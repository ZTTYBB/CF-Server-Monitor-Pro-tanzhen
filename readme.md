## 📸 界面预览

演示站点：https://odd-art-043f.a68561918.workers.dev

已添加支持alpine系统挂载探针，已个性化CSS设置，已添加网易云外链单曲循环，可通过CSS代码实现个性化探针主题实现

### 1. 前台多节点大盘与 Web3 全局统计 (全新升级)
<img width="3840" height="1738" alt="image" src="https://github.com/user-attachments/assets/0cd9b65a-ff8e-43b2-8a5f-8a3e6e424359" />
<img width="3840" height="1738" alt="image" src="https://github.com/user-attachments/assets/d341b70b-0131-4b3e-aeda-59ae36091c89" />
<img width="3840" height="1738" alt="image" src="https://github.com/user-attachments/assets/9c5283b5-05cc-4fae-9e10-8f70fe81381c" />

### 2. 单节点实时性能折线图
<img width="3840" height="1738" alt="image" src="https://github.com/user-attachments/assets/81ce19c3-7554-4dd1-818a-7ca478d3eb0d" />
<img width="3840" height="1738" alt="image" src="https://github.com/user-attachments/assets/7024bd65-7ec2-4912-8c7a-38af36796cf3" />

### 3. 后台管理与全局设置
<img width="3840" height="1738" alt="image" src="https://github.com/user-attachments/assets/9d4d21de-6f2a-4980-9b0c-c9850f1e1223" />
<img width="3840" height="1738" alt="image" src="https://github.com/user-attachments/assets/d8bdd200-20bb-42dd-83d2-6810a59f03c8" />
<img width="3840" height="1738" alt="image" src="https://github.com/user-attachments/assets/c6989909-0ce7-4cc1-87e6-65d87e4ea48b" />

---

## 🤝 参与贡献 (Contributing)

如果你喜欢这个项目，欢迎提交 Pull Request，或者给个 ⭐ **Star** 支持一下！

# ⚡ CF-Server-Monitor-Pro (Serverless 探针增强版 & Web3 共识网络)

