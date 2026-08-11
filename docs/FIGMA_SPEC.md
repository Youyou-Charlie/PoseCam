# PoseCam Figma 设计规格（视觉复刻文档）

> 日期：2026-07-17
> 状态：视觉已冻结（高保真原型于 2026-07-17 评审通过），本文档供 Figma 复刻与 iOS 开发标注使用
> 迭代记录：2026-07-17 R1 迭代增量已同步（取景器 AR 轮廓显隐开关 / AI 点评页「快门即存」/ 场景卡预览文案行）
> 事实来源：`prototype-hifi/` 高保真原型 —— `style.css` 是全部视觉数值的唯一事实来源，`index.html` / `app.js` 是结构与交互的事实来源
> 冲突仲裁：本文全部数值以 `style.css` 实际值为准；与 `docs/superpowers/specs/2026-07-17-hifi-prototype-and-pose-demo-design.md`（下称「7-17 规格」）或 `docs/PRD.md` 冲突之处，就地加注并汇总于文末「不一致记录」
> 读者：在 Figma 中复刻本设计的设计师，以及需要标注信息的 iOS 开发

---

## 一、设计 Tokens

### 1.1 色彩

Figma 中建议按 `PoseCam/<组>/<名>` 建 Color Styles。「出处」列为 `style.css` 中的变量或选择器。

| Figma 样式名 | 值 | 用途 | 出处 |
|---|---|---|---|
| `bg/app` | `#0A0A0F` | 全部页面主背景 | `--bg` |
| `bg/viewfinder` | `#000000` | 取景器屏底色（渐变画面之下） | `.vf` |
| `brand/cyan` | `#00D4AA` | 品牌主色：主按钮、引导线、选中态、强调文字、图标描边 | `--cyan` |
| `ar/success` | `#34C759` | AR 匹配成功（轮廓变绿仍未实现，见「不一致记录」1）；R1 起实际用于保存标记 ✓ 图标（`.saved-chip`） | `--green` |
| `ar/error` | `#FF453A` | AR 未匹配部位高亮、警示 | `--red` |
| `accent/coral` | `#FF7E67` | 珊瑚橙暖色，**仅限话术锦囊模块** | `--coral` |
| `text/primary` | `#F5F5F0` | 主文字（暖白） | `--text` |
| `text/secondary` | `#8E8E93` | 次级文字 | `--text2` |
| `text/primary-82` | `rgba(245,245,240,0.82)` | AI 建议正文（主文字 82% 不透明） | `.ai-tip` |
| `text/cyan-72` | `rgba(0,212,170,0.72)` | 场景卡预览文案（品牌青 72% 不透明，R1 新增） | `.scene-preview` |
| `surface/glass` | `rgba(18,20,28,0.55)` | 标准毛玻璃面板底色 | `--glass` |
| `surface/glass-heavy` | `rgba(18,20,28,0.78)` | 话术锦囊底部面板（更重） | `.lines-sheet` |
| `surface/bubble` | `rgba(255,126,103,0.14)` | 锦囊聊天气泡底 | `--bubble` |
| `surface/cyan-10` | `rgba(0,212,170,0.10)` | 反馈行图标底 | `.fb-icon` |
| `border/glass` | `rgba(255,255,255,0.08)` | 玻璃面板 1px 描边 | `--glass-border` |
| `border/glass-strong` | `rgba(255,255,255,0.35)` | 底部缩略图 1.5px 描边 | `.thumb-mini` |
| `border/bubble` | `rgba(255,126,103,0.22)` | 气泡 1px 描边 | `.bubble` |
| `border/coral` | `rgba(255,126,103,0.40)` | 「换几句」按钮描边 | `.sheet-refresh` |
| `border/coral-28` | `rgba(255,126,103,0.28)` | 锦囊面板顶部 1px 描边 | `.lines-sheet` |
| `border/error-45` | `rgba(255,69,58,0.45)` | 未匹配提示标签描边 | `.ar-tag` |
| `border/cyan-35` | `rgba(0,212,170,0.35)` | 启动页品牌标描边 | `.brand-mark` |
| `base/on-cyan` | `#0A0A0F` | 压在中色上的深色：主按钮文字、勾选对勾 | `.btn-primary` 等 |
| `base/white` | `#FFFFFF` | 快门圆环/内芯、FAB 图标、状态栏图标（`#F5F5F0`） | `.shutter` 等 |
| `overlay/scrim` | `rgba(0,0,0,0.45)` | 锦囊面板遮罩 | `.scrim` |
| `token/panel-base` | `#12141C` | **声明后未被直接引用**（仅作 glass 基色），见「不一致记录」4 | `--panel` |

**取景器叠层与渐变（填充样式，非纯色）：**

| 名称 | 值 | 用途 |
|---|---|---|
| 取景暗角 | 径向 `rgba(245,235,220,0.10)→透明70%`（椭圆 52%×44%，位于 50%/40%）+ 线性 180° `rgba(0,0,0,0.42) 0% → 透明 22% → 透明 62% → rgba(0,0,0,0.66) 100%` | `.vf-vignette` |
| 快门区底渐变 | 线性 0° `rgba(0,0,0,0.72) → 透明` | `.vf-bottom` |
| 启动页底光晕 | 径向椭圆 90%×60% 位于 50%/108%，`rgba(0,212,170,0.10) → 透明 65%` | `.splash` |
| 点评照片叠层 | 径向 `rgba(245,235,220,0.12)→透明70%` + 线性 0° `rgba(0,0,0,0.5) → 透明 38%` | `.review-photo::after` |

**模拟照片占位渐变**（场景缩略图 / 取景画面 / 点评照片共用，属占位素材而非 UI 色）：

