/**
 * PoseCam · 姿势识别技术验证 Demo
 *
 * 技术方案（无构建步骤）：
 * - MediaPipe Tasks Vision 0.10.14，ES module 从 jsdelivr CDN 动态引入
 * - PoseLandmarker / VIDEO 模式 / numPoses:1，模型 pose_landmarker_full（Google 官方托管）
 * - getUserMedia → requestAnimationFrame 循环 → detectForVideo 逐帧检测
 * - DrawingUtils 在 canvas 上叠加骨架（主色 #00D4AA）
 *
 * 仅验证「识别能力」本身：不做姿势打分/匹配逻辑（YAGNI）。
 */

// ---------- 常量：CDN 与模型版本号必须前后一致 ----------

const TASKS_VISION_VERSION = "0.10.14";
const VISION_MODULE_URL =
  `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/vision_bundle.mjs`;
const WASM_BASE_URL =
  `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const MODEL_ASSET_URL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task";

// 通过标准（页面上同步标明）
const PASS_FPS = 24;
const PASS_MS = 40;
// 滑动平均窗口（帧）
const AVG_WINDOW = 30;

// ---------- DOM ----------

const startBtn = document.getElementById("start-btn");
const statusLine = document.getElementById("status-line");
const setupPanel = document.getElementById("setup-panel");
const errorBox = document.getElementById("error-box");
const errorTitle = document.getElementById("error-title");
const errorDetail = document.getElementById("error-detail");
const stage = document.getElementById("stage");
const video = document.getElementById("webcam");
const canvas = document.getElementById("overlay");
const backendNote = document.getElementById("backend-note");

const mFps = document.getElementById("m-fps");
const mMs = document.getElementById("m-ms");
const mPersons = document.getElementById("m-persons");
const mKeypoints = document.getElementById("m-keypoints");
const mBackend = document.getElementById("m-backend");
const mFpsJudge = document.getElementById("m-fps-judge");
const mMsJudge = document.getElementById("m-ms-judge");

// ---------- 运行状态 ----------

let PoseLandmarkerRef = null; // PoseLandmarker 类（渲染 POSE_CONNECTIONS 用）
let poseLandmarker = null;
let drawingUtils = null;
let running = false;

let lastVideoTime = -1; // 上一帧 video.currentTime，用于跳过重复帧
let lastTimestamp = -1; // 上次传入 detectForVideo 的时间戳（必须单调递增）
let lastDetectAt = 0; // 上一次成功检测的墙钟时间（算 FPS 用）

// ---------- 滑动平均 ----------

function createAverager(windowSize) {
  const buf = [];
  return {
    push(v) {
      buf.push(v);
      if (buf.length > windowSize) buf.shift();
    },
    avg() {
      if (buf.length === 0) return 0;
      return buf.reduce((a, b) => a + b, 0) / buf.length;
    },
  };
}

const fpsAvg = createAverager(AVG_WINDOW);
const msAvg = createAverager(AVG_WINDOW);

// ---------- 错误提示 ----------

function showError(title, detail) {
  errorTitle.textContent = title;
  errorDetail.textContent = detail;
  errorBox.hidden = false;
  statusLine.textContent = "";
}

function mapError(err) {
  const name = err && err.name ? err.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") {
    return [
      "摄像头权限被拒绝",
      "解决办法：点击浏览器地址栏左侧的锁形/设置图标，将「摄像头」权限改为「允许」，然后刷新页面重试。",
    ];
  }
  if (name === "NotFoundError" || name === "OverconstrainedError" || name === "DevicesNotFoundError") {
    return [
      "未检测到摄像头",
      "解决办法：请确认设备已连接摄像头且驱动正常（笔记本请确认未禁用/未遮挡），然后刷新页面重试。",
    ];
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return [
      "摄像头被其他应用占用",
      "解决办法：关闭正在使用摄像头的应用（如视频会议软件、其他浏览器标签页），然后刷新页面重试。",
    ];
  }
  return [
    "初始化失败",
    `错误信息：${(err && err.message) || err}\n` +
      "可能原因与解决办法：\n" +
      "1. 首次加载需从 CDN 下载运行时与模型（约 12 MB），网络不通或被墙时会失败——请检查网络/代理后刷新重试。\n" +
      "2. 浏览器过旧——请使用较新版本的 Chrome / Edge。",
  ];
}

// 兜底：任何漏网的 Promise rejection 都以可读方式呈现，而不是静默失败
window.addEventListener("unhandledrejection", (event) => {
  event.preventDefault();
  const [title, detail] = mapError(event.reason);
  showError(title, detail);
});

// ---------- 环境预检 ----------

function preflight() {
  if (!window.isSecureContext) {
    throw new Error(
      "INSECURE_CONTEXT:当前页面不是安全上下文。摄像头（getUserMedia）只允许在 https:// 或 localhost 下使用。" +
        "请用本地 HTTP 服务打开，例如在本目录运行 python -m http.server 8000 后访问 http://localhost:8000；直接双击 file:// 打开无法使用摄像头。"
    );
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      "NO_GETUSERMEDIA:当前浏览器不支持 getUserMedia。请使用较新版本的 Chrome / Edge，并通过 localhost 或 https 访问。"
    );
  }
}

// ---------- 模型初始化（GPU 优先，失败回退 CPU） ----------

async function createLandmarker(filesetResolver, vision) {
  const baseOptions = { modelAssetPath: MODEL_ASSET_URL, delegate: "GPU" };
  try {
    const landmarker = await vision.PoseLandmarker.createFromOptions(filesetResolver, {
      baseOptions,
      runningMode: "VIDEO",
      numPoses: 1,
    });
    return { landmarker, delegate: "GPU" };
  } catch (gpuErr) {
    console.warn("GPU 委托初始化失败，回退 CPU：", gpuErr);
    const landmarker = await vision.PoseLandmarker.createFromOptions(filesetResolver, {
      baseOptions: { modelAssetPath: MODEL_ASSET_URL, delegate: "CPU" },
      runningMode: "VIDEO",
      numPoses: 1,
    });
    return { landmarker, delegate: "CPU" };
  }
}

// ---------- 启动流程 ----------

async function start() {
  preflight();
  errorBox.hidden = true;

  setStatus("正在加载 MediaPipe 运行时与模型（首次约 12 MB，请稍候）…");
  const vision = await import(VISION_MODULE_URL);
  PoseLandmarkerRef = vision.PoseLandmarker;

  const filesetResolver = await vision.FilesetResolver.forVisionTasks(WASM_BASE_URL);
  const { landmarker, delegate } = await createLandmarker(filesetResolver, vision);
  poseLandmarker = landmarker;
  mBackend.textContent = delegate;
  if (delegate === "CPU") backendNote.hidden = false;

  setStatus("模型就绪，正在请求摄像头权限…");
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
    audio: false,
  });

  video.srcObject = stream;
  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve;
    video.onerror = () => reject(new Error("视频流加载失败，请刷新页面重试。"));
  });
  await video.play();

  // canvas 与视频同尺寸叠加
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  drawingUtils = new vision.DrawingUtils(canvas.getContext("2d"));

  setupPanel.hidden = true;
  stage.hidden = false;
  running = true;
  requestAnimationFrame(detectLoop);
}

function setStatus(text) {
  statusLine.textContent = text;
}

// ---------- 检测循环 ----------

function detectLoop() {
  if (!running) return;
  try {
    // HAVE_CURRENT_DATA(2)：确保有可用帧；currentTime 未变说明是重复帧，跳过
    if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
      lastVideoTime = video.currentTime;

      // detectForVideo 要求时间戳严格单调递增
      let timestamp = performance.now();
      if (timestamp <= lastTimestamp) timestamp = lastTimestamp + 1;

      const result = poseLandmarker.detectForVideo(video, timestamp);
      const elapsed = performance.now() - timestamp;

      lastTimestamp = timestamp;
      msAvg.push(elapsed);
      const now = performance.now();
      if (lastDetectAt > 0) fpsAvg.push(1000 / (now - lastDetectAt));
      lastDetectAt = now;

      render(result);
      updateHud(result);
    }
  } catch (err) {
    running = false;
    const [title, detail] = mapError(err);
    showError(title, detail);
    return;
  }
  requestAnimationFrame(detectLoop);
}

// ---------- 渲染骨架 ----------

function render(result) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const poses = result.landmarks || [];
  for (const landmarks of poses) {
    drawingUtils.drawConnectors(landmarks, PoseLandmarkerRef.POSE_CONNECTIONS, {
      color: "#00D4AA",
      lineWidth: 3,
    });
    drawingUtils.drawLandmarks(landmarks, {
      color: "#00D4AA",
      fillColor: "#F5F5F0",
      lineWidth: 1,
      radius: 4,
    });
  }
}

// ---------- HUD ----------

function setJudge(el, value, pass, okText, badText) {
  el.textContent = `${value} · ${pass ? okText : badText}`;
  el.className = "stat-value " + (pass ? "ok" : "bad");
}

function updateHud(result) {
  const fps = fpsAvg.avg();
  const ms = msAvg.avg();

  setJudge(mFps, fps.toFixed(0), fps >= PASS_FPS, "达标", "未达标");
  setJudge(mMs, ms.toFixed(1) + " ms", ms <= PASS_MS, "达标", "未达标");
  mFpsJudge.textContent = fps >= PASS_FPS ? "达标" : "未达标";
  mFpsJudge.className = fps >= PASS_FPS ? "ok" : "bad";
  mMsJudge.textContent = ms <= PASS_MS ? "达标" : "未达标";
  mMsJudge.className = ms <= PASS_MS ? "ok" : "bad";

  const poses = result.landmarks || [];
  let keypointCount = 0;
  for (const landmarks of poses) keypointCount += landmarks.length;
  mPersons.textContent = String(poses.length);
  mKeypoints.textContent = String(keypointCount);
}

// ---------- 入口 ----------

startBtn.addEventListener("click", () => {
  if (running) return;
  startBtn.disabled = true;
  start().catch((err) => {
    console.error(err);
    if (String((err && err.message) || "").startsWith("INSECURE_CONTEXT:")) {
      showError("非安全上下文，无法使用摄像头", err.message.replace("INSECURE_CONTEXT:", ""));
    } else if (String((err && err.message) || "").startsWith("NO_GETUSERMEDIA:")) {
      showError("浏览器不支持摄像头调用", err.message.replace("NO_GETUSERMEDIA:", ""));
    } else {
      const [title, detail] = mapError(err);
      showError(title, detail);
    }
    startBtn.disabled = false;
    running = false;
  });
});
