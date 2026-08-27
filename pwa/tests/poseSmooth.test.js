// poseSmooth 单元测试
// 基线断言来自施工规格 Task 1 Step 1（docs/superpowers/plans/2026-07-17-pwa-v2-real-functions.md）。
// 勘误（记入 BLOCKED.md）：规格原文写作 a.x / b.x / c.x——update() 返回 landmarks
// 数组，直接在数组上取 .x 恒为 undefined，属规格笔误；此处勘误为 a[0].x 等，
// 断言值与强度与规格完全一致（strictEqual 0.5 / |0.55|<1e-6 / <0.6）。
const assert = require("node:assert");
require("../js/poseSmooth.js"); // 挂载 window.PoseCam
global.window = global.window || {};
// poseSmooth.js 需兼容 Node：内部用 (typeof window!=="undefined"?window:globalThis)

const s = globalThis.PoseCam.createPoseSmoother({ alpha: 0.5 });
// 输入在 100/110 间抖动的点，输出应平滑（不跟随单帧跳变到满幅）
const a = s.update([{ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }]);
assert.strictEqual(a[0].x, 0.5); // 首帧直通
const b = s.update([{ x: 0.6, y: 0.5, z: 0, visibility: 0.9 }]);
assert(Math.abs(b[0].x - 0.55) < 1e-6, `EMA 应为 0.55，实际 ${b[0].x}`);
// 低可见性点应被丢弃（返回上一帧平滑值）
const c = s.update([{ x: 0.9, y: 0.9, z: 0, visibility: 0.1 }]);
assert(c[0].x < 0.6, "低可见性帧不应污染平滑值");

// ---- 新增断言：覆盖接口描述中的 null 淡出 / reset / 拷贝语义 / 默认参数 ----
// update(null)：连续 10 帧内返回最后平滑值，超过 10 帧返回 null 并清空（骨架淡出）
const s2 = globalThis.PoseCam.createPoseSmoother({ alpha: 0.4 });
const first = s2.update([{ x: 0.3, y: 0.7, z: 0, visibility: 0.9 }]);
assert.strictEqual(first[0].x, 0.3, "首帧直通");
let missOut = null;
for (let i = 1; i <= 10; i++) missOut = s2.update(null);
assert(missOut && Math.abs(missOut[0].x - 0.3) < 1e-9, "连续 10 帧 miss 内应返回最后平滑值");
assert.strictEqual(s2.update(null), null, "超过 10 连续帧 miss 应返回 null（淡出）");
const afterFade = s2.update([{ x: 0.8, y: 0.2, z: 0, visibility: 0.9 }]);
assert.strictEqual(afterFade[0].x, 0.8, "淡出清空后恢复检出应重新首帧直通");

// reset()：清空后重新直通
const r = s2.update([{ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }]);
s2.reset();
const r2 = s2.update([{ x: 0.9, y: 0.1, z: 0, visibility: 0.9 }]);
assert.strictEqual(r2[0].x, 0.9, "reset 后应首帧直通");

// 返回值应为拷贝：外部篡改不污染内部平滑状态
const s3 = globalThis.PoseCam.createPoseSmoother();
const out = s3.update([{ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }]);
out[0].x = 0.123;
const out2 = s3.update([{ x: 0.5, y: 0.5, z: 0, visibility: 0.9 }]);
assert(Math.abs(out2[0].x - 0.5) < 1e-9, "返回值应为拷贝，外部篡改不影响内部");

// 默认参数：alpha=0.4
const s4 = globalThis.PoseCam.createPoseSmoother();
s4.update([{ x: 0, y: 0, z: 0, visibility: 0.9 }]);
const d2 = s4.update([{ x: 1, y: 1, z: 1, visibility: 0.9 }]);
assert(Math.abs(d2[0].x - 0.4) < 1e-9, "默认 alpha=0.4：s = 0.4*1 + 0.6*0");
assert(Math.abs(d2[0].z - 0.4) < 1e-9, "z 轴同样参与 EMA");

console.log("poseSmooth tests passed");
