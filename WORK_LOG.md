# 项目工作日志 / Project Work Log

> 用途：记录项目状态、关键决策和下一步，让新会话能快速接上进度。  
> 更新时间：2026-07-17

---

## 项目基本信息

- **项目名称**：Pose相机 / PoseCam
- **产品定位**：结合摄影知识库与 AI 视觉的人像拍照伴侣工具
- **核心价值**：同时服务「拍摄者」和「被拍摄者」，通过实时双向引导和情绪价值话术，让普通人也能拍出有情绪、有构图、有故事的人像照片
- **目标用户**：情侣/夫妻（P0）、闺蜜群体（P1）、年轻女性/社交达人（P2）、亲子家庭（P3）
- **当前阶段**：PDLC 第一、二步及第三步低保真原型已完成；2026-07-17 起进入高保真视觉原型 + 姿势识别技术验证阶段（用户全权委托 Agent 自主推进）

---

## 关键决策（已确认）

1. **目标平台**：MVP 先做 iOS，后续扩展 Android。
2. **核心场景**：优先聚焦「情侣/约会拍照」。
3. **技术栈**：Swift + SwiftUI + ARKit + Apple Vision。
4. **商业模式**：免费 + 订阅（¥12.9/月 或 ¥68/年）。
5. **MVP 周期**：6-8 周出 TestFlight 原型。
6. **核心差异化**：
   - 双向引导（拍摄者 + 被拍摄者）
   - AI 摄影师式实时指导（构图、焦段、姿势）
   - 情绪价值话术锦囊
7. **代码仓库**：双推策略
   - GitHub：`https://github.com/Youyou-Charlie/PoseCam.git`
   - Gitee：`https://gitee.com/Youyou-Charlie/pose-cam.git`
   - 当前分支：`feature/research-and-prd`

---

## 已完成工作

### 2026-07-17

- ✅ 用户全权委托 Agent 自主推进项目（原话：「把这个项目托付到你的手中，看你能做到哪一步」），视觉方向等设计决策由 Agent 调研拍板，用户保留随时否决权。
- ✅ 拍板视觉方向：**方案 A（专业科技风）为全局基调 + 话术锦囊模块融合方案 B（聊天泡泡 + 珊瑚橙暖色）**，理由与否决记录见设计规格文档。
- ✅ 确定交付路线调整：以 HTML/CSS 高保真视觉原型替代 Figma 稿先行，并新增浏览器姿势识别技术验证 demo（验证 CV 核心可行性这一最大风险）。
- ✅ 输出设计规格：`docs/superpowers/specs/2026-07-17-hifi-prototype-and-pose-demo-design.md`（含设计 tokens、页面规格、demo 技术方案与验证指标）。
- ✅ 构建完成 `prototype-hifi/` 高保真视觉原型（5 屏，A+B 融合视觉，纯前端无依赖，file:// 直开可运行）。
- ✅ 构建完成 `pose-demo/` 姿势识别验证 demo（MediaPipe PoseLandmarker，FPS/单帧耗时/骨架实时显示，通过标准 FPS≥24、≤40ms；真实浏览器效果待用户实测验收）。
- ✅ pose-demo 增加「文件回退模式」（用户台式机无摄像头）：上传视频/图片即可验证算力核心（识别速度+准确性），实时管道待回家用笔记本摄像头模式补验。
- ✅ 用户实测：视频模式 FPS 28 / 单帧 35ms 双达标（台式机、浏览器 WASM 环境）。图片模式初测 1700ms 为测量口径失真（模式切换+GPU预热+原图上传），修正（预热+缩放1280+5次中位数）后中位数 70ms，按图片模式独立参考线 ≤100ms（单次全量检测≈2×视频帧）判达标。
- ✅ 摄像头模式补测取消：台式机与笔记本均无摄像头，且浏览器实时管道并非产品（iOS 原生）路径，边际验证价值低，不购置外接摄像头；实时管道验证并入后续 iPhone 真机阶段。
- ✅ 用户评审通过高保真原型（「感觉不错，没有太多意见」）：A+B 融合视觉方向与原型正式冻结，进入 Figma 设计规格与可用性测试计划阶段。
- ✅ 输出正式设计规格 `docs/FIGMA_SPEC.md`：设计 tokens（21 色/24 文字样式/10 效果）、11 个组件规格、5 屏页面规格与完整 z 序、CSS→SwiftUI 映射表；文末附 6 条原型不一致记录（AR 已匹配绿态原型未实现需 Figma 补变体等）。
- ✅ 输出可用性测试计划 `docs/USABILITY_TEST_PLAN.md`：4 大测试目标、P0 情侣 3-5 对 + P1 闺蜜 2 组、6 个贴合原型真实路径的任务脚本（含双人实拍核心任务）、招募渠道与酬谢方案、记录反馈模板、7 条迭代决策规则。
- ✅ 完成可用性测试第 1 轮（参与者=用户本人，专家走查性质）：执行任务全通过；发现并修复 P0 bug 1 个（双人轮廓 `.hidden` 对 SVG 不生效，`dc12d8b` 修复并复测闭环）；核心结论「AI 建议与点评必须由真实画面/成片驱动」；付费意愿口头验证 ¥30–60/月（高于 PRD 定价 2.3–4.7 倍）。报告：`docs/USABILITY_REPORT_R1_2026-07-17.md`。
- ✅ 按报告决策完成原型 Top 3 迭代：AR 轮廓显隐开关（取景器顶部栏，SVG 用 setAttribute 切换）、点评页快门即存语义（自动保存状态 + 再拍一张/完成）、场景卡一句话预览；PRD 级提案「分析当前画面（实时视觉分析）」待用户拍板。
- ✅ 用户拍板：「AI 实时场景分析（分析当前画面）」进 PRD v0.2（P1、阶段二、Pro 订阅权益）；分享入口问题已向用户澄清（系统分享≠社区化），待确认后补进原型。
- ✅ 用户确认补回分享入口：点评页照片右上角新增系统分享按钮（iOS 分享面板语义、增长水印思路、不做社区），FIGMA_SPEC 同步（R1.1），不一致记录第 7 条关闭。

