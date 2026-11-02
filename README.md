# Veloce Digital: video animati

Short verticali animati (9:16, 1080×1920) per i social di **Veloce Digital**. Sono fatti con codice: Remotion monta il video, three.js disegna la città e il negozio in 3D, i personaggi sono disegni 2D a inchiostro.

Il primo episodio è **"Ugo"** (46 s): un gioielliere storico che nessuno nota perché non ha tempo per i social, finché non arriva Veloce Digital.

▶️ Il risultato è in [`examples/ugo-veloce-46s.mp4`](examples/ugo-veloce-46s.mp4).

## In 3 comandi

```bash
npm install
```

```bash
npm run audio
```

```bash
npm run render
```

Il video esce in `out/ugo.mp4`. Prerequisiti e installazione sono in [docs/SETUP.md](docs/SETUP.md).

## Da dove partire

| Vuoi… | Leggi |
|---|---|
| installare tutto | [docs/SETUP.md](docs/SETUP.md) |
| capire come si passa da uno script al video | [docs/PIPELINE.md](docs/PIPELINE.md) |
| sapere cosa abbiamo imparato (personaggi, camera, luci, iPhone, servizi, voce) | [docs/REGOLE-REGIA.md](docs/REGOLE-REGIA.md) |
| rifare città e studio in Blender e collegarli | [docs/BLENDER.md](docs/BLENDER.md) |
| fare un nuovo episodio con Claude | [docs/NUOVO-EPISODIO.md](docs/NUOVO-EPISODIO.md) |

Se lavori con **Claude Code**, aprilo in questa cartella: le regole per lui sono in [CLAUDE.md](CLAUDE.md).

## Com'è fatto

```
src/
  Root.tsx          composizioni registrate: "Ugo" (il video) e "Chars2" (foglio personaggi)
  JewelShort3.tsx   il player di "Ugo": scena 3D + grafiche sopra (REC, profilo social, sottotitoli, logo finale)
  jewel3.ts         LA REGIA di "Ugo": personaggi, movimenti, inquadrature, tempi
  Services.tsx      il montaggio rapido dei servizi (0:24–0:30)
  toon2.ts          disegno dei personaggi: viste frontale / 3/4 / profilo / spalle
  toon.ts           oggetti in mano (iPhone, pacco, pinzette, borsa…) e funzioni di disegno
  world.ts          città procedurale, cielo, luci (la città si può sostituire con Blender)
  jewelworld.ts     la gioielleria: facciata, vetrina, banco, vitrine, porta
  post.ts           sfocatura, bagliore, correzione colore
  kit.ts            materiali toon e contorni a inchiostro
  (altri file)      passaggi precedenti tenuti come riferimento
audio/ugo_musica_effetti.py   musica ed effetti sintetizzati, tempi sincronizzati alle scene
storie/ugo/                   copione e battute della voce (con tempi)
scripts/                      voce, mix, render, fotogrammi di prova
```

## Licenza

Codice e materiali sono di Veloce Digital. Il logo è un marchio registrato: non riutilizzarlo per altri progetti.
