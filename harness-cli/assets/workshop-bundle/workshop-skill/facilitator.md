# Facilitator Commands

Příkazy pro facilitátory, kteří řídí workshop instance přes AI agenta.

## Auth

Facilitátor se musí nejdřív přihlásit přes `harness` CLI. Skill nemá být další secret store pro raw credentials ani dlouhodobou session.

### `/workshop facilitator login`

Pokud není aktivní facilitátorská session, řekni facilitátorovi, aby spustil:

```bash
harness auth login
```

CLI provede browser/device auth flow, uloží session do lokálního file storage a zpřístupní ji pro další privileged příkazy.

Model:
- `harness auth login` autentizuje facilitátora vůči platformě
- konkrétní workshop instance se vybírá až při operaci nebo přes default context
- instance grant se vyhodnocuje při přístupu ke konkrétní akci, ne při samotném loginu

Aktuální praktický path v repu:

- default / browser-device auth:
```bash
harness auth login --dashboard-url https://harness-lab-dashboard.vercel.app
```
- file mode / lokální demo fallback:
```bash
harness auth login --auth basic --dashboard-url http://localhost:3000 --username facilitator --password secret
```
- neon mode / sdílený dashboard bootstrap fallback:
```bash
harness auth login --auth neon --dashboard-url https://harness-lab-dashboard.vercel.app --email facilitator@example.com
```

Poznámka:
- CLI dnes defaultně používá browser/device auth a ukládá session do lokálního file storage
- Pokud facilitátor chce OS-native storage, může použít `HARNESS_SESSION_STORAGE=keychain`, `credential-manager` nebo `secret-service`
- `--auth basic` a `--auth neon` zůstávají jen jako explicitní fallback pro lokální dev/bootstrap

### `/workshop facilitator logout`

Požádej o:

```bash
harness auth logout
```

## Instance Management

### `/workshop facilitator status`

Preferovaný path:

```bash
harness workshop status
```

Zobraz:
- aktivní instanci a její stav
- aktuální fázi
- seznam facilitátorů s rolemi
- počet týmů

### `/workshop facilitator grant <email> <role>`

Použij CLI-backed privileged request path. Skill nemá řešit auth bootstrap sám.

API capability zůstává:

```http
POST {DASHBOARD_URL}/api/admin/facilitators
Content-Type: application/json

{ "email": "...", "role": "operator" }
```

Vyžaduje `owner` roli. Vrací info o novém grantu.

### `/workshop facilitator revoke <email>`

Nejdřív zavolej `GET /api/admin/facilitators` a najdi grant podle emailu.
Pak:
```
DELETE {DASHBOARD_URL}/api/admin/facilitators/{grantId}
```

Vyžaduje `owner` roli.

### `/workshop facilitator create-instance`

Preferovaný path je CLI příkaz nad sdíleným runtime API:

```bash
harness workshop create-instance sample-workshop-demo-orbit \
  --template-id blueprint-default \
  --content-lang cs \
  --event-title "Sample Workshop Demo" \
  --city "Example City" \
  --date-range "15. června 2026" \
  --venue-name "Example Campus North" \
  --room-name Orbit \
  --address-line "Example Avenue 123" \
  --location-details "12 participants + facilitator" \
  --facilitator-label Alex
```

Raw API reference zůstává jen jako diagnostická nebo architektonická reference:

```http
POST {DASHBOARD_URL}/api/workshop/instances
Content-Type: application/json

{
  "id": "sample-workshop-demo-orbit",
  "templateId": "blueprint-default",
  "contentLang": "cs",
  "eventTitle": "Sample Workshop Demo",
  "city": "Example City",
  "dateRange": "15. června 2026",
  "venueName": "Example Campus North",
  "roomName": "Orbit",
  "addressLine": "Example Avenue 123",
  "locationDetails": "12 participants + facilitator",
  "facilitatorLabel": "Alex"
}
```

Poznámky pro skill:
- skill má preferovat CLI, ne ručně skládané `fetch` skripty
- `id` musí být lowercase slug s písmeny, čísly a pomlčkami
- `contentLang` určuje jazyk workshopového obsahu pro dashboard, presenter a skill delivery; není to totéž jako UI language
- když skill volá create opakovaně se stejným `id`, route vrací `created: false` a existující instance record
- nehádej venue metadata zkráceně, když je facilitátor zná; pošli je rovnou při create

