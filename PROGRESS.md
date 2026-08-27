# PWA v2 真功能施工 · 进度

## 任务 0 核对（2026-08-27）
- `ls pwa`：index.html/style.css/app.js/manifest.json/icons/tools 存在；js/、tests/ 不存在 ✓
- `node --check pwa/app.js` → 通过 ✓
- `git remote -v`：github + gitee 双远端在 ✓
- 大小核对：index.html 17716B / style.css 22642B / app.js 29254B，与现状描述一致 ✓

## 理解的目标 / 任务顺序 / 最大风险（任务 0 要求，≤10 行）
- 目标：v2 让核心功能作用于真实输入——T1 骨架 EMA 平滑+检测节流、T2 VLM 配置+客户端、T3 提示词/容错解析、T4 取景器真实场景分析、T5 真实照片点评、T6 诚实化文案+README。让步顺序：做得对 > 做得全 > 做得快。
- 顺序：严格 T1→T6（T4/T5 依赖 T1-T3）；每任务：写测试→红→实现→绿→接入→提交（feat:/fix:/docs:）→双推（github 优先，连败 5 次记 BLOCKED 以 gitee 为准）。
- 最大风险：①app.js（29KB）接入平滑/分析/点评流程时改动面大，需小心不破坏现有快门主流程；②无 VLM Key，T4/T5 只能自测到解析层与回退路径；③github 推送可能不通。
- 流程说明：规格建议 subagent-driven-development，但任务书指定"你是执行者"且自治无 Reviewer，故直接在主会话按 TDD 逐任务执行，以本文件做进度跟踪，效果等同 executing-plans。

## 进度
- [x] 任务 0：现状核对 + 本文件（无 BLOCKED 项）
- [x] Task 1：poseSmooth.js + 测试（红→绿，`poseSmooth tests passed`，0 skipped）+ 渲染循环接入（每 2 帧检测 1 次、双人各一平滑器、null 淡出）；规格测试 `a.x` 笔误勘误记 BLOCKED.md B1
- [x] Task 2：aiClient.js（三预设+自定义、chat/testConnection、401/429/超时中文映射）+ 设置面板（齿轮/毛玻璃/存取/测试连接）+ 分析按钮未配置置灰；新增 pwa/tests/aiClient.test.js 全绿；Playwright 实测：面板开合/刷新持久化/置灰回灰、控制台 0 错误
- [x] Task 3：prompts.js（场景/点评双提示词 + 围栏剥离 + 首尾散文容忍 + 严格校验抛中文错）+ 测试全绿（红：模块缺失→绿：`prompts tests passed`）；反向验证已贴红（`Error: AI 返回中找不到 JSON 对象（缺少大括号）`）→还原全绿；中途修过 1 处自撰断言正则过窄（截断 JSON 走「找不到 JSON」路径而非「解析失败」），断言意图不变并补 1 用例
- [x] Task 4：captureFrame（768/0.7 统一压缩出口）+ 分析链路（loading→压缩→__IMG__替换→chat→解析→applySceneAdvice→焦段/AI面板/锦囊3条/note）+ 30s 冷却 + 失败 Toast+回退预设；Playwright 实测：A 失败回退（无相机→Toast「相机尚未就绪…已保留预设建议」，预设未破坏）；B 假摄像头流+桩 VLM 端到端全绿（请求形状/压缩/容错解析/渲染/锦囊 AI 3 条）；真实 Key 场景留用户真机验收（拍板）
- [x] Task 5：state.lastPhoto + blobToCompressedDataUrl（快门同一张、768/0.7）+ startReviewFlow（加载态不阻塞按钮、token 防竞态）+ applyReview/applyDemoReview（来源标注动态切换）；Playwright 实测：C 成功路径（score=7.5/AI 标注/星级/鼓励语/4KB 压缩）+ D 未配置（演示标注正确、0 请求）；顺带验证了模型加载失败不阻断拍照的降级
- [x] Task 6：「✓ 已暂存 · 点保存写入相册」（验收 grep "已自动保存到相册" 无命中，连"已自动保存"也零残留）+ 骨架开关 β 角标（珊瑚色）+ 开启 Toast；README 真功能 vs 未实现清单 + key 只存本机说明 + v2 描述刷新 + 单测命令；Playwright 实测 β 角标渲染与文案
- [x] 收尾：验收全套通过——`node pwa/tests/poseSmooth.test.js`→passed、`node pwa/tests/prompts.test.js`→passed、（附加 `aiClient.test.js`→passed）、`for f in pwa/app.js pwa/js/*.js; do node --check $f || exit 1; done`→ALL_SYNTAX_OK、`grep -rn "已自动保存到相册" pwa/`→无命中；WORK_LOG.md 已更新；github 连败 5 次记 BLOCKED.md B0 以 gitee 为准（gitee 全部同步）

## 最终状态（2026-08-27）
- 规格 6 任务全部落地并逐任务提交：6c4ca5c(T1) / 4159612(T2) / a06a420(T3) / 18ad425(T4) / 9ff55a1(T5) / 0f3d3d8(T6) + 本收尾提交。
- gitee 推送全程成功；github 间歇失败（曾成功过 4159612/a06a420），最终连败 5 次，详见 BLOCKED.md B0。
- 待用户验收（拍板范围外）：真实 Key 真机端到端——①分析建议提到画面真实元素 ②点评针对本张照片 ③骨架肉眼不抖 ④断网/无 Key 全回退。

## 备注
- 每完成一项立即更新本文件。
