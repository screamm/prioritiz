# Prioritiz — Data Integrity Audit

**Datum:** 2026-08-19
**Metod:** 5 oberoende agenter undersökte separata delar av sync/restore/backup-systemet genom att läsa faktisk källkod (inte anta), och rapporterade 20 fynd. Varje fynd med severity high/critical granskades därefter av 2 oberoende "adversariala" agenter vars enda uppgift var att försöka motbevisa fyndet genom att leta efter guards/confirmations/fixar i koden. Alla 10 high/critical-fynd nedan överlevde båda motbevisningsförsöken (2/2 "confirmed").
**Scope:** Risk för att en användares todo-lista nollställs eller raderas — oavsiktligt, utan varning, permanent.

---

## Sammanfattning

Den lokala listan i webbläsaren (localStorage) är **inte** i farozonen från något av dessa fynd under normal användning — den skrivs synkront och påverkas inte av sync-buggarna. Det som **är** verkligt sårbart är:

1. **"Återställ från kod"-flödet** (Settings, välkomstmodal, och `/restore/:token`-länkar) — det finns **noll bekräftelse** innan en enhets hela lokala lista skrivs över, trots att appen redan har och använder en bekräftelse-dialog för betydligt mindre destruktiva saker (radera en enskild todo, regenerera token).
2. **Cross-tab-synken** kan under helt vanlig användning (två flikar, en flik som legat öppen ett tag) få backend att permanent radera hela D1-backupen för ett token — inte en race-condition i millisekundklassen, utan ett strukturellt fel som utlöses av ordinär webbläsaranvändning.
3. **90-dagarsutgången** för D1-backupen kommuniceras aldrig proaktivt till användaren, och "bara läsa listan" förnyar inte klockan — bara faktiska ändringar gör det.

Inget av detta har hittills orsakat dataförlust hos er (det är kodgranskning, inte en incidentrapport) — men mekanismerna är verifierat verkliga och rimligt lätta att råka ut för.

---

## 🔴 Kritiska fynd (3)

### 1. Restore-flödet har ingen bekräftelse alls före full överskrivning
**Var:** `RestoreModal.tsx`, `RestoreToken.tsx` (Settings), `/restore/:token`-routen i `App.tsx`
Alla tre anropar `syncService.restore(token)` → `importTodos()`/`importPriorities()`, som gör en **full ersättning** (`set({ todos: ... })`), inte en merge — och det sker utan bekräftelsedialog, utan koll om enheten redan har data, och utan backup. Appen har och använder redan `ConfirmModal`/`window.confirm()` för betydligt mindre destruktiva saker: radera en todo, radera en prioritet, till och med för att regenerera ett token (som inte rör todo-data alls).

`/restore/:token`-länken är värst: den kör restore automatiskt i en `useEffect` så fort sidan laddas — inget klick krävs. En gammal bokmärkt länk, delad demo-länk eller QR-kod räcker för att tysta skriva över en enhets hela lista.

**Rekommendation:** Lägg till samma `ConfirmModal` som redan finns i appen ("Du har N todos lokalt — återställning ersätter dem") innan `restore()` anropas, i alla tre flödena. Kör inte auto-restore på `/restore/:token` om lokal data redan finns.

### 2. Ett giltigt men tomt token skriver tyst över listan — och rapporterar "lyckades"
**Var:** `workers/api/src/routes/restore.ts` + `src/services/sync.ts`
Backend returnerar `200 success` för vilket token som helst som finns i databasen och inte gått ut — oavsett om det tokenet faktiskt har några todos. Ett oanvänt eller redan tomt token ger `{todos: [], priorities: []}` med `success: true`. Frontend tolkar detta som en lyckad restore, skriver över den lokala listan med tomma listor, och visar **"Din lista har återställts!"** — en falsk bekräftelse som aktivt döljer att data just raderades.

**Rekommendation:** Skilj på "token finns men saknar data" och "token finns med data" i backend-svaret; vägra skriva över icke-tom lokal data med ett tomt restore-svar utan extra bekräftelse.

