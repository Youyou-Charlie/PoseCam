# PoseCam PWA · 网页版 MVP（v2 真功能版）

真摄像头取景 + MediaPipe 实时骨架姿势引导（β）+ 真实成片拍摄/保存 + VLM 真实场景分析与照片点评。
无构建步骤，运行时外部依赖仅两个：MediaPipe CDN（骨架）、用户自配的 OpenAI 兼容 VLM 端点（分析/点评）。

## 真功能 vs 未实现（诚实清单）

**真功能（作用于真实输入）**

- 真实拍摄：快门捕获真实视频帧成片（前摄镜像所见即所得），可保存/分享。
- 真实骨架（β）：MediaPipe PoseLandmarker 实时检测 + EMA 平滑降抖（每 2 帧推理 1 次、低可见度点不污染、连续未检出 10 帧淡出）。角标「β」= 实验功能，原生 App 中将是稳定引导。
- VLM 真实场景分析：取景器「分析当前画面」把当前帧（压缩为长边 ≤768 JPEG）发给视觉模型，返回针对画面真实元素（光线、背景、线条）的构图/焦段/姿势建议与 3 条话术；标注「AI 实时分析 · 刚刚」。
- VLM 真实照片点评：快门成片发给视觉模型点评，评分/三星项/鼓励语均基于本张照片；标注「AI 点评 · 基于本张照片」。
- 未配置 Key 或调用失败时，全功能回退预设库，并 Toast 中文说明 + 明确标注「演示点评」。

**未实现（划归原生 App 阶段）**

- 目标姿势轮廓匹配（被拍者对着轮廓模板摆姿势）——Web 版骨架仅叠加显示与降抖。
- 双人专属内容（合照模式两人骨架可叠加，但建议/话术无双人差异）。
- 实时纠偏闭环（检测到偏差即时提醒）——仅有 v1 遗留的单条「右臂抬高」规则示范。

## AI 服务配置（首页右下角 ⚙）

- 内置三家预设：智谱 GLM（免费，`glm-4.6v-flash`）/ 阿里百炼（`qwen-vl-plus`）/ Moonshot（付费，视觉模型），也可自定义任意 OpenAI 兼容端点。
- **API Key 仅存在你自己设备的浏览器 localStorage 里（键 `posecam.ai`），不会上传到本仓库或任何服务器**——部署在公网时同样如此，每个用户只存自己的 Key。（2026-07-17 曾短暂内置默认 Key，因仓库公开已撤回；历史提交中出现过的旧 Key 已在智谱控制台吊销作废。）
- 配置后可用「测试连接」验证；未配置时取景器「分析当前画面」按钮置灰并提示「先在首页⚙配置 AI」。

## 文件结构

```
pwa/
├── index.html        # 应用入口（5 屏流程 + iOS PWA 元数据）
├── style.css         # 视觉系统（沿用 prototype-hifi 冻结稿，全屏/safe-area 适配）
├── app.js            # 相机生命周期 + MediaPipe 管线 + VLM 流程 + 交互逻辑
├── js/
│   ├── poseSmooth.js # 骨架 EMA 平滑器（Node 可单测）
│   ├── aiClient.js   # VLM 客户端与服务商配置（localStorage）
│   └── prompts.js    # 提示词构建 + 容错 JSON 解析（Node 可单测）
├── tests/            # Node 单元测试（node:assert，零依赖）
├── manifest.json     # PWA manifest（standalone / #0A0A0F）
├── icons/            # 图标（脚本生成，勿手改）
└── tools/
    └── gen_icons.py  # 图标生成脚本（纯 Python 标准库）
```

## 单元测试

```bash
node pwa/tests/poseSmooth.test.js   # 骨架平滑
node pwa/tests/prompts.test.js      # 提示词/解析（含坏 JSON 必须抛错）
node pwa/tests/aiClient.test.js     # 配置存取/错误映射
```

## 本地运行（桌面调试）

摄像头要求 **https 或 localhost** 安全上下文，`file://` 直开会得到明确的中文错误提示。

```bash
cd pwa
python -m http.server 8000
# 浏览器打开 http://localhost:8000
```

首次进入取景器需联网加载 AI 模型（移动端 lite 约 5 MB / 桌面 full 约 12 MB），之后由浏览器 CDN 缓存。

## iPhone 真机部署（推荐 GitHub Pages）

iOS Safari 上 localhost 与局域网 IP 均不可用（非安全上下文），必须 https。仓库已双推 GitHub，直接用 Pages 零成本获得 https：