| 场景 | CSS |
|---|---|
| 咖啡厅 `thumb-cafe` | 径向圆 78%/18% `rgba(255,196,120,0.55)→透明42%`，径向圆 30%/78% `rgba(122,78,44,0.6)→透明55%`，线性 150° `#241a12 0% → #4a3320 55% → #191008 100%` |
| 街拍 `thumb-street` | 径向圆 24%/22% `rgba(140,170,220,0.4)→透明46%`，线性 160° `#141a26 0% → #2c3a52 58% → #0e1420 100%` |
| 夜景 `thumb-night` | 4 处径向光斑（青 `rgba(0,212,170,0.35)` 26%/30%、粉 `rgba(255,120,160,0.32)` 72%/22%、黄 `rgba(255,200,90,0.3)` 58%/62%、紫 `rgba(120,90,255,0.3)` 30%/74%），线性 180° `#0a0e24 0% → #1a1f4a 60% → #0a0a18 100%` |
| 室内 `thumb-indoor` | 径向圆 70%/24% `rgba(230,214,190,0.4)→透明48%`，线性 140° `#221e1a 0% → #453c33 55% → #171310 100%` |

#### AR 反馈色语义

| 状态 | 颜色 | 形态 |
|---|---|---|
| 匹配中（默认） | `brand/cyan` | 3px 圆角虚线（dash 7/7），发光 6px |
| 未匹配部位 | `ar/error` | 同上虚线改红色 + 红色描边提示标签 |
| 已匹配 | `ar/success` | **原型未实现**（7-17 规格第 2 节定义了「匹配后变绿」），Figma 需按 `--green` token 补该变体，见「不一致记录」1 |

> 注：`docs/PRD.md` 3.3.1 的「轮廓白色或浅蓝色、透明度 60-70%」为早期草案，已被 7-17 规格与冻结视觉取代，以本节为准。

### 1.2 文字

- 字体族：`-apple-system, "PingFang SC", "Noto Sans SC", sans-serif`。Figma 对应：中文 **PingFang SC**，西文与数字 **SF Pro**（无 SF 许可时用 Inter 代）。
- 字重仅三档：400 Regular / 600 Semibold / 700 Bold。
- 行高未显式声明处为浏览器默认（≈1.2–1.4），Figma 用 Auto 并在下表注明。

Figma Text Styles 建议命名 `PoseCam/<语义名>`：

| Text Style | 字号 | 字重 | 行高 | 字距 | 颜色 | 用途（出处） |
|---|---|---|---|---|---|---|
| `brand` | 36 | 700 | Auto | 1 | `text/primary` | 启动页品牌名（`.brand-name`） |
| `h1-page` | 26 | 700 | Auto | 0.5 | `text/primary` | 页面标题（`.head-row h2`） |
| `score` | 26 | 700 | 1.1（≈28.6px） | 0 | `brand/cyan` | 评分数字（`.score-num`） |
| `card-title` | 18 | 700 | Auto | 0 | `text/primary` | 模式卡标题（`.mode-title`） |
| `button` | 17 | 600 | Auto | 0 | 视按钮 | 主/次按钮（`.btn-pill`） |
| `list-title` | 17 | 600 | Auto | 0 | `text/primary` | 场景名（`.scene-name`） |
| `sheet-title` | 17 | 700 | Auto | 0 | `accent/coral` | 锦囊面板标题（`.sheet-title`） |
| `emphasis` | 16 | 700 | Auto | 0 | `brand/cyan` | AI 姿势名（`.ai-pose`） |
| `body` | 15 | 400 | 1.8（27px） | 0 | `text/secondary` | 启动页副标语（`.brand-tag`） |
| `statusbar` | 15 | 600 | Auto | 0 | `text/primary` | 状态栏时间（`.sb-time`） |
| `item-title` | 14.5 | 600 | Auto | 0 | `text/primary` | 反馈行标题（`.fb-title`） |
| `subtitle` | 14 | 400 | Auto | 0 | `text/secondary` | 页头副标题（`.head-sub`） |
| `pill` | 13.5 | 600 | Auto | 0 | `text/primary` | 焦段胶囊（`.focal-pill`） |
| `bubble` | 13.5 | 400 | 1.6（21.6px） | 0 | `text/primary` | 气泡 / Toast（`.bubble` `.toast`） |
| `stars` | 13 | 400 | Auto | 1.5 | `brand/cyan`（空星 `rgba(245,245,240,0.18)`） | 星级（`.stars`） |
| `refresh` | 13 | 600 | Auto | 0 | `accent/coral` | 「换几句」（`.sheet-refresh`） |
| `badge` | 12.5 | 700 | Auto | 0 | `brand/cyan` | 「AI 摄影师」徽标（`.ai-badge`） |
| `caption` | 12.5 | 400 | 1.6 处 20px | 0 | `text/secondary` / `text/primary-82` | 场景描述、AI 建议正文、反馈正文（`.scene-desc` `.ai-tip` `.fb-text`） |
| `desc` | 12 | 400 | 1.7（20.4px） | 0 | `text/secondary` | 模式卡描述（`.mode-desc`） |
| `hint` | 12 | 400 | Auto | 0 | `text/secondary` 70% | 启动页提示（`.splash-hint`） |
| `tag` | 11.5 | 400 | Auto | 0 | `text/primary` | AR 提示标签（`.ar-tag`） |
| `sub` | 11.5 | 400 | Auto | 0 | `text/secondary` | 锦囊面板副标（`.sheet-sub`） |
| `preview` | 11.5 | 400 | Auto | 0 | `text/cyan-72` | 场景卡预览文案（`.scene-preview`，R1 新增） |
| `meta` | 11 | 400 | Auto | 0 | `text/secondary` | AI 面板场景信息（`.ai-scene`） |
| `chip` | 11 | 400 | Auto | 0 | `text/primary` | 自动保存标记（`.saved-chip`，R1 新增） |
| `label` | 10.5 | 400 | Auto | 0 | `text/secondary` | 评分标签（`.score-label`） |
| `fab-label` | 10 | 600 | Auto | 0 | `accent/coral` | FAB 下文字（`.fab-label`） |
| `avatar` | 10 | 700 | Auto | 0 | `#FFFFFF` | 气泡头像「AI」（`.bubble-avatar`） |

