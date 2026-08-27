// aiClient 单元测试（localStorage 存取 / 默认值 / 未配置拒绝 / testConnection 语义）
// 说明：Task 2 规格未要求测试文件，此处为新增真实断言（测试数只增不减），只测纯逻辑层，不发真实网络请求。
const assert = require("node:assert");

// localStorage 桩（Node 环境模拟浏览器存储；被测的是 aiClient 自身逻辑，桩不是被测对象）
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k)
};

require("../js/aiClient.js");
const AI = globalThis.PoseCam.AI;

// 内置预设齐全
assert.deepStrictEqual(Object.keys(AI.PROVIDERS), ["zhipu", "dashscope", "moonshot"]);
assert.strictEqual(AI.PROVIDERS.zhipu.model, "glm-4.6v-flash");
assert.strictEqual(AI.PROVIDERS.zhipu.baseUrl, "https://open.bigmodel.cn/api/paas/v4");
assert.strictEqual(AI.PROVIDERS.dashscope.model, "qwen-vl-plus");
assert.strictEqual(AI.PROVIDERS.moonshot.model, "moonshot-v1-8k-vision-preview");

// 未配置：isConfigured=false，chat 拒绝并给中文原因（回退路径入口）
assert.strictEqual(AI.isConfigured(), false);
AI.chat({ messages: [] }).then(
  () => { throw new Error("未配置时 chat 应该拒绝"); },
  (err) => {
    assert.ok(/尚未配置/.test(err.message), "未配置错误应为中文提示，实际：" + err.message);

    // 保存（默认智谱）→ 读取一致；Key 去空格
    AI.saveSettings({ provider: "zhipu", apiKey: "  test-key  " });
    const s = AI.loadSettings();
    assert.strictEqual(s.provider, "zhipu");
    assert.strictEqual(s.apiKey, "test-key");
    assert.strictEqual(s.model, "glm-4.6v-flash"); // 未传 model 时取预设
    assert.strictEqual(AI.isConfigured(), true);
    assert.strictEqual(globalThis.localStorage.getItem("posecam.ai"),
      JSON.stringify({ provider: "zhipu", apiKey: "test-key", model: "glm-4.6v-flash", baseUrl: "" }));

    // 换服务商：model 留空应落到该服务商预设
    AI.saveSettings({ provider: "moonshot", apiKey: "k2", model: "" });
    assert.strictEqual(AI.loadSettings().model, "moonshot-v1-8k-vision-preview");

    // 自定义服务商：model 不回落到预设（无预设），baseUrl 必填才 isConfigured
    AI.saveSettings({ provider: "custom", apiKey: "k3", baseUrl: "https://my.llm/v1/" });
    let cs = AI.loadSettings();
    assert.strictEqual(cs.baseUrl, "https://my.llm/v1/");
    assert.strictEqual(cs.model, ""); // 自定义无预设 model
    assert.strictEqual(AI.isConfigured(), true);
    AI.saveSettings({ provider: "custom", apiKey: "k3", baseUrl: "" });
    assert.strictEqual(AI.isConfigured(), false, "自定义服务商缺 baseUrl 应视为未配置");

    // testConnection 语义：成功时 resolve true（不发真实网络——用桩 fetch 拦截验证请求形状）
    AI.saveSettings({ provider: "zhipu", apiKey: "k4" });
    let captured = null;
    const realFetch = globalThis.fetch;
    globalThis.fetch = (url, init) => {
      captured = { url, body: JSON.parse(init.body), auth: init.headers.Authorization };
      return Promise.resolve({
        ok: true, status: 200, json: () => Promise.resolve({ choices: [{ message: { content: "pong" } }] })
      });
    };
    return AI.testConnection().then((ok) => {
      globalThis.fetch = realFetch;
      assert.strictEqual(ok, true);
      assert.strictEqual(captured.url, "https://open.bigmodel.cn/api/paas/v4/chat/completions");
      assert.strictEqual(captured.auth, "Bearer k4");
      assert.strictEqual(captured.body.messages[0].content, "ping"); // 纯文本 ping
      assert.strictEqual(captured.body.temperature, 0.3);

      // chat 成功路径：返回 choices[0].message.content 字符串
      globalThis.fetch = (url, init) => Promise.resolve({
        ok: true, status: 200, json: () => Promise.resolve({ choices: [{ message: { content: "hello" } }] })
      });
      return AI.chat({ messages: [{ role: "user", content: "hi" }] });
    }).then((out) => {
      globalThis.fetch = realFetch;
      assert.strictEqual(out, "hello");

      // 401 → 中文 Key 无效
      globalThis.fetch = () => Promise.resolve({ ok: false, status: 401, text: () => Promise.resolve("") });
      return AI.chat({ messages: [] }).then(
        () => { throw new Error("401 应该拒绝"); },
        (err) => assert.ok(/Key 无效/.test(err.message), "401 应映射为 Key 无效，实际：" + err.message)
      );
    }).then(() => {
      // 429 → 限流提示
      globalThis.fetch = () => Promise.resolve({ ok: false, status: 429, text: () => Promise.resolve("") });
      return AI.chat({ messages: [] }).then(
        () => { throw new Error("429 应该拒绝"); },
        (err) => assert.ok(/限流/.test(err.message), "429 应映射为限流，实际：" + err.message)
      );
    }).then(() => {
      // 空返回 → 中文报错
      globalThis.fetch = () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ choices: [] }) });
      return AI.chat({ messages: [] }).then(
        () => { throw new Error("空 choices 应该拒绝"); },
        (err) => assert.ok(/为空/.test(err.message), "空返回应报中文错误，实际：" + err.message)
      );
    }).then(() => {
      globalThis.fetch = realFetch;
      console.log("aiClient tests passed");
    });
  }
).catch((err) => {
  console.error(err);
  process.exit(1);
});
