# Regole di regia (tutto quello che abbiamo imparato su "Ugo")

Ogni regola qui sotto nasce da un errore vero, corretto durante la lavorazione. Valgono per ogni nuovo episodio.

## Personaggi

- **Nessuno guarda in camera.** Le sole eccezioni:
  - Ugo quando parla al telefono nel suo reel (lì la camera *è* il telefono);
  - il ragazzo di Veloce nel finale, quando guarda in camera, sospira e sorride.
- **I passanti camminano di profilo o di tre quarti** e guardano la strada o il telefono. Il telefono si tiene davanti al viso, con l'avambraccio piegato verso l'alto e la testa china: la posa pronta è `phoneArms(view)` in `toon2.ts`. Niente gomiti storti né telefono rivolto alla camera.
- **Chi lavora guarda il lavoro** (`lookY` positivo = occhi verso il basso).
- **Viste:** `toon2.ts` disegna frontale, tre quarti, profilo e spalle. La classe `Person` (in `jewel2.ts`) sceglie la vista da sola, confrontando la direzione del personaggio (`h`) con la posizione della camera. Quindi basta dire dove va il personaggio: la vista giusta arriva da sé.
- **Capelli lunghi:** vanno disegnati dietro la testa e sopra la mascella, altrimenti sembrano una barba.
- **Il ragazzo di Veloce:**
  - è un ragazzo normale stilizzato: capelli e sopracciglia neri, occhiali neri spessi e squadrati;
  - ha un fisico da eroe a V (spalle larghe, vita stretta) e una tuta tutta nera con cuciture, cintura con fibbia gialla e stivali;
  - porta il **logo ufficiale davanti e dietro, sempre dritto**: la tela si specchia quando il personaggio guarda a sinistra, e il codice la raddrizza;
  - niente maschera, niente scia gialla, niente mantello.
- **Ugo** è il gioielliere: grembiule di cuoio, baffi, lente da orafo quando lavora.

## L'iPhone e il videomaker

Il ragazzo di Veloce deve sembrare un videomaker vero.

- **Gimbal, camminata ninja:** ginocchia piegate (`crouch: 50`), passo corto e fluido (`amp: 0.5`), avambracci orizzontali e telefono davanti al petto. In `pose`: `armL: [38, 54], armR: [30, 58], holdL: 'iphone'`.
- **Mentre riprende:** braccia avanti all'altezza del petto, mai sopra la testa né incrociate sul corpo.
- **Prima delle riprese** monta e accende due luci da studio (softbox).
- **Dopo** monta il video al portatile, con timeline, tracce colorate e testina che scorre.

Gli angoli delle braccia sono in gradi: il primo dice quanto il braccio va avanti rispetto alla verticale, il secondo quanto si piega il gomito.

## Camera e inquadratura (formato 9:16)

- **Il video verticale è stretto.** Con un campo verticale di 46° quello orizzontale è solo ~27°. Due persone a 1,5 m l'una dall'altra stanno insieme nell'inquadratura solo se la camera è a circa 6 m. Molti errori ("personaggio fuori campo") venivano da qui. Prima di un'inquadratura con due soggetti, punta la camera *a metà* tra loro.
- **Una cosa nuova ogni ~1 secondo:** uno stacco oppure un movimento deciso. Ogni inquadratura si muove sempre un po' (spinta o carrellata).
- **Alterna sempre macro e campi larghi**, e usa i primi piani di oggetti per raccontare (fogli sulla scrivania, collana, profilo social).
- **Profondità:** oggetti in primo piano (bici, siepi, passanti vicini alla camera), marciapiede di fronte con altre persone, sfocatura (`ap`) nei primi piani.
- **Trappole che fanno frame neri:**
  - la camera dentro il pilastro tra vetrina e porta (x 1,2–1,5);
  - la camera dentro il fondale di velluto della vetrina: per le riprese interne serve z < -1,1 se x < 1,1;
  - la camera dentro le case di fronte (z > 13,8).
- **Niente contorni a inchiostro sugli oggetti trasparenti**, per esempio il vetro della porta: il contorno si vede attraverso il vetro come una lastra nera.

## Luci e colore (tramonto caldo fuori, interno dorato)

| Cosa | Valore |
|---|---|
| Sole | colore `#ffd2a0`, intensità 3,4, posizione (-24, 14, 20) |
| Luce ambiente | cielo `#c2ceff`, terra `#b98f6a`, intensità 1,6 |
| Cielo | alto `#4f8ade`, orizzonte `#ffd9ae`; nebbia `#f4cfa8` |
| Vetrina | luce 1,6 + faretti emissivi 0,9 (di più brucia i gioielli) |
| Sala | lampadario 3,5 · banco 1,1 · luci da studio 2,2 quando accese |
| Post | sfocatura (`ap` da 0,004 nei campi medi a 0,016 nelle macro) → bagliore (soglia 0,92) → tone mapping Neutral, esposizione 0,92 → saturazione 1,14, contrasto 1,07, vignetta 0,32 |

I personaggi ricevono la luce della scena con un gradiente: caldo dal lato illuminato, viola freddo in ombra, più scuro verso i piedi.

## La gioielleria (coordinate, 1 unità = 1 metro)

- Facciata sul piano **z = 0**, larghezza da x = -3,7 a x = 3,7. Strada lungo l'asse x.
- Vetrina da x -2,6 a 1,1; porta in vetro da x 1,55 a 2,65 (si apre verso l'interno).
- Marciapiede da z 0 a 3,6; strada fino a 11,2; marciapiede di fronte fino a 13,8.
- Interno da z 0 a -6,7:
  - banco di Ugo a (-1,6; -3,2);
  - vitrine a x 2,3;
  - pacchi in fondo a destra.

## Montaggio dei servizi

È un telefono a tutto schermo per ogni servizio, con stacco a frusta, banda gialla ed etichetta gialla:

| Ordine | Servizio | Durata |
|---|---|---|
| 1 | Reel che vendono | 2,6 s |
| 2 | Foto prodotto | ~0,7 s |
| 3 | Caroselli | ~0,7 s |
| 4 | Campagne sponsorizzate | ~0,7 s |
| 5 | Shop online | ~0,7 s |
| 6 | Risultati | ~0,7 s |

Il reel che vende ha bisogno di più tempo degli altri: si vede Ugo che balla un trend e poi compare l'adesivo del prodotto. Il messaggio è "video che intrattengono e intanto vendono".

## Audio

- Musica malinconica (pizzicati e celesta) finché il negozio è solo; ritmata (cassa, rullante, stacchi) dall'arrivo di Veloce.
- Un effetto per ogni azione visibile: penna, pacco, campanello, click delle luci, REC, tastiera, frustate.
- La musica si abbassa sotto la voce; il volume finale è -14 LUFS.

## Cosa NON fare (bocciato in revisione)

- Gag forzate: il gatto che sbadiglia, il passante che si sistema i capelli nel riflesso della vetrina.
- Persone che attraversano i muri. I clienti entrano **dalla porta aperta**.
- La voce di sistema del Mac.
- Un gancio lento: si apre sulla scena più forte, cioè la gente che passa davanti alla vetrina senza guardarla.
