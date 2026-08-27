# PoseCam PWA v2 真功能改造 Implementation Plan（任务书）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 PWA 的每个核心功能都作用于真实输入——VLM 真实场景分析、VLM 真实照片点评、骨架稳定性修复；剔除或诚实标注一切摆设行为。

**Architecture:** 保持纯前端无构建（经典 `<script>` 标签 + `window.PoseCam` 命名空间）。取景器当前帧压缩为 ≤768px JPEG → OpenAI 兼容 `chat/completions`（base64 `image_url`）→ 强约束 JSON 输出 + 容错解析 → 渲染进 AI 面板/焦段胶囊/锦囊（场景分析）与点评页（照片点评）。服务商配置（base_url/key/model）存 localStorage，内置三家预设。骨架用 EMA 平滑 + 检测节流降抖。

**Tech Stack:** 原生 HTML/CSS/JS（无框架无构建）、MediaPipe tasks-vision 0.10.14（沿用）、OpenAI 兼容视觉 API（智谱 `glm-4.6v-flash` / 百炼 `qwen-vl-plus` / Moonshot `moonshot-v1-8k-vision-preview`）、Node 自带 `node:assert` 做纯函数单测。

## Global Constraints

- 无构建步骤；禁止 ES modules/`fetch` 于 file:// 会崩的新写法（现有 file:// 兜底横幅逻辑保留）。
- 唯一运行时外部依赖：`@mediapipe/tasks-vision@0.10.14`（CDN）+ 用户自配 VLM 端点。
- 视觉 tokens 沿用 `pwa/style.css` 现有 CSS 变量，文案简体中文。
- 图像上传前必须压缩：长边 ≤768px、JPEG quality 0.7（`captureFrame()` 统一出口）。
- AI 调用永不阻断快门/拍照主流程；失败一律回退预设库并 Toast 说明。
- API Key 仅存 `localStorage["posecam.ai"]`（自用阶段）；README 必须注明"公开仓库 Pages 部署时 key 仅存在用户自己设备浏览器里，不上传仓库"。
- 每完成一个任务提交一次（`feat:`/`fix:` 前缀），双推 github+gitee。

---

### Task 1: 骨架平滑模块 `poseSmooth.js`

**Files:**
- Create: `pwa/js/poseSmooth.js`
- Test: `pwa/tests/poseSmooth.test.js`
- Modify: `pwa/index.html`（script 标签）、`pwa/app.js`（渲染循环接入）

**Interfaces:**
- Produces: `window.PoseCam.createPoseSmoother({ alpha = 0.4, minVisibility = 0.5 })` → `{ update(landmarks|null) → landmarks|null, reset() }`。`update` 收到 `null`（未检出人）时连续 10 帧后返回 `null`（骨架淡出），之前返回最后平滑值。

- [ ] **Step 1: 写失败测试**

```js
// pwa/tests/poseSmooth.test.js
const assert = require("node:assert");
require("../js/poseSmooth.js"); // 挂载 window.PoseCam
global.window = global.window || {};
// poseSmooth.js 需兼容 Node：内部用 (typeof window!=="undefined"?window:globalThis)

const s = globalThis.PoseCam.createPoseSmoother({ alpha: 0.5 });
// 输入在 100/110 间抖动的点，输出应平滑（不跟随单帧跳变到满幅）
const a = s.update([{ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }]);
assert.strictEqual(a.x, 0.5); // 首帧直通
const b = s.update([{ x: 0.6, y: 0.5, z: 0, visibility: 0.9 }]);
assert(Math.abs(b.x - 0.55) < 1e-6, `EMA 应为 0.55，实际 ${b.x}`);
// 低可见性点应被丢弃（返回上一帧平滑值）
const c = s.update([{ x: 0.9, y: 0.9, z: 0, visibility: 0.1 }]);
assert(c.x < 0.6, "低可见性帧不应污染平滑值");
console.log("poseSmooth tests passed");
```

- [ ] **Step 2: 运行确认失败** `node pwa/tests/poseSmooth.test.js` → 模块不存在报错。
- [ ] **Step 3: 实现**（EMA：`s = a*curr + (1-a)*prev`；visibility < minVisibility 的 landmark 保留 prev；`update(null)` 计数，>10 连续帧返回 null 并 reset；文件尾部挂 `(typeof window!=="undefined"?window:globalThis).PoseCam = Object.assign(...)`）。
- [ ] **Step 4: 运行确认通过** → 输出 `poseSmooth tests passed`。
- [ ] **Step 5: 接入渲染循环**：`app.js` 检测循环改为每 2 帧检测 1 次（`frameCount % 2`），未检测帧用 smoother 的当前值渲染；检测帧先 `smoother.update(landmarks)` 再渲染返回值。
- [ ] **Step 6: Commit** `feat: stabilize skeleton with EMA smoothing and detection throttling`