10台VPS以下可以使用cf版本轻量部署，10台VPS以上建议使用docker部署在免费容器northflank：[点击访问 Docker 版](https://github.com/a63414262/server-monitor)

基于 Cloudflare Workers 和 D1 数据库构建的轻量级、零成本、高定制化的服务器探针大盘。
完美复刻了商业级探针（如 Nezha）的核心体验，并**跨时代地引入了 Web3 去中心化共识网络机制**，无需额外部署任何服务端 VPS！完全白嫖 Cloudflare 的免费 Serverless 资源。

## ✨ 核心特性

### 🔗 Web3 去中心化共识与资产系统 (🚀 Pro 独占全新升级)
- **全网信标节点 (Beacon Nodes)**：开启后，你的探针面板将作为 P2P 共识网络的权重节点，通过底层的 Gossip 流言协议与全球探针网络无缝对接，打破信息孤岛。
- **Cycle 财富账本 (Cycle Ledger)**：内置原生 Web3 状态机引擎，挂载探针即可自动参与“出块挖矿”获取 Cycle 奖励。支持在后台直接发起全网广播的 P2P 资产转账 (Tx)。
- **全网排名与英雄榜**：前台实时展示全网权重节点排行榜！精准查阅全球各节点的探针总数、资产重力 (Gravity) 以及最后活跃时间。
- **资产穿透与链上浏览器**：首页内置透明的「Cycle 财富英雄榜」与「区块浏览器」。支持**一键点击钱包地址即可穿透搜索**，瞬间查阅任意 EVM 地址的 Cycle 余额与链上流水。
- **V15 Pure Chain 大一统协议**：底层采用最新的硬分叉哈希验证与 500+ P2P 缓冲扩容技术，完美解决同高度分叉碰撞，实现极低 Workers 免费额度消耗（毫秒级 CPU 耗时缓冲引擎）。

### 🎨 极致的视觉与个性化体验
- **高级自定义 CSS / JS 注入**：支持完全自定义 CSS 主题，支持原生 JS 动态特效注入，轻松实现网易云外链作为背景音乐自动单曲循环播放。
- **国旗智能匹配**：依托 Cloudflare 全球网络，自动识别 VPS 归属地并渲染超清图片国旗。
- **无感 AJAX 热更新**：彻底抛弃传统的 `<meta refresh>`，采用 DOM 局部替换与 V8 内存级缓存穿透技术，数据实时跳动，页面零闪烁。
- **多维视图切换**：内置 卡片 (Card)、表格 (Table)、世界地图 (Map) 和 链上区块 (Block) 四种视图，使用 LocalStorage 自动记忆用户偏好。

### 📊 专业级监控与大盘展示
- **全局顶栏大盘**：直观展示服务器总数、在线/离线数、总计流量（入/出）以及全网实时网速。
- **硬核双栈检测**：自动探测并高亮打标 VPS 的 **IPv4** 与 **IPv6** 网络连通性。
- **商业级自定义徽章**：支持为每台机器单独设置**价格、到期时间（自动计算剩余天数）、带宽上限、流量配额**，并在前台以彩色徽章优雅展示。
- **过去24h至实时详情图表**：点击任意节点卡片，即可查看基于 Chart.js 的 CPU、内存、磁盘、进程数、TCP/UDP 连接数及双向网速的实时折线图，以及三网延迟追踪（电信/联通/移动/字节）。
- **月度流量重置**：内置流量增量累加机制，支持开启每月 1 号自动重置统计，无惧被控端 VPS 重启导致的数据清零。

### 🛡️ 隐私、安全与管理控制
- **Agent 上报频率自定义**：后台支持一键修改全网探针的上报心跳间隔（如 5 秒 / 10 秒）。
- **一键私密模式与节点隐藏**：吃灰神机不想公开？在后台取消勾选“公开访问”即可。同时支持单独隐藏某台具体的 VPS，只在后台可见。
- **模块化展示开关**：价格、到期时间、带宽、流量、甚至是数字资产价值等敏感信息，可在后台一键控制前台展示。

### 🚀 极简部署与高精度采集
- **底层精准脱钩算法**：抛弃传统不稳定的 `top` 命令，采用 Linux 内核级 `/proc/stat` 计算 CPU 时钟差值，数据采集跳动精准顺滑。
- **傻瓜式一键安装**：后台添加节点后自动生成被控端 Bash 安装命令，完美支持 Debian/Ubuntu/CentOS 等 Systemd 架构，同时 **首发支持 Alpine (OpenRC) 轻量系统** 挂载探针！

---

## 🚀 部署指南 (Deployment)

**第一步：配置 Cloudflare 环境**
1. 登录 Cloudflare 控制台，进入 `Workers & Pages`。
2. 创建一个全新的 D1 数据库，命名为 `probe-db`。
3. 创建一个新的 Worker 服务。

**第二步：配置 Worker**
1. 将本项目中的 `worker.js` 代码全部复制并覆盖到你的 Worker 代码编辑器中。
2. 在 Worker 的 **设置 (Settings) -> 变量 (Variables)** 中，绑定你刚才创建的 D1 数据库，变量名称必须为 `DB`。
3. 在环境变量中添加一个密码变量，用于后台登录：
   - 变量名：`API_SECRET`
   - 值：设置你的高强度密码

**第三步：访问与初始化**
部署完成后，访问你的 Worker 域名。
- 管理后台路径：`https://你的域名.workers.dev/admin`
- 账号：`admin`
- 密码：你设置的 `API_SECRET` 的值
*(注意：首次访问会自动初始化 D1 数据表，无需手动建表)*
- **💡 提示**：在后台全局设置中，记得填入你的“出块奖励收款钱包地址 (EVM格式)”，你的节点每次打包新区块都会自动为你发放 Cycle 资产！

---

## 💻 客户端探针安装 (Client Agent)

进入管理后台后，点击 "+ 添加新服务器"。添加完成后，列表中会生成专属的一键安装命令。

直接复制该命令，在你的目标 VPS 上（需 Root 权限）运行即可：
```bash
curl -sL [https://你的域名.workers.dev/install.sh](https://你的域名.workers.dev/install.sh) | bash -s <SERVER_ID> <API_SECRET>
