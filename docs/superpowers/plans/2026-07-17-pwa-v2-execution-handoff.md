# PWA v2 真功能改造 · 新会话开工提示词

> 用法：在 Pose相机 项目目录（D:\KIMI\project\Pose相机 或 D:\KIMI）新开 Kimi Code 会话，把下面分割线内的内容完整粘贴发送即可。

---

你是 PoseCam 项目的实施工程师。项目根目录：`D:\KIMI\project\Pose相机`（Windows，Bash 工具走 Git Bash）。产品是一款人像拍照伴侣 App（情侣约会场景）；PWA 网页版 v1 已上线（https://Youyou-Charlie.github.io/PoseCam/pwa/），真机测试暴露问题：浏览器骨架抖动严重、其余功能均为预设文案无实用性。现按**已批准的任务书**实施 v2 真功能改造，你负责逐任务施工。

**开工前必读（按此顺序）：**

1. `AGENTS.md` —— 项目工作约定（提交前缀、双推策略、禁止危险 git 操作）
2. `WORK_LOG.md` —— 项目现状与本次改造背景（2026-07-17 条目）
3. `docs/superpowers/plans/2026-07-17-pwa-v2-real-functions.md` —— **任务书，你的唯一施工依据**：6 个任务、接口定义、测试代码、验收标准
4. `pwa/index.html`、`pwa/style.css`、`pwa/app.js` —— 现状代码（约 2300 行）；若 `pwa/js/` 已有部分产出则续做

**执行规则：**

- 严格按任务书 Task 1→6 顺序执行；每个任务按 checkbox 步骤走：先写失败测试 → 实现 → 测试通过（`node pwa/tests/xxx.test.js`）→ 提交。
- 技术约束：纯原生 HTML/CSS/JS，无构建，禁 ES modules 与新增运行时依赖；视觉沿用 `style.css` 现有 CSS 变量，文案简体中文。
- 每个任务完成后：`node --check` 验证改动文件 → git 提交（`feat:`/`fix:`/`docs:` 前缀）→ 双推：`git push github feature/research-and-prd` 然后 `git push gitee feature/research-and-prd`（github 网络不稳时最多重试 5 次，间隔 8 秒）。
- 不要改 PRD 方向、不要改冻结的视觉 tokens、不要做任务书范围外的功能（YAGNI）。发现任务书有错漏，先停下说明问题并给修正建议，不要擅自扩 scope。
- 没有 VLM API Key 也能完成全部开发（设置页由用户自填 Key）；真实调用验证属验收环节，不在本会话。
- 全部完成后更新 `WORK_LOG.md`（2026-07-17 条目追加 v2 实施记录：各任务完成状态、偏差说明），提交并双推。

**验收标准（任务书 Self-Review 节，最终由用户真机执行）：** ①真实场景分析有场景差异且提及画面真实元素；②点评针对当次拍摄的照片；③骨架肉眼可见不抖；④断网/未配 Key 时回退预设库并有中文说明。

现在从 Task 1（骨架平滑模块 `pwa/js/poseSmooth.js`）开始。

---

## 验收约定（给规划方）

- 施工方每任务一个提交，全部完成后汇报：各任务状态、与任务书的偏差、自查结论。
- 验收方（本对话）按任务书 Self-Review 四条 + 提交记录逐条核验；真机验收由用户在 iPhone 上执行四条标准。
