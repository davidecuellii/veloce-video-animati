# Migliorare con Blender (Blender MCP + Claude)

L'obiettivo è fare città e studio in Blender, con più dettaglio e più realismo (per esempio una città precisa o un negozio vero), e poi caricarli nel video. Regia, personaggi, voce e grafiche restano quelli di questa repo.

## 1. Collegare Claude a Blender

Si usa [Blender MCP](https://github.com/ahujasid/blender-mcp), che permette a Claude di comandare Blender a parole ("costruisci una via di Milano con portici…"). I passi qui sotto sono quelli noti al momento della scrittura: controlla sempre il README ufficiale del progetto, perché il setup può cambiare.

1. Installa `uv` (serve per avviare il server):

   ```bash
   brew install uv
   ```

2. In Blender: **Edit → Preferences → Add-ons → Install** e scegli il file `addon.py` della repo blender-mcp. Attivalo.
3. In Blender, nella barra laterale (tasto **N**), apri la scheda **BlenderMCP** e premi **Connect to Claude**.
4. Aggiungi il server a Claude Code:

   ```bash
   claude mcp add blender -- uvx blender-mcp
   ```

5. Riavvia Claude Code in questa cartella e verifica che veda gli strumenti di Blender.

## 2. Le coordinate (importante)

Il video lavora in **metri**, con l'asse **y verso l'alto**. Blender lavora con **z verso l'alto**, e l'esportatore glTF converte da solo (opzione *+Y Up*, attiva di default). Quindi:

| Nel video (three.js) | In Blender |
|---|---|
| x (lungo la strada) | X |
| y (in alto) | Z |
| z (verso la strada / la camera) | **-Y** |

Le misure da rispettare, in coordinate Blender:

- **Facciata della gioielleria** sul piano Y = 0, da X -3,7 a X 3,7. La strada sta verso **-Y**.
- **Marciapiede** da Y 0 a Y -3,6 (alto 0,18 m); **strada** fino a Y -11,2; **marciapiede di fronte** fino a Y -13,8.
- **Interno** del negozio da Y 0 a Y +6,7, pavimento a Z 0,12.
- Se vuoi rifare **anche l'interno**, rispetta queste posizioni (anche qui in coordinate Blender), perché i personaggi e le camere le usano:
  - banco di Ugo centrato a X -1,6, Y 3,2, piano a Z 1,16;
  - porta da X 1,55 a 2,65;
  - vitrine a X 2,3.

## 3. Esportare e collegare

1. In Blender: **File → Export → glTF 2.0**, formato **glb**, con *Apply Modifiers* e i materiali. Salva in `public/models/scena.glb`.
2. Renderizza con la scena Blender **al posto** della città procedurale:

   ```bash
   scripts/render.sh '{"blender":"models/scena.glb","hideTown":true}'
   ```

   Oppure guarda singoli fotogrammi:

   ```bash
   npx remotion still src/index.ts Ugo stills/prova.png --gl=angle --scale=0.4 --props='{"t":2,"blender":"models/scena.glb","hideTown":true}'
   ```

Cosa fa: `hideTown` nasconde case, alberi, auto e colline procedurali (il gruppo `townGroup` in `world.ts`). Restano strada, marciapiedi, cielo, gioielleria, personaggi e regia. Il caricamento è in `src/JewelShort3.tsx`.

Per provare il collegamento prima di avere una scena vera, c'è già un cubo rosso di prova:

```bash
npx remotion still src/index.ts Ugo stills/prova.png --gl=angle --scale=0.4 --props='{"t":0.5,"blender":"models/test-cubo.glb","hideTown":true,"cam":[-3,4,13,-5,2,0,60]}'
```

## 4. Consigli per lo stile

- **Il look è cartoon con contorno a inchiostro.** Nel GLB usa materiali semplici a tinta piena (*Principled BSDF* con poca rugosità), niente texture fotografiche: verrebbero fuori da un altro film.
- **I contorni neri** vengono aggiunti in automatico a ogni oggetto non trasparente del GLB, con lo stesso spessore della scena procedurale. Per toglierli aggiungi `"ink":false` alle props. Non mettere il contorno sugli oggetti trasparenti (vetri), perché si vedrebbe attraverso come una lastra nera.
- **Tieni il file leggero:** sotto i 50 MB e sotto ~300.000 triangoli. Il render gira nel browser.
- **Le luci di Blender non vengono usate:** comandano le luci del codice (vedi [REGOLE-REGIA.md](REGOLE-REGIA.md#luci-e-colore-tramonto-caldo-fuori-interno-dorato)).

## 5. Esempi di richieste a Claude (con Blender collegato)

- «Costruisci in Blender una via del centro di Brescia: portici, palazzi color ocra, ciottolato, lampioni in ghisa. Rispetta le coordinate di docs/BLENDER.md, lascia libero lo spazio della gioielleria (X -3,7…3,7, Y 0…6,7) ed esporta in public/models/scena.glb.»
- «Fai uno studio fotografico per l'episodio 2 al posto della gioielleria, con le stesse misure.»
- «Renderizza i fotogrammi 1, 5, 12 e 27 con la scena Blender e dimmi cosa non torna.»
