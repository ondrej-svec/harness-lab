# Codex Setup Verification

## Goal

By 10:30, every participant needs one working path:

- `pi`
- `Codex CLI`
- `Codex App`
- or the web fallback

The goal isn't a perfect install. The goal is to get everyone into agent work as early as possible.

## Quick start

### macOS / Linux

1. Open a terminal.
2. Sign into the Codex environment following the company flow.
3. Open the repository.
4. Send the first prompt.

### pi

1. Install `pi`:
   `npm install -g @mariozechner/pi-coding-agent`
2. Sign in with the provider or account you want to use.
3. Open the repository.
4. Run `pi`.
5. Load the workshop skill with `/skill:workshop` and ask for the next step.

### Windows / macOS

1. Open the `Codex App`.
2. Sign in.
3. Open the workshop repo or the team project.
4. Send the first prompt.

### Web fallback

Use this the moment installation, company policy, or authentication is blocking you. Don't wait for the ideal setup when you can already be working.

## Troubleshooting checklist

- Login not working → switch to the `App` or the web fallback and keep going.
- CLI install failing → don't let it block you for more than 7 minutes.
- Can't open the repo → pair up with someone at the table and come back to it later.
- Don't know the next step → in Codex, use `$workshop setup`. In pi, load `/skill:workshop` and ask for setup help.

## Facilitator decisions

- 7 minutes blocked → fallback or pairing.
- 10 minutes of chaos → the facilitator gives one concrete next step.
- Once a person has one working path, the setup is good enough for now.
