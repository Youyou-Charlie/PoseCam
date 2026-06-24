# Pose相机 / PoseCam — Agent 工作指南

> 本文件用于帮助新接入的 AI Agent 快速理解项目上下文，避免对话中断后接不上进度。

---

## 1. 项目一句话

Pose相机是一款结合摄影知识库与 AI 视觉的人像拍照伴侣工具：
- **拍摄者**获得实时构图、焦段、参数建议；
- **被拍摄者**通过 AR 姿势引导线知道怎么摆、往哪看；
- 双方同时获得情绪价值话术锦囊，降低关系场景中的拍照摩擦。

---

## 2. 当前阶段

项目已完成 PDLC 的前三个阶段：

| 阶段 | 状态 | 输出物 |
|---|---|---|
| 灵感构思与市场调研 | ✅ 完成 | `docs/research_report.md` |
| 产品规划 | ✅ 完成 | `docs/PRD.md`、`docs/MVP_PLAN.md` |
| 原型设计 | ✅ 完成 | `prototype/index.html`（可点击 HTML 原型） |
| 开发实现 | ⏳ 待开始 | 暂无 |

---

## 3. 关键决策

以下决策已确认，执行时如无特别说明请遵循：

1. **MVP 平台**：iOS（Swift + SwiftUI + ARKit + Apple Vision），后续扩展 Android。
2. **核心场景**：情侣/约会拍照。
3. **商业模式**：免费 + 订阅（¥12.9/月 或 ¥68/年）。
4. **MVP 周期**：6-8 周出 TestFlight 原型。
5. **核心功能 triad**：
   - 被拍摄者：AR 姿势引导线
   - 拍摄者：实时构图 + 焦段建议
   - 双方：情绪价值话术锦囊
6. **代码仓库双推**：
   - GitHub：`https://github.com/Youyou-Charlie/PoseCam.git`
   - Gitee：`https://gitee.com/Youyou-Charlie/pose-cam.git`
   - 当前分支：`feature/research-and-prd`
7. **权限模式**：用户已开启 YOLO 模式，但仍需在大改动前说明计划。

---

## 4. 工作流约定

### 4.1 开始工作前必读

每次新会话接入后，请先阅读：

1. `WORK_LOG.md`（项目状态与下一步）
2. `docs/PRD.md`（产品需求）
3. `docs/MVP_PLAN.md`（MVP 规划）
4. `prototype/index.html` 或相关代码（当前实现状态）

### 4.2 Git 提交规范

使用前缀风格提交信息：

| 前缀 | 用途 |
|---|---|
| `docs:` | PRD、调研报告、规划文档 |
| `log:` | WORK_LOG 更新 |
| `feat:` | 新功能 |
| `fix:` | Bug 修复 |
| `refactor:` | 重构 |
| `chore:` | 配置、环境、工具 |

### 4.3 双推策略

每次提交后同步推送到两个仓库：

```bash
git push github feature/research-and-prd
git push gitee feature/research-and-prd
```

如果 GitHub 网络不稳定，先推 Gitee，稍后重试 GitHub。

### 4.4 Superpowers Skill

项目已安装 `obra/superpowers` skill 到 `~/.kimi/skills/`。在开发实现阶段，相关 skill 包括：

- `using-superpowers`：总入口，任何任务前检查是否有 skill 适用
- `writing-plans`：写实施计划
- `subagent-driven-development`：复杂多文件改动
- `test-driven-development`：TDD 开发
- `systematic-debugging`：调试
- `verification-before-completion`：完成前验证

---

## 5. 下一步工作

按 `docs/MVP_PLAN.md` 推进，下一步建议：

1. **原型可用性测试**：邀请 3-5 名目标用户操作 HTML 原型。
2. **Figma 视觉设计**：输出高保真设计稿。
3. **Xcode 项目脚手架**：创建 SwiftUI + ARKit + Vision 项目。
4. **MVP 开发**：从 M0 准备到 M7 上线验证。

---

## 6. 注意事项

- **不要擅自修改已确认的 PRD 核心方向**，如有必要先说明原因并征得用户同意。
- **不要执行 `git push --force`、 `git reset`、`git rebase` 等危险操作**。
- **保持工作日志更新**：每次完成阶段性工作后，更新 `WORK_LOG.md`。
- **遇到不确定性要说明**：不要在未告知的情况下替用户做重大决策。
