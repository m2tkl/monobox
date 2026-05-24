#!/bin/sh

set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)
ICONS_DIR="$ROOT_DIR/src-tauri/icons"
TMP_DIR="/private/tmp/monobox-icon-build"
RENDERER="$ROOT_DIR/scripts/render-rgba-png.swift"
COMPOSER="$ROOT_DIR/scripts/compose-macos-icon.swift"
SWIFT_HOME="/private/tmp/monobox-swift-home"
SWIFT_XDG_CACHE="/private/tmp/monobox-swift-xdg-cache"
SWIFT_CLANG_CACHE="/private/tmp/monobox-swift-clang-cache"

SOURCE_IMAGE="${1:-$ICONS_DIR/source.png}"

if [ ! -f "$SOURCE_IMAGE" ]; then
  echo "Source image not found: $SOURCE_IMAGE" >&2
  exit 1
fi

mkdir -p "$ICONS_DIR" "$TMP_DIR"
mkdir -p "$SWIFT_HOME" "$SWIFT_XDG_CACHE" "$SWIFT_CLANG_CACHE"
find "$TMP_DIR" -mindepth 1 -maxdepth 1 -exec rm -rf {} +

cp "$SOURCE_IMAGE" "$ICONS_DIR/source.png"

resize_png() {
  size="$1"
  output="$2"
  HOME="$SWIFT_HOME" \
  XDG_CACHE_HOME="$SWIFT_XDG_CACHE" \
  CLANG_MODULE_CACHE_PATH="$SWIFT_CLANG_CACHE" \
  swift "$RENDERER" "$ICONS_DIR/icon.png" "$ICONS_DIR/$output" "${size}x${size}"
}

HOME="$SWIFT_HOME" \
XDG_CACHE_HOME="$SWIFT_XDG_CACHE" \
CLANG_MODULE_CACHE_PATH="$SWIFT_CLANG_CACHE" \
swift "$COMPOSER" "$ICONS_DIR/source.png" "$ICONS_DIR/icon.png"

resize_png 32 "32x32.png"
resize_png 128 "128x128.png"
resize_png 256 "128x128@2x.png"
resize_png 30 "Square30x30Logo.png"
resize_png 44 "Square44x44Logo.png"
resize_png 71 "Square71x71Logo.png"
resize_png 89 "Square89x89Logo.png"
resize_png 107 "Square107x107Logo.png"
resize_png 142 "Square142x142Logo.png"
resize_png 150 "Square150x150Logo.png"
resize_png 284 "Square284x284Logo.png"
resize_png 310 "Square310x310Logo.png"
resize_png 50 "StoreLogo.png"

for size in 16 32 48 128 256 512 1024; do
  sips -z "$size" "$size" "$ICONS_DIR/icon.png" -s format tiff --out "$TMP_DIR/${size}.tiff" >/dev/null
done
tiffutil -cat \
  "$TMP_DIR/16.tiff" \
  "$TMP_DIR/32.tiff" \
  "$TMP_DIR/48.tiff" \
  "$TMP_DIR/128.tiff" \
  "$TMP_DIR/256.tiff" \
  "$TMP_DIR/512.tiff" \
  "$TMP_DIR/1024.tiff" \
  -out "$TMP_DIR/icon-multi.tiff" >/dev/null
tiff2icns "$TMP_DIR/icon-multi.tiff" "$ICONS_DIR/icon.icns"

python3 - "$ICONS_DIR" <<'PY'
import os
import struct
import sys

icons_dir = sys.argv[1]
files = [
    "32x32.png",
    "128x128.png",
    "128x128@2x.png",
    "icon.png",
]
paths = [os.path.join(icons_dir, name) for name in files]
out_path = os.path.join(icons_dir, "icon.ico")
entries = []
payloads = []
offset = 6 + 16 * len(paths)

for path in paths:
    with open(path, "rb") as f:
        data = f.read()
    width = int.from_bytes(data[16:20], "big")
    height = int.from_bytes(data[20:24], "big")
    ico_width = 0 if width >= 256 else width
    ico_height = 0 if height >= 256 else height
    entries.append(struct.pack("<BBBBHHII", ico_width, ico_height, 0, 0, 1, 32, len(data), offset))
    payloads.append(data)
    offset += len(data)

with open(out_path, "wb") as f:
    f.write(struct.pack("<HHH", 0, 1, len(paths)))
    for entry in entries:
        f.write(entry)
    for payload in payloads:
        f.write(payload)
PY

echo "Generated Tauri icons in $ICONS_DIR"
