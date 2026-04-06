# Facilitator Commands

Příkazy pro facilitátory, kteří řídí workshop instance přes AI agenta.

## Auth

Facilitátor se musí nejdřív přihlásit přes Neon Auth. Agent získá session token voláním `/api/auth/sign-in/email` a uloží ho pro další requesty.

### `/workshop facilitator login`

Zeptej se na email a heslo. Zavolej dashboard API:

```
POST {DASHBOARD_URL}/api/auth/sign-in/email
Content-Type: application/json

{ "email": "...", "password": "..." }
```

Ulož session cookie/token pro další příkazy.

### `/workshop facilitator logout`

Zavolej:
```
POST {DASHBOARD_URL}/api/auth/sign-out
```

Smaž uloženou session.

## Instance Management

### `/workshop facilitator status`

Zavolej:
```
GET {DASHBOARD_URL}/api/workshop
GET {DASHBOARD_URL}/api/admin/facilitators
```

Zobraz:
- aktivní instanci a její stav
- aktuální fázi
- seznam facilitátorů s rolemi
- počet týmů

### `/workshop facilitator grant <email> <role>`

Zavolej:
```
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

Zavolej:
```
POST {DASHBOARD_URL}/api/workshop
Content-Type: application/json

{ "action": "create", "templateId": "..." }
```

### `/workshop facilitator prepare`

Zavolej:
```
POST {DASHBOARD_URL}/api/workshop
Content-Type: application/json

{ "action": "prepare" }
```

Nastaví instanci do stavu `prepared`, ověří event code.

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
- `/workshop facilitator login` je jediný příkaz, který vyžaduje credentials
- Všechny ostatní příkazy používají uloženou session
- Pokud session expiruje, agent řekne facilitátorovi, aby se znovu přihlásil
- Tyto příkazy nikdy nezobrazuj participant účastníkům