> 注：10.5 / 11.5 / 12.5 / 13.5 / 14.5 等半像素字号是原型实际值，Figma 与 iOS（pt）均可直接使用，无需取整。

### 1.3 圆角

| Radius token | 值 | 用在 |
|---|---|---|
| `radius/pill` | 999（全圆角） | 主/次按钮、焦段胶囊、AR 标签、「换几句」、Toast、保存标记 chip |
| `radius/brand` | 28 | 启动页品牌标 |
| `radius/sheet` | 24（仅顶部两角） | 锦囊底部面板 |
| `radius/panel` | 20 | 模式卡、场景卡、AI 面板、点评照片、反馈行（`--radius-panel`） |
| `radius/chip` | 16 | 评分 chip |
| `radius/bubble` | 16 / 16 / 16 / 4（左上起顺时针，左下 4） | 聊天气泡 |
| `radius/thumb` | 14 | 场景缩略图 |
| `radius/mini` | 12 | 底部缩略图按钮 |
| `radius/icon` | 11 | 反馈行图标底 |
| 正圆 | 50% | 返回键、玻璃圆钮、FAB、快门、头像、小圆点 |

> 注：7-17 规格第 2 节只写了「圆角 20px」，实际 CSS 存在上表多档圆角，以 CSS 为准（见「不一致记录」3）。

### 1.4 间距体系

原型未定义显式 spacing token，以下是从 CSS 提取的实际值，基础网格 4px：

- 页面容器：上 72 / 左右 24 / 下 28（`.screen`，取景器屏除外，padding 0）
- 内容区净宽：390 − 24×2 = **342**
- 页头：标题行与副标题间距 8，页头距下方内容 26；副标题左缩进 52（= 返回键 38 + 间距 14）
- 页脚：距上 20，贴底（`margin-top:auto`）
- 列表/网格间距：模式卡 14，场景卡 12，反馈行 10，气泡 10，双按钮行 12
- 卡片内边距：模式卡 18/12（上下/左右），场景卡 12/14，AI 面板 14/16，反馈行 13/15，气泡 11/14，锦囊面板 18/18/22
- 组件内部小间距：4 / 5 / 6 / 8 / 10 / 12 / 14（组件节逐一标注）
- 取景器绝对定位基准：顶栏 top 58，AI 面板 bottom 142 / 左 16 / 右 88，FAB bottom 168 / 右 18，快门区 padding 26/24/30

### 1.5 毛玻璃与效果（Figma Effect Styles）

| Effect Style | 参数 | 用在（出处） |
|---|---|---|
| `effect/glass` | 填充 `surface/glass` + **Background blur 20** + 内侧描边 1px `border/glass` | 全部标准玻璃面板：次按钮、返回键、玻璃圆钮（含 AR 开关）、模式卡、场景卡、焦段胶囊、AI 面板、评分 chip、保存标记 chip、反馈行、Toast |
| `effect/glass-heavy` | 填充 `surface/glass-heavy` + Background blur **24** + 顶描边 1px `border/coral-28` | 锦囊底部面板（`.lines-sheet`） |
| `effect/cta-cyan` | Drop shadow X0 Y8 B28，`rgba(0,212,170,0.28)` | 主按钮 |
| `effect/selected-mode` | 描边改 `brand/cyan` 1.5px + 双层阴影：X0 Y0 B0 Spread1 `rgba(0,212,170,0.4)`；X0 Y10 B34 `rgba(0,212,170,0.14)` | 模式卡选中 |
| `effect/selected-scene` | 同上但第二层为 X0 Y8 B28 `rgba(0,212,170,0.12)` | 场景卡选中 |
| `effect/fab-coral` | Drop shadow X0 Y10 B28 `rgba(255,126,103,0.4)` | 话术锦囊 FAB |
| `effect/glow-cyan` | Drop shadow X0 Y0 B6 `rgba(0,212,170,0.45)` | AR 轮廓（匹配中段）发光 |
| `effect/glow-red` | Drop shadow X0 Y0 B6 `rgba(255,69,58,0.5)` | AR 轮廓（未匹配段）发光 |
| `effect/brand-glow` | Drop shadow X0 Y0 B44 `rgba(0,212,170,0.22)`；呼吸动画在 B28/16% ↔ B52/32% 间循环，3.2s | 启动页品牌标 |
| `effect/text-on-dark` | Drop shadow X0 Y1 B6 `rgba(0,0,0,0.6~0.8)`（文字阴影） | 状态栏、FAB 标签 |

### 1.6 动效参数（供 Figma 原型 / 开发还原）

| 动效 | 参数 | 出处 |
|---|---|---|
| 屏幕切换 | 透明度淡入 0.3s ease | `.screen` |
| 按钮按下 | scale 0.96（主按钮、模式卡）/ 0.97（场景卡）/ 0.9（圆钮、缩略图、快门）/ 0.88（FAB）/ 0.85（刷新、关闭）/ 0.93（换几句），0.15s ease；AI 刷新额外 rotate 40° | 各 `:active` |
| 锦囊面板滑出 | translateY 104% → 0，0.34s cubic-bezier(0.32, 0.9, 0.35, 1)；遮罩淡入 0.3s | `.lines-sheet` `.scrim` |
| AR 轮廓脉冲 | 透明度 0.62 ↔ 1，2.6s ease-in-out 循环 | `arPulse` |
| 启动页呼吸 | 光晕 opacity 0.55↔1、scale 0.92↔1.06，3.2s | `breathe` / `markGlow` |
| 拍照闪白 | 白屏 opacity 0→0.92(18%)→0，0.38s ease-out，闪后 360ms 跳转点评页 | `flashAnim` + `app.js` |
| Toast | 透明度 + 上移 16px，0.25s；停留 1.8s | `.toast` + `app.js` |

