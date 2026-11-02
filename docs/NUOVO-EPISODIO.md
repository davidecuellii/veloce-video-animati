# Fare un nuovo episodio con Claude

Ogni episodio racconta un'attività diversa (ristorante, palestra, concessionaria…) con la stessa struttura di "Ugo":

1. gancio;
2. il titolare sommerso dal lavoro;
3. social fermi;
4. arriva Veloce;
5. giornata di registrazione;
6. servizi;
7. strada;
8. nuovi clienti;
9. logo.

## I passi

1. **Copia la regia:**

   ```bash
   cp src/jewel3.ts src/episodio2.ts
   ```

   Registra la nuova composizione in `src/Root.tsx`, copiando `JewelShort3.tsx` in un nuovo player.
2. **Scrivi la scaletta per blocchi di secondi** e falla approvare prima di generare qualsiasi cosa. Esempi in [PIPELINE.md](PIPELINE.md).
3. **Scrivi le battute** in `storie/episodio2/voce.tsv` e genera la voce. Guarda dove finisce ogni battuta e aggiusta i tempi.
4. **Adatta la regia:** nuovo set (in Blender o in un nuovo `*world.ts`), nuovi personaggi in `toon2.ts`, inquadrature in `SH`.
5. **Controlla i fotogrammi** con `scripts/stills.sh`. Correggi le inquadrature, poi fai il render completo.
6. **Audio:** copia `audio/ugo_musica_effetti.py` e aggiorna i tempi degli effetti, poi lancia `npm run audio`.

## Prompt pronti per Claude

**Partire da un'idea:**
> Leggi CLAUDE.md e docs/REGOLE-REGIA.md. Voglio un episodio di circa 45 s su [attività]: [2–3 righe sulla storia]. Proponimi una scaletta per blocchi di secondi nello stesso formato di docs/PIPELINE.md, con le battute della voce. Non generare niente finché non la approvo.

**Dopo l'approvazione:**
> Scaletta approvata. Crea src/episodio2.ts partendo da jewel3.ts, storie/episodio2/voce.tsv e la composizione "Episodio2". Genera la voce, adatta la regia, fai i fotogrammi di controllo di ogni inquadratura e correggi quelle sbagliate prima del render completo.

**Correzioni puntuali:**
> Dal secondo 12 al 15 il personaggio è fuori inquadratura e il braccio col telefono è storto: sistemalo seguendo le regole sull'iPhone in REGOLE-REGIA.md e mostrami i fotogrammi.

## Idee di serie (dalla strategia)

- **Il personaggio di Veloce come mentore:** ogni episodio chiude con una pillola di 5 secondi ("La regola: se nei primi 2 secondi non succede niente, sei già scrollato").
- **Storie vere in versione animata:** il giorno dopo esce il contenuto reale dello stesso cliente.
- **Sottotitoli parola per parola su tutti i video:** molti guardano senza audio.
