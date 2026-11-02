"""Generate the voice-over line by line with free Microsoft neural voices (edge-tts) and place each line at its start time.

    pip install edge-tts numpy
    python3 scripts/voce.py storie/ugo/voce.tsv public/ugo_voce.wav 46

Each line is generated separately, trimmed of silence and placed at `inizio`, so the picture timing never moves.
Prints the end time of every line: if a line ends after the next one starts, shorten the text or raise the speed.
"""
import subprocess, sys, wave, tempfile, os
import numpy as np

tsv, out, dur = sys.argv[1], sys.argv[2], float(sys.argv[3])
SR = 48000
track = np.zeros(int(dur * SR), np.float32)
tmp = tempfile.mkdtemp()
rows = [l.rstrip('\n').split('\t') for l in open(tsv, encoding='utf-8') if l.strip() and not l.startswith('#')]
for n, start, voice, rate, pitch, text in rows:
    mp3, wav = os.path.join(tmp, f'{n}.mp3'), os.path.join(tmp, f'{n}.wav')
    subprocess.run([sys.executable, '-m', 'edge_tts', '--voice', voice, f'--rate={rate}', f'--pitch={pitch}', '--volume=+10%', '--text', text, '--write-media', mp3], check=True, capture_output=True)
    trim = 'silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse'
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', mp3, '-af', trim, '-ar', str(SR), '-ac', '1', wav], check=True)
    w = wave.open(wav)
    a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    w.close()
    i = int(float(start) * SR)
    e = min(len(track), i + len(a))
    track[i:e] += a[: e - i]
    print(f'{n:>3}  {float(start):6.2f} -> {float(start) + len(a) / SR:6.2f}  {text[:50]}')
track = track / max(1e-6, np.abs(track).max()) * 0.9
w = wave.open(out, 'wb')
w.setnchannels(1)
w.setsampwidth(2)
w.setframerate(SR)
w.writeframes((track * 32767).astype(np.int16).tobytes())
w.close()
print('voce ->', out)
