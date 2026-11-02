#!/bin/bash
# Music + effects ducked under the voice, normalised to -14 LUFS (Instagram/TikTok level).
#   scripts/mix.sh public/ugo_musica.wav public/ugo_voce.wav public/ugo_mix.wav
set -e
ffmpeg -hide_banner -loglevel error -y -i "$1" -i "$2" -filter_complex \
  "[1:a]aformat=channel_layouts=stereo,asplit=2[v1][v2];[0:a][v1]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=300[m];[m][v2]amix=inputs=2:weights='0.9 1.25':normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9" \
  -ar 48000 "$3"
ffmpeg -hide_banner -i "$3" -af ebur128 -f null - 2>&1 | grep " I:" | tail -1
