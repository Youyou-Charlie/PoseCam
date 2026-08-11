# PoseCam PWA 网页版最小 MVP · 设计稿

> 日期：2026-07-17
> 状态：已确认（用户拍板 PWA 先行，原生 iOS 路线不变）
> 定位：MVP 验证载体——在 Mac 到位前，把"真正能用的最小产品"交到用户手上
> 上游文档：PRD v0.2、`2026-07-17-hifi-prototype-and-pose-demo-design.md`（视觉系统）、R1 测试报告

---

## 1. 范围（与原型/ demo 的关系）

复用两块已验证资产：
- **pose-demo/**：MediaPipe PoseLandmarker 管线（CDN 版本、预热、GPU→CPU 回退、检测循环、HUD 思路）。
- **prototype-hifi/**：冻结的视觉系统（tokens、5 屏结构、GUIDES/LINES 演示数据、文案）。

PWA 不是"又一个原型"：取景器接**真摄像头 + 实时骨架**，快门拍**真照片**，点评页显示**真实成片**。

## 2. 功能范围（v1）

| 模块 | 实现 | 说明 |
|---|---|---|
| 流程 5 屏 | 沿用高保真原型 | 启动→模式→场景→取景器→点评 |
| 取景器 | `getUserMedia` 真摄像头（默认后置 `environment`，可翻转） | 全屏实时画面 |
| AR 层 | 实时骨架叠加（青色 #00D4AA）+ 1–2 条规则化姿势检测示范（如「右臂抬高」：腕部高于肩部 → 提示标签红转绿） | v1 简化：不做模板轮廓匹配，骨架即引导反馈 |
| AI 摄影师面板 / 焦段胶囊 / 话术锦囊 | 预设库（GUIDES/LINES，按场景；双人差异本轮标注待补） | 与原型一致 |
| 快门 | video 帧 → canvas 捕获真实照片 | 快门即存语义（R1 迭代结论） |
| 点评页 | 显示真实成片 + 预设点评文案（明确标注"演示点评"） | 保存=Web Share API 存相册（降级为下载）；分享=系统分享面板；再拍一张返回 |
| PWA | manifest.json + apple-touch 元数据 + standalone 全屏 + 图标（纯色底+取景框图形，脚本生成 PNG） | iPhone「添加到主屏幕」 |

## 3. 关键技术决策

1. **模型按设备分级**：移动端用 `pose_landmarker_lite`，桌面用 `full`；GPU 失败回退 CPU（沿用 pose-demo 的健壮性写法）。
2. **iOS Safari 摄像头要求 https 或 localhost**——局域网 IP 直开不可用。部署方案首选 **GitHub Pages**（仓库已双推 GitHub，静态文件零成本 https），备选 tunnel（ngrok 等）。README 写清步骤。
3. **拍照捕获**：canvas.drawImage(video) → toBlob；点评页展示该 blob；保存用 `navigator.share({files})`（iOS Safari 支持存入相册），不支持则降级 `<a download>`。
4. **骨架即反馈**：v1 不做目标轮廓匹配算法（那是原生阶段的 Vision 工作）；用 1–2 条 landmarks 规则示范"姿势对不对"的反馈形态。
5. **诚实标注**：点评为预设演示文案（实时分析是 PRD P1，不在此版本）；骨架为实时检测结果。

## 4. YAGNI（本版不做）

- 目标姿势轮廓模板匹配、双人对称引导算法
- 真实 AI 点评 / 实时场景分析（PRD P1，需后端/订阅）
- 账号体系、云存储、社区（PRD 明确 P3 不做）
- 离线可用（模型需在线加载；Service Worker 缓存壳可做可不做，本版不做）

## 5. 验证方式

- 桌面：`localhost` 起服务跑通流程（摄像头模式已在 pose-demo 验证）。
- 真机：GitHub Pages 部署后 iPhone Safari 打开 → 添加到主屏幕 → 全流程实测（用户执行）。
- 已知风险：iOS Safari 上 MediaPipe 性能未实测（lite + CPU 回退兜底）。

## 6. 后续（本版之后）

- 用户真机实测反馈 → 迭代
- 双人专属建议/话术内容补齐（R1 归档项）
- Mac 到位 → 原生工程（SwiftUI + Vision），PWA 作为功能/交互参照
