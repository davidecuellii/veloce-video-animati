#!/bin/bash
# Final render (1080x1920, h264). Extra Remotion props can be passed as $1, e.g. '{"blender":"models/scena.glb","hideTown":true}'
set -e
cd "$(dirname "$0")/.."
export TEMP="${REMOTION_TMP:-$HOME/remotion-tmp}" TMP="${REMOTION_TMP:-$HOME/remotion-tmp}"
mkdir -p "$TEMP" out
npx remotion render src/index.ts Ugo out/ugo.mp4 --gl=angle --codec=h264 --crf=16 --audio-bitrate=192k ${1:+--props="$1"}
ffmpeg -hide_banner -i out/ugo.mp4 -vf "blackdetect=d=0.05:pix_th=0.05" -an -f null - 2>&1 | grep black_start || echo "nessun frame nero"
