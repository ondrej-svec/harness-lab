# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Harness Lab, please report it responsibly:

1. **Do not open a public issue.**
2. Email the maintainer directly or use GitHub's private vulnerability reporting feature on this repository.
3. Include a description of the vulnerability, reproduction steps, and potential impact.

We aim to acknowledge reports within 48 hours and provide a fix or mitigation plan within 7 days.

## Security Measures

### CLI (`@harness-lab/cli`)

- **Role enforcement at CLI layer**: participant sessions are rejected from facilitator commands before any network request is made.
- **Credential isolation**: session cookies, access tokens, and authorization headers are never included in CLI output. The `sanitizeSession` function strips all secret fields.
- **Dependency audit**: `npm audit --audit-level=high` runs on every push, PR, and before every npm publish.
- **SAST**: Semgrep scans CLI source on every push, PR, and before publish.
- **Secret scanning**: Gitleaks scans git history on every push and PR.
- **Minimal dependency surface**: 1 runtime dependency (`chalk`), zero devDependencies.

### Dashboard

- **Origin checking**: all mutation endpoints verify the request origin matches the deployment host.
- **Participant sessions**: short-lived, HttpOnly, SameSite cookies. Cannot access facilitator endpoints.
- **Facilitator sessions**: role-gated, device-flow authenticated.

### CI/CD

- **Tests before publish**: all tests (including security tests) must pass before npm publish.
- **Dependabot**: automated weekly dependency updates for CLI, dashboard, and GitHub Actions.
- **No secrets in code**: Gitleaks enforced on every commit range.
