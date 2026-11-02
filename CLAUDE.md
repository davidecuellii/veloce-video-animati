# Istruzioni per Claude in questa repo

Questa repo produce short animati 9:16 per Veloce Digital con Remotion e three.js. Rispondi in italiano.

## Prima di tutto

- Leggi [docs/REGOLE-REGIA.md](docs/REGOLE-REGIA.md): contiene le regole nate dalle revisioni del cliente. Non vanno violate.
- **Proponi sempre la scaletta** (blocchi di secondi + battute) e falla approvare prima di generare voce o render.
- La regia del video attuale è in `src/jewel3.ts`, il player in `src/JewelShort3.tsx`, i servizi in `src/Services.tsx`.

## Regole che contano di più

1. Nessun personaggio guarda in camera. Unica eccezione: chi parla al telefono nel reel, e il finale del ragazzo di Veloce.
2. I passanti camminano di profilo o di tre quarti, con il telefono tenuto in modo naturale (`phoneArms(view)`).
3. Il formato 9:16 è stretto: prima di un'inquadratura con più soggetti verifica che stiano tutti nel campo orizzontale (circa 27° con un campo verticale di 46°).
4. Mai la camera dentro oggetti (pilastri, fondale della vetrina, case): produce frame neri.
5. Logo ufficiale sempre dritto, mai ridisegnato.
6. Voce: mai la sintesi vocale del Mac. Usa `scripts/voce.py` (edge-tts, gratis) oppure ElevenLabs se c'è una chiave API. Pronuncia italiana tramite grafia: "sòscial", "Velòce Dìgital".

## Come verificare il lavoro

- `npx tsc --noEmit -p .` dopo ogni modifica al codice.
- `scripts/stills.sh <secondi…>` per vedere i fotogrammi: **guardali davvero**, uno per uno, prima del render completo.
- `npm run render` alla fine. Il comando segnala da solo i frame neri.
- Non puoi ascoltare l'audio: dichiaralo e fai verificare a un umano.

## Blender

Se è collegato Blender MCP, segui [docs/BLENDER.md](docs/BLENDER.md):

- rispetta le coordinate indicate;
- esporta in `public/models/*.glb`;
- renderizza con `--props='{"blender":"models/scena.glb","hideTown":true}'`.