### 2026-06-25

- ✅ 确认下一步推进方式：先基于现有原型输出 Figma 高保真设计稿，再用设计稿做可用性测试。
- ✅ 调研 UI 设计专业知识与经典案例：
  - 相机类 App UI 共识（取景器优先、深色模式默认、拇指区控件）
  - AR 叠加层最佳实践（最大化实景、减少环境文本、即时反馈、避免视野过载）
  - 2025 移动 UI 趋势（深色模式、玻璃拟态、柔和圆角、微交互、功能型 AI）
- ✅ 结合 PoseCam 场景提出 3 个视觉方向：
  - 方案 A：专业科技风（推荐）
  - 方案 B：温馨陪伴风
  - 方案 C：时尚杂志风
- ✅ 创建视觉方向草案：`docs/superpowers/specs/2026-06-25-ui-design-direction-draft.md`
- ✅ 保存进度并推送到 GitHub 与 Gitee 双仓库。

### 2026-06-24

- ✅ 恢复项目并启用 YOLO 模式，减少操作确认摩擦。
- ✅ 安装并配置 `obra/superpowers` skill 工作流。
- ✅ 从 Markdown 版《AI时代的产品开发完全指南》中提取 PDLC 框架，整理为 `.kimi/references/PDLC_REFERENCE.md`。
- ✅ 完成市场调研，撰写 `docs/research_report.md`：
  - 验证「不会拍照/不会摆姿势」痛点（华为、荣耀、字节可颂均在押注）
  - 竞品分析（华为 AI 构图、荣耀灵感帮拍、字节可颂、美姿构图相机等）
  - 用户画像、SWOT 分析、市场规模
  - 结论：MVP 聚焦情侣场景，核心 triad 为 AR 姿势引导 + 构图/焦段建议 + 话术锦囊
- ✅ 完成产品规划：
  - 撰写 `docs/PRD.md`（产品需求文档）
  - 撰写 `docs/MVP_PLAN.md`（MVP 里程碑与功能边界）
