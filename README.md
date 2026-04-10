# Harness Lab

[![CI](https://github.com/ondrej-svec/harness-lab/actions/workflows/dashboard-ci.yml/badge.svg?branch=main)](https://github.com/ondrej-svec/harness-lab/actions/workflows/dashboard-ci.yml)
[![npm](https://img.shields.io/npm/v/@harness-lab/cli?label=%40harness-lab%2Fcli)](https://www.npmjs.com/package/@harness-lab/cli)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/ondrej-svec/harness-lab/badge)](https://scorecard.dev/viewer/?uri=github.com/ondrej-svec/harness-lab)
[![License: MIT](https://img.shields.io/badge/license-MIT-brightgreen)](LICENSE)

Open-source workshop template for teams working with AI coding agents on real software.

Harness Lab teaches **harness engineering** — the discipline of building context, instructions, verification, and workflows around AI agents so the work survives handoffs instead of collapsing into disposable output.

## Quick Start

### Participant

You do **not** need to fork or clone this repo. Install the CLI in your own project:

```bash
npm install -g @harness-lab/cli
harness skill install
```

Then open your coding agent and run `$workshop commands` (Codex) or `/skill:workshop` (pi).

### Run the dashboard locally

```bash
git clone https://github.com/ondrej-svec/harness-lab.git
cd harness-lab/dashboard
cp .env.example .env.local
npm install && npm run dev
```

Open `http://localhost:3000/admin` with the demo credentials from `.env.example`.

### Deploy your own instance

Fork the repo, connect Vercel + Neon, and follow [docs/self-hosting.md](docs/self-hosting.md).

## Choose Your Path

| You are a... | Start here |
|---|---|
| **Participant** | [harness-cli/README.md](harness-cli/README.md) |
| **Facilitator** | [harness-cli/README.md](harness-cli/README.md) then [workshop-skill/facilitator.md](workshop-skill/facilitator.md) |
| **Self-hoster** | [docs/self-hosting.md](docs/self-hosting.md) |
| **Contributor** | [docs/contributing.md](docs/contributing.md) |

## Repository Map

| Directory | What lives here |
|---|---|
| `harness-cli/` | CLI for skill installation and facilitator operations |
| `workshop-skill/` | Portable participant skill, setup help, and reference card |
| `dashboard/` | Facilitator and participant dashboard (Next.js) |
| `workshop-blueprint/` | Canonical workshop method and day structure |
| `content/` | Project briefs, challenge cards, talks, and facilitation content |
| `materials/` | Printable participant takeaways |
| `docs/` | Architecture, ADRs, operator guides, and contributor docs |

## What Gets Practiced

During the workshop, teams work through:

1. Writing repo-native context (`AGENTS.md`, skills, runbooks)
2. A structured flow: brainstorm &rarr; plan &rarr; work &rarr; review &rarr; compound
3. Delegating, checking, and redirecting agent work
4. Turning decisions into artifacts that survive handoffs

Three rules guide the work:

- **Clarify first, then generate.** An agent without intent and constraints does not create; it improvises.
- **Verify before you move on.** Verification is the trust boundary.
- **Work so others can continue.** The next person or agent should not have to guess what happened.

## Community

- [Contributing](docs/contributing.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security](SECURITY.md)
- [Support](SUPPORT.md)
- [License](LICENSE)