---

## 二、组件库规格

「状态」只列原型实际实现的；未实现的（如禁用态）明确标注。所有玻璃质感组件均引用 `effect/glass`，不再重复展开。

### 2.1 主按钮 `btn-primary`（pill）

- 尺寸：宽撑满父容器（页面内 342；启动页限宽 250），高由 padding 决定：17×2 + 17px 文本行 ≈ **56**；`radius/pill`
- 配色：底 `brand/cyan`，文字 `base/on-cyan` / `button` 17-600；阴影 `effect/cta-cyan`
- 状态：默认 / 按下 scale 0.96（0.15s）；**无禁用态、无加载态（原型未实现）**
- Auto Layout：水平，居中，padding 17/24，宽 Fill container；文本不换行

### 2.2 次按钮 `btn-ghost`

- 尺寸/圆角/文字同主按钮（17-600，padding 17/24，高 ≈56）
- 配色：`effect/glass`（底 `surface/glass` + blur 20 + 描边 `border/glass`），文字 `text/primary`；无投影
- 状态：默认 / 按下 scale 0.96
- Auto Layout：同主按钮；双按钮行中两个按钮各 Fill（等分，间距 12 → 单个宽 165）

### 2.3 模式卡片 `mode-card`

- 尺寸：宽 164 × 高 200（CSS 为两列网格 + `aspect-ratio 0.82`，(342−14)/2=164，164/0.82=200）；`radius/panel` 20；padding 18/12
- 配色：`effect/glass`，描边为 **1.5px** `border/glass`（比标准玻璃粗）；图标青色线稿 56×56（viewBox 48，stroke 3）
- 结构（垂直居中，间距 8）：图标 56 → 标题 `card-title` 18-700 → 描述 `desc` 12-400/1.7 两行居中（图标与标题间另有 6px 外边距）
- 选中标记：右上角 24×24 圆形对勾（距顶/右各 12）：圆底 `brand/cyan`，对勾 `base/on-cyan` stroke 2.4
- 状态：默认（勾选隐藏，opacity 0 + scale 0.6）/ 选中（描边 `brand/cyan` + `effect/selected-mode`，勾选淡入放大至 1，0.2s）/ 按下 scale 0.96
- Auto Layout：垂直，水平居中，内容上中下分布居中，gap 8，padding 18/12，固定尺寸 164×200；勾选标记用绝对定位（Figma 中脱离 Auto Layout 置于右上）

### 2.4 场景卡片 `scene-card`

- 尺寸：宽 342 × 高 ≈88（padding 12×2 + 缩略图 64；R1 新增预览行后文字列三行合计约 57，仍由缩略图撑高，卡高不变）；`radius/panel` 20；padding 12/14
- 配色：`effect/glass`，描边 1.5px `border/glass`
- 结构（水平，垂直居中，间距 14）：缩略图 64×64 `radius/thumb`（渐变占位，见 1.1）→ 文字列（Fill，间距 4：名称 `list-title` 17-600 / 描述 `caption` 12.5 `text/secondary` / 预览 `preview` 11.5 `text/cyan-72`，R1 新增第三行）→ 勾选 24×24（同款圆形对勾）
- 状态：默认 / 选中（`effect/selected-scene`）/ 按下 scale 0.97
- Auto Layout：水平，居中，gap 14，padding 12/14；缩略图 Fixed 64×64，文字列 Fill，勾选 Fixed 24

### 2.5 焦段建议胶囊 `focal-pill`

- 尺寸：padding 9/18，高 ≈ 36；`radius/pill`
- 配色：`effect/glass`；文字 `pill` 13.5-600 `text/primary`，不换行
- 文案形态：`建议焦段 {倍率} · {构图名}`（随 AI 建议联动切换，如「建议焦段 2x · 半身特写」）
- 状态：仅默认（无点击交互，原型中为纯展示）
- Auto Layout：水平，padding 9/18，Hug contents

### 2.6 AI 摄影师面板 `ai-panel`

- 定位尺寸：左 16 / 右 88（为 FAB 让位）/ bottom 142；宽 = 390−16−88 = **286**；padding 14/16；`radius/panel` 20
- 配色：`effect/glass`
- 结构：
  - 头行（水平居中，间距 8，下距 8）：徽标（青色四角星图标 15 + 「AI 摄影师」`badge` 12.5-700 cyan，间距 5）→ 场景信息 `meta` 11 `text/secondary`（Fill，单行省略）→ 刷新钮 28×28 正圆（1px `border/glass` 描边，图标 14 `text/secondary`）
  - 姿势名 `emphasis` 16-700 cyan，下距 4
  - 建议正文 `caption` 12.5/1.6 `text/primary-82`
- 状态：默认；刷新钮按下 scale 0.85 + rotate 40° 并变 cyan（0.15s）
- Auto Layout：垂直，padding 14/16，gap 8/4；头行水平，徽标 Fixed、场景信息 Fill、刷新 Fixed 28

### 2.7 话术锦囊 FAB `fab-coral`

- 尺寸：56×56 正圆；定位 右 18 / bottom 168；阴影 `effect/fab-coral`
- 配色：底 `accent/coral`；图标 27×27（白色对话泡 + 三个 coral 圆点）
- 附属标签：「话术锦囊」`fab-label` 10-600 coral，位于 FAB 正下方 6px，水平居中，带 `effect/text-on-dark`
- 状态：默认 / 按下 scale 0.88
- Auto Layout：FAB 本体 Fixed 56 居中放图标；标签建议与 FAB 组成垂直组件（gap 6）以便整体定位

