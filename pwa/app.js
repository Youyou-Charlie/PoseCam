/* ============================================================
   PoseCam PWA · 最小 MVP
   资产复用：
   - 流程 / 视觉 / 文案：prototype-hifi（冻结稿，GUIDES/LINES 逐字沿用）
   - MediaPipe 管线：pose-demo（CDN 0.10.14、GPU→CPU 回退、预热、
     detectForVideo 循环、时间戳单调递增）
   差异：取景器为真摄像头全屏，骨架实时叠加即姿势反馈（v1 不做轮廓模板匹配）。
   ============================================================ */
(function () {
  'use strict';

  var $ = function (sel) { return document.querySelector(sel); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  /* ---------- 常量：CDN 与模型版本号必须前后一致（沿用 pose-demo） ---------- */
  var TASKS_VISION_VERSION = '0.10.14';
  var VISION_MODULE_URL =
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@' + TASKS_VISION_VERSION + '/vision_bundle.mjs';
  var WASM_BASE_URL =
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@' + TASKS_VISION_VERSION + '/wasm';
  /* 模型按设备分级（设计稿 §3.1）：移动端 lite，桌面 full */
  var IS_MOBILE =
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
  var MODEL_ASSET_URL = IS_MOBILE
    ? 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task'
    : 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task';

  /* MediaPipe Pose 关键点索引（本版用到的） */
  var IDX_RIGHT_SHOULDER = 12;
  var IDX_RIGHT_WRIST = 16;
  var VISIBILITY_MIN = 0.5;

  /* ---------- 全局状态 ---------- */
  var state = {
    mode: 'ta',        // ta=帮TA拍 / us=我们合照
    scene: 'cafe',     // cafe / street / night / indoor
    adviceIdx: 0,      // 当前 AI 建议索引
    linesPage: 0,      // 话术锦囊分页
    arOn: true,        // 骨架引导显隐开关（沿用原型 AR 开关语义，会话内有效）
    facing: 'environment' // 默认后置；翻转按钮切 'user'
  };

  var MODE_LABEL = { ta: '帮 TA 拍', us: '我们合照' };
  var SCENE_LABEL = { cafe: '咖啡厅', street: '街拍', night: '夜景', indoor: '室内' };

  /* ---------- 演示数据：AI 摄影师建议（按场景，文案与原型逐字一致） ----------
     rule 字段为本版新增的规则化姿势反馈示范标记（v1 简化，仅 1 条规则）：
     'raise-right-arm' = 「右臂抬高」类建议 → 检测右腕高于右肩，标签红/绿切换；
     无 rule 的建议 → 标签显示对应提示文案（默认红），不做关键点判定。 */
  var GUIDES = {
    cafe: [
      { focal: '2x',  fl: '半身特写', pose: '侧身靠窗', tip: '让 TA 侧对窗户，脸转向光源，轮廓会更柔和。跟随红色引导线，右臂再抬高一点。', rule: 'raise-right-arm' },
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

  /* ---------- 演示数据：话术锦囊（按场景，每屏 3 条，与原型逐字一致） ---------- */
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

  /* ---------- DOM ---------- */
  var video = $('#vf-video');
  var canvas = $('#vf-canvas');
  var vfMedia = $('#vf-media');
  var vfStatus = $('#vf-status');
  var vfError = $('#vf-error');
  var arTag = $('#ar-tag');
  var arTagText = $('#ar-tag-text');
  var flash = $('#flash');
  var sheet = $('#lines-sheet');
  var scrim = $('#scrim');

  /* ---------- 运行状态（相机 / MediaPipe） ---------- */
  var PoseLandmarkerRef = null;
  var DrawingUtilsRef = null;
  var poseLandmarker = null;
  var drawingUtils = null;
  var modelPromise = null;   // 模型只加载一次（含进行中）
  var cameraStarting = null; // 相机启动中的 Promise，防重入
  var stream = null;
  var detecting = false;     // 检测循环开关
  var mirrorActive = false;  // 预览/成片是否镜像（按轨道实际 facingMode 判定）
  var lastVideoTime = -1;
  var lastTimestamp = -1;
  var detectErrors = 0;    // 连续检测异常计数（瞬时错误不中断，持续异常才停）
  var currentPhoto = null;   // { blob, url, name } 本次成片
  var lastTagState = '';     // 姿势标签 DOM 更新去抖
  var frameCount = 0;        // 检测节流：每 2 帧做 1 次推理（v2 降抖）
  var poseSmoothers = (window.PoseCam && window.PoseCam.createPoseSmoother)
    ? [window.PoseCam.createPoseSmoother(), window.PoseCam.createPoseSmoother()] // numPoses=2，每人一个
    : null; // 平滑模块缺失时退回直渲染，不阻断
  var lastSmoothedPoses = []; // smoother 当前值缓存，未检测帧渲染用

  /* ---------- 屏幕切换（淡入） ---------- */
  function show(id) {
    $$('.screen').forEach(function (s) {
      s.classList.toggle('active', s.id === id);
    });
  }

  // data-go 导航 + 相机生命周期联动：
  // 离开取景器去点评 → 暂停检测但保留相机流（再拍一张秒回）；
  // 离开取景器回场景/模式/启动页 → 彻底停相机。
  function go(id) {
    if (id === 'screen-viewfinder') {
      show(id);
      resumeViewfinder();
      return;
    }
    show(id);
    if (id === 'screen-review') {
      pauseDetection();
    } else {
      stopCamera();
    }
  }

  $$('[data-go]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      go(btn.getAttribute('data-go'));
    });
  });

  // 启动页：点击任意处进入
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
  function currentGuide() {
    return GUIDES[state.scene][state.adviceIdx];
  }

  function applyAdvice() {
    var g = currentGuide();
    $('#focal-pill').textContent = '建议焦段 ' + g.focal + ' · ' + g.fl;
    $('#ai-pose').textContent = g.pose;
    $('#ai-tip').textContent = g.tip;
    lastTagState = ''; // 建议变了，强制刷新姿势标签
    updatePoseTag(null);
  }

  // 进入取景器前：同步模式/场景标签与首条建议，然后启动相机
  function syncViewfinder() {
    state.adviceIdx = 0;
    $('#ai-scene').textContent = SCENE_LABEL[state.scene] + ' · ' + MODE_LABEL[state.mode];
    applyAdvice();
  }

  $('#btn-to-vf').addEventListener('click', function () {
    syncViewfinder();
    show('screen-viewfinder');
    startCameraFlow();
  });

  // 取景器返回键（等价于 data-go="screen-scene"，走 go() 统一停相机）
  $('#btn-vf-back').addEventListener('click', function () {
    go('screen-scene');
  });

  /* ---------- 环境预检（file:// / 非安全上下文给出明确中文提示） ---------- */
  function preflight() {
    if (!window.isSecureContext) {
      throw new Error(
        'INSECURE_CONTEXT:当前页面不是安全上下文，摄像头（getUserMedia）只允许在 https:// 或 localhost 下使用。\n' +
        '本地调试：在 pwa 目录运行 python -m http.server 8000 后访问 http://localhost:8000；双击 file:// 打开无法使用摄像头。\n' +
        'iPhone 真机：请用 GitHub Pages（https）或 ngrok 隧道访问，步骤见 README。'
      );
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'NO_GETUSERMEDIA:当前浏览器不支持摄像头调用。请使用较新版本的 Safari / Chrome，并通过 localhost 或 https 访问。'
      );
    }
  }

  function mapCameraError(err) {
    var name = err && err.name ? err.name : '';
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      return ['摄像头权限被拒绝',
        '解决办法：在浏览器设置中允许本页面使用摄像头（iPhone：设置 → Safari → 相机；或点击地址栏左侧图标），然后刷新重试。'];
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError' || name === 'DevicesNotFoundError') {
      return ['未检测到可用摄像头', '请确认设备摄像头未被占用或禁用，然后刷新页面重试。'];
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return ['摄像头被其他应用占用', '请关闭正在使用摄像头的应用或其他浏览器标签页，然后刷新重试。'];
    }
    return ['相机初始化失败',
      '错误信息：' + ((err && err.message) || err) + '\n首次使用需联网从 CDN 加载 AI 模型（约 5–12 MB），请检查网络后刷新重试。'];
  }

  function showVfError(title, detail) {
    $('#vf-error-title').textContent = title;
    $('#vf-error-detail').textContent = detail;
    vfError.hidden = false;
    setVfStatus(null);
  }

  function presentError(err) {
    var msg = String((err && err.message) || '');
    if (msg.indexOf('INSECURE_CONTEXT:') === 0) {
      showVfError('非安全上下文，无法使用摄像头', msg.replace('INSECURE_CONTEXT:', ''));
    } else if (msg.indexOf('NO_GETUSERMEDIA:') === 0) {
      showVfError('浏览器不支持摄像头调用', msg.replace('NO_GETUSERMEDIA:', ''));
    } else {
      var r = mapCameraError(err);
      showVfError(r[0], r[1]);
    }
  }

  $('#btn-vf-error-back').addEventListener('click', function () {
    vfError.hidden = true;
    go('screen-scene');
  });

  window.addEventListener('unhandledrejection', function (event) {
    event.preventDefault();
    if ($('#screen-viewfinder').classList.contains('active')) presentError(event.reason);
  });

  function setVfStatus(text) {
    if (!text) {
      vfStatus.hidden = true;
      return;
    }
    vfStatus.textContent = text;
    vfStatus.hidden = false;
  }

  /* ---------- MediaPipe 模型加载（GPU 优先，失败回退 CPU；沿用 pose-demo 写法） ---------- */
  function createLandmarker(filesetResolver, vision) {
    var base = { modelAssetPath: MODEL_ASSET_URL, delegate: 'GPU' };
    // numPoses:2 —— 单/双人模式共用同一实例，合照模式两人骨架都能叠加；
    // 双人对称引导算法不在本版（YAGNI），骨架即反馈。
    return vision.PoseLandmarker.createFromOptions(filesetResolver, {
      baseOptions: base, runningMode: 'VIDEO', numPoses: 2
    }).then(function (lm) {
      return { landmarker: lm, delegate: 'GPU' };
    }).catch(function (gpuErr) {
      console.warn('GPU 委托初始化失败，回退 CPU：', gpuErr);
      return vision.PoseLandmarker.createFromOptions(filesetResolver, {
        baseOptions: { modelAssetPath: MODEL_ASSET_URL, delegate: 'CPU' },
        runningMode: 'VIDEO', numPoses: 2
      }).then(function (lm) {
        return { landmarker: lm, delegate: 'CPU' };
      });
    });
  }

  function ensureLandmarker() {
    if (modelPromise) return modelPromise;
    setVfStatus('正在加载 AI 模型（首次约 5–12 MB）…');
    modelPromise = import(VISION_MODULE_URL).then(function (vision) {
      PoseLandmarkerRef = vision.PoseLandmarker;
      DrawingUtilsRef = vision.DrawingUtils;
      return vision.FilesetResolver.forVisionTasks(WASM_BASE_URL)
        .then(function (filesetResolver) { return createLandmarker(filesetResolver, vision); });
    }).then(function (r) {
      poseLandmarker = r.landmarker;
      warmupLandmarker();
      return poseLandmarker;
    }).catch(function (err) {
      modelPromise = null; // 失败允许重试
      throw err;
    });
    return modelPromise;
  }

  // 预热：小尺寸位图跑一次 VIDEO 推理，一次性成本不计入首帧（沿用 pose-demo；本版只用 VIDEO 模式）
  function warmupLandmarker() {
    try {
      var wc = document.createElement('canvas');
      wc.width = 224;
      wc.height = 224;
      var wctx = wc.getContext('2d');
      wctx.fillStyle = '#808080';
      wctx.fillRect(0, 0, 224, 224);
      poseLandmarker.detectForVideo(wc, performance.now());
    } catch (err) {
      console.warn('预热失败（不影响流程）：', err);
    }
  }

  /* ---------- 相机生命周期 ---------- */
  function startCameraFlow() {
    if (cameraStarting) return cameraStarting;
    cameraStarting = (async function () {
      preflight();
      vfError.hidden = true;
      // 模型与相机并行启动，缩短等待
      var modelReady = ensureLandmarker().catch(function (err) {
        console.error('模型加载失败：', err);
        // 模型失败不阻断取景器：可拍照，仅无骨架。提示后继续。
        toast('AI 模型加载失败，仅保留拍照功能（请检查网络后重进）');
      });
      setVfStatus('正在启动摄像头…');
      await openStream();
      await modelReady;
      setVfStatus(null);
      resumeDetection();
    })().catch(function (err) {
      console.error(err);
      stopCamera();
      presentError(err);
    }).finally(function () {
      cameraStarting = null;
    });
    return cameraStarting;
  }

  function openStream() {
    return navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
        facingMode: { ideal: state.facing }
      },
      audio: false
    }).then(function (s) {
      stopStream();
      stream = s;
      video.srcObject = s;
      return new Promise(function (resolve, reject) {
        video.onloadedmetadata = resolve;
        video.onerror = function () { reject(new Error('视频流加载失败，请刷新页面重试。')); };
      }).then(function () {
        return video.play();
      }).then(function () {
        // canvas 与视频同尺寸；CSS object-fit:cover 保证两者裁切一致、骨架对齐
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (!drawingUtils && DrawingUtilsRef) {
          drawingUtils = new DrawingUtilsRef(canvas.getContext('2d'));
        }
        // 前置摄像头预览镜像（与系统相机一致的自拍观感）；容器整体镜像，video 与 canvas 同步。
        // 以轨道实际 facingMode 为准（部分设备/桌面摄像头不支持 facingMode 选择，
        // 此时退回请求时的意图值），避免单摄设备翻转后镜像状态错乱。
        var track = s.getVideoTracks()[0];
        var actualFacing = track && track.getSettings ? track.getSettings().facingMode : undefined;
        mirrorActive = actualFacing ? (actualFacing === 'user') : (state.facing === 'user');
        vfMedia.classList.toggle('mirrored', mirrorActive);
        resetLoopState();
      });
    });
  }

  function stopStream() {
    if (stream) {
      stream.getTracks().forEach(function (t) { t.stop(); });
      stream = null;
    }
    if (video.srcObject) video.srcObject = null;
  }

  function stopCamera() {
    detecting = false;
    stopStream();
    clearOverlay();
  }

  // 点评页 → 取景器（再拍一张 / 返回）：流还在就恢复检测；流被系统回收则重启
  function resumeViewfinder() {
    if (stream && stream.getVideoTracks().some(function (t) { return t.readyState === 'live'; })) {
      resumeDetection();
    } else {
      startCameraFlow();
    }
  }

  function resumeDetection() {
    if (!poseLandmarker || !stream || detecting) return;
    resetLoopState();
    detecting = true;
    requestAnimationFrame(detectLoop);
  }

  function pauseDetection() {
    detecting = false;
  }

  function resetLoopState() {
    lastVideoTime = -1;
    lastTimestamp = -1;
    detectErrors = 0;
    frameCount = 0;
    lastSmoothedPoses = [];
    if (poseSmoothers) poseSmoothers.forEach(function (sm) { sm.reset(); });
  }

  function clearOverlay() {
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  // 页面切后台：暂停检测省电；回前台若在取景器则恢复（iOS 可能已回收相机流 → 自动重启）
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      pauseDetection();
    } else if ($('#screen-viewfinder').classList.contains('active')) {
      resumeViewfinder();
    }
  });

  /* ---------- 检测循环（沿用 pose-demo：跳重复帧 + 时间戳严格单调；v2：每 2 帧推理 1 次 + EMA 平滑） ---------- */
  function detectLoop() {
    if (!detecting) return;
    try {
      if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        frameCount += 1;

        if (frameCount % 2 === 1) { // 检测帧：跑推理并喂给平滑器
          var timestamp = performance.now();
          if (timestamp <= lastTimestamp) timestamp = lastTimestamp + 1;
          lastTimestamp = timestamp;

          var result = poseLandmarker.detectForVideo(video, timestamp);
          detectErrors = 0;
          var raw = result.landmarks || [];
          if (poseSmoothers) {
            // 每人一个平滑器；未检出的那一侧喂 null（连续 10 帧后骨架淡出）
            lastSmoothedPoses = poseSmoothers
              .map(function (sm, i) { return sm.update(raw[i] || null); })
              .filter(Boolean);
          } else {
            lastSmoothedPoses = raw;
          }
        }
        // 未检测帧：复用 smoother 当前值渲染（骨架不逐帧跳变 → 降抖）
        renderPoses(lastSmoothedPoses);
      }
    } catch (err) {
      console.error(err);
      detectErrors += 1;
      if (detectErrors >= 30) { // 连续异常才判定为检测管道故障
        pauseDetection();
        toast('骨架检测中断：' + ((err && err.message) || err) + '（拍照功能不受影响）');
        return;
      }
    }
    requestAnimationFrame(detectLoop);
  }

  /* ---------- 骨架渲染（青色 #00D4AA，DrawingUtils；输入为平滑后 poses） ---------- */
  function renderPoses(poses) {
    poses = poses || [];
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!state.arOn) {
      updatePoseTag(null);
      return;
    }
    // drawingUtils 惰性创建：openStream 时模型可能尚在加载（两者并行），
    // 这里保证首次渲染前一定就绪
    if (!drawingUtils) drawingUtils = new DrawingUtilsRef(ctx);
    for (var i = 0; i < poses.length; i++) {
      drawingUtils.drawConnectors(poses[i], PoseLandmarkerRef.POSE_CONNECTIONS, {
        color: '#00D4AA',
        lineWidth: 3
      });
      drawingUtils.drawLandmarks(poses[i], {
        color: '#00D4AA',
        fillColor: '#F5F5F0',
        lineWidth: 1,
        radius: 4
      });
    }
    updatePoseTag(poses[0] || null);
  }

  /* ---------- 规则化姿势反馈（v1 简化示范，仅 1 条规则） ----------
     「右臂抬高」类建议：右腕(16) 高于 右肩(12)（图像坐标 y 更小为更高）
     → 标签转绿「✓ 右臂已到位」；否则红色提示「右臂再抬高一点」。
     其他建议：显示对应提示文案（默认红），不做关键点判定。
     注意：这是规则形态示范，不是完整的姿势匹配算法（轮廓模板匹配留待原生阶段）。 */
  function updatePoseTag(landmarks) {
    if (!state.arOn) {
      setTag('hidden');
      return;
    }
    var g = currentGuide();
    if (g.rule === 'raise-right-arm') {
      var ok = false;
      if (landmarks) {
        var shoulder = landmarks[IDX_RIGHT_SHOULDER];
        var wrist = landmarks[IDX_RIGHT_WRIST];
        if (shoulder && wrist &&
            (shoulder.visibility === undefined || shoulder.visibility >= VISIBILITY_MIN) &&
            (wrist.visibility === undefined || wrist.visibility >= VISIBILITY_MIN)) {
          ok = wrist.y < shoulder.y;
        }
      }
      setTag(ok ? 'ok' : 'miss', ok ? '✓ 右臂已到位，保持！' : '右臂再抬高一点');
    } else {
      setTag('miss', '保持：' + g.pose);
    }
  }

  function setTag(cls, text) {
    var key = cls + '|' + (text || '');
    if (key === lastTagState) return; // 每帧调用，状态未变不碰 DOM
    lastTagState = key;
    if (cls === 'hidden') {
      arTag.setAttribute('hidden', '');
      return;
    }
    arTag.removeAttribute('hidden');
    arTag.classList.toggle('ok', cls === 'ok');
    arTagText.textContent = text;
  }

  /* ---------- 骨架引导显隐开关（沿用原型 AR 开关语义） ---------- */
  $('#btn-ar-toggle').addEventListener('click', function () {
    state.arOn = !state.arOn;
    this.classList.toggle('on', state.arOn);
    this.setAttribute('aria-pressed', String(state.arOn));
    if (!state.arOn) clearOverlay();
    lastTagState = '';
    updatePoseTag(null);
  });

  /* ---------- AI 摄影师「换一条」 ---------- */
  $('#btn-next-advice').addEventListener('click', function () {
    state.adviceIdx = (state.adviceIdx + 1) % GUIDES[state.scene].length;
    applyAdvice();
  });

  /* ---------- 翻转镜头（默认后置 environment ↔ 前置 user） ---------- */
  $('#btn-flip').addEventListener('click', function () {
    if (cameraStarting) return;
    state.facing = state.facing === 'environment' ? 'user' : 'environment';
    if (!$('#screen-viewfinder').classList.contains('active')) return;
    pauseDetection();
    setVfStatus('正在切换镜头…');
    openStream()
      .then(function () {
        setVfStatus(null);
        resumeDetection();
      })
      .catch(function (err) {
        console.error(err);
        // 翻转失败（如设备无对应镜头）：回退到原方向再试一次
        state.facing = state.facing === 'environment' ? 'user' : 'environment';
        openStream()
          .then(function () {
            setVfStatus(null);
            resumeDetection();
            toast('当前设备只有一个方向的镜头');
          })
          .catch(function (err2) {
            setVfStatus(null);
            presentError(err2);
          });
      });
  });

  /* ---------- 快门：捕获真实视频帧 → 闪白 → 点评页 ---------- */
  $('#btn-shutter').addEventListener('click', function () {
    if (!stream || video.readyState < 2 || video.videoWidth === 0) {
      toast('相机尚未就绪，请稍候');
      return;
    }
    var w = video.videoWidth;
    var h = video.videoHeight;
    var shot = document.createElement('canvas');
    shot.width = w;
    shot.height = h;
    var ctx = shot.getContext('2d');
    // 预览若镜像（前摄），成片同步镜像，所见即所得（与系统相机一致）
    if (mirrorActive) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);
    shot.toBlob(function (blob) {
      if (!blob) {
        toast('拍照失败，请重试');
        return;
      }
      if (currentPhoto) URL.revokeObjectURL(currentPhoto.url);
      currentPhoto = {
        blob: blob,
        url: URL.createObjectURL(blob),
        name: 'posecam-' + new Date().toISOString().replace(/[:.]/g, '-') + '.jpg'
      };
      flash.classList.remove('on');
      void flash.offsetWidth; // 强制重排，重启动画
      flash.classList.add('on');
      setTimeout(function () {
        $('#review-img').src = currentPhoto.url;
        $('#thumb-mini').style.backgroundImage = 'url(' + currentPhoto.url + ')';
        $('#review-sub').textContent = SCENE_LABEL[state.scene] + ' · ' + MODE_LABEL[state.mode];
        go('screen-review');
      }, 360);
    }, 'image/jpeg', 0.92);
  });

  /* ---------- 保存 / 分享（共用实现：navigator.share files → 降级下载 → Toast 兜底） ---------- */
  function shareOrSavePhoto() {
    if (!currentPhoto) {
      toast('还没有成片，先去拍一张');
      return;
    }
    var file = new File([currentPhoto.blob], currentPhoto.name, { type: 'image/jpeg' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'PoseCam 成片' }).catch(function (err) {
        if (err && err.name === 'AbortError') return; // 用户取消系统面板，不打扰
        downloadPhoto();
      });
    } else {
      downloadPhoto();
    }
  }

  function downloadPhoto() {
    var a = document.createElement('a');
    a.href = currentPhoto.url;
    a.download = currentPhoto.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast('当前浏览器不支持系统分享，已改为下载保存');
  }

  $('#btn-save').addEventListener('click', shareOrSavePhoto);
  $('#btn-share').addEventListener('click', shareOrSavePhoto);

  $('#thumb-mini').addEventListener('click', function () {
    if (currentPhoto) {
      $('#review-img').src = currentPhoto.url;
      $('#review-sub').textContent = SCENE_LABEL[state.scene] + ' · ' + MODE_LABEL[state.mode];
      go('screen-review');
    } else {
      toast('还没有成片，先拍一张吧');
    }
  });

  /* ---------- 话术锦囊（暖色模块，行为同原型） ---------- */
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

  /* ---------- Toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  // 标记脚本已完整加载执行（供 index.html 内联兜底脚本检测加载失败）
  window.__poseCamReady = true;
})();
