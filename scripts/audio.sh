#!/bin/bash
# Full audio pass for "Ugo": music+effects, voice, mix.
set -e
cd "$(dirname "$0")/.."
(cd audio && python3 ugo_musica_effetti.py)
python3 scripts/voce.py storie/ugo/voce.tsv public/ugo_voce.wav 46
scripts/mix.sh public/ugo_musica.wav public/ugo_voce.wav public/ugo_mix.wav
