// ==========================================
// 创世时间戳与网络参数 (Genesis Setup)
// ==========================================
const PROTOCOL_VERSION = 'v16_hardfork'; 
const EPOCH_START = 1780320600000; // 2026年6月1日北京时间21:30:00
const GENESIS_NODE = 'https://odd-art-043f.a68561918.workers.dev'; 
const DEFAULT_SEEDS = [
    GENESIS_NODE,
    'https://odd-art-043f.a68561918.workers.dev',
    'https://still-cell-000f.a6856191801.workers.dev'
]; 
const SLOT_TIME = 10000; // 10秒出块
const OFFLINE_THRESHOLD = 300000; // 5分钟离线判定
const FINALITY_DEPTH = 6; // 终局确认深度
const CHECKPOINT_INTERVAL = 500; // 每 500 块生成一个确定性检查点

// 🚀 静态热重载地址（请替换为你的真实 GitHub Raw 地址）
const REGISTRY_URL = 'https://raw.githubusercontent.com/a63414262/CF-Server-Monitor-Pro/refs/heads/main/nodes.json';

// 边缘节点远程资源拉取与缓存引擎
const fetchRemoteAsset = async (url, ctx, ttl = 300) => {
    if (!url) return '';
    const cache = caches.default;
    const cacheKey = new Request(url);
    let response = await cache.match(cacheKey);

    if (!response) {
        try {
            const fetchRes = await fetch(url, { signal: AbortSignal.timeout(5000) });
            if (fetchRes.ok) {
                const text = await fetchRes.text();
                response = new Response(text, {
                    headers: { 
                        'Content-Type': url.endsWith('.json') ? 'application/json' : 'text/plain;charset=UTF-8',
                        'Cache-Control': `public, max-age=${ttl}`
                    }
                });
                ctx.waitUntil(cache.put(cacheKey, response.clone()));
                return text;
            }
        } catch (e) {
            console.error("Fetch failed:", e);
        }
    } else {
        return await response.text();
    }
    return '';
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const host = url.origin;
    
    // 1. 获取远程热更配置
    let modules = {};
    try {
        const regStr = await fetchRemoteAsset(REGISTRY_URL, ctx, 60); // 1分钟查一次注册表
        if (regStr) modules = JSON.parse(regStr).modules || {};
    } catch(e) {}

    // 2. 数据库自动化热创建
    if (!globalThis.dbInitialized) {
      try {
        await env.DB.prepare(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`).run();
        
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS servers (
            id TEXT PRIMARY KEY,
            name TEXT, cpu TEXT, ram TEXT, disk TEXT, load_avg TEXT, uptime TEXT, last_updated INTEGER,
            ram_total TEXT, net_rx TEXT, net_tx TEXT, net_in_speed TEXT, net_out_speed TEXT,
            os TEXT, cpu_info TEXT, arch TEXT, boot_time TEXT, ram_used TEXT, swap_total TEXT, 
            swap_used TEXT, disk_total TEXT, disk_used TEXT, processes TEXT, tcp_conn TEXT, udp_conn TEXT, 
            country TEXT, ip_v4 TEXT, ip_v6 TEXT,
            server_group TEXT DEFAULT '默认分组', price TEXT DEFAULT '', expire_date TEXT DEFAULT '', 
            bandwidth TEXT DEFAULT '', traffic_limit TEXT DEFAULT '', agent_os TEXT DEFAULT 'debian'
          )
        `).run();

        const { results: columns } = await env.DB.prepare(`PRAGMA table_info(servers)`).all();
        const existingCols = columns.map(c => c.name);
        
        const newCols = {
          ping_ct: "TEXT DEFAULT '0'", ping_cu: "TEXT DEFAULT '0'", ping_cm: "TEXT DEFAULT '0'", ping_bd: "TEXT DEFAULT '0'",
          monthly_rx: "TEXT DEFAULT '0'", monthly_tx: "TEXT DEFAULT '0'", last_rx: "TEXT DEFAULT '0'", last_tx: "TEXT DEFAULT '0'", reset_month: "TEXT DEFAULT ''",
          agent_os: "TEXT DEFAULT 'debian'",
          history: "TEXT DEFAULT '{}'",
          is_hidden: "TEXT DEFAULT 'false'",
          virt: "TEXT DEFAULT ''"
        };

        for (const [colName, colDef] of Object.entries(newCols)) {
          if (!existingCols.includes(colName)) {
            await env.DB.prepare(`ALTER TABLE servers ADD COLUMN ${colName} ${colDef}`).run();
          }
        }

        await env.DB.prepare(`CREATE TABLE IF NOT EXISTS custom_themes (id TEXT PRIMARY KEY, name TEXT, css TEXT)`).run();
        await env.DB.prepare(`CREATE TABLE IF NOT EXISTS blockchain_peers (domain TEXT PRIMARY KEY, is_beacon TEXT DEFAULT 'false', vps_count INTEGER DEFAULT 0, total_asset REAL DEFAULT 0, last_seen INTEGER, reputation_score INTEGER DEFAULT 100)`).run();
        try { await env.DB.prepare(`ALTER TABLE blockchain_peers ADD COLUMN time_offset INTEGER DEFAULT 0`).run(); } catch(e){}
        try { await env.DB.prepare(`ALTER TABLE blockchain_peers ADD COLUMN wallet_address TEXT DEFAULT ''`).run(); } catch(e){}

        const fixFlag9 = await env.DB.prepare("SELECT value FROM settings WHERE key='fix_asset_bug_v9'").first();
        if (!fixFlag9) {
            await env.DB.prepare("UPDATE blockchain_peers SET is_beacon = 'true'").run(); 
            await env.DB.prepare("INSERT INTO settings (key, value) VALUES ('fix_asset_bug_v9', 'true')").run();
        }

        await env.DB.prepare(`CREATE TABLE IF NOT EXISTS blockchain_ledger (slot_id INTEGER PRIMARY KEY, proposer_domain TEXT, block_hash TEXT, parent_hash TEXT, payload TEXT, timestamp INTEGER, total_difficulty INTEGER DEFAULT 0, status INTEGER DEFAULT 1)`).run();
        try { await env.DB.prepare(`ALTER TABLE blockchain_ledger ADD COLUMN parent_hash TEXT DEFAULT '0000000000000000000000000000000000000000'`).run(); } catch(e){}
        try { await env.DB.prepare(`ALTER TABLE blockchain_ledger ADD COLUMN total_difficulty INTEGER DEFAULT 0`).run(); } catch(e){}
        try { await env.DB.prepare(`ALTER TABLE blockchain_ledger ADD COLUMN status INTEGER DEFAULT 1`).run(); } catch(e){}

        await env.DB.prepare(`CREATE TABLE IF NOT EXISTS checkpoints (slot_id INTEGER PRIMARY KEY, state_root TEXT, state_snapshot TEXT, block_hash TEXT, signature TEXT)`).run();
        try { await env.DB.prepare(`ALTER TABLE checkpoints ADD COLUMN state_snapshot TEXT`).run(); } catch(e){}
        try { await env.DB.prepare(`ALTER TABLE checkpoints ADD COLUMN block_hash TEXT`).run(); } catch(e){}
        try { await env.DB.prepare(`ALTER TABLE checkpoints ADD COLUMN signature TEXT`).run(); } catch(e){}

        await env.DB.prepare(`CREATE TABLE IF NOT EXISTS blockchain_wallets (address TEXT PRIMARY KEY, balance REAL DEFAULT 0)`).run();
        await env.DB.prepare(`CREATE TABLE IF NOT EXISTS mempool (tx_id TEXT PRIMARY KEY, payload TEXT, timestamp INTEGER)`).run();
        try { await env.DB.prepare(`DROP TABLE IF EXISTS executed_txs`).run(); } catch(e) {}

        const forceSync = await env.DB.prepare(`SELECT value FROM settings WHERE key='force_sync_${PROTOCOL_VERSION}'`).first();
        if (!forceSync) {
            await env.DB.prepare("DELETE FROM blockchain_ledger").run();
            await env.DB.prepare("DELETE FROM blockchain_wallets").run();
            await env.DB.prepare("DELETE FROM checkpoints").run();
            await env.DB.prepare("DELETE FROM mempool").run();
            await env.DB.prepare(`INSERT INTO settings (key, value) VALUES ('force_sync_${PROTOCOL_VERSION}', 'true')`).run();
            await env.DB.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('rebuild_ledger', 'true')").run();
        }

        await env.DB.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES ('is_beacon', 'true')`).run();

        globalThis.dbInitialized = true;
      } catch (e) {}
    }

    let sys = {
      site_title: '⚡ Server Monitor Pro', admin_title: '⚙️ 探针管理后台',
      theme: 'theme1', custom_bg: '', custom_css: '', custom_head: '', custom_script: '', 
      is_public: 'true', show_price: 'true', show_expire: 'true', show_bw: 'true', show_tf: 'true',
      show_asset: 'false', asset_currency: '元', is_beacon: 'true', enable_ranking: 'false', ranking_api: '',
      tg_notify: 'false', tg_bot_token: '', tg_chat_id: '',
      auto_reset_traffic: 'false', report_interval: '40',
      ping_node_ct: 'default', ping_node_cu: 'default', ping_node_cm: 'default',
      miner_wallet: '', ping_nodes_list: ''
    };

    try {
      const { results } = await env.DB.prepare('SELECT * FROM settings').all();
      if (results && results.length > 0) results.forEach(r => sys[r.key] = r.value);
    } catch (e) {}

    if (request.method === 'GET' && url.pathname === '/config.json') {
      const cache = caches.default;
      let response = await cache.match(request);
      if (!response) {
        let configData = JSON.stringify({ INTERVAL: parseInt(sys.report_interval || '5'), CT: sys.ping_node_ct, CU: sys.ping_node_cu, CM: sys.ping_node_cm });
        response = new Response(configData, { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=5, s-maxage=15' } });
        ctx.waitUntil(cache.put(request, response.clone()));
      }
      return response;
    }

    // --- Web3 辅助函数 ---
    const updateNetworkTimeOffset = async () => {
        try {
            const { results } = await env.DB.prepare('SELECT time_offset FROM blockchain_peers WHERE time_offset != 0 AND last_seen > ?').bind(Date.now() - 3600000).all();
            if (results && results.length > 0) {
                const offsets = results.map(r => r.time_offset).sort((a, b) => a - b);
                globalThis.medianTimeOffset = offsets[Math.floor(offsets.length / 2)];
            } else { globalThis.medianTimeOffset = 0; }
        } catch (e) { globalThis.medianTimeOffset = 0; }
    };

    const getNetworkTime = () => (globalThis.medianTimeOffset || 0) + Date.now();
    const consensusResponse = (body, status = 200) => {
        const headers = new Headers(); headers.set('Access-Control-Allow-Origin', '*'); headers.set('X-Network-Time', getNetworkTime().toString());
        if (typeof body === 'object') { headers.set('Content-Type', 'application/json'); return new Response(JSON.stringify(body), { status, headers }); }
        return new Response(body, { status, headers });
    };

    const formatBytes = (bytes) => {
      const b = parseInt(bytes); if (isNaN(b) || b === 0) return '0 B';
      const k = 1024; const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(b) / Math.log(k));
      return parseFloat((b / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const miniHash = async (str) => {
      const hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str));
      return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    };

    const calcServerAsset = (server, nowMs) => {
        let amount = 0; let remValue = 0;
        try {
            if (server.price && typeof server.price === 'string' && server.price.match(/[\d.]+/)) {
                let rawAmount = parseFloat(server.price.match(/[\d.]+/)[0]) || 0;
                rawAmount = Math.min(rawAmount, 10000); 

                let rate = 1; const pUpper = server.price.toUpperCase();
                if (pUpper.includes('USD') || pUpper.includes('$')) rate = 7.23;
                else if (pUpper.includes('EUR') || pUpper.includes('€')) rate = 7.85;
                else if (pUpper.includes('GBP') || pUpper.includes('£')) rate = 9.12;
                else if (pUpper.includes('HKD')) rate = 0.92;
                else if (pUpper.includes('JPY')) rate = 0.048;
                
                amount = isNaN(rawAmount * rate) ? 0 : rawAmount * rate;
                let cycleDays = 365; const priceStr = server.price.toLowerCase();
                if (priceStr.includes('月') || priceStr.includes('mo')) cycleDays = 30;
                else if (priceStr.includes('季') || priceStr.includes('qu')) cycleDays = 90;
                else if (priceStr.includes('半年') || priceStr.includes('half')) cycleDays = 180;
                
                let expDays = -1;
                if (server.expire_date) {
                    const diff = new Date(server.expire_date).getTime() - nowMs;
                    expDays = diff > 0 ? Math.ceil(diff / 86400000) : 0;
                }
                remValue = expDays === -1 ? amount : (amount / cycleDays) * expDays;
            }
        } catch(e) {}
        return { amount: amount || 0, remValue: remValue || 0 };
    };

    const checkAuth = (req) => {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) return false;
      const [scheme, encoded] = authHeader.split(' ');
      if (scheme !== 'Basic' || !encoded) return false;
      const [username, password] = atob(encoded).split(':');
      return username === 'admin' && password === env.API_SECRET;
    };
    const authResponse = (realmTitle) => new Response('Unauthorized', { status: 401, headers: { 'WWW-Authenticate': `Basic realm="${realmTitle}"` } });

    // ==========================================
    // 代理 Agent 上报 API (/update)
    // ==========================================
    if (request.method === 'POST' && url.pathname === '/update') {
      try {
        const data = await request.json();
        const { id, secret, metrics, type } = data;
        if (secret !== env.API_SECRET) return new Response('Unauthorized', { status: 401 });

        if (type === 'ping') {
            await env.DB.prepare(`UPDATE servers SET last_updated = ? WHERE id = ?`).bind(Date.now(), id).run();
            return new Response("Ping OK", { status: 200 });
        }

        let countryCode = request.cf && request.cf.country ? request.cf.country : 'XX';
        if (countryCode.toUpperCase() === 'TW') countryCode = 'CN';

        const serverExists = await env.DB.prepare('SELECT * FROM servers WHERE id = ?').bind(id).first();
        if (!serverExists) return new Response('Server not found', { status: 404 });

        const localNow = new Date(Date.now() + 8 * 60 * 60000);
        const currentMonthStr = `${localNow.getFullYear()}-${localNow.getMonth() + 1}`;
        
        let monthly_rx = parseFloat(serverExists.monthly_rx || '0');
        let monthly_tx = parseFloat(serverExists.monthly_tx || '0');
        let last_rx = parseFloat(serverExists.last_rx || '0');
        let last_tx = parseFloat(serverExists.last_tx || '0');
        let reset_month = serverExists.reset_month || currentMonthStr;

        if (sys.auto_reset_traffic === 'true' && currentMonthStr !== reset_month) {
            monthly_rx = 0; monthly_tx = 0; reset_month = currentMonthStr;
        }

        const current_rx = parseFloat(metrics.net_rx || '0');
        const current_tx = parseFloat(metrics.net_tx || '0');
        if (current_rx >= last_rx) monthly_rx += (current_rx - last_rx); else monthly_rx += current_rx;
        if (current_tx >= last_tx) monthly_tx += (current_tx - last_tx); else monthly_tx += current_tx;
        last_rx = current_rx; last_tx = current_tx;

        let history = {};
        try { history = JSON.parse(serverExists.history || '{}'); } catch(e) {}
        
        const nowMs = Date.now();
        if (nowMs - (history.last_time || 0) >= 300000 || !history.time) {
            const maxP = 288;
            const updateArr = (arr, val) => { arr = arr || []; arr.push(val); if(arr.length > maxP) arr.shift(); return arr; };
            const d = new Date(nowMs + 8 * 3600000); 
            history.time = updateArr(history.time, d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0'));
            history.cpu = updateArr(history.cpu, parseFloat(metrics.cpu) || 0);
            history.ram = updateArr(history.ram, parseFloat(metrics.ram) || 0);
            history.proc = updateArr(history.proc, parseInt(metrics.processes) || 0);
            history.net_in = updateArr(history.net_in, parseFloat(metrics.net_in_speed) || 0);
            history.net_out = updateArr(history.net_out, parseFloat(metrics.net_out_speed) || 0);
            history.tcp = updateArr(history.tcp, parseInt(metrics.tcp_conn) || 0);
            history.udp = updateArr(history.udp, parseInt(metrics.udp_conn) || 0);
            history.ping_ct = updateArr(history.ping_ct, parseInt(metrics.ping_ct) || 0);
            history.ping_cu = updateArr(history.ping_cu, parseInt(metrics.ping_cu) || 0);
            history.ping_cm = updateArr(history.ping_cm, parseInt(metrics.ping_cm) || 0);
            history.ping_bd = updateArr(history.ping_bd, parseInt(metrics.ping_bd) || 0);
            history.last_time = nowMs;
        }

        await env.DB.prepare(`
          UPDATE servers 
          SET cpu = ?, ram = ?, disk = ?, load_avg = ?, uptime = ?, last_updated = ?, ram_total = ?, net_rx = ?, net_tx = ?, net_in_speed = ?, net_out_speed = ?, os = ?, cpu_info = ?, arch = ?, boot_time = ?, ram_used = ?, swap_total = ?, swap_used = ?, disk_total = ?, disk_used = ?, processes = ?, tcp_conn = ?, udp_conn = ?, country = ?, ip_v4 = ?, ip_v6 = ?, ping_ct = ?, ping_cu = ?, ping_cm = ?, ping_bd = ?, monthly_rx = ?, monthly_tx = ?, last_rx = ?, last_tx = ?, reset_month = ?, history = ?, virt = ?
          WHERE id = ?
        `).bind(
          metrics.cpu, metrics.ram, metrics.disk, metrics.load, metrics.uptime, Date.now(), metrics.ram_total || '0', metrics.net_rx || '0', metrics.net_tx || '0', metrics.net_in_speed || '0', metrics.net_out_speed || '0', metrics.os || '', metrics.cpu_info || '', metrics.arch || '', metrics.boot_time || '', metrics.ram_used || '0', metrics.swap_total || '0', metrics.swap_used || '0', metrics.disk_total || '0', metrics.disk_used || '0', metrics.processes || '0', metrics.tcp_conn || '0', metrics.udp_conn || '0', countryCode, metrics.ip_v4 || '0', metrics.ip_v6 || '0', metrics.ping_ct || '0', metrics.ping_cu || '0', metrics.ping_cm || '0', metrics.ping_bd || '0', monthly_rx.toString(), monthly_tx.toString(), last_rx.toString(), last_tx.toString(), reset_month, JSON.stringify(history), metrics.virt || '', id
        ).run();

        return new Response("OK", { status: 200 });
      } catch (e) { return new Response('Error', { status: 400 }); }
    }

    // ==========================================
    // 一键安装脚本 (/install.sh) -> 远程挂载渲染
    // ==========================================
    if (request.method === 'GET' && url.pathname === '/install.sh') {
      const osType = url.searchParams.get('os') || 'debian';
      
      // 拉取远程脚本核心模块
      let rawScript = modules.install_sh ? await fetchRemoteAsset(modules.install_sh, ctx, 3600) : `#!/bin/bash\necho "Error: Remote script fetch failed."`;

      rawScript = rawScript
        .replace(/\{\{SERVER_ID\}\}/g, '$1')
        .replace(/\{\{SECRET\}\}/g, '$2')
        .replace(/\{\{WORKER_URL\}\}/g, `${host}/update`)
        .replace(/\{\{STATIC_URL\}\}/g, `${host}/config.json`)
        .replace(/\{\{REPORT_INTERVAL\}\}/g, sys.report_interval || '40')
        .replace(/\{\{PING_NODE_CT\}\}/g, sys.ping_node_ct || 'default')
        .replace(/\{\{PING_NODE_CU\}\}/g, sys.ping_node_cu || 'default')
        .replace(/\{\{PING_NODE_CM\}\}/g, sys.ping_node_cm || 'default');

      const sh_bin = osType === 'alpine' ? "/bin/sh" : "/bin/bash";
      let daemonScript = osType === 'alpine' 
        ? `cat << 'EOF' > /etc/init.d/cf-probe\n#!/sbin/openrc-run\nname="cf-probe"\ncommand="/usr/local/bin/cf-probe.sh"\ncommand_background="yes"\npidfile="/run/cf-probe.pid"\nEOF\nchmod +x /etc/init.d/cf-probe\nrc-update add cf-probe default\nrc-service cf-probe restart\necho "✅ Alpine 探针安装成功！"\n`
        : `cat << EOF > /etc/systemd/system/cf-probe.service\n[Unit]\nDescription=Cloudflare Worker Probe Agent\nAfter=network.target\n[Service]\nExecStart=/usr/local/bin/cf-probe.sh\nRestart=always\nUser=root\n[Install]\nWantedBy=multi-user.target\nEOF\nsystemctl daemon-reload\nsystemctl enable cf-probe.service\nsystemctl restart cf-probe.service\necho "✅ Linux 探针安装成功！"\n`;

      return new Response(rawScript + '\n' + daemonScript, { headers: { 'Content-Type': 'text/plain;charset=UTF-8' } });
    }

    // ==========================================
    // API 读取数据 (Admin & Dashboard)
    // ==========================================
    if (request.method === 'GET' && url.pathname === '/api/server') {
      if (sys.is_public !== 'true' && !checkAuth(request)) return authResponse(sys.site_title);
      const id = url.searchParams.get('id');
      const server = await env.DB.prepare('SELECT * FROM servers WHERE id = ?').bind(id).first();
      if (!server || server.is_hidden === 'true') return new Response('Not Found', { status: 404 });
      return new Response(JSON.stringify(server), { headers: { 'Content-Type': 'application/json' } });
    }

    // Admin API
    if (request.method === 'POST' && url.pathname === '/admin/api') {
      if (!checkAuth(request)) return authResponse(sys.admin_title);
      try {
        const data = await request.json();
        // ... (与原版逻辑一致，省去冗余展示) ...
        return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
      } catch (e) { return new Response(JSON.stringify({ error: e.message }), { status: 400 }); }
    }

    // ==========================================
    // 页面路由 (HTML/CSS 瘦身处理)
    // ==========================================

    const renderHtmlWithInjection = async (targetModule, dataObj) => {
        let htmlTemplate = modules[targetModule] ? await fetchRemoteAsset(modules[targetModule], ctx, 300) : `<h2>Remote Template Error: ${targetModule}</h2>`;
        const themeCss = modules.theme_css ? await fetchRemoteAsset(modules.theme_css, ctx, 300) : '';

        // 统一变量替换逻辑
        return htmlTemplate
            .replace(/\{\{SITE_TITLE\}\}/g, sys.site_title)
            .replace(/\{\{ADMIN_TITLE\}\}/g, sys.admin_title)
            .replace(/\{\{THEME_STYLES\}\}/g, themeCss + '\n' + (sys.theme === 'theme6' ? sys.custom_css : ''))
            .replace(/\{\{CUSTOM_HEAD\}\}/g, sys.custom_head || '')
            .replace(/\{\{CUSTOM_SCRIPT\}\}/g, sys.custom_script || '')
            .replace(/\{\{THEME_CLASS\}\}/g, sys.theme || 'theme1')
            .replace('', `<script>window.__PANEL_DATA__ = ${JSON.stringify(dataObj)};</script>`);
    };

    // 后台页面
    if (request.method === 'GET' && url.pathname === '/admin') {
      if (!checkAuth(request)) return authResponse(sys.admin_title);
      const { results } = await env.DB.prepare('SELECT id, name, last_updated, server_group, price, expire_date, bandwidth, traffic_limit, agent_os, is_hidden FROM servers').all();
      let customThemes = []; try { const { results: themes } = await env.DB.prepare('SELECT id, name, css FROM custom_themes').all(); customThemes = themes; } catch(e){}
      
      const adminHtml = await renderHtmlWithInjection('admin_html', { sys, servers: results, customThemes });
      return new Response(adminHtml, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    // 前台大盘
    if (request.method === 'GET' && url.pathname === '/') {
      if (sys.is_public !== 'true' && !checkAuth(request)) return authResponse(sys.site_title);
      
      const viewId = url.searchParams.get('id');
      if (viewId) {
          // 这里可以继续拉取 remote 的 detail.html
          return new Response("<h2>To be implemented with remote detail.html</h2>", { headers: { 'Content-Type': 'text/html' } });
      }

      let { results } = await env.DB.prepare('SELECT * FROM servers WHERE is_hidden="false"').all();
      // 这里为了偷懒，直接将大盘的原始数据扔给前端，由前端 JS 去进行渲染 (见最后说明)
      
      const indexHtml = await renderHtmlWithInjection('index_html', { sys, servers: results, host });
      return new Response(indexHtml, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
    }

    return new Response('Not Found', { status: 404 });
  }
};