### Task 2: VLM 客户端与服务商配置 `aiClient.js` + 设置页

**Files:**
- Create: `pwa/js/aiClient.js`
- Modify: `pwa/index.html`（启动页齿轮入口 + 设置面板）、`pwa/style.css`（面板样式）、`pwa/app.js`（面板开合）

**Interfaces:**
- Produces:
  - `PoseCam.AI.PROVIDERS = { zhipu: { label:"智谱 GLM（免费）", baseUrl:"https://open.bigmodel.cn/api/paas/v4", model:"glm-4.6v-flash" }, dashscope: { label:"阿里百炼（90天免费额度）", baseUrl:"https://dashscope.aliyuncs.com/compatible-mode/v1", model:"qwen-vl-plus" }, moonshot: { label:"Moonshot（付费）", baseUrl:"https://api.moonshot.cn/v1", model:"moonshot-v1-8k-vision-preview" } }`
  - `PoseCam.AI.loadSettings()` / `saveSettings({provider, apiKey, model?})`（localStorage `posecam.ai`）
  - `PoseCam.AI.isConfigured()` → boolean
  - `PoseCam.AI.chat({ messages, timeoutMs = 20000 })` → `Promise<string>`（`choices[0].message.content`）；非 200/超时/网络错误均抛带中文消息的 Error
  - `PoseCam.AI.testConnection()` → `Promise<true>`（发 1 条纯文本 "ping"）

- [ ] **Step 1: 实现 aiClient.js**（`chat()` 用 `fetch(baseUrl+"/chat/completions")`，`Authorization: Bearer <key>`，body `{model, messages, temperature:0.3}`，`AbortSignal.timeout(timeoutMs)`；错误映射：401→"Key 无效或已过期"、429→"触发限流，稍后再试"、timeout→"模型响应超时，请检查网络"。）
- [ ] **Step 2: 设置面板 UI**：启动页右下角齿轮按钮 → 毛玻璃面板（服务商下拉[三家预设+自定义]、API Key 密码输入、模型名[默认带预设值可改]、「保存」「测试连接」按钮、状态行）。未配置时，取景器「分析」按钮置灰并附提示文案"先在首页⚙配置 AI"。
- [ ] **Step 3: 手动验证**：起 `python -m http.server`，面板可开合、配置保存后刷新仍在（localStorage）、未配置时按钮置灰。
- [ ] **Step 4: Commit** `feat: add VLM provider settings and OpenAI-compatible client`

### Task 3: 提示词与解析 `prompts.js`（场景分析）

**Files:**
- Create: `pwa/js/prompts.js`
- Test: `pwa/tests/prompts.test.js`

