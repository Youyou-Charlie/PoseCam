# PoseCam PWA · 网页版最小 MVP

真摄像头取景 + MediaPipe 实时骨架姿势引导 + 真实成片拍摄/保存的最小产品。
无构建步骤，唯一外部依赖是 MediaPipe CDN（运行时加载）。

## 文件结构

```
pwa/
├── index.html        # 应用入口（5 屏流程 + iOS PWA 元数据）
├── style.css         # 视觉系统（沿用 prototype-hifi 冻结稿，全屏/safe-area 适配）
├── app.js            # 相机生命周期 + MediaPipe 管线 + 交互逻辑
├── manifest.json     # PWA manifest（standalone / #0A0A0F）
├── icons/            # 图标（脚本生成，勿手改）
└── tools/
    └── gen_icons.py  # 图标生成脚本（纯 Python 标准库）
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

## 功能与交互（v1）

- 流程 5 屏：启动 → 模式（帮 TA 拍 / 我们合照）→ 场景（咖啡厅/街拍/夜景/室内）→ 取景器 → 点评。
- 取景器：真摄像头全屏，默认后置（`facingMode: "environment"`），右下按钮翻转前后；前摄预览与成片均镜像（所见即所得）。
- AR 层：MediaPipe PoseLandmarker 实时骨架叠加（青色 #00D4AA）；移动端 `pose_landmarker_lite`、桌面 `full`，GPU 失败自动回退 CPU；右上角开关控制骨架显隐（沿用原型 AR 开关语义）。
- 规则化姿势反馈（**v1 简化示范**，仅 1 条规则）：建议为「右臂抬高」类（咖啡厅 · 侧身靠窗）时，右腕关键点高于右肩 → 提示标签转绿「✓ 右臂已到位」，否则红色提示「右臂再抬高一点」；其他建议下标签显示「保持：××」提示文案（默认红）。
- AI 摄影师面板（换一条）/ 焦段胶囊 / 话术锦囊（换几句）：与 prototype-hifi 行为一致，文案逐字沿用。
- 快门：捕获当前视频帧 → 闪白 → 点评页。
- 点评页：真实成片 + 「✓ 已自动保存」状态 + 预设点评（8.6 分 + 三条反馈，页面明确标注「演示点评 · 真实分析为后续版本」）。
  - **再拍一张**：返回取景器（相机流保留，秒回）。
  - **保存 / 分享**：同一实现——`navigator.share({files})` 调起系统分享面板（iOS 可「存储图像」存相册）；不支持时降级为浏览器下载；失败 Toast 兜底。

## 已知限制

- **iOS Safari 性能未实测**：lite 模型 + CPU 回退兜底，帧率待真机验证。
- **点评为演示数据**：8.6 分与三条反馈为预设文案（页面已标注），真实 AI 分析为后续版本（PRD P1）。
- **骨架规则为示范**：仅「右臂抬高」一条规则，非完整姿势匹配；目标轮廓模板匹配留待原生阶段（Vision）。
- 双人模式骨架可叠加两人，但双人专属建议/话术差异内容待补（R1 归档项）。
- 无离线可用：模型需在线从 CDN 加载（Service Worker 缓存本版不做）。
- 「✓ 已自动保存」指成片已暂存于页面内；存入系统相册需点「保存」走系统分享/下载。