- ✅ 完成可点击 HTML 原型 `prototype/`，迭代多轮：
  - 启动页 → 模式选择 → 场景选择 → 取景器 → AI 点评
  - 取景器包含：构图辅助线、AR 姿势轮廓、焦段建议、AI 摄影师指导面板、话术锦囊
  - 移除姿势列表，改为 AI 摄影师根据场景直接给出 integrated 指导方案
  - **注意：此原型仅为低保真功能原型，用于验证交互流程和核心功能，UI 视觉设计尚未开始**
- ✅ 将项目推送到 GitHub 和 Gitee 双仓库。

---

## 下一步（待执行）

当前处于「Agent 自主推进」阶段（用户全权委托，保留否决权）：

1. ✅ **高保真视觉原型 `prototype-hifi/`**：已交付（双击 `prototype-hifi/index.html` 即可体验）。
2. ✅ **姿势识别验证 demo `pose-demo/`**：已交付（在 `pose-demo/` 起 HTTP 服务后访问，步骤见其中 README）。
3. ✅ **用户评审**：原型通过、视觉冻结；demo 视频模式双达标，图片模式按独立参考线达标；摄像头补测取消（2026-07-17）。
4. ✅ **输出正式 Figma 设计稿规格**：`docs/FIGMA_SPEC.md` 已交付（2026-07-17）。
5. ✅ **制定可用性测试计划**：`docs/USABILITY_TEST_PLAN.md` 已交付（2026-07-17）。
6. ✅ **可用性测试第 1 轮（本人场）**：报告见 `docs/USABILITY_REPORT_R1_2026-07-17.md`；第 2 轮需陌生人 n≥3（至少 2 对情侣现场），补测 T3 双人任务与锦囊发现率。
7. （后续，需 Mac + Xcode）**技术脚手架**：创建 SwiftUI + ARKit + Vision 项目；需提前规划 Mac 与 Apple 开发者账号（¥688/年）。
8. （后续）**MVP 开发**：按 `docs/MVP_PLAN.md` 的 8 个里程碑推进。

---

## 项目文件结构

```
Pose相机/
├── README.md                          # 项目简介
├── WORK_LOG.md                        # 本文件：项目状态与上下文
├── docs/
│   ├── research_report.md             # 市场调研报告
│   ├── PRD.md                         # 产品需求文档
│   ├── MVP_PLAN.md                    # MVP 规划与里程碑
│   ├── FIGMA_SPEC.md                  # Figma 设计规格（2026-07-17，视觉冻结版）
│   └── USABILITY_TEST_PLAN.md         # 可用性测试计划（2026-07-17）
├── prototype/                         # 可点击 HTML 原型（低保真，流程对照）
│   ├── index.html
│   ├── style.css
│   └── app.js
├── prototype-hifi/                    # 高保真视觉原型（2026-07-17，A+B 融合视觉）
│   ├── index.html
│   ├── style.css
│   └── app.js
├── pose-demo/                         # 姿势识别技术验证 demo（2026-07-17，MediaPipe）
│   ├── index.html
│   ├── app.js
│   ├── style.css
│   └── README.md
├── .kimi/
│   ├── references/
│   │   └── PDLC_REFERENCE.md          # 产品开发生命周期参考
│   └── scripts/
│       └── commit_log.py              # 工作日志辅助脚本
├── docs/superpowers/
│   └── specs/
│       ├── 2026-06-25-ui-design-direction-draft.md        # UI 视觉方向草案（已确认）
│       └── 2026-07-17-hifi-prototype-and-pose-demo-design.md  # 高保真原型+demo 设计规格
└── .gitignore
```

---

## 给新会话的提示

如果你是新接手的 AI Agent，请先：

1. 阅读本文件（WORK_LOG.md）了解项目状态。
2. 阅读 `docs/research_report.md`、`docs/PRD.md`、`docs/MVP_PLAN.md` 了解产品方向。
3. 打开 `prototype/index.html` 体验当前低保真原型（仅确认功能流程，非最终 UI）。
4. 查看当前 git 分支和最近提交：`git log --oneline -10`。
5. 确认 remote 配置：`git remote -v`（双推策略）。
6. 推进任务前，优先使用 superpowers skill（如有必要）。