### 3. Cross-tab lastSyncAt-desync kan radera hela D1-backupen — via helt vanlig flikanvändning
**Var:** `settingsStore.ts` (storage-event-listenern), `workers/api/src/routes/sync.ts`
Backend-regeln för radering är: *"finns posten på servern men saknas i det som klienten skickar, och `lastSyncAt` inte är satt → radera direkt"* (`if (lastSyncAt && serverRow.updated_at > lastSyncAt)` — en falsy `lastSyncAt` kringgår skyddet helt).

Problemet: när flik B adopterar samma token som flik A (via `storage`-eventet) kopieras `lastSyncAt` **bara vid det första tillfället** — aldrig igen efteråt. Om flik B öppnade token *innan* flik A:s första riktiga sync hann klart, fastnar flik B för alltid med `lastSyncAt: null`, även om flik A senare synkar massor av riktig data. Så fort användaren gör *något* i flik B (helt vanligt — t.ex. en gammal flik som legat öppen) skickas flik B:s (ofullständiga) lista med `lastSyncAt: null`, och backend raderar **allt** flik A synkat som inte finns med i flik B:s lista.

Detta kräver ingen millisekund-precision — bara "två flikar, en av dem rörd senare", vilket är extremt vanligt webbläsarbeteende.

**Rekommendation:** Gör om raderingslogiken så att en `null`/saknad `lastSyncAt` **aldrig** ger tillstånd att radera utan vidare (kräv explicit "detta är en avsiktlig radering"-signal, t.ex. tombstones för borttagna id:n, istället för att sluta sig till radering från frånvaro). Komplettera gärna med att flik-synken alltid tar det senaste `lastSyncAt`-värdet, inte bara vid första adoptionen.

---

## 🟠 Höga fynd (7, alla verifierade 2/2)

| # | Fynd | Kort |
|---|---|---|
| 4 | `isNewUser`-spärren skyddar bara välkomstmodalen | Settings→"Återställ från kod" och `/restore/:token` är helt oskyddade oavsett hur mycket data användaren redan har — förstärker fynd 1–2. |
| 5 | localStorage-skrivfel hanteras aldrig | Zustands `persist` har inget try/catch runt `localStorage.setItem`. Appens egen kvot-återhämtningskod (`localStorage.ts`) är död kod — aldrig kopplad till de faktiska stores. Ett misslyckat skriv → nästa sync tolkar det som "användaren tog bort det" → raderas på servern. |
| 6 | Utgångsvarning visas aldrig proaktivt | Statusen (`getTokenStatus`/`getDaysRemaining`) renderas bara inuti Settings-modalen, som bara öppnas via ett explicit klick på kugghjulet. Ingen banner, ingen toast, inget mejl. Cron-jobbet som raderar efter 90 dagar loggar bara till konsolen — ingen varning till användaren någonstans. |
| 7 | Bara redigeringar förnyar 90-dagarsklockan — inte att öppna appen | `lastSyncAt` uppdateras enbart av en faktisk sync, som bara triggas av ändringar i todo/priority-stores. En användare som regelbundet öppnar appen och bara *tittar* på listan räknas som inaktiv och riskerar radering, trots att de anser sig vara aktiva. |
| 8 | Raderade todos kan tyst återuppstå | Servern sluter sig till radering enbart genom "finns på server men inte i denna request" — inget tombstone/versionsspår. En andra enhet/flik som inte hunnit hämta en radering kommer att återinsätta den borttagna posten nästa gång den synkar *något*. Realistiskt vid vanlig flertelefon/dator-användning (appen är byggd för det, via QR/token-delning). |
| 9 | Ingen låsning mellan samtidiga sync-requests | Två flikar/enheter som redigerar nära i tid (inom 5–10 sek) kan råka ut för att den ena sparar tyst blir överskriven eller no-opad av den andra — inget fel visas för användaren. |
| 10 | Ingen varning innan lokal data kan försvinna helt | Inkognitofönster (garanterad förlust vid stängning), "rensa webbplatsdata", Safaris ITP (7 dagars gräns), mobilens lagringsutrymning — inget av detta har någon `navigator.storage.persist()`, ingen varning, ingen detektering. Om första synken aldrig hann köras (flik stängd inom 5 sek) finns **ingen** serverkopia att falla tillbaka på. |

