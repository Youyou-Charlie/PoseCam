/* ============================================================
   PoseCam · VLM 客户端（OpenAI 兼容 chat/completions）与服务商配置
   window.PoseCam.AI：
   - PROVIDERS：内置三家预设（baseUrl/model）
   - loadSettings()/saveSettings()：localStorage["posecam.ai"]，
     结构 { provider, apiKey, model, baseUrl? }（baseUrl 仅自定义服务商需要）
   - isConfigured()：有 Key 且能确定接口地址
   - chat({ messages, timeoutMs=20000 }) → Promise<string>（choices[0].message.content）
   - testConnection() → Promise<true>（发 1 条纯文本 "ping"）
   错误一律抛带中文消息的 Error（401/429/超时/网络/空返回分别映射）。
   兼容 Node 单测：宿主对象取 (typeof window !== "undefined" ? window : globalThis)。
   ============================================================ */
(function (global) {
  'use strict';

  var STORAGE_KEY = 'posecam.ai';
  var DEFAULT_TIMEOUT_MS = 20000;

  var PROVIDERS = {
    zhipu: {
      label: '智谱 GLM（免费）',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      model: 'glm-4.6v-flash'
    },
    dashscope: {
      label: '阿里百炼（90天免费额度）',
      baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      model: 'qwen-vl-plus'
    },
    moonshot: {
      label: 'Moonshot（付费）',
      baseUrl: 'https://api.moonshot.cn/v1',
      model: 'moonshot-v1-8k-vision-preview'
    }
  };

  function readStore() {
    try {
      var raw = global.localStorage && global.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) || {}) : {};
    } catch (e) {
      return {};
    }
  }

  function loadSettings() {
    var s = readStore();
    var provider = PROVIDERS[s.provider] ? s.provider : (s.provider === 'custom' ? 'custom' : 'zhipu');
    var preset = PROVIDERS[provider];
    return {
      provider: provider,
      apiKey: s.apiKey || '',
      model: s.model || (preset ? preset.model : ''),
      baseUrl: s.baseUrl || ''
    };
  }

  function saveSettings(opts) {
    opts = opts || {};
    var known = opts.provider && (PROVIDERS[opts.provider] || opts.provider === 'custom');
    var provider = known ? opts.provider : 'zhipu';
    var preset = PROVIDERS[provider];
    var settings = {
      provider: provider,
      apiKey: (opts.apiKey || '').trim(),
      model: (opts.model || '').trim() || (preset ? preset.model : ''),
      baseUrl: (opts.baseUrl || '').trim()
    };
    try {
      global.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      /* 隐私模式等写入失败时静默：调用方拿返回值即本次会话生效值 */
    }
    return settings;
  }

  function isConfigured() {
    var s = loadSettings();
    return Boolean(s.apiKey) && Boolean(PROVIDERS[s.provider] || s.baseUrl);
  }

  function resolveEndpoint() {
    var s = loadSettings();
    var baseUrl = (PROVIDERS[s.provider] && PROVIDERS[s.provider].baseUrl) || s.baseUrl;
    if (!s.apiKey) throw new Error('尚未配置 AI：请先在首页 ⚙ 设置服务商与 API Key');
    if (!baseUrl) throw new Error('AI 接口地址缺失：请在设置中选择服务商，或补全自定义 Base URL');
    return { baseUrl: baseUrl.replace(/\/+$/, ''), model: s.model, apiKey: s.apiKey };
  }

  function chat(req) {
    req = req || {};
    var endpoint;
    try {
      endpoint = resolveEndpoint();
    } catch (err) {
      return Promise.reject(err);
    }
    var timeoutMs = req.timeoutMs || DEFAULT_TIMEOUT_MS;
    return fetch(endpoint.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + endpoint.apiKey
      },
      body: JSON.stringify({
        model: endpoint.model,
        messages: req.messages,
        temperature: 0.3
      }),
      signal: AbortSignal.timeout(timeoutMs)
    }).then(function (res) {
      if (res.status === 401) throw new Error('Key 无效或已过期（401）：请到服务商控制台核对');
      if (res.status === 429) throw new Error('触发限流（429），稍后再试');
      if (!res.ok) {
        return res.text().then(function (body) {
          var detail = (body || '').slice(0, 160);
          throw new Error('AI 服务返回错误（HTTP ' + res.status + '）' + (detail ? '：' + detail : ''));
        });
      }
      return res.json();
    }).then(function (data) {
      // 部分服务商会以 HTTP 200 返回错误体（如智谱 1305 模型拥堵），必须显式识别
      if (data && data.error) {
        throw new Error('AI 服务错误：' + (data.error.message || data.error.code || '未知错误'));
      }
      var content = data && data.choices && data.choices[0] &&
        data.choices[0].message && data.choices[0].message.content;
      if (typeof content !== 'string' || !content.trim()) {
        throw new Error('AI 返回内容为空或格式异常，请重试');
      }
      return content;
    }).catch(function (err) {
      if (err && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        throw new Error('模型响应超时，请检查网络');
      }
      throw err;
    });
  }

  function testConnection() {
    return chat({
      messages: [{ role: 'user', content: 'ping' }],
      timeoutMs: 15000
    }).then(function () {
      return true;
    });
  }

  var AI = {
    PROVIDERS: PROVIDERS,
    loadSettings: loadSettings,
    saveSettings: saveSettings,
    isConfigured: isConfigured,
    chat: chat,
    testConnection: testConnection
  };

  global.PoseCam = Object.assign(global.PoseCam || {}, { AI: AI });
})(typeof window !== 'undefined' ? window : globalThis);