1. GitHub 仓库页面 → **Settings → Pages**。
2. **Source** 选 `Deploy from a branch`；Branch 选 **`feature/research-and-prd`**。
   - 目录选 **`/pwa`**（若该分支目录下拉框仅提供 `/(root)`，则选 `/(root)` 亦可，访问路径改为 `https://<用户名>.github.io/PoseCam/pwa/`）。
   - 选 `/pwa` 时访问地址为 `https://<用户名>.github.io/PoseCam/`。
3. 保存后等 1–2 分钟部署完成，iPhone Safari 打开对应 URL。

### 备选：隧道（不改仓库设置）

```bash
# 本地起服务后，用 ngrok / cloudflared 等隧道暴露 https 入口
cd pwa && python -m http.server 8000
ngrok http 8000        # 或 cloudflared tunnel --url http://localhost:8000
# iPhone Safari 打开隧道给出的 https 地址
```

## 添加到主屏幕（iPhone）

1. Safari 打开部署后的 https 地址。
2. 点底部分享按钮 → **「添加到主屏幕」** → 添加。
3. 从主屏幕图标启动即 standalone 全屏（无 Safari 地址栏），图标与启动画面背景为深黑 #0A0A0F。

## 功能与交互（v2）

- 流程 5 屏：启动 → 模式（帮 TA 拍 / 我们合照）→ 场景（咖啡厅/街拍/夜景/室内）→ 取景器 → 点评。
- 取景器：真摄像头全屏，默认后置（`facingMode: "environment"`），右下按钮翻转前后；前摄预览与成片均镜像（所见即所得）。
- AR 层（β）：MediaPipe PoseLandmarker 实时骨架叠加（青色 #00D4AA）+ EMA 平滑降抖；移动端 `pose_landmarker_lite`、桌面 `full`，GPU 失败自动回退 CPU；右上角开关控制骨架显隐，开启时 Toast 说明「实验功能，原生 App 中将是稳定引导」。
- 规则化姿势反馈（**v1 遗留示范**，仅 1 条规则）：建议为「右臂抬高」类（咖啡厅 · 侧身靠窗）时，右腕关键点高于右肩 → 提示标签转绿「✓ 右臂已到位」，否则红色提示「右臂再抬高一点」；其他建议下标签显示「保持：××」提示文案（默认红）。AI 实时建议下无规则判定，仅显示保持提示。
- AI 摄影师面板：「分析当前画面」（需在首页 ⚙ 配置 AI）真实分析当前帧，更新焦段/姿势/提示与锦囊 3 条话术（30 秒冷却）；「换一条」回预设库轮换；未配置 Key 时分析按钮置灰并提示。
- 快门：捕获当前视频帧 → 闪白 → 点评页；成片 blob 保存供 AI 点评复用。
- 点评页：真实成片；已配置 AI 时自动点评本张照片（评分 + 构图/姿势/情绪三星项 + 鼓励语，标注「AI 点评 · 基于本张照片」），加载期间「再拍一张/保存/分享」不阻塞；未配置或失败时展示演示点评并标注「演示点评 · AI 未配置或调用失败」。状态角标「✓ 已暂存 · 点保存写入相册」。
  - **再拍一张**：返回取景器（相机流保留，秒回）。
  - **保存 / 分享**：同一实现——`navigator.share({files})` 调起系统分享面板（iOS 可「存储图像」存相册）；不支持时降级为浏览器下载；失败 Toast 兜底。

## 已知限制

- **iOS Safari 性能未实测**：lite 模型 + CPU 回退兜底，帧率待真机验证；骨架平滑参数（alpha=0.4、每 2 帧检测）待真机调优。
- **VLM 端到端未在真机验证**：单测覆盖到解析层与回退路径，真实模型调用效果由用户真机验收（在 ⚙ 自填 Key；建议/点评质量取决于所选模型）。
- **骨架规则为示范**：仅「右臂抬高」一条规则，非完整姿势匹配；目标轮廓模板匹配留待原生阶段（Vision）。
- 双人模式骨架可叠加两人，但双人专属建议/话术差异内容待补（R1 归档项）。
- 无离线可用：模型需在线从 CDN 加载（Service Worker 缓存本版不做）。
- 「✓ 已暂存」指成片已暂存于页面内；存入系统相册需点「保存」走系统分享/下载（浏览器无静默写相册能力）。
