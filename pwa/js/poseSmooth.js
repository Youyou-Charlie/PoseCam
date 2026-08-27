/* ============================================================
   PoseCam · 骨架 EMA 平滑器（v2 降抖）
   window.PoseCam.createPoseSmoother({ alpha = 0.4, minVisibility = 0.5 })
   → { update(landmarks|null) → landmarks|null, reset() }
   - EMA：s = alpha*curr + (1-alpha)*prev，首帧直通；
   - visibility < minVisibility 的关键点保留上一帧平滑值（低置信不污染）；
   - update(null)（未检出人）连续计 miss，超过 10 帧返回 null（骨架淡出）
     并清空内部状态；此前返回最后平滑值；恢复检出后 miss 清零、重新直通；
   - 返回值为内部状态的拷贝，外部篡改不影响平滑；
   - 兼容 Node 单测：宿主对象取 (typeof window !== "undefined" ? window : globalThis)。
   ============================================================ */
(function (global) {
  'use strict';

  var MAX_MISS_FRAMES = 10;

  function clonePoint(p) {
    return { x: p.x, y: p.y, z: p.z, visibility: p.visibility };
  }

  function createPoseSmoother(opts) {
    opts = opts || {};
    var alpha = typeof opts.alpha === 'number' ? opts.alpha : 0.4;
    var minVisibility = typeof opts.minVisibility === 'number' ? opts.minVisibility : 0.5;
    var smoothed = null;  // 上一帧平滑结果（结构同输入 landmarks）
    var missCount = 0;    // 连续 update(null) 计数

    function update(landmarks) {
      if (!landmarks) {
        missCount += 1;
        if (missCount > MAX_MISS_FRAMES) {
          smoothed = null; // 淡出：清空状态，恢复检出时重新直通
          return null;
        }
        return smoothed ? smoothed.map(clonePoint) : null;
      }
      missCount = 0;
      if (!smoothed) {
        smoothed = landmarks.map(clonePoint); // 首帧直通
      } else {
        for (var i = 0; i < smoothed.length && i < landmarks.length; i++) {
          var cur = landmarks[i];
          var prev = smoothed[i];
          if (!cur) continue; // 关键点缺失：保留 prev
          if (cur.visibility !== undefined && cur.visibility < minVisibility) continue; // 低可见性：保留 prev
          if (!isFinite(cur.x) || !isFinite(cur.y) || !isFinite(cur.z)) continue; // 非有限坐标（NaN/Infinity）：保留 prev，防止污染平滑状态
          if (!prev) {
            smoothed[i] = clonePoint(cur);
            continue;
          }
          smoothed[i] = {
            x: alpha * cur.x + (1 - alpha) * prev.x,
            y: alpha * cur.y + (1 - alpha) * prev.y,
            z: alpha * cur.z + (1 - alpha) * prev.z,
            visibility: cur.visibility
          };
        }
        for (var j = smoothed.length; j < landmarks.length; j++) {
          smoothed[j] = clonePoint(landmarks[j]); // 输入点数变多时补齐
        }
      }
      return smoothed.map(clonePoint);
    }

    function reset() {
      smoothed = null;
      missCount = 0;
    }

    return { update: update, reset: reset };
  }

  global.PoseCam = Object.assign(global.PoseCam || {}, { createPoseSmoother: createPoseSmoother });
})(typeof window !== 'undefined' ? window : globalThis);