### 2.8 锦囊聊天气泡 `bubble-row` / `bubble`（含面板 `lines-sheet`）

- 面板 `lines-sheet`：贴底，max-height 屏高 62%（≈523）；`radius/sheet` 24（仅顶角）；`effect/glass-heavy`；padding 18/18/22；滑出动效见 1.6
- 面板头：标题「话术锦囊」`sheet-title` 17-700 coral + 副标「照着说就好，情绪价值拉满」`sub` 11.5（间距 3）；右侧关闭钮 32×32 正圆（1px `border/glass`，✕ 图标 15 `text/secondary`，按下 scale 0.85）；头行下距 16
- 气泡行（水平，底部对齐，间距 8）：头像 26×26 正圆（底 `accent/coral`，文字「AI」`avatar` 10-700 白）+ 气泡
- 气泡 `bubble`：max-width 面板宽 82%；padding 11/14；`radius/bubble` 16/16/16/4；底 `surface/bubble` + 1px `border/bubble`；文字 `bubble` 13.5/1.6 `text/primary`
- 气泡列表：垂直间距 10，可滚动，下距 14；每屏 3 条
- 「换几句」按钮：pill，padding 9/20，间距 6（图标 14 + 文字 `refresh` 13-600 coral），1px `border/coral` 描边，居中，按下 scale 0.93
- 状态：面板开 / 关（滑出动画 + 遮罩 `overlay/scrim`，点遮罩或 ✕ 关闭）；气泡无单独状态
- Auto Layout：面板垂直 padding 18/18/22 gap 16/14；气泡行水平底对齐 gap 8，头像 Fixed 26，气泡 Hug（限宽 82%）

### 2.9 快门按钮 `shutter`

- 尺寸：外径 76×76 正圆；白色圆环 stroke 4.5；内芯白色实心圆直径 57（环与芯间距 5）
- 配色：`base/white`（深底上纯白，无额外发光）
- 状态：默认 / 按下 scale 0.9（0.12s，全组件中最快的按压反馈）
- Auto Layout：Fixed 76×76，两层圆（环用 stroke，芯用 fill），无需 Auto Layout 嵌套
- 同排元件：快门行宽 290 居中，三元件 space-between —— 左「上一张缩略图」44×44 `radius/mini` 12 + 1.5px `border/glass-strong`（按下 0.9），右「翻转镜头」玻璃圆钮 44（见 2.14）

### 2.10 评分 chip `score-chip`

- 尺寸：padding 10/16，Hug contents；`radius/chip` 16；定位于照片左下（左/下各 14）
- 配色：`effect/glass`
- 结构（垂直，间距 2）：数字 `score` 26-700/1.1 cyan（如「8.6」）+ 标签「AI 综合评分」`label` 10.5 `text/secondary`
- 状态：仅默认
- Auto Layout：垂直，padding 10/16，gap 2，Hug contents

### 2.11 反馈行 `fb-item`

- 尺寸：宽 342；padding 13/15；`radius/panel` 20
- 配色：`effect/glass`
- 结构（水平，顶部对齐，间距 12）：图标底 34×34 `radius/icon` 11（底 `surface/cyan-10`，内图标 19×19 青色线稿）→ 文字列（垂直，间距 4）：标题行（`item-title` 14.5-600 + 星级 `stars` 13 cyan/空星 18% 白，间距 10）→ 正文 `caption` 12.5/1.6 `text/secondary`
- 状态：仅默认（纯展示）
- Auto Layout：水平顶对齐，gap 12，padding 13/15；图标 Fixed 34，文字列 Fill

### 2.12 AR 轮廓显隐开关 `ar-toggle`（R1 新增）

- 尺寸：44×44 正圆（复用 `btn-glass-circle` 基底，`effect/glass`）；位于取景器顶栏右侧（`vf-top` 内，与左侧返回键同为 44，焦段胶囊保持视觉居中）
- 图标：21×21 虚线人形轮廓（viewBox 24，stroke 1.9 圆头，dash 3/2.6；描边 `currentColor` 随态变色）
- 状态：开（默认，`ar-toggle.on`：图标 `brand/cyan`，描边改 `rgba(0,212,170,0.45)`）/ 关（图标 `text/secondary`，描边回落 `border/glass`）/ 按下 scale 0.9；色彩过渡 0.2s，`aria-pressed` 同步
- 行为：整体切换 AR 姿势轮廓（单人/双人两套 SVG）与未匹配提示标签 `ar-tag` 的显隐；默认开（`state.arOn: true`），会话内有效、不持久化
- Auto Layout：Fixed 44×44，居中放图标，无需嵌套

### 2.13 自动保存标记 `saved-chip`（R1 新增）

- 尺寸：padding 8/12，Hug contents，高 ≈ 29；`radius/pill`；定位于点评照片右下（右/下各 14），与评分 chip 同排呼应
- 配色：`effect/glass`；文字 `chip` 11-400 `text/primary`，不换行
- 结构（水平居中，间距 5）：✓ 图标 13×13（stroke 2.6 圆头，`ar/success` 绿 —— 该 token 的首个实际用例）+ 文案「已自动保存到相册」
- 状态：仅默认（「快门即存」的状态确认，纯展示无点击交互）
- Auto Layout：水平，居中，padding 8/12，gap 5，Hug contents

### 2.14 辅助元件速查