**Interfaces:**
- Produces:
  - `PoseCam.Prompts.buildSceneMessages({ sceneLabel, modeLabel })` → OpenAI messages 数组（system：人像摄影指导专家，只输出 JSON；user：`[{type:"text",...},{type:"image_url",image_url:{url:"data:image/jpeg;base64,..."}}]`——图片占位符 `__IMG__` 由调用方替换）
  - `PoseCam.Prompts.parseSceneAdvice(text)` → `{ composition, focal, pose, tip, lines: [3条] }`；能剥 ```` ```json ```` 围栏、容忍首尾散文（找首个 `{` 到末个 `}`）、字段缺失/非 3 条 lines 时抛错
  - `PoseCam.Prompts.buildReviewMessages({ sceneLabel, modeLabel })` / `parseReview(text)` → `{ score: 1-10 数字, items: [{dim:"构图"|"姿势"|"情绪", stars:1-5, text}×3], encouragement }`

- [ ] **Step 1: 写失败测试**：fixtures——标准 JSON、带围栏 JSON、首尾带废话的 JSON、缺字段 JSON（应抛错）、lines 只有 2 条（应抛错）。
- [ ] **Step 2: 运行确认失败**。
- [ ] **Step 3: 实现**（解析器约 50 行；prompt 要求模型"以专业人像摄影师口吻，针对照片中真实可见的场景元素——光线方向、背景、线条——给建议，禁止泛泛而谈"，输出 schema 逐字段注释）。
- [ ] **Step 4: 运行确认通过**。
- [ ] **Step 5: Commit** `feat: add VLM prompt builders and tolerant JSON parsers with tests`

### Task 4: 取景器「分析当前画面」真功能

**Files:**
- Modify: `pwa/app.js`（captureFrame、分析流程）、`pwa/index.html`（按钮）、`pwa/style.css`（加载态）

**Interfaces:**
- Consumes: Task 2 `PoseCam.AI.*`、Task 3 `PoseCam.Prompts.buildSceneMessages/parseSceneAdvice`
- Produces: `PoseCam.captureFrame(maxEdge = 768, quality = 0.7)` → `Promise<dataURL:string>`（Task 5 复用）；分析成功后 AI 面板/焦段胶囊/锦囊的数据入口 `applySceneAdvice(advice)`

- [ ] **Step 1: `captureFrame()`**：从当前 video 帧 drawImage 到离屏 canvas（等比缩到长边 768），`toDataURL("image/jpeg", 0.7)`。
- [ ] **Step 2: 「分析当前画面」按钮**：放 AI 面板头部（「换一条」旁，图标+文案）。点击 → 按钮转圈 loading（禁用）→ captureFrame → buildSceneMessages（`__IMG__` 替换为 dataURL）→ `AI.chat` → parseSceneAdvice → `applySceneAdvice`：焦段胶囊=advice.focal、AI 面板 pose/tip=advice.pose/tip、锦囊 3 条=advice.lines、面板底部小字标注"AI 实时分析 · 刚刚"。失败 → Toast 中文原因 + 保留/回退预设库。30 秒冷却防连点。
- [ ] **Step 3: 手动验证**（需真实 key）：对准两个不同场景各分析一次，建议内容应有场景差异且提到画面真实元素；拔网线测失败回退。
- [ ] **Step 4: Commit** `feat: real scene analysis via VLM in viewfinder`

### Task 5: 真实照片点评

**Files:**
- Modify: `pwa/app.js`（点评流程）、`pwa/index.html`（点评页加载态）、`pwa/style.css`

**Interfaces:**
- Consumes: `PoseCam.captureFrame`（用快门同一张 blob 转 dataURL）、`PoseCam.Prompts.buildReviewMessages/parseReview`、`PoseCam.AI.chat`
- 点评页渲染入口 `applyReview(review)`：score 与三条 {dim, stars, text} 替换现有静态 DOM；「演示点评」标注改为按来源动态切换（AI→"AI 点评 · 基于本张照片"，回退→"演示点评 · AI 未配置或调用失败"）。

- [ ] **Step 1: 快门流程改造**：照片 blob 保存到 `state.lastPhoto`；点评页先显示照片 + 骨架屏/加载条「AI 正在看这张照片…」（已配置时），调用点评 → 渲染真实结果；未配置/失败 → 现状演示点评 + 明确标注。加载期间「再拍一张/保存/分享」可用（不阻塞）。
- [ ] **Step 2: 手动验证**：拍一张明显构图歪的照片，AI 点评应指出；未配置 key 时演示点评标注正确。
- [ ] **Step 3: Commit** `feat: real photo critique via VLM on review page`

### Task 6: 诚实化整改与文档

**Files:**
- Modify: `pwa/index.html`、`pwa/app.js`（文案）、`pwa/README.md`

- [ ] **Step 1**: 「✓ 已自动保存到相册」→「✓ 已暂存 · 点保存写入相册」（浏览器无静默写相册能力，与 R1"快门即存"语义在 Web 平台的真实映射）；骨架开关按钮加角标「β」并配 Toast 说明"实验功能，原生 App 中将是稳定引导"。
- [ ] **Step 2**: README 新增「真功能 vs 未实现」清单：真功能=真实骨架（β）/VLM 场景分析/VLM 照片点评/真实拍摄；未实现=目标姿势轮廓匹配、双人专属内容、实时纠偏闭环（划归原生阶段）。部署段落补充"key 只存用户设备"。
- [ ] **Step 3: Commit** `docs: honesty pass - real vs unimplemented feature list, beta badges`

---

## Self-Review 记录

- 覆盖：VLM 场景分析（T3+T4）、VLM 点评（T3+T5）、骨架稳定（T1）、配置（T2）、诚实化（T6）、验收（下方）。
- 验收标准（用户真机）：①对准真实场景按「分析当前画面」→ 建议提到画面真实元素；②拍照 → 点评针对该照片；③骨架肉眼可见不抖；④断网/无 key 时全功能回退预设库且有中文说明。四条全过才算真功能 MVP。
- 类型一致性：`captureFrame` 返回 dataURL 字符串（T4 产出、T5 消费）；`parseSceneAdvice`/`parseReview` 抛错路径均在 UI 层 catch。
