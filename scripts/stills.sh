#!/bin/bash
# Quick look at single moments: scripts/stills.sh 0.5 4.9 19.5  -> stills/s_<t>.png + stills/sheet.jpg
# COMP=Chars2 for the character sheet, SCALE=0.4 by default.
cd "$(dirname "$0")/.."
export TEMP="${REMOTION_TMP:-$HOME/remotion-tmp}" TMP="${REMOTION_TMP:-$HOME/remotion-tmp}"
mkdir -p stills "$TEMP"
npx remotion bundle src/index.ts --out-dir=bundle_tmp >/dev/null 2>&1
for t in "$@"; do
  npx remotion still bundle_tmp ${COMP:-Ugo} stills/s_$t.png --gl=angle --scale=${SCALE:-0.4} --props="{\"t\":$t}" >/dev/null 2>&1 &
  while [ $(jobs -r | wc -l) -ge 3 ]; do sleep 0.5; done
done
wait
python3 - "$@" <<'PY'
import sys
from PIL import Image
ts = sys.argv[1:]
ims = [Image.open(f'stills/s_{t}.png').convert('RGB') for t in ts]
w, h = ims[0].size
cols = min(6, len(ims)); rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * h), 'white')
for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * w, (i // cols) * h))
sheet.save('stills/sheet.jpg', quality=85)
print('stills/sheet.jpg')
PY