| 元件 | 关键参数 |
|---|---|
| 返回键 `btn-back` | 38×38 正圆，`effect/glass`，箭头图标 20；按下 scale 0.9 |
| 玻璃圆钮 `btn-glass-circle` | 44×44 正圆，`effect/glass`，图标 21；用于取景器顶栏返回、翻转镜头，并作 AR 开关基底（见 2.12）；按下 0.9 |
| AR 提示标签 `ar-tag` | pill，padding 6/12，间距 6：红点 6×6 `ar/error` + 文字 `tag` 11.5；`effect/glass` 但描边改 1px `border/error-45`；不换行 |
| 勾选标记 `mode/scene-check` | 24×24，圆底 `brand/cyan` + 对勾 `base/on-cyan` stroke 2.4；隐藏态 opacity 0 scale 0.6 |
| Toast | pill，padding 11/22，`bubble` 13.5；`effect/glass`；定位水平居中、bottom 64；进场见 1.6 |
| 拍照闪白 `flash` | 全屏纯白层，z 最高于画面，动画见 1.6 |
| 遮罩 `scrim` | 全屏 `overlay/scrim`，点击关闭面板 |
| 状态栏（模拟） | 左右 padding 32、上 18；时间 9:41 `statusbar` 15-600；右侧信号/WiFi/电量图标高 13，`#F5F5F0`，带文字阴影。**Figma 可直接用 iOS 官方状态栏组件替代** |

---

## 三、页面规格（390×844）

画板统一 390×844（iPhone 14 逻辑分辨率），背景 `bg/app`；原型外层的手机框（圆角 56 + 机身阴影）仅为浏览器展示容器，**不进 Figma 画板**。除取景器外，各屏内容区统一 padding 上 72 / 左右 24 / 下 28（`.screen`）。跳转均为整屏淡入 0.3s。

### 屏 1 · 启动页 `screen-splash`

**元素与层级（底→顶）：**

1. 背景：`bg/app` + 底部青色光晕渐变（见 1.1）
2. 呼吸光斑 `splash-glow`：260×260 正圆，径向 `rgba(0,212,170,0.16)→透明70%`；顶边位于屏高 22% 处、水平居中（圆心约 (195, 316)）；呼吸动画 3.2s
3. 内容列 `splash-inner`（垂直水平居中）：
   - 品牌标 96×96 `radius/brand` 28：`effect/glass` + 1px `border/cyan-35` + `effect/brand-glow`；内嵌取景框图形 logo 54×54（青色，stroke 3.5）
   - 品牌名「PoseCam」`brand` 36-700 字距 1，上距 26
   - 副标语两行 `body` 15/1.8 `text/secondary`，上距 14：「你的随身 AI 摄影师 / 让每一次快门，都恰好心动」
   - 主按钮「开始拍摄」（限宽 250），上距 52
   - 提示「点击任意处进入」`hint` 12 70%，上距 18

**交互：** 点击屏幕任意处（含按钮）→ 屏 2。
**状态变体：** 无；呼吸光效标注动画参数即可。

### 屏 2 · 模式选择 `screen-mode`

**元素与层级：**

1. 页头：返回键 38（→ 屏 1）+ 标题「今天怎么拍？」`h1-page`（间距 14）；副标「选择拍摄模式，AI 摄影师将全程陪同引导」`subtitle`，左缩进 52；页头下距 26
2. 模式卡网格：两列，间距 14，卡片 164×200（规格见 2.3）
   - 「帮 TA 拍」（默认选中）：单人图标；描述「实时构图与姿势引导 / 随手拍出氛围感」
   - 「我们合照」：双人图标；描述「双人同框姿势引导 / 记录并肩的时刻」
3. 页脚贴底：主按钮「下一步」（→ 屏 3）

**交互：** 点卡片切换选中（单选，互斥）；返回 → 屏 1；下一步 → 屏 3。
**状态变体：** 两卡 ×（默认/选中）共 4 态；选中态有勾选标记淡入。

### 屏 3 · 场景选择 `screen-scene`

**元素与层级：**

1. 页头：返回键（→ 屏 2）+ 标题「选一个约会场景」；副标「AI 将按场景推荐焦段、姿势与话术」
2. 场景列表：4 张场景卡（规格见 2.4），垂直间距 12：
   - 咖啡厅（默认选中）「窗边暖光 · 氛围感首选」/ 预览「暖光木质调 · 窗光侧脸与半身特写」— `thumb-cafe`
   - 街拍「城市线条 · 随性松弛感」/ 预览「延伸线构图 · 霓虹背景与城市氛围」— `thumb-street`
   - 夜景「霓虹光斑 · 电影感拉满」/ 预览「光斑虚化 · 电影感逆光与车流拉丝」— `thumb-night`
   - 室内「居家日常 · 自然生活感」/ 预览「自然窗光 · 松弛生活感人像」— `thumb-indoor`
3. 页脚：主按钮「进入取景器」

**交互：** 点卡切换选中（单选）；「进入取景器」→ 屏 4，并把所选场景渐变、模式标签、AR 轮廓形态（单人/双人）同步到取景器。
**状态变体：** 卡片默认/选中。

### 屏 4 · 取景器 `screen-viewfinder`（核心屏）

全屏无 padding，底色 `#000`。**z 序表（值即 CSS z-index）：**

| z | 元素 | 说明 |
|---|---|---|
| 0 | `vf-scene` | 全屏取景画面（场景渐变占位） |
| 1 | `vf-vignette` | 暗角 + 人物光影叠层（见 1.1），不响应点击 |
| 2 | `ar-outline` | AR 姿势轮廓（单人 196 宽 / 双人 260 宽；R1 起受 AR 开关显隐控制） |
| 3 | `ar-tag` | 未匹配部位提示标签（随 AR 轮廓一同显隐） |
| 10 | `vf-top` / `ai-panel` / `vf-bottom` | 顶栏（含 R1 新增 AR 显隐开关）/ AI 面板 / 快门区 |
| 11 | `fab-coral` | 话术锦囊入口 |
| 30 | `flash` | 拍照闪白 |
| 40 | `scrim` | 锦囊遮罩 |
| 50 | `lines-sheet` | 锦囊底部面板 |
| 60 | `statusbar` | 状态栏 |
| 70 | `toast` | 全局 Toast |