---

## 🟡 Övriga fynd (medel/låg, ej adversarialt verifierade men rimliga)

- Servern rapporterar konflikter (`hasConflicts`/`conflicts`) men klienten läser aldrig fältet — förlorade ändringar syns aldrig för användaren.
- Restore-felmeddelanden är generiska ("kontrollera koden") oavsett om orsaken är utgånget token, borttaget token, eller en enkel felskrivning — användaren kan inte skilja "permanent borta" från "prova igen".
- Ingen information om 90-dagarsgränsen visas när token *skapas* — bara djupt inne i Settings.
- `regenerateToken()` kan visa "giltig i 90 dagar" trots att ingen backup faktiskt finns än (kräver en efterföljande sync).
- `updated_at` sätts klient-sidan för todos men server-sidan för prioriteter — asymmetrisk och klockskev-känslig konfliktlösning.
- Ingen leveranskanal för återställningskoden (mejl togs bort av säkerhetsskäl) — en lyckad backup kan bli orörbar om koden inte sparades manuellt.
- Header-ikonen ("Synkad"/"Ej synkad") är en statisk 60-sekundersjämförelse, inte verklig status.

## ✅ Verifierat SÄKERT (för kalibrering — inte allt är trasigt)

- **Restore→auto-sync-vägen raderar aldrig serverdata för det återställda tokenet** — `last_sync_at` är alltid satt innan auto-synken hinner köra, så payloaden matchar alltid exakt det servern just skickade.
- **Total localStorage-förlust (ITP/rensning/privat läge) raderar inte D1-backupen** — appen tappar bara *tillgången* till token, inte själva datan på servern. Problemet där är att användaren förlorar nyckeln till sin egen backup, inte att backupen försvinner.
- Den 5-sekunders debouncen (`SYNC_DEBOUNCE_MS`) förlorar **inte** data i sig — Zustand skriver till localStorage synkront, oberoende av debouncen.
- Cron-jobbets SQL/batch-logik är korrekt implementerad (atomär per användare, ingen risk för delvis radering).

---

## Rekommenderad prioritetsordning

1. Bekräftelsedialog före restore (fynd 1, 2, 4) — litet, isolerat, täcker de två mest akuta buggarna.
2. Fixa cross-tab `lastSyncAt`-desync och/eller gör backend-raderingen mindre aggressiv vid saknad `lastSyncAt` (fynd 3) — detta är den enda buggen som kan radera data helt utan att användaren gjort något som "kändes" farligt.
3. Synlig utgångsvarning (banner, inte bara Settings) + förnya klockan även vid appöppning (fynd 6, 7).
4. Resten (5, 8, 9, 10) är verkliga men mindre akuta — värda att åtgärda i nästa iteration.

Inget av ovanstående har fixats i denna audit — detta är enbart en kartläggning. Säg till om du vill att jag börjar med punkt 1.

---

## Separat: CI/CD-infrastruktur (ej data-relaterat)

Under deployen av gradient-bakgrunderna (se separat commit) upptäcktes att GitHub Actions `Deploy`- och `CI`-workflows båda **failar** på huvudgrenen, oberoende av denna audit:
- `Deploy`: saknar `CLOUDFLARE_API_TOKEN`-secret i repots GitHub-inställningar → auto-deploy till Cloudflare Pages har inte fungerat via CI (deploy gjordes manuellt via `wrangler` istället, vilket lyckades).
- `CI` (lint): 2 sedan tidigare existerande ESLint-fel i `ErrorBoundary.tsx` och `RestoreToken.tsx`, orelaterade till detta arbete.

Detta är inte en data-risk, men innebär att push till `main` inte längre auto-deployar eller körs igenom kvalitetsgrindar just nu.
