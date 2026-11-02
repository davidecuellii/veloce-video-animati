# Installazione

Tutto gratuito. Testato su macOS (Apple Silicon).

## Cosa serve

| Strumento | Perché | Come |
|---|---|---|
| Node.js 20+ | Remotion (il motore del video) | `brew install node` |
| ffmpeg | voce, mix, controlli | `brew install ffmpeg` |
| Python 3 + numpy + edge-tts | musica, effetti, voce gratuita | `pip3 install numpy edge-tts pillow` |
| Claude Code (consigliato) | per modificare regia e scene a parole | [claude.com/claude-code](https://claude.com/claude-code) |
| Blender 4.x (facoltativo) | per rifare città e studio | vedi [BLENDER.md](BLENDER.md) |

## Primo avvio

```bash
npm install
```

```bash
npm run audio
```

```bash
npm run render
```

- `npm run audio` genera musica ed effetti (`public/ugo_musica.wav`), poi la voce (`public/ugo_voce.wav`), poi il mix finale a -14 LUFS (`public/ugo_mix.wav`).
- `npm run render` crea `out/ugo.mp4` in circa 2–3 minuti e controlla che non ci siano frame neri.
- `npm run studio` apre l'anteprima interattiva di Remotion nel browser.

## Cose da sapere

- **`--gl=angle` è obbligatorio** su Mac: senza, il 3D non viene renderizzato. Gli script lo mettono già.
- **Spazio su disco:** ogni render copia file temporanei in `~/remotion-tmp`. Svuotala ogni tanto, oppure impostala su un disco esterno con `export REMOTION_TMP=/Volumes/…/remotion-tmp`.
- **Font:** la scritta finale usa *Creato Display ExtraBold*. Non è nella repo perché non abbiamo verificato la licenza. Se ce l'hai, mettila in `public/CreatoDisplay-ExtraBold.otf`. Se no, viene usato un font di sistema.
- **Voce:** usa le voci neurali Microsoft tramite `edge-tts`. È gratis e non serve un account. Le condizioni d'uso commerciale vanno verificate da voi. Per una qualità superiore c'è ElevenLabs a pagamento (piano Starter, licenza commerciale): vedi [PIPELINE.md](PIPELINE.md#voce).