**关键布局尺寸：**

- 顶栏 `vf-top`：top 58、左右 16；左返回 44（→ 屏 3），中焦段胶囊（Hug），右 AR 轮廓显隐开关 44（规格见 2.12；与返回键同为 44，胶囊保持视觉居中）
- AR 轮廓：水平居中，中心位于屏高 42%（双人 43%）；3px 虚线 dash 7/7，匹配中段 cyan + `effect/glow-cyan`，未匹配段 red + `effect/glow-red`；脉冲动画 2.6s
- AR 标签 `ar-tag`：单人时 left 58% / top 27%，双人时 left 62% / top 36%（**以 JS 运行值为准**，见「不一致记录」2）；文案示例「右臂再抬高一点」
- AI 面板：左 16 / 右 88 / bottom 142（规格见 2.6）；示例文案 —— 徽标「AI 摄影师」、场景「咖啡厅 · 帮 TA 拍」、姿势「侧身靠窗」、正文「让 TA 侧对窗户，脸转向光源，轮廓会更柔和。跟随红色引导线，右臂再抬高一点。」
- FAB：右 18 / bottom 168（规格见 2.7）
- 快门区 `vf-bottom`：贴底，padding 26/24/30 + 底部黑色渐变；快门行宽 290 居中（缩略图 44 / 快门 76 / 翻转 44，规格见 2.9）

**交互：**

- AI 面板刷新钮 → 轮换当前场景的 3 条建议，**焦段胶囊同步切换**（数据见 `app.js` `GUIDES`）
- FAB → 锦囊面板自下滑出（0.34s）+ 遮罩淡入；点遮罩或 ✕ 关闭；「换几句」翻页换 3 条
- 快门 → 全屏闪白 0.38s → 360ms 后跳屏 5（点评照片与副标同步当前场景/模式）
- AR 开关 → 切换 AR 姿势轮廓与未匹配提示标签的整体显隐（默认开，会话内有效不持久化；开关 on/off 态见 2.12）
- 翻转镜头 / 缩略图 → 仅 Toast 演示反馈；返回 → 屏 3

**状态变体（本屏需重点出图）：**

1. AR 匹配中（默认）：青色虚线 + 局部红色未匹配段 + 红色提示标签
2. AR 已匹配：**原型未实现**，按 `ar/success` 全绿轮廓补画（见「不一致记录」1）
3. 单人轮廓（帮 TA 拍）/ 双人轮廓（我们合照）
4. AR 开关 on / off（off：轮廓与提示标签整体隐藏，仅留纯净取景画面；R1 新增）
5. 锦囊面板关闭 / 滑出（含遮罩）
6. Toast 显示态（如「已切换前后镜头（演示）」）

### 屏 5 · AI 点评 `screen-review`

**元素与层级：**

1. 页头：返回键（→ 屏 4）+ 标题「AI 拍摄点评」；副标动态文案「{场景} · {模式}」（如「咖啡厅 · 帮 TA 拍」）
2. 点评照片 `review-photo`：宽 342 × **高 380**（CSS 声明 3/4 比例但被 `max-height:380` 截断，见「不一致记录」5），`radius/panel` 20 + 1px `border/glass`；场景渐变 + 叠层（见 1.1）；下距 20
3. 评分 chip：叠在照片左下 14/14（规格见 2.10），示例「8.6 / AI 综合评分」
4. 自动保存标记 `saved-chip`：与评分 chip 同行、贴照片右下 14/14（规格见 2.13），「✓ 已自动保存到相册」（R1 新增，「快门即存」状态确认）
5. 反馈列表 `fb-list`：3 条反馈行（规格见 2.11），间距 10，下距 8：
   - 构图 ★★★★☆「人物落在右侧三分线，头顶留白舒适，构图很稳。」
   - 姿势 ★★★☆☆「右臂线条略僵，下次再放松一点会更自然。」
   - 情绪 ★★★★★「笑容自然有感染力，这张的情绪价值拉满。」
6. 页脚双按钮行（间距 12，各宽 165）：主按钮「再拍一张」（→ 屏 4）+ 次按钮「完成」（仅 Toast 反馈）；R1 起移除原主按钮「保存照片」

**交互：** 快门即存 —— 按下快门时照片已自动保存，saved-chip 作状态确认（无手动保存入口）；「完成」→ Toast「拍摄完成，成片已在相册（演示）」；再拍一张 / 返回 → 屏 4。
**状态变体：** 星级 1–5（实心 cyan / 空心 18% 白）；评分数字随照片变化。

---

## 四、交付与标注约定

### 4.1 导出倍率与切片命名

- 图标与矢量图形（返回、刷新、关闭、翻转、对勾、AI 星标、反馈图标、品牌标、AR 轮廓、AR 开关人形）：导出 **PDF 单倍矢量**（Xcode Asset Catalog 勾选 Preserve Vector Data），统一在各自 viewBox 画板（24 / 48 / 64）内导出；备选 SVG。
- 位图素材（4 张场景渐变缩略图、点评占位照片）：**@2x / @3x PNG**。
- 切片命名：`posecam_<模块>_<名称>[_<状态>]`，全小写蛇形；位图带倍率后缀。示例：
  - `posecam_icon_back.pdf`、`posecam_icon_check_selected.pdf`
  - `posecam_thumb_cafe@2x.png` / `posecam_thumb_cafe@3x.png`
  - `posecam_ar_solo_matched.pdf`
