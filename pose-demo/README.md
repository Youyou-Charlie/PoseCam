# PoseCam · 姿势识别技术验证 Demo

验证项目最危险的技术假设：**实时姿势识别在普通设备的浏览器里是否足够快、足够稳**，能否支撑「实时 AR 姿势引导」的产品体验。

只验证「识别能力」本身——不做姿势打分/匹配、不做引导线生成（YAGNI）。

## 运行方式

摄像头（`getUserMedia`）只允许在 **安全上下文**（`https://` 或 `localhost`）中使用，因此**不能直接双击 `index.html` 以 `file://` 打开**——那样摄像头不可用。请用本地 HTTP 服务：

```bash
# 方式一：在 pose-demo/ 目录下
cd pose-demo
python -m http.server 8000
# 浏览器访问 http://localhost:8000

# 方式二：在项目根目录起服务
python -m http.server 8000
# 浏览器访问 http://localhost:8000/pose-demo/
```

没有 Python 也可以用 `npx serve .` 等任意静态文件服务器，效果相同。

进入页面后点击「开启摄像头」，授权权限即可。首次加载需联网：运行时（wasm）与模型文件（`pose_landmarker_full.task`，约 9.4 MB）均从 CDN 下载，之后浏览器会缓存。

## 验证指标与判读标准

页面 HUD 实时显示（均为最近 30 帧滑动平均）：

| 指标 | 含义 | 通过标准 |
|---|---|---|
| FPS | 检测循环帧率（两次成功检测的间隔倒数） | **≥ 24** |
| 单帧检测耗时 | `detectForVideo` 调用前后差值 | **≤ 40 ms** |
| 检测到人数 / 关键点数 | 本 Demo 固定 `numPoses: 1`，单人时关键点应为 33 | 稳定为 1 人 / 33 点 |
| 骨架稳定性 | 连续帧骨架是否剧烈抖动 | 目测：人静止时骨架基本不抖 |

达标/未达标会在 HUD 中以绿/红实时标注。另请注意「推理后端」一栏：正常应为 **GPU**；若显示 CPU 并出现黄色提示条，说明 GPU 委托初始化失败已自动回退，此时性能数据不代表最佳水平。

**判读建议**：在目标档次的普通设备（非顶配）上测试；人进入画面后静止 2–3 秒待滑动平均稳定，再看 FPS 与耗时是否同时达标。

## 常见报错排查

| 现象 | 原因与解决 |
|---|---|
| 「非安全上下文」 | 用 `file://` 或局域网 IP（如 `http://192.168.x.x`）打开了页面。改用 `http://localhost:端口` 访问。 |
| 「摄像头权限被拒绝」 | 地址栏左侧锁形图标 → 网站设置 → 摄像头改为「允许」，刷新重试。 |
| 「未检测到摄像头」 | 设备无摄像头/被禁用/驱动异常；换一个带摄像头的设备测试。 |
| 「摄像头被其他应用占用」 | 关闭视频会议软件、其他占用摄像头的标签页后刷新。 |
| 「初始化失败」（加载阶段） | CDN / Google 存储下载失败：检查网络与代理（`cdn.jsdelivr.net` 与 `storage.googleapis.com` 均需可达），刷新重试。 |
| 推理后端显示 CPU | GPU 委托初始化失败（旧显卡/驱动问题）。可更新浏览器与显卡驱动后重试；CPU 模式仅作兜底。 |
| FPS 不达标 | 关闭其他占资源的标签页/应用；确认浏览器未开省电模式；确认后端为 GPU。 |

## 技术说明

- 无构建步骤：`index.html` + `app.js`（ES module）+ `style.css`，共三个文件。
- 库：`@mediapipe/tasks-vision@0.10.14`，jsdelivr CDN（`vision_bundle.mjs` 与 `wasm/` 目录同版本）。
- 模型：PoseLandmarker `pose_landmarker_full`（Google 官方托管，float16）。
- 推理：`runningMode: "VIDEO"`，`numPoses: 1`，GPU 优先、CPU 兜底；`detectForVideo` 时间戳严格单调递增，重复帧跳过。
- 渲染：canvas 与视频同尺寸叠加，`DrawingUtils.drawConnectors(POSE_CONNECTIONS)` 画骨架、`drawLandmarks` 画关键点，主色 `#00D4AA`；画面做自拍镜像（video 与 canvas 同一变换，骨架仍严格对齐）。
- 所有视频帧仅在本地浏览器内处理，不上传任何数据。
