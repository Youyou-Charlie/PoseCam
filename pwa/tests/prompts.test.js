// prompts 单元测试（fixtures 覆盖规格 Task 3 Step 1 全部 5 类 + 点评解析器同规格覆盖）
const assert = require("node:assert");
require("../js/prompts.js");
const P = globalThis.PoseCam.Prompts;

/* ---------- buildSceneMessages：结构与占位符 ---------- */
const sceneMsgs = P.buildSceneMessages({ sceneLabel: "咖啡厅", modeLabel: "帮 TA 拍" });
assert.strictEqual(sceneMsgs.length, 2, "messages 应为 system + user");
assert.strictEqual(sceneMsgs[0].role, "system");
assert.ok(/JSON/.test(sceneMsgs[0].content), "system 应约束只输出 JSON");
assert.ok(/人像摄影/.test(sceneMsgs[0].content), "system 应设定人像摄影专家口吻");
assert.ok(/真实可见/.test(sceneMsgs[0].content), "system 应要求针对画面真实元素");
assert.strictEqual(sceneMsgs[1].role, "user");
assert.strictEqual(sceneMsgs[1].content.length, 2, "user 应为 text + image_url 两段");
assert.strictEqual(sceneMsgs[1].content[0].type, "text");
assert.ok(sceneMsgs[1].content[0].text.includes("咖啡厅"), "user text 应含场景标签");
assert.ok(sceneMsgs[1].content[0].text.includes("帮 TA 拍"), "user text 应含模式标签");
assert.strictEqual(sceneMsgs[1].content[1].type, "image_url");
assert.strictEqual(sceneMsgs[1].content[1].image_url.url, "__IMG__", "图片应为 __IMG__ 占位符，由调用方替换");

/* ---------- parseSceneAdvice：5 类 fixtures ---------- */
// 1. 标准 JSON
const std = '{"composition":"人物居右，背景窗光形成侧逆光","focal":"2x · 半身特写","pose":"侧身靠窗","tip":"脸转向窗户，轮廓光更柔","lines":["头往窗边转一点点","肩膀放松，对就是这样","保持这个状态，三、二、一"]}';
const advice = P.parseSceneAdvice(std);
assert.strictEqual(advice.composition, "人物居右，背景窗光形成侧逆光");
assert.strictEqual(advice.focal, "2x · 半身特写");
assert.strictEqual(advice.pose, "侧身靠窗");
assert.strictEqual(advice.tip, "脸转向窗户，轮廓光更柔");
assert.strictEqual(advice.lines.length, 3);
assert.strictEqual(advice.lines[2], "保持这个状态，三、二、一");

// 2. 带 ```json 围栏
const fenced = "```json\n" + std + "\n```";
assert.deepStrictEqual(P.parseSceneAdvice(fenced), advice, "围栏 JSON 应剥壳后等价");

// 3. 首尾带散文废话
const noisy = "好的，以下是针对这张照片的建议：\n" + std + "\n希望对你有帮助，祝拍摄愉快！";
assert.deepStrictEqual(P.parseSceneAdvice(noisy), advice, "首尾散文应被容忍");

// 4. 缺字段 → 必须抛错
assert.throws(
  () => P.parseSceneAdvice('{"focal":"2x","pose":"p","tip":"t","lines":["a","b","c"]}'),
  /缺少字段|composition/,
  "缺 composition 字段应抛错"
);

// 5. lines 只有 2 条 → 必须抛错
assert.throws(
  () => P.parseSceneAdvice('{"composition":"c","focal":"f","pose":"p","tip":"t","lines":["a","b"]}'),
  /lines/,
  "lines 非 3 条应抛错"
);

// 6. 坏 JSON（反向验证核心：无闭合括号 / 括号齐全但内容坏 / 完全无 JSON）→ 必须抛错
assert.throws(() => P.parseSceneAdvice('{"composition":"c","focal": '), /JSON/, "无闭合大括号的截断 JSON 应抛错");
assert.throws(() => P.parseSceneAdvice('{"composition": "c", "focal": }'), /JSON 解析失败/, "括号齐全但内容非法应抛 JSON 解析失败");
assert.throws(() => P.parseSceneAdvice("抱歉，我看不到图片。"), /找不到 JSON/, "无 JSON 应抛错");