- Figma 组件 / 样式命名与本文 token 对齐（`PoseCam/color/...`、`PoseCam/text/...`、`PoseCam/effect/...`），保证设计稿与本文档可互相检索。

### 4.2 给 iOS 开发的标注重点（CSS → SwiftUI 映射）

| CSS（本文数值） | SwiftUI 对应 |
|---|---|
| 字体族 `-apple-system, PingFang SC` | `Font.system(size:weight:)`（SF Pro），中文回落 PingFang SC；600→`.semibold`，700→`.bold` |
| 毛玻璃 blur 20 + `rgba(18,20,28,0.55)` | `.background(.ultraThinMaterial)`（深色环境最接近 blur 20 的系统材质）+ 叠 `Color(#12141C).opacity(0.55)`；描边 `.overlay(RoundedRectangle…stroke(Color.white.opacity(0.08), lineWidth: 1))` |
| 面板 blur 24 + 0.78 底（锦囊面板） | 介于系统材质之间，建议 `.thinMaterial` 或自绘 `UIVisualEffectView` 自定义半径 |
| 圆角 20 / 16 / 11… | `RoundedRectangle(cornerRadius:style: .continuous)`；pill 用 `Capsule()` |
| CSS box-shadow（如 0 8px 28px） | `.shadow(color:radius:x:y)`，radius 取 **CSS blur ÷ 2** 起步微调（如 CTA：`.shadow(color: Color(#00D4AA).opacity(0.28), radius: 14, y: 4)`）；Spread 用 `.shadow` 叠层或 stroke 模拟 |
| 按下 scale 0.96/0.9，0.15s | 自定义 `ButtonStyle`：`scaleEffect(isPressed ? 0.96 : 1)` + `.animation(.easeOut(duration: 0.15))` |
| AR 虚线 dash 7/7、3px 圆头 | `StrokeStyle(lineWidth: 3, lineCap: .round, dash: [7, 7])` |
| AR 脉冲 2.6s、呼吸 3.2s | `withAnimation(.easeInOut(duration: 2.6).repeatForever(autoreverses: true))` |
| 屏幕淡入 0.3s | `.transition(.opacity)` + `.animation(.easeInOut(duration: 0.3))` |
| 锦囊面板 | 底部弹层：62% 屏高上限 ≈ `.presentationDetents([.fraction(0.62)])` + 自定义 24 顶角圆角与珊瑚橙顶描边；滑出曲线 cubic-bezier(0.32, 0.9, 0.35, 1) 用 `.timingCurve` |
| 字距 1 / 1.5 / 0.5 | `.tracking(_:)`（pt 值相同） |
| 顶部 72px 内容起点 | 状态栏 + safe area：`.safeAreaInset` 处理，勿写死 72 |
| 半像素字号（12.5 等） | iOS 直接支持 pt 小数值，照用 |

### 4.3 标注注意事项

- 取景器屏全部控件为绝对定位，标注时以画板边缘为基准给 offset（本文 z 序表 + 布局尺寸已列全）。
- 渐变占位图属「模拟照片」素材，真实 App 中由相机画面/相册照片替换，标注为占位即可。
- 勾选标记、Toast、闪白、遮罩均有显隐动画，交付时在原型模式连好交互，参数见 1.6。

---

## 附：不一致记录

1. **AR「已匹配」绿色态未实现**：7-17 规格第 2 节定义「匹配后轮廓变绿」，`style.css` 声明了 `--green: #34C759`，取景器至今仍只有「匹配中（青）+ 未匹配部位（红）」一态。R1 起该变量已被保存标记 ✓（`.saved-chip`）实际引用，不再是「声明未使用」的 token。处理：Figma 按 `--green` 补 AR matched 变体；开发按 token 实现。
2. **AR 提示标签位置双份定义**：`style.css` 默认 `top:25%; left:59%`，但 `app.js` 进入取景器时覆盖为单人 `left 58% / top 27%`、双人 `left 62% / top 36%`，CSS 默认值实际从不生效。处理：以 JS 运行值为准（本文已按此标注）。
3. **圆角不止 20px**：7-17 规格第 2 节仅写「圆角 20px」，CSS 实际存在 28 / 24 / 20 / 16 / 16+4 / 14 / 12 / 11 多档（见 1.3）。处理：以 CSS 为准。
4. **`--panel: #12141C` 声明未使用**：7-17 规格写作「次级面板底」，但 CSS 中所有面板均为半透明玻璃 `rgba(18,20,28,0.55)`，`#12141C` 仅是玻璃基色，无纯色面板实例。处理：Figma 不建纯色面板样式，保留 token 仅作 glass 底色的不透明等效参考。
5. **点评照片比例被截断**：`.review-photo` 声明 `aspect-ratio: 3/4`（342 宽应对应高 456），同时 `max-height: 380px` 生效，实际渲染 342×380（≈1:1.11），3/4 比例不成立。处理：Figma 按 342×380 画；若产品希望严格 3/4，需另行决策（本文不擅自改值）。
6. **PRD 与冻结视觉冲突**：`docs/PRD.md` 3.3.1 写「轮廓线白色或浅蓝色、透明度 60-70%」，与青色虚线方案不符。处理：PRD 为早期草案，以 7-17 规格与 CSS 为准。
7. **点评页按钮组与「保存」入口变更（R1）**：7-17 规格「页面清单（5 屏）」第 5 条定义点评页含「重拍/保存按钮」，PRD 3.1 功能架构写拍摄后「一键保存/分享」；R1 原型改为「快门即存」——快门按下即自动保存，点评页评分 chip 同行新增 saved-chip 状态标记，页脚改为主按钮「再拍一张」+ 次按钮「完成」，无手动保存/分享入口。处理：以 R1 原型为准；「分享」入口是否补充待产品决策，本文不擅自加。