### `/workshop facilitator update-instance <instance-id>`

Preferovaný path:

```bash
harness workshop update-instance sample-workshop-demo-orbit \
  --content-lang en \
  --event-title "Sample Workshop Demo" \
  --date-range "15. června 2026" \
  --venue-name "Example Campus North" \
  --room-name Orbit \
  --address-line "Example Avenue 123" \
  --location-details "12 participants + facilitator" \
  --facilitator-label Alex
```

Raw API reference:

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}
Content-Type: application/json

{
  "action": "update_metadata",
  "contentLang": "en",
  "eventTitle": "Sample Workshop Demo",
  "dateRange": "15. června 2026",
  "venueName": "Example Campus North",
  "roomName": "Orbit",
  "addressLine": "Example Avenue 123",
  "locationDetails": "12 participants + facilitator",
  "facilitatorLabel": "Alex"
}
```

Pravidla:
- pošli jen fieldy, které chceš změnit
- nepoužívej reset pro obyčejnou opravu názvu, venue nebo room
- když route vrátí `400`, payload je špatně; když vrátí `404`, instance neexistuje

### `/workshop facilitator prepare`

Preferovaný path:

```bash
harness workshop prepare sample-workshop-demo-orbit
```

Raw API reference:

```http
POST {DASHBOARD_URL}/api/workshop
Content-Type: application/json

{ "action": "prepare", "instanceId": "sample-workshop-demo-orbit" }
```

Nastaví instanci do stavu `prepared`, ověří event code.

### `/workshop facilitator remove-instance <instance-id>`

Preferovaný path:

```bash
harness workshop remove-instance sample-workshop-demo-orbit
```

Raw API reference:

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}
Content-Type: application/json

{ "action": "remove" }
```

Pravidla:
- remove zůstává owner-only operace
- skill má facilitátora upozornit, že jde o destruktivní odebrání z aktivního seznamu, ne o běžnou editaci metadata

### `/workshop facilitator agenda`

Lokální editace agendy pro konkrétní instanci používá instanční route:

```http
GET {DASHBOARD_URL}/api/workshop/instances/{instanceId}/agenda
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}/agenda
POST {DASHBOARD_URL}/api/workshop/instances/{instanceId}/agenda
DELETE {DASHBOARD_URL}/api/workshop/instances/{instanceId}/agenda
```

Příklady:

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}/agenda
Content-Type: application/json

{
  "action": "update",
  "itemId": "build-1",
  "title": "...",
  "time": "...",
  "goal": "...",
  "roomSummary": "...",
  "facilitatorPrompts": ["..."],
  "watchFors": ["..."],
  "checkpointQuestions": ["..."]
}
```

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}/agenda
Content-Type: application/json

{ "action": "move", "itemId": "build-1", "direction": "up" }
```

```http
POST {DASHBOARD_URL}/api/workshop/instances/{instanceId}/agenda
Content-Type: application/json

{
  "title": "...",
  "time": "...",
  "goal": "...",
  "roomSummary": "...",
  "facilitatorPrompts": ["..."],
  "watchFors": ["..."],
  "checkpointQuestions": ["..."],
  "afterItemId": "build-1"
}
```

Pravidla:

- agenda item je facilitátorský pack, ne jen `title/time/description`
- preferované fieldy jsou `goal`, `roomSummary`, `facilitatorPrompts`, `watchFors`, `checkpointQuestions`
- `description` zůstává compatibility field pro starší surface; pro room-facing shrnutí preferuj `roomSummary`
- používej kanonická agenda ids jako `opening`, `talk`, `demo`, `build-1`, `intermezzo-1`, `rotation`, `build-2`, `intermezzo-2`, `reveal`
- skill nemá vymýšlet vlastní názvy workshop momentů mimo tuto kostru

### `/workshop facilitator scenes`

Presenter scenes jsou agenda-linked room-facing výstupy pro facilitátora a projektor. Skill má umět:

