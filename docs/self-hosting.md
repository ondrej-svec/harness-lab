# Deploy Your Own Instance

This guide is for teams who want their own hosted Harness Lab dashboard and private workshop runtime.

If you only want the participant experience inside your own repo, do **not** fork this repository. Install the CLI and participant bundle instead:

```bash
npm install -g @harness-lab/cli
harness skill install
```

## Choose a Mode

- local demo: run the dashboard with file-backed sample data for development, review, or dry runs
- hosted workshop instance: fork the repo, deploy `dashboard/`, and keep real workshop state in private Neon-backed runtime storage

## Recommended Hosted Model

- one fork of this repository
- one Vercel project rooted at `dashboard/`
- one private Neon production database
- one Neon preview branch or preview-grade database path
- one or more private workshop instances managed in runtime state, not in tracked repo files

Do not create a separate public repo or Vercel project per workshop unless you have a strong operational reason.

## 1. Fork and Clone

Fork the repository to your own GitHub account or organization, then clone your fork:

```bash
git clone https://github.com/<your-account>/harness-lab.git
cd harness-lab
```

## 2. Prove the Local Demo First

Before wiring hosted infrastructure, confirm the repo works in local file mode:

```bash
cd dashboard
cp .env.example .env.local
npm install
npm run dev
```

Local demo defaults:

- `HARNESS_STORAGE_MODE=file`
- `/admin` is protected by the demo basic-auth credentials from `.env.local`
- `HARNESS_EVENT_CODE` is a demo seed only

Run the core checks before moving on:

```bash
npm run test
npm run test:e2e
npm run lint
npm run build
```

## 3. Create the Hosted Infrastructure

### Vercel

Create one Vercel project for the dashboard and set its root directory to `dashboard`.

This repo assumes the standard Vercel Git model:

- pull requests create preview deployments
- pushes to `main` create production deployments

### Neon

Create the private runtime database and keep preview and production separated.

At minimum you will need:

- one production database or branch
- one preview database or branch for deployment verification
- Neon Auth enabled for facilitator auth in hosted mode

## 4. Configure Environment Variables

Use `dashboard/.env.example` only as the local demo bootstrap. For hosted deployments, configure preview and production values in Vercel, not in tracked files.

Hosted mode requires `HARNESS_STORAGE_MODE=neon` and a private runtime database.

Common hosted variables:

- `HARNESS_STORAGE_MODE`
- `HARNESS_WORKSHOP_INSTANCE_ID`
- `HARNESS_DATABASE_URL`
- `NEON_AUTH_BASE_URL`
- `NEON_AUTH_COOKIE_SECRET`
- optional bootstrap-only `HARNESS_EVENT_CODE`
- optional bootstrap-only `HARNESS_EVENT_CODE_EXPIRES_AT`

Authoritative environment guidance:

- [private-workshop-instance-env-matrix.md](private-workshop-instance-env-matrix.md)

## 5. Apply the Schema

Run migrations through the documented dashboard command path:

```bash
cd dashboard
npm run db:migrate
```

The migration runner uses `HARNESS_DATABASE_URL` or `DATABASE_URL`.

Database details:

- [db/README.md](../dashboard/db/README.md)

## 6. Create the First Facilitator

Hosted Neon mode needs a facilitator identity before you can operate protected routes.

Use the bootstrap script with preview-safe or production-safe values:

```bash
cd dashboard
NEON_AUTH_BASE_URL=https://<your-auth-host> \
HARNESS_DATABASE_URL=postgres://<connection-string> \
npx tsx scripts/create-facilitator.ts "Facilitator Name" facilitator@example.com "strong-password"
```

After that:

1. sign in at `/admin/sign-in`
2. this bootstrap script marks the facilitator as a Neon Auth `admin`, which is required for workspace-level instance list/create access
3. the first `admin` sign-in on an empty instance becomes the owner for that instance
4. add more facilitators from the admin UI as needed

## 7. Create and Prepare a Workshop Instance

Once the dashboard is reachable and facilitator auth works, create the workshop instance through the CLI or admin surface.

Example CLI flow:

```bash
harness auth login --dashboard-url https://<your-dashboard-host>
harness workshop create-instance sample-workshop-demo-orbit --event-title "Sample Workshop Demo"
harness workshop prepare sample-workshop-demo-orbit
harness workshop status
```

Facilitator command surface:

- [../harness-cli/README.md](../harness-cli/README.md)

Operational runbook:

- [workshop-instance-runbook.md](workshop-instance-runbook.md)

## 8. Promotion and Safety Rules

- keep real workshop data out of Git
- use Vercel environment variables and Neon configuration for secrets
- validate preview before promoting to production
- do not point preview deployments at the production database by accident
- treat the public repo as the reusable template and the private runtime as the live source of truth

## Related Docs

- [deployment-strategy.md](deployment-strategy.md)
- [private-workshop-instance-env-matrix.md](private-workshop-instance-env-matrix.md)
- [private-workshop-instance-deployment-spec.md](private-workshop-instance-deployment-spec.md)
- [workshop-instance-runbook.md](workshop-instance-runbook.md)
- [public-private-taxonomy.md](public-private-taxonomy.md)
