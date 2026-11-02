# Dallo script al video

L'ordine è sempre questo:

1. Storia
2. Scaletta approvata
3. Voce
4. Regia
5. Grafiche
6. Audio
7. Render
8. Controllo

Ogni passaggio ha un file preciso.

## 1. Storia e scaletta

Si parte dal business del cliente tipo, non dal reel: chi è, come guadagna, dove perde clienti. Poi si scrive una scaletta per blocchi di secondi. È quella che si fa approvare ai soci prima di toccare il codice.

Ecco la scaletta di "Ugo" (46 s):

| s | Blocco | Cosa si vede |
|---|---|---|
| 0–4,4 | Gancio | Vetrina curata, gente che passa di profilo col telefono, nessuno si gira |
| 4,4–7 | Sommerso | Scrivania piena di fogli, Ugo che scrive |
| 7–11 | Quotidianità | Porta i pacchi, allestisce la vetrina, posa una collana |
| 11–13,2 | Social fermi | Profilo con "Ultimo post: 2 anni fa" |
| 13,2–16 | Arriva Veloce | Entra dalla porta, saluta Ugo |
| 16–24 | Giornata di registrazione | Luci, gimbal, Ugo parla nel reel (sottotitoli), macro, montaggio al portatile |
| 24–30 | Servizi | Montaggio rapido: reel che vendono, foto, caroselli, sponsorizzate, shop, risultati |
| 30–35 | Strada | Un passante scorre il telefono, si ferma, guarda la vetrina; altri si fermano |
| 35–39 | Nuovi clienti | Entrano dalla porta, Ugo parla con tutti |
| 39–42 | Uscita | Il ragazzo di Veloce esce, guarda in camera, sospira, sorride, va |
| 42–46 | Logo | VELOCE DIGITAL |

## 2. Voce

Il file è [`storie/ugo/voce.tsv`](../storie/ugo/voce.tsv): una battuta per riga, con queste colonne:

- inizio in secondi;
- voce;
- velocità;
- tono;
- testo.

```bash
python3 scripts/voce.py storie/ugo/voce.tsv public/ugo_voce.wav 46
```

Lo script genera ogni battuta separatamente, la ripulisce dal silenzio e la mette al secondo indicato. Stampa anche dove finisce ogni battuta: se finisce dopo l'inizio della successiva, accorcia il testo o alza la velocità.

Quello che abbiamo imparato sulle voci:

- **Narratore:** `it-IT-DiegoNeural` a +22% di velocità e +6Hz di tono. Il tono gasato si ottiene anche con frasi brevi ed esclamazioni.
- **Ugo**, che parla nel suo reel, ha una voce diversa: `it-IT-GiuseppeMultilingualNeural` a +4% e -14Hz, più lenta e profonda.
- **Pronuncia all'italiana:** si risolve con la grafia, non con le impostazioni.
  - "social" con la O aperta si scrive **"sòscial"**;
  - **"Velòce Dìgital"** evita l'accento inglese.
- **Mai la voce di sistema del Mac:** è robotica.

Per passare a **ElevenLabs** basta generare le battute con la sua API invece che con `edge-tts`, tenendo lo stesso file `voce.tsv`: cambia solo la funzione in `scripts/voce.py`. Il piano gratuito non permette l'uso commerciale; lo Starter sì.

## 3. Regia (dove sta tutto)

Tutta la regia di "Ugo" è in [`src/jewel3.ts`](../src/jewel3.ts):

- **Personaggi** (`new Person(...)`): ognuno ha due funzioni.
  - `pos(t)` dice dove si trova e verso dove è girato (`h`, la direzione in radianti, 0 = verso la strada).
  - `pose(t, view)` dice cosa sta facendo: braccia, oggetto in mano, espressione, dove guarda.

  La vista (frontale, tre quarti, profilo, spalle) **viene scelta da sola** in base alla direzione del personaggio e alla posizione della camera.
- **Inquadrature** (`SH`): ogni riga è uno stacco, con:
  - `p0`/`p1`: posizione della camera all'inizio e alla fine (si muove sempre un po');
  - `l0`/`l1`: dove guarda;
  - `fov`: zoom;
  - `ap`: quanto sfoca lo sfondo;
  - `foc`: punto a fuoco;
  - `fx`: per seguire un personaggio che cammina.
- **Oggetti** (luci da studio, portatile con la timeline, fogli, pacchi, collana): sono costruiti nella stessa funzione e animati in `update(t)`.

**Tempo del video e tempo della storia.** Il montaggio dei servizi (24–30 s) è inserito sopra la scena 3D. Per questo [`JewelShort3.tsx`](../src/JewelShort3.tsx) converte il tempo del video in tempo della storia: dopo il montaggio la storia riparte da 25 s, quindi c'è uno scarto di 5 secondi. Se sposti il montaggio, aggiorna `SERVICES_START`/`SERVICES_END` in `Services.tsx` e gli orari in `voce.tsv` e nell'audio.

## 4. Grafiche sopra la scena

Sono in `JewelShort3.tsx` e `Services.tsx`:

- la schermata REC dell'iPhone;
- il profilo social fermo;
- i sottotitoli del reel di Ugo (`CUES.subs` in `jewel3.ts`);
- il montaggio dei servizi;
- la banda gialla e il logo finale.

Sono semplici componenti React: testi e colori si cambiano direttamente.

## 5. Audio

```bash
npm run audio
```

1. [`audio/ugo_musica_effetti.py`](../audio/ugo_musica_effetti.py) sintetizza musica ed effetti:
   - musica malinconica fino all'arrivo di Veloce, poi ritmata;
   - campanello della porta, penna, pacco, click delle luci, REC, tastiera, frustate del montaggio, accordo finale.

   I tempi sono in secondi del video, in fondo al file.
2. `scripts/voce.py` genera la voce.
3. `scripts/mix.sh` abbassa la musica quando c'è la voce e porta tutto a -14 LUFS.

## 6. Render e controllo

```bash
npm run render
```

```bash
scripts/stills.sh 0.5 4.9 19.5 27.0
```

- `npm run render` crea `out/ugo.mp4` e cerca da solo eventuali frame neri.
- `scripts/stills.sh` produce fotogrammi singoli e un foglio riassuntivo in `stills/sheet.jpg`: è il modo veloce per controllare un'inquadratura senza fare il render intero.

Un frame nero quasi sempre significa che la camera è finita dentro un oggetto, per esempio un pilastro, il fondale della vetrina o una casa.
