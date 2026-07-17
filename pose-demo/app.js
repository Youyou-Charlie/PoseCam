/**
 * PoseCam · 姿势识别技术验证 Demo
 *
 * 技术方案（无构建步骤）：
 * - MediaPipe Tasks Vision 0.10.14，ES module 从 jsdelivr CDN 动态引入
 * - PoseLandmarker / VIDEO 模式 / numPoses:1，模型 pose_landmarker_full（Google 官方托管）
 * - 摄像头模式：getUserMedia → requestAnimationFrame 循环 → detectForVideo 逐帧检测
 * - 文件回退模式（无摄像头设备）：上传视频走同一检测循环；上传图片切 IMAGE 模式单次 detect()
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
// 图片模式参考线：单次全量检测无上一帧跟踪红利，天然约为视频帧耗时的 2 倍，
// 故不复用 40ms 达标线，单独给 100ms 作量级参考
const IMAGE_PASS_MS = 100;
// 滑动平均窗口（帧）
const AVG_WINDOW = 30;
// 图片模式测量口径：长边上限、连续检测次数（取中位数）
const IMAGE_MAX_EDGE = 1280;
const IMAGE_DETECT_RUNS = 5;

// ---------- DOM ----------

const startBtn = document.getElementById("start-btn");
const fileBtn = document.getElementById("file-btn");
const fileInput = document.getElementById("file-input");
const backBtn = document.getElementById("back-btn");
const statusLine = document.getElementById("status-line");
const setupPanel = document.getElementById("setup-panel");
const errorBox = document.getElementById("error-box");
const errorTitle = document.getElementById("error-title");
const errorDetail = document.getElementById("error-detail");
const stage = document.getElementById("stage");
const videoWrap = document.querySelector(".video-wrap");
const video = document.getElementById("webcam");
const canvas = document.getElementById("overlay");
const backendNote = document.getElementById("backend-note");

const mFps = document.getElementById("m-fps");
const mMs = document.getElementById("m-ms");
const mPersons = document.getElementById("m-persons");
const mKeypoints = document.getElementById("m-keypoints");
const mBackend = document.getElementById("m-backend");
const mMode = document.getElementById("m-mode");
const mFpsJudge = document.getElementById("m-fps-judge");
const mMsJudge = document.getElementById("m-ms-judge");

// ---------- 运行状态 ----------

let PoseLandmarkerRef = null; // PoseLandmarker 类（渲染 POSE_CONNECTIONS 用）
let DrawingUtilsRef = null;
let poseLandmarker = null;
let drawingUtils = null;
let running = false;
let mode = null; // "camera" | "video-file" | "image-file"
let currentObjectUrl = null; // 文件模式的 object URL，用完必须释放

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
    reset() {
      buf.length = 0;
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
      "解决办法：请确认设备已连接摄像头且驱动正常（笔记本请确认未禁用/未遮挡），然后刷新页面重试。\n" +
        "没有摄像头？可以改用「上传视频/图片测试」进入文件模式。",
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

// 统一错误呈现：业务错误用约定前缀标记，其余走 mapError
function presentError(err) {
  const msg = String((err && err.message) || "");
  if (msg.startsWith("INSECURE_CONTEXT:")) {
    showError("非安全上下文，无法使用摄像头", msg.replace("INSECURE_CONTEXT:", ""));
  } else if (msg.startsWith("NO_GETUSERMEDIA:")) {
    showError("浏览器不支持摄像头调用", msg.replace("NO_GETUSERMEDIA:", ""));
  } else if (msg === "FILE_DECODE_VIDEO") {
    showError(
      "视频文件无法解码播放",
      "该格式/编码当前浏览器不支持。\n建议：使用 MP4（H.264 编码）文件；MOV（尤其是 iPhone 拍摄的 HEVC）在 Windows 版 Chrome 上常无法播放，请先转码为 MP4 再试。"
    );
  } else if (msg === "FILE_DECODE_IMAGE") {
    showError("图片文件无法解码", "请换用常见格式（JPG / PNG / WebP）重试。");
  } else if (msg.startsWith("UNSUPPORTED_FILE:")) {
    showError("不支持的文件类型", msg.replace("UNSUPPORTED_FILE:", ""));
  } else {
    const [title, detail] = mapError(err);
    showError(title, detail);
  }
}

// 兜底：任何漏网的 Promise rejection 都以可读方式呈现，而不是静默失败
window.addEventListener("unhandledrejection", (event) => {
  event.preventDefault();
  presentError(event.reason);
});

// ---------- 环境预检（仅摄像头模式需要） ----------

function preflight() {
  if (!window.isSecureContext) {
    throw new Error(
      "INSECURE_CONTEXT:当前页面不是安全上下文。摄像头（getUserMedia）只允许在 https:// 或 localhost 下使用。" +
        "请用本地 HTTP 服务打开，例如在本目录运行 python -m http.server 8000 后访问 http://localhost:8000；直接双击 file:// 打开无法使用摄像头。" +
        "没有摄像头或只想快速验证，可改用「上传视频/图片测试」文件模式（无此限制）。"
    );
  }
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      "NO_GETUSERMEDIA:当前浏览器不支持 getUserMedia。请使用较新版本的 Chrome / Edge，并通过 localhost 或 https 访问；" +
        "或改用「上传视频/图片测试」文件模式。"
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

// 两种模式共用的模型加载：只加载一次
async function ensureLandmarker() {
  if (poseLandmarker) return;
  setStatus("正在加载 MediaPipe 运行时与模型（首次约 12 MB，请稍候）…");
  const vision = await import(VISION_MODULE_URL);
  PoseLandmarkerRef = vision.PoseLandmarker;
  DrawingUtilsRef = vision.DrawingUtils;

  const filesetResolver = await vision.FilesetResolver.forVisionTasks(WASM_BASE_URL);
  const { landmarker, delegate } = await createLandmarker(filesetResolver, vision);
  poseLandmarker = landmarker;
  mBackend.textContent = delegate;
  if (delegate === "CPU") backendNote.hidden = false;

  setStatus("模型就绪，正在预热推理管道…");
  await warmupLandmarker();
}

// 预热：用小尺寸位图把 VIDEO / IMAGE 两种模式各跑一次，
// 让推理图重建与 GPU 首次推理等一次性成本不混入后续真实测量。
// 预热失败不阻断流程（首次测量可能偏大，仅警告）。
async function warmupLandmarker() {
  try {
    const warmupCanvas = document.createElement("canvas");
    warmupCanvas.width = 224;
    warmupCanvas.height = 224;
    const wctx = warmupCanvas.getContext("2d");
    wctx.fillStyle = "#808080";
    wctx.fillRect(0, 0, 224, 224);

    // VIDEO 模式预热（detectForVideo 接受 canvas 作为 ImageSource，时间戳合法即可）
    poseLandmarker.detectForVideo(warmupCanvas, performance.now());
    // IMAGE 模式预热；无论成功与否都切回 VIDEO，避免卡在 IMAGE 模式
    await poseLandmarker.setOptions({ runningMode: "IMAGE" });
    try {
      poseLandmarker.detect(warmupCanvas);
    } finally {
      await poseLandmarker.setOptions({ runningMode: "VIDEO" });
    }
  } catch (err) {
    console.warn("预热失败（不影响流程，首次测量可能含一次性成本）：", err);
  }
}

// ---------- 通用工具 ----------

function setStatus(text) {
  statusLine.textContent = text;
}

function releaseObjectUrl() {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

// 停止一切媒体源（摄像头轨道 / 文件视频），释放 object URL
function stopMedia() {
  if (video.srcObject) {
    video.srcObject.getTracks().forEach((t) => t.stop());
    video.srcObject = null;
  }
  video.pause();
  video.onloadedmetadata = null;
  video.onerror = null;
  video.removeAttribute("src");
  video.load();
  releaseObjectUrl();
}

function resetLoopState() {
  lastVideoTime = -1;
  lastTimestamp = -1;
  lastDetectAt = 0;
  fpsAvg.reset();
  msAvg.reset();
}

// canvas 与视频同尺寸叠加；DrawingUtils 绑定 ctx 只需创建一次
function prepareCanvasFromVideo() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  if (!drawingUtils) drawingUtils = new DrawingUtilsRef(canvas.getContext("2d"));
}

function waitVideoMetadata(makeError) {
  return new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve;
    video.onerror = () => reject(makeError());
  });
}

function enterStage(inputMode) {
  mode = inputMode;
  setupPanel.hidden = true;
  stage.hidden = false;
}

// ---------- 模式一：摄像头 ----------

async function startCamera() {
  preflight();
  errorBox.hidden = true;
  await ensureLandmarker();

  setStatus("模型就绪，正在请求摄像头权限…");
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
    audio: false,
  });

  video.srcObject = stream;
  await waitVideoMetadata(() => new Error("视频流加载失败，请刷新页面重试。"));
  await video.play();

  prepareCanvasFromVideo();
  videoWrap.classList.remove("image-mode");
  mMode.textContent = "摄像头";
  resetLoopState();
  enterStage("camera");
  running = true;
  requestAnimationFrame(detectLoop);
}

// ---------- 模式二：文件（无摄像头设备的回退） ----------

async function handleFile(file) {
  if (file.type.startsWith("video/")) return startVideoFile(file);
  if (file.type.startsWith("image/")) return startImageFile(file);
  throw new Error(
    `UNSUPPORTED_FILE:无法识别「${file.name}」的类型（${file.type || "未知"}）。` +
      "请选择视频（推荐 MP4 / H.264）或图片（JPG / PNG / WebP）文件。"
  );
}

// 视频文件：复用 detectForVideo 检测循环与 HUD
async function startVideoFile(file) {
  errorBox.hidden = true;
  await ensureLandmarker();

  setStatus("正在解码视频文件…");
  releaseObjectUrl();
  const url = URL.createObjectURL(file);
  currentObjectUrl = url;

  const metadataReady = waitVideoMetadata(() => new Error("FILE_DECODE_VIDEO"));
  video.muted = true;
  video.loop = true; // 循环播放，保证指标可持续观测
  video.src = url;
  await metadataReady;
  await video.play().catch(() => {
    throw new Error("FILE_DECODE_VIDEO");
  });

  prepareCanvasFromVideo();
  videoWrap.classList.remove("image-mode");
  mMode.textContent = "文件模式 · 视频";
  resetLoopState();
  enterStage("video-file");
  running = true;
  requestAnimationFrame(detectLoop);
}

// 图片文件：切 IMAGE 模式连续 detect 5 次取中位数，测完切回 VIDEO
async function startImageFile(file) {
  errorBox.hidden = true;
  await ensureLandmarker();

  setStatus("正在检测图片…");
  releaseObjectUrl();
  const url = URL.createObjectURL(file);
  currentObjectUrl = url;

  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error("FILE_DECODE_IMAGE"));
    img.src = url;
  });

  // 长边超过 1280px 时先等比缩放：手机原图（3000-4000px）全尺寸上传 GPU
  // 是一笔失真成本，不代表实时管道中的实际输入规格
  let source = img;
  let srcWidth = img.naturalWidth;
  let srcHeight = img.naturalHeight;
  const longEdge = Math.max(srcWidth, srcHeight);
  const wasScaled = longEdge > IMAGE_MAX_EDGE;
  if (wasScaled) {
    const scale = IMAGE_MAX_EDGE / longEdge;
    srcWidth = Math.round(srcWidth * scale);
    srcHeight = Math.round(srcHeight * scale);
    const scaled = document.createElement("canvas");
    scaled.width = srcWidth;
    scaled.height = srcHeight;
    scaled.getContext("2d").drawImage(img, 0, 0, srcWidth, srcHeight);
    source = scaled;
  }

  canvas.width = srcWidth;
  canvas.height = srcHeight;
  if (!drawingUtils) drawingUtils = new DrawingUtilsRef(canvas.getContext("2d"));

  // 连续检测 5 次取中位数：首次 detect 仍可能含模式切换的推理图重建，
  // 中位数可把这类一次性波动剔掉
  await poseLandmarker.setOptions({ runningMode: "IMAGE" });
  const samples = [];
  let result;
  try {
    for (let i = 0; i < IMAGE_DETECT_RUNS; i++) {
      const t0 = performance.now();
      result = poseLandmarker.detect(source);
      samples.push(performance.now() - t0);
    }
  } finally {
    // 无论成功与否都切回 VIDEO，保证后续摄像头/视频模式可用
    await poseLandmarker.setOptions({ runningMode: "VIDEO" });
  }
  samples.sort((a, b) => a - b);
  const median = samples[Math.floor(samples.length / 2)];

  // canvas 上画检测所用的同一张位图（缩放后为缩放图），骨架坐标自然对齐
  const ctx = canvas.getContext("2d");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  drawPoses(result);
  releaseObjectUrl(); // 图片已解码绘制完毕，object URL 用完释放

  videoWrap.classList.add("image-mode");
  mMode.textContent = wasScaled
    ? `文件模式 · 图片（已缩放至 ${IMAGE_MAX_EDGE}px）`
    : "文件模式 · 图片";
  enterStage("image-file");
  updateHudForImage(result, median);
}

// ---------- 返回说明页 ----------

function resetToSetup() {
  running = false;
  mode = null;
  stopMedia();
  videoWrap.classList.remove("image-mode");
  resetLoopState();

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  mFps.textContent = "--";
  mFps.className = "stat-value";
  mMs.textContent = "--";
  mMs.className = "stat-value";
  mPersons.textContent = "0";
  mKeypoints.textContent = "0";
  mMode.textContent = "--";
  mFpsJudge.textContent = "--";
  mFpsJudge.className = "";
  mMsJudge.textContent = "--";
  mMsJudge.className = "";

  stage.hidden = true;
  setupPanel.hidden = false;
  startBtn.disabled = false;
  fileBtn.disabled = false;
  statusLine.textContent = "";
}

// ---------- 检测循环（摄像头与视频文件共用） ----------

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
    console.error(err);
    resetToSetup(); // 错误框在说明页内，先回到说明页再呈现
    presentError(err);
    return;
  }
  requestAnimationFrame(detectLoop);
}

// ---------- 渲染骨架 ----------

function drawPoses(result) {
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

function render(result) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPoses(result);
}

// ---------- HUD ----------

function setJudge(el, value, pass, okText, badText) {
  el.textContent = `${value} · ${pass ? okText : badText}`;
  el.className = "stat-value " + (pass ? "ok" : "bad");
}

function setCounts(result) {
  const poses = result.landmarks || [];
  let keypointCount = 0;
  for (const landmarks of poses) keypointCount += landmarks.length;
  mPersons.textContent = String(poses.length);
  mKeypoints.textContent = String(keypointCount);
}

// 实时流（摄像头 / 视频文件）每帧刷新
function updateHud(result) {
  const fps = fpsAvg.avg();
  const ms = msAvg.avg();

  setJudge(mFps, fps.toFixed(0), fps >= PASS_FPS, "达标", "未达标");
  setJudge(mMs, ms.toFixed(1) + " ms", ms <= PASS_MS, "达标", "未达标");
  mFpsJudge.textContent = fps >= PASS_FPS ? "达标" : "未达标";
  mFpsJudge.className = fps >= PASS_FPS ? "ok" : "bad";
  mMsJudge.textContent = ms <= PASS_MS ? "达标" : "未达标";
  mMsJudge.className = ms <= PASS_MS ? "ok" : "bad";

  setCounts(result);
}

// 静态图：显示 5 次连续检测的中位数，FPS 无意义；
// 耗时按图片模式自己的参考线（≤100ms）判定，不复用视频流的 40ms 达标线
function updateHudForImage(result, medianMs) {
  const pass = medianMs <= IMAGE_PASS_MS;
  mFps.textContent = "静态图";
  mFps.className = "stat-value";
  setJudge(mMs, medianMs.toFixed(1) + " ms", pass, "达标", "未达标");
  mFpsJudge.textContent = "—";
  mFpsJudge.className = "";
  mMsJudge.textContent =
    (pass ? "达标" : "未达标") +
    ` · 5 次中位数 · 图片模式参考线 ≤${IMAGE_PASS_MS} ms（单次全量检测 ≈ 2×视频帧）`;
  mMsJudge.className = pass ? "ok" : "bad";

  setCounts(result);
}

// ---------- 入口 ----------

function runFlow(flow) {
  startBtn.disabled = true;
  fileBtn.disabled = true;
  flow().catch((err) => {
    console.error(err);
    running = false;
    stopMedia(); // 清理可能已部分获取的媒体资源
    presentError(err);
    startBtn.disabled = false;
    fileBtn.disabled = false;
  });
}

startBtn.addEventListener("click", () => {
  if (running) return;
  runFlow(startCamera);
});

fileBtn.addEventListener("click", () => {
  if (running) return;
  fileInput.click();
});

fileInput.addEventListener("change", () => {
  const file = fileInput.files && fileInput.files[0];
  fileInput.value = ""; // 允许再次选择同一文件
  if (!file || running) return;
  runFlow(() => handleFile(file));
});

backBtn.addEventListener("click", resetToSetup);

// 标记脚本已完整加载执行（供 index.html 内联兜底脚本检测加载失败）
window.__poseDemoReady = true;
