# Workshop Setup

## Goal

By 10:30, you need one working path into Codex or pi. Not a perfect setup. A working path.

The first goal after setup is not a feature. It is orientation:

- open the repo
- load the workshop guidance
- create a short `AGENTS.md`
- name the first verifiable step

The guaranteed default for today is the `workshop` skill. Additional workflow skills or external toolkits are optional accelerators, not a requirement for participation.

## Fastest choice

- terminal-first, hackable multi-model setup: `pi`
- macOS / Linux: `Codex CLI`
- Windows or macOS: `Codex App`
- if you get blocked: web fallback or pair with someone whose setup already works

## pi

1. Install `pi`:

```bash
npm install -g @mariozechner/pi-coding-agent
```

2. Sign in to the provider or account you want to use.
3. Open the repository.
4. Run `pi`.
5. Load the workshop skill with `/skill:workshop` and ask for `setup`, `reference`, or `brief`.

## Codex CLI

1. Confirm that you have access to your Codex account.
2. Install the CLI using your organization's setup flow.
3. Sign in.
4. Open the repository.
5. Send the first meaningful prompt and confirm that you get a response.

## Codex App

1. Install the app.
2. Sign in with the same account.
3. Open the workshop repo or your team project.
4. Send the first prompt.
5. Confirm that you can continue without another blocker.

## If something does not work

- Do not spend 20 minutes debugging setup alone.
- After 7 minutes of being blocked, switch to App, web fallback, or pairing.
- If authentication fails, continue with someone at your table and come back to your own setup later.
- If you are unsure about the next step, use `$workshop setup` in Codex. In pi, load `/skill:workshop` and ask for setup help. Or call a facilitator.

## First 15 minutes after setup

1. Open workshop reference:
   - Codex: `$workshop reference`
   - pi: `/skill:workshop`, then ask for `reference`
   - if you want a fast overview of the skill surface: `Codex: $workshop commands`
2. Open the brief:
   - Codex: `$workshop brief`
   - pi: `/skill:workshop`, then ask for `brief`
3. Add a short `AGENTS.md`:
   - Codex: `$workshop template`
4. Name the first safe move:
   - ideally through `plan`, or `brainstorm` if the scope is still unclear
5. Add one executable check:
   - a RED test, tracer bullet, or at least a clear review or checklist step
6. If you want materials for later too:
   - `Codex: $workshop resources`
   - `Codex: $workshop gallery`
   - `Codex: $workshop follow-up`

## Done when

- You can open the repo.
- You can send a prompt.
- You have one working path for using an agent during the workshop.
- You know the first safe move in the repo after setup.