- vypsat scény pro celou instanci nebo konkrétní agenda item
- vytvořit novou scénu
- upravit obsah, label, scene type a CTA
- změnit default scénu pro danou agenda položku
- přeuspořádat scény
- skrýt nebo znovu povolit scénu
- smazat lokální scénu
- číst a případně upravit `facilitatorNotes`, `sourceRefs` a `blocks`

Instanční route:

```http
GET {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
GET {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes?agendaItemId=talk
POST {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
DELETE {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
```

Příklady:

```http
POST {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
Content-Type: application/json

{
  "agendaItemId": "talk",
  "label": "Prompt blob vs repo context",
  "sceneType": "demo",
  "intent": "walkthrough",
  "chromePreset": "agenda",
  "title": "Nejdřív bez kontextu, potom s mapou",
  "facilitatorNotes": [
    "Držte jednu story, ne přehlídku funkcí."
  ],
  "blocks": [
    {
      "id": "hero",
      "type": "hero",
      "title": "Nejdřív bez kontextu, potom s mapou",
      "body": "Ukažte rozdíl mezi prompt blobem a krátkou mapou zapsanou v repu."
    },
    {
      "id": "questions",
      "type": "bullet-list",
      "title": "Pointa",
      "items": [
        "Co není v repu, neexistuje.",
        "Kontext je páka, ne kosmetika."
      ]
    }
  ],
  "ctaLabel": "Potom přepnout na participant walkthrough"
}
```

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
Content-Type: application/json

{
  "action": "update",
  "agendaItemId": "talk",
  "sceneId": "scene-123",
  "label": "Upravený demo flow",
  "sceneType": "demo",
  "intent": "walkthrough",
  "chromePreset": "agenda",
  "title": "Jedna story, ne přehlídka funkcí",
  "blocks": [
    {
      "id": "hero",
      "type": "hero",
      "title": "Jedna story, ne přehlídka funkcí",
      "body": "Neukazujte pět režimů práce. Ukažte jeden čitelný workflow."
    }
  ]
}
```

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
Content-Type: application/json

{ "action": "set_default", "agendaItemId": "talk", "sceneId": "talk-participant-view" }
```

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
Content-Type: application/json

{ "action": "move", "agendaItemId": "talk", "sceneId": "scene-123", "direction": "up" }
```

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
Content-Type: application/json

{ "action": "set_enabled", "agendaItemId": "talk", "sceneId": "scene-123", "enabled": false }
```

```http
DELETE {DASHBOARD_URL}/api/workshop/instances/{instanceId}/scenes
Content-Type: application/json

{ "agendaItemId": "talk", "sceneId": "scene-123" }
```

Když facilitátor chce změnit wording, flow nebo participant walkthrough přes coding agenta, preferuj tuto route místo ručního popisu změn v UI.

Při práci přes API:

- neznámé `agendaItemId` nebo `sceneId` vrací `404`
- malformed payload pořád vrací `400`
- skill má stale target ids hlásit explicitně, ne pokračovat jako by se změna povedla
- room-facing obsah patří do `blocks`, facilitátorské pokyny do `facilitatorNotes`
- `title/body` zůstávají kvůli compatibility, ale skill má preferovat strukturované `blocks`
- když runtime agenda existuje, skill má číst a citovat její `goal`, `roomSummary`, `facilitatorPrompts`, `watchFors`, `checkpointQuestions`, `facilitatorNotes` a `blocks`
- když runtime data nejsou dostupná, fallbackni na blueprint a facilitační docs z repa a explicitně to řekni

### `/workshop facilitator archive`

Zavolej:
```
POST {DASHBOARD_URL}/api/workshop/archive
Content-Type: application/json

{ "reason": "manual", "notes": "..." }
```

## Environment

Agent potřebuje vědět URL dashboardu:
- `HARNESS_DASHBOARD_URL` — URL produkčního nebo preview dashboardu
- Pokud není nastaveno, použij `https://harness-lab-dashboard.vercel.app`

## Poznámky

- Facilitátorské příkazy jsou oddělené od participant příkazů
- `/workshop facilitator login` má facilitátora navést do `harness auth login`
- Všechny ostatní privileged příkazy používají CLI-backed uloženou session
- Pokud session expiruje, agent řekne facilitátorovi, aby se znovu přihlásil
- Tyto příkazy nikdy nezobrazuj participant účastníkům
