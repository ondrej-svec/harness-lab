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

Vysvětli, že vytvoření instance má být popsané jako import z blueprintu. Preferovaný bootstrap je přes CLI-backed auth a sdílené runtime API:

```http
POST {DASHBOARD_URL}/api/workshop
Content-Type: application/json

{ "action": "create", "templateId": "..." }
```

Nebo explicitně přes instanční route:

```http
POST {DASHBOARD_URL}/api/workshop/instances
Content-Type: application/json

{ "id": "client-hackathon-2026-05", "templateId": "...", "city": "...", "dateRange": "..." }
```

### `/workshop facilitator prepare`

Zavolej:
```
POST {DASHBOARD_URL}/api/workshop
Content-Type: application/json

{ "action": "prepare" }
```

Nastaví instanci do stavu `prepared`, ověří event code.

### `/workshop facilitator remove-instance <instance-id>`

Bezpečné odebrání z aktivního seznamu:

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}
Content-Type: application/json

{ "action": "remove" }
```

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

{ "action": "update", "itemId": "build-1", "title": "...", "time": "...", "description": "..." }
```

```http
PATCH {DASHBOARD_URL}/api/workshop/instances/{instanceId}/agenda
Content-Type: application/json

{ "action": "move", "itemId": "build-1", "direction": "up" }
```

```http
POST {DASHBOARD_URL}/api/workshop/instances/{instanceId}/agenda
Content-Type: application/json

{ "title": "...", "time": "...", "description": "...", "afterItemId": "build-1" }
```

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
