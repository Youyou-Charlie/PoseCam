/* ============================================================
   PoseCam 高保真视觉原型 · 屏幕切换与演示交互
   纯原生 JS：无构建、无 ES modules、无 fetch，file:// 直开可运行
   ============================================================ */
(function () {
  'use strict';

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  /* ---------- 全局状态 ---------- */
  var state = {
    mode: 'ta',        // ta=帮TA拍 / us=我们合照
    scene: 'cafe',     // cafe / street / night / indoor
    adviceIdx: 0,      // 当前 AI 建议索引
    linesPage: 0       // 话术锦囊分页
  };

  var MODE_LABEL = { ta: '帮 TA 拍', us: '我们合照' };
  var SCENE_LABEL = { cafe: '咖啡厅', street: '街拍', night: '夜景', indoor: '室内' };

  /* ---------- 演示数据：AI 摄影师建议（按场景） ---------- */
  var GUIDES = {
    cafe: [
      { focal: '2x',  fl: '半身特写', pose: '侧身靠窗', tip: '让 TA 侧对窗户，脸转向光源，轮廓会更柔和。跟随红色引导线，右臂再抬高一点。' },
      { focal: '1x',  fl: '环境人像', pose: '举杯互动', tip: '用咖啡杯做前景，人物放在画面右侧三分线，生活感自然就有了。' },
      { focal: '1.5x', fl: '坐姿构图', pose: '桌前前倾', tip: '身体微微前倾更显脸小，头顶留出三分之一空间，构图更透气。' }
    ],
    street: [
      { focal: '1x',  fl: '环境人像', pose: '漫步回眸', tip: '让 TA 自然向前走，你喊名字的瞬间回头，利用街道延伸线引导视线。' },
      { focal: '2x',  fl: '半身特写', pose: '倚墙插兜', tip: '找一面干净的墙，手插口袋，肩膀放松下沉，对准青色轮廓线。' },
      { focal: '1x',  fl: '全身构图', pose: '招牌之下', tip: '人物放在画面下方三分之一，霓虹招牌做背景，城市氛围拉满。' }
    ],
    night: [
      { focal: '2x',  fl: '光斑人像', pose: '逆光侧脸', tip: '让霓虹在 TA 身后虚化成光斑，侧脸对镜头，发丝会发光。' },
      { focal: '1x',  fl: '夜景人像', pose: '街头驻足', tip: '提醒 TA 保持两秒不动，背景车流自然拉丝，画面更有电影感。' },
      { focal: '1.5x', fl: '半身构图', pose: '灯下回眸', tip: '找一盏暖色路灯站进光里，回眸瞬间按下快门，明暗对比最出片。' }
    ],
    indoor: [
      { focal: '1.5x', fl: '生活感人像', pose: '沙发倚靠', tip: '靠进沙发，手自然搭在扶手上，脸转向窗户借自然光，状态最松弛。' },
      { focal: '2x',  fl: '面部特写', pose: '窗边侧颜', tip: '让自然光打亮半边脸，视线看镜头上方一点，眼神会更有神。' },
      { focal: '1x',  fl: '全身抓拍', pose: '居家走动', tip: '从窗边自然走向屋内，不要摆拍，抓最松弛的那一步。' }
    ]
  };

  /* ---------- 演示数据：话术锦囊（按场景，每屏 3 条） ---------- */
  var LINES = {
    cafe: [
      '头往窗边转一点点，光落在侧脸上，绝了。',
      '咖啡杯端起来，看窗外别看我，自然就好。',
      '就这个状态，笑起来特别好看，三、二、一。',
      '你刚刚那个表情很松弛，我们再来一张。',
      '肩膀放松，对，就是这样，太好看了。',
      '这张直接封神，回去就能当头像。'
    ],
    street: [
      '你就往前走，我喊你的时候回头，别停。',
      '手插口袋，肩膀放松，对，特别自然。',
      '靠在招牌下面那张墙，人往左边站一点。',
      '这个背景虚化会很好看，保持三秒钟。',
      '你笑起来比酷着好看，笑一个试试。',
      '刚抓到你走路那张，氛围感直接拉满。'
    ],
    night: [
      '站进路灯那个光圈里，侧脸给我。',
      '别动别动，身后正好有车灯拉丝，三、二、一。',
      '回头看我的瞬间笑一下，就像听到我叫你。',
      '你身后的霓虹全变成光斑了，超级电影感。',
      '下巴稍微收一点，轮廓会更好看。',
      '这张有剧照那味了，再来一张保底。'
    ],
    indoor: [
      '往沙发里陷一点，就像平时在家那样。',
      '脸转向窗户那边，光照进来特别温柔。',
      '眼睛看镜头上面一点，会显得更有神。',
      '你刚刚笑场那张其实最好看，再来一次。',
      '手里拿杯水也行，有道具手就不僵了。',
      '这张很像生活杂志封面，保存预定。'
    ]
  };

  /* ---------- 屏幕切换（淡入） ---------- */
  function show(id) {
    $$('.screen').forEach(function (s) {
      s.classList.toggle('active', s.id === id);
    });
  }

  // data-go 返回 / 前进导航
  $$('[data-go]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      show(btn.getAttribute('data-go'));
    });
  });

  // 启动页：点击任意处进入（含「开始拍摄」按钮，事件冒泡一次到位）
  $('#screen-splash').addEventListener('click', function () {
    show('screen-mode');
  });

  /* ---------- 屏 2 · 模式选择 ---------- */
  $$('.mode-card').forEach(function (card) {
    card.addEventListener('click', function () {
      state.mode = card.getAttribute('data-mode');
      $$('.mode-card').forEach(function (c) {
        c.classList.toggle('selected', c === card);
      });
    });
  });

  /* ---------- 屏 3 · 场景选择 ---------- */
  $$('.scene-card').forEach(function (card) {
    card.addEventListener('click', function () {
      state.scene = card.getAttribute('data-scene');
      $$('.scene-card').forEach(function (c) {
        c.classList.toggle('selected', c === card);
      });
    });
  });

  /* ---------- 屏 4 · 取景器 ---------- */
  function applyAdvice() {
    var g = GUIDES[state.scene][state.adviceIdx];
    $('#focal-pill').textContent = '建议焦段 ' + g.focal + ' · ' + g.fl;
    $('#ai-pose').textContent = g.pose;
    $('#ai-tip').textContent = g.tip;
  }

  // 进入取景器前：同步场景画面、模式标签与 AR 轮廓形态
  function syncViewfinder() {
    state.adviceIdx = 0;
    $('#vf-scene').className = 'vf-scene thumb-' + state.scene;
    $('#thumb-mini').className = 'thumb-mini thumb-' + state.scene;
    $('#ai-scene').textContent = SCENE_LABEL[state.scene] + ' · ' + MODE_LABEL[state.mode];

    var solo = (state.mode === 'ta');
    // .hidden 是 HTMLElement 的 IDL 属性，对 SVG 元素赋值不会映射到 hidden 内容属性，
    // 必须用 setAttribute/removeAttribute 才能让 [hidden]{display:none} 生效
    if (solo) {
      $('#ar-solo').removeAttribute('hidden');
      $('#ar-couple').setAttribute('hidden', '');
    } else {
      $('#ar-solo').setAttribute('hidden', '');
      $('#ar-couple').removeAttribute('hidden');
    }

    // 未匹配提示标签对准红色部位（单人 / 双人轮廓位置不同）
    var tag = $('#ar-tag');
    if (solo) {
      tag.style.left = '58%';
      tag.style.top = '27%';
    } else {
      tag.style.left = '62%';
      tag.style.top = '36%';
    }

    applyAdvice();
  }

  $('#btn-to-vf').addEventListener('click', function () {
    syncViewfinder();
    show('screen-viewfinder');
  });

  // AI 摄影师「换一条」
  $('#btn-next-advice').addEventListener('click', function () {
    state.adviceIdx = (state.adviceIdx + 1) % GUIDES[state.scene].length;
    applyAdvice();
  });

  // 快门：闪白后进入 AI 点评页
  var flash = $('#flash');
  $('#btn-shutter').addEventListener('click', function () {
    flash.classList.remove('on');
    void flash.offsetWidth; // 强制重排，重启动画
    flash.classList.add('on');
    setTimeout(function () {
      $('#review-photo').className = 'review-photo thumb-' + state.scene;
      $('#review-sub').textContent = SCENE_LABEL[state.scene] + ' · ' + MODE_LABEL[state.mode];
      show('screen-review');
    }, 360);
  });

  /* ---------- 话术锦囊（暖色模块） ---------- */
  var sheet = $('#lines-sheet');
  var scrim = $('#scrim');
  var scrimTimer = null;

  function renderBubbles() {
    var lines = LINES[state.scene];
    var start = (state.linesPage * 3) % lines.length;
    var html = '';
    for (var i = 0; i < 3; i++) {
      html += '<div class="bubble-row">' +
                '<span class="bubble-avatar">AI</span>' +
                '<span class="bubble">' + lines[(start + i) % lines.length] + '</span>' +
              '</div>';
    }
    $('#bubbles').innerHTML = html;
  }

  function openSheet() {
    state.linesPage = 0;
    renderBubbles();
    clearTimeout(scrimTimer);
    scrim.hidden = false;
    // 先显示再补类名，保证过渡动画生效
    requestAnimationFrame(function () {
      scrim.classList.add('show');
      sheet.classList.add('open');
    });
  }

  function closeSheet() {
    scrim.classList.remove('show');
    sheet.classList.remove('open');
    scrimTimer = setTimeout(function () { scrim.hidden = true; }, 340);
  }

  $('#btn-lines').addEventListener('click', openSheet);
  $('#btn-sheet-close').addEventListener('click', closeSheet);
  scrim.addEventListener('click', closeSheet);

  $('#btn-more-lines').addEventListener('click', function () {
    state.linesPage += 1;
    renderBubbles();
  });

  /* ---------- Toast（演示反馈） ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 1800);
  }

  $('#btn-save').addEventListener('click', function () { toast('已保存到相册'); });
  $('#btn-flip').addEventListener('click', function () { toast('已切换前后镜头（演示）'); });
  $('#thumb-mini').addEventListener('click', function () { toast('上一张成片（演示）'); });

})();