/* ---------- buildReviewMessages：结构 ---------- */
const reviewMsgs = P.buildReviewMessages({ sceneLabel: "街拍", modeLabel: "我们合照" });
assert.strictEqual(reviewMsgs.length, 2);
assert.strictEqual(reviewMsgs[0].role, "system");
assert.ok(/JSON/.test(reviewMsgs[0].content));
assert.strictEqual(reviewMsgs[1].role, "user");
assert.strictEqual(reviewMsgs[1].content[1].type, "image_url");
assert.strictEqual(reviewMsgs[1].content[1].image_url.url, "__IMG__");
assert.ok(reviewMsgs[1].content[0].text.includes("街拍"));

/* ---------- parseReview ---------- */
const reviewObj = {
  score: 8.5,
  items: [
    { dim: "构图", stars: 4, text: "人物压在三分线上，背景延伸线用得不错。" },
    { dim: "姿势", stars: 3, text: "右手僵在身侧，下次插兜会更自然。" },
    { dim: "情绪", stars: 5, text: "笑容抓得准，很有感染力。" }
  ],
  encouragement: "这张已经很接近成片了，再来一张保底！"
};
const reviewJson = JSON.stringify(reviewObj);
const review = P.parseReview(reviewJson);
assert.strictEqual(review.score, 8.5);
assert.strictEqual(review.items.length, 3);
assert.deepStrictEqual(review.items[0], { dim: "构图", stars: 4, text: "人物压在三分线上，背景延伸线用得不错。" });
assert.strictEqual(review.encouragement, "这张已经很接近成片了，再来一张保底！");

// 围栏 + 首尾废话同样容忍
const reviewNoisy = "点评如下：\n```json\n" + reviewJson + "\n```\n以上，请查收。";
assert.deepStrictEqual(P.parseReview(reviewNoisy), review);

// 非整数星级容错：四舍五入到整数星（降低真实模型输出触发回退的概率）
const halfStar = JSON.stringify(Object.assign({}, reviewObj, {
  items: [
    { dim: "构图", stars: 4.5, text: "a" },
    { dim: "姿势", stars: 3, text: "b" },
    { dim: "情绪", stars: 5, text: "c" }
  ]
}));
assert.strictEqual(P.parseReview(halfStar).items[0].stars, 5, "4.5 星应四舍五入为 5");

// 非法输入逐项抛错
const badScore = JSON.stringify(Object.assign({}, reviewObj, { score: 15 }));
assert.throws(() => P.parseReview(badScore), /score/, "score 越界应抛错");

const badDim = JSON.stringify(Object.assign({}, reviewObj, {
  items: [
    { dim: "色彩", stars: 4, text: "a" },
    { dim: "姿势", stars: 3, text: "b" },
    { dim: "情绪", stars: 5, text: "c" }
  ]
}));
assert.throws(() => P.parseReview(badDim), /dim/, "dim 不在枚举内应抛错");

const twoItems = JSON.stringify(Object.assign({}, reviewObj, { items: reviewObj.items.slice(0, 2) }));
assert.throws(() => P.parseReview(twoItems), /items/, "items 非 3 条应抛错");

const badStars = JSON.stringify(Object.assign({}, reviewObj, {
  items: [
    { dim: "构图", stars: 9, text: "a" },
    { dim: "姿势", stars: 3, text: "b" },
    { dim: "情绪", stars: 5, text: "c" }
  ]
}));
assert.throws(() => P.parseReview(badStars), /stars/, "stars 越界应抛错");

const noEncourage = JSON.stringify(Object.assign({}, reviewObj, { encouragement: "" }));
assert.throws(() => P.parseReview(noEncourage), /encouragement/, "缺鼓励语应抛错");

// 坏 JSON（反向验证）→ 必须抛错
assert.throws(() => P.parseReview("}{ 完全不是 JSON"), /JSON/, "坏 JSON 应抛错");

console.log("prompts tests passed");
