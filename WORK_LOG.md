# 项目工作日志 / Project Work Log

> 用途：记录项目状态、关键决策和下一步，让新会话能快速接上进度。  
> 更新时间：2026-06-24

---

## 项目基本信息

- **项目名称**：Pose相机 / PoseCam
- **产品定位**：结合摄影知识库与 AI 视觉的人像拍照伴侣工具
- **核心价值**：同时服务「拍摄者」和「被拍摄者」，通过实时双向引导和情绪价值话术，让普通人也能拍出有情绪、有构图、有故事的人像照片
- **目标用户**：情侣/夫妻（P0）、闺蜜群体（P1）、年轻女性/社交达人（P2）、亲子家庭（P3）
- **当前阶段**：PDLC 第一步「灵感构思与市场调研」和第二步「产品规划」已完成，第三步「原型设计」已完成并迭代多轮

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

按 PDLC 下一步是 **开发实现（Development）**：

1. **原型可用性测试**：邀请 3-5 名目标用户操作 HTML 原型，收集反馈。
2. **Figma 高保真设计**：基于原型输出视觉设计稿。
3. **技术脚手架**：创建 Xcode 项目，配置 SwiftUI + ARKit + Vision。
4. **MVP 开发**：按 `docs/MVP_PLAN.md` 的 8 个里程碑推进。

---

## 项目文件结构

```
Pose相机/
├── README.md                          # 项目简介
├── WORK_LOG.md                        # 本文件：项目状态与上下文
├── docs/
│   ├── research_report.md             # 市场调研报告
│   ├── PRD.md                         # 产品需求文档
│   └── MVP_PLAN.md                    # MVP 规划与里程碑
├── prototype/                         # 可点击 HTML 原型
│   ├── index.html
│   ├── style.css
│   └── app.js
├── .kimi/
│   ├── references/
│   │   └── PDLC_REFERENCE.md          # 产品开发生命周期参考
│   └── scripts/
│       └── commit_log.py              # 工作日志辅助脚本
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
