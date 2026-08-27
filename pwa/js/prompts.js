/* ============================================================
   PoseCam · VLM 提示词构建与容错 JSON 解析
   window.PoseCam.Prompts：
   - buildSceneMessages({ sceneLabel, modeLabel })：场景分析 messages，
     user 图片段为 __IMG__ 占位符（调用方替换为 data:image/jpeg;base64,…）
   - parseSceneAdvice(text) → { composition, focal, pose, tip, lines:[3] }
   - buildReviewMessages({ sceneLabel, modeLabel })：照片点评 messages（同占位符约定）
   - parseReview(text) → { score:1-10, items:[{dim,stars,text}×3], encouragement }
   解析容错：剥 ```json 围栏、容忍首尾散文（取首个 { 到末个 }）；
   字段缺失 / lines 或 items 非恰 3 条 / 数值越界 → 抛带中文消息的 Error（UI 层 catch 后回退）。
   兼容 Node 单测：宿主对象取 (typeof window !== "undefined" ? window : globalThis)。
   ============================================================ */
(function (global) {
  'use strict';

  var IMG_PLACEHOLDER = '__IMG__';
  var REVIEW_DIMS = ['构图', '姿势', '情绪'];

  /* ---------- 提示词 ---------- */
  var SCENE_SYSTEM = [
    '你是一位资深人像摄影师与摄影指导专家。',
    '你只输出一个 JSON 对象，不要输出任何其他文字，也不要用 Markdown 代码围栏。',
    '文案全部使用简体中文。',
    '要求：以专业人像摄影师口吻，针对照片中真实可见的场景元素——光线方向、背景、线条——给建议，禁止泛泛而谈。',
    '输出 JSON schema（逐字段说明）：',
    '{',
    '  "composition": "一句话构图建议，必须提到画面中真实可见的元素（如窗户侧光、背景延伸线、招牌、桌面等）",',
    '  "focal": "建议焦段与景别，形如 2x · 半身特写 / 1.5x · 半身 / 1x · 环境人像",',
    '  "pose": "4-8 字姿势要点",',
    '  "tip": "1-2 句具体可执行的拍摄提示，结合画面真实光线与背景",',
    '  "lines": ["话术1", "话术2", "话术3"] —— 恰好 3 条可直接对被拍者说出口的引导话术，每条 20 字以内，口语化',
    '}'
  ].join('\n');

  var REVIEW_SYSTEM = [
    '你是一位资深人像摄影师，正在点评刚拍好的一张照片。',
    '你只输出一个 JSON 对象，不要输出任何其他文字，也不要用 Markdown 代码围栏。',
    '文案简体中文，语气真诚、具体、以鼓励为主。',
    '点评必须针对照片里真实可见的内容（光线、构图、姿势、表情），禁止模板化套话。',
    '输出 JSON schema（逐字段说明）：',
    '{',
    '  "score": 1 到 10 的综合评分数字，可带一位小数',
    '  "items": [',
    '    { "dim": "构图", "stars": 1-5 的星级整数, "text": "一句话点评，提到照片真实细节" },',
    '    { "dim": "姿势", "stars": 1-5, "text": "一句话点评" },',
    '    { "dim": "情绪", "stars": 1-5, "text": "一句话点评" }',
    '  ] —— 恰好 3 条，dim 只能取 构图 / 姿势 / 情绪',
    '  "encouragement": "一句真诚的鼓励话，20 字以内"',
    '}'
  ].join('\n');

  function buildUserText(sceneLabel, modeLabel, taskLine) {
    return [
      '当前拍摄场景：' + (sceneLabel || '未指定'),
      '拍摄模式：' + (modeLabel || '帮 TA 拍'),
      taskLine
    ].join('\n');
  }

  function buildSceneMessages(opts) {
    opts = opts || {};
    return [
      { role: 'system', content: SCENE_SYSTEM },
      {
        role: 'user',
        content: [
          { type: 'text', text: buildUserText(opts.sceneLabel, opts.modeLabel, '请看这张取景器实时画面，按 system 的 schema 只输出 JSON。') },
          { type: 'image_url', image_url: { url: IMG_PLACEHOLDER } }
        ]
      }
    ];
  }

  function buildReviewMessages(opts) {
    opts = opts || {};
    return [
      { role: 'system', content: REVIEW_SYSTEM },
      {
        role: 'user',
        content: [
          { type: 'text', text: buildUserText(opts.sceneLabel, opts.modeLabel, '这是刚按下快门的一张成片，请按 system 的 schema 点评这张照片，只输出 JSON。') },
          { type: 'image_url', image_url: { url: IMG_PLACEHOLDER } }
        ]
      }
    ];
  }

  /* ---------- 容错解析 ---------- */
  // 剥 ```json 围栏 → 取首个 { 到末个 } → JSON.parse；任一步失败抛中文错误
  function extractJson(text) {
    if (typeof text !== 'string' || !text.trim()) {
      throw new Error('AI 返回为空，无法解析');
    }
    var fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    var body = fenced ? fenced[1] : text;
    var start = body.indexOf('{');
    var end = body.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) {
      throw new Error('AI 返回中找不到 JSON 对象（缺少大括号）');
    }
    try {
      return JSON.parse(body.slice(start, end + 1));
    } catch (e) {
      throw new Error('AI 返回的 JSON 解析失败：' + (e && e.message ? e.message : e));
    }
  }

  function requireString(obj, key, who) {
    var v = obj ? obj[key] : undefined;
    if (typeof v !== 'string' || !v.trim()) {
      throw new Error('AI 返回' + (who ? who + ' ' : '') + '缺少字段或为空：' + key);
    }
    return v.trim();
  }

  function parseSceneAdvice(text) {
    var obj = extractJson(text);
    var result = {
      composition: requireString(obj, 'composition'),
      focal: requireString(obj, 'focal'),
      pose: requireString(obj, 'pose'),
      tip: requireString(obj, 'tip'),
      lines: null
    };
    if (!Array.isArray(obj.lines) || obj.lines.length !== 3) {
      throw new Error('AI 返回 lines 必须为 3 条话术，实际：' + (Array.isArray(obj.lines) ? obj.lines.length + ' 条' : '非数组'));
    }
    result.lines = obj.lines.map(function (l, i) {
      if (typeof l !== 'string' || !l.trim()) {
        throw new Error('AI 返回 lines[' + i + '] 不是非空字符串');
      }
      return l.trim();
    });
    return result;
  }

  function parseReview(text) {
    var obj = extractJson(text);
    var score = Number(obj.score);
    if (!isFinite(score) || score < 1 || score > 10) {
      throw new Error('AI 返回 score 应为 1-10 的数字，实际：' + obj.score);
    }
    if (!Array.isArray(obj.items) || obj.items.length !== 3) {
      throw new Error('AI 返回 items 必须为 3 条（构图/姿势/情绪），实际：' + (Array.isArray(obj.items) ? obj.items.length + ' 条' : '非数组'));
    }
    var seenDims = {};
    var items = obj.items.map(function (it, i) {
      if (!it || REVIEW_DIMS.indexOf(it.dim) === -1) {
        throw new Error('AI 返回 items[' + i + '].dim 必须是 构图/姿势/情绪 之一，实际：' + (it ? it.dim : it));
      }
      if (seenDims[it.dim]) {
        throw new Error('AI 返回 items[' + i + '].dim 重复：' + it.dim);
      }
      seenDims[it.dim] = true;
      var stars = Number(it.stars);
      if (!isFinite(stars) || stars < 1 || stars > 5) {
        throw new Error('AI 返回 items[' + i + '].stars 应为 1-5 的星级，实际：' + it.stars);
      }
      if (typeof it.text !== 'string' || !it.text.trim()) {
        throw new Error('AI 返回 items[' + i + '].text 不是非空字符串');
      }
      return { dim: it.dim, stars: Math.round(stars), text: it.text.trim() };
    });
    return {
      score: score,
      items: items,
      encouragement: requireString(obj, 'encouragement')
    };
  }

  global.PoseCam = Object.assign(global.PoseCam || {}, {
    Prompts: {
      buildSceneMessages: buildSceneMessages,
      parseSceneAdvice: parseSceneAdvice,
      buildReviewMessages: buildReviewMessages,
      parseReview: parseReview
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
