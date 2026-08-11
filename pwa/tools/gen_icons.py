#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PoseCam PWA 图标生成脚本（纯 Python 标准库，无第三方依赖）。

图形语言沿用品牌标：深底 #0A0A0F + 青色 #00D4AA 取景框四角 + 圆环 + 圆点。
输出（相对本脚本所在目录的 ../icons/）：
  - icon-192.png          manifest 用
  - icon-512.png          manifest 用
  - apple-touch-icon.png  180x180，iOS 添加到主屏幕用

实现说明：
  - 以 2x 超采样渲染后盒式降采样，保证圆/环边缘平滑；
  - PNG 编码手写：RGBA8、每扫描行 filter 0、zlib 压缩、CRC 校验块。

运行：python tools/gen_icons.py
"""

import os
import struct
import zlib

BG = (0x0A, 0x0A, 0x0F)      # 深底
CYAN = (0x00, 0xD4, 0xAA)    # 品牌青

SUPER = 2  # 超采样倍率


def write_png(path, size, px):
    """px: bytearray，长度 size*size*4（RGBA）。"""
    stride = size * 4
    raw = bytearray()
    for y in range(size):
        raw.append(0)  # filter type 0
        raw += px[y * stride:(y + 1) * stride]

    def chunk(typ, data):
        return (
            struct.pack(">I", len(data))
            + typ
            + data
            + struct.pack(">I", zlib.crc32(typ + data) & 0xFFFFFFFF)
        )

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


def render(big):
    """在 big×big 画布上绘制图标，返回 RGBA bytearray。"""
    px = bytearray(big * big * 4)
    # 铺底
    for i in range(0, len(px), 4):
        px[i] = BG[0]
        px[i + 1] = BG[1]
        px[i + 2] = BG[2]
        px[i + 3] = 255

    def set_px(x, y, c):
        o = (y * big + x) * 4
        px[o] = c[0]
        px[o + 1] = c[1]
        px[o + 2] = c[2]

    def fill_rect(x0, y0, x1, y1, c):
        for y in range(max(0, y0), min(big, y1)):
            for x in range(max(0, x0), min(big, x1)):
                set_px(x, y, c)

    def paint_where(c, pred):
        cx = big / 2.0
        cy = big / 2.0
        for y in range(big):
            dy = y + 0.5 - cy
            for x in range(big):
                dx = x + 0.5 - cx
                if pred(dx, dy):
                    set_px(x, y, c)

    # ---- 取景框四角（横竖两段矩形拼成 L 形） ----
    m = int(big * 0.155)      # 边距
    arm = int(big * 0.175)    # 臂长
    t = int(big * 0.062)      # 线宽
    corners = [
        (m, m, 1, 1),
        (big - m, m, -1, 1),
        (m, big - m, 1, -1),
        (big - m, big - m, -1, -1),
    ]
    for cx0, cy0, sx, sy in corners:
        # 横臂：自角点向水平内侧伸 arm，厚度 t 向垂直内侧
        fill_rect(int(min(cx0, cx0 + sx * arm)), int(min(cy0, cy0 + sy * t)),
                  int(max(cx0, cx0 + sx * arm)), int(max(cy0, cy0 + sy * t)), CYAN)
        # 竖臂：自角点向垂直内侧伸 arm，厚度 t 向水平内侧
        fill_rect(int(min(cx0, cx0 + sx * t)), int(min(cy0, cy0 + sy * arm)),
                  int(max(cx0, cx0 + sx * t)), int(max(cy0, cy0 + sy * arm)), CYAN)

    # ---- 中央圆环 + 圆点 ----
    r_out = big * 0.175
    r_in = big * 0.175 - big * 0.052
    paint_where(CYAN, lambda dx, dy: r_in * r_in <= dx * dx + dy * dy <= r_out * r_out)
    r_dot = big * 0.062
    paint_where(CYAN, lambda dx, dy: dx * dx + dy * dy <= r_dot * r_dot)

    return px


def downsample(px, big, factor):
    size = big // factor
    out = bytearray(size * size * 4)
    for y in range(size):
        for x in range(size):
            r = g = b = 0
            for yy in range(factor):
                for xx in range(factor):
                    o = ((y * factor + yy) * big + (x * factor + xx)) * 4
                    r += px[o]
                    g += px[o + 1]
                    b += px[o + 2]
            n = factor * factor
            o = (y * size + x) * 4
            out[o] = r // n
            out[o + 1] = g // n
            out[o + 2] = b // n
            out[o + 3] = 255
    return out


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    out_dir = os.path.normpath(os.path.join(here, "..", "icons"))
    os.makedirs(out_dir, exist_ok=True)

    targets = [
        ("icon-192.png", 192),
        ("icon-512.png", 512),
        ("apple-touch-icon.png", 180),
    ]
    for name, size in targets:
        big = size * SUPER
        px = downsample(render(big), big, SUPER)
        path = os.path.join(out_dir, name)
        write_png(path, size, px)
        print("generated %s (%dx%d, %d bytes)" % (path, size, size, os.path.getsize(path)))


if __name__ == "__main__":
    main()
