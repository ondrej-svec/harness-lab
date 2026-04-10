# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| `@harness-lab/cli` latest | Yes |
| `@harness-lab/cli` < latest | Best effort |

## Reporting a Vulnerability

If you discover a security vulnerability in Harness Lab, please report it responsibly:

1. **Do not open a public issue.**
2. Use [GitHub's private vulnerability reporting](https://github.com/ondrej-svec/harness-lab/security/advisories/new) on this repository.
3. Alternatively, email the maintainer at the address listed in the npm package.
4. Include a description of the vulnerability, reproduction steps, and potential impact.

We aim to acknowledge reports within 48 hours and provide a fix or mitigation plan within 7 days.

## Security Measures

### CLI (`@harness-lab/cli`)

- **Role enforcement at CLI layer**: participant sessions are rejected from facilitator commands before any network request is made. Enforced by `requireFacilitatorSession` in the CLI, tested by 9 security-specific tests.
- **Credential isolation**: session cookies, access tokens, and authorization headers are never included in CLI output. The `sanitizeSession` function strips all secret fields. Tested across all 4 auth types.
- **Dependency audit**: `npm audit --audit-level=high` runs on every push, PR, and before every npm publish.
- **SAST**: Semgrep scans CLI source on every push, PR, and before publish.
- **Secret scanning**: Gitleaks scans git history on every push and PR.
- **Minimal dependency surface**: 1 runtime dependency (`chalk`), zero devDependencies.
- **Pinned dependencies**: all GitHub Actions are pinned to SHA hashes, not mutable tags.

### Dashboard

- **Origin checking**: all mutation endpoints verify the request origin matches the deployment host.
- **Participant sessions**: short-lived, HttpOnly, SameSite cookies. Cannot access facilitator endpoints.
- **Facilitator sessions**: role-gated, device-flow authenticated.
- **Rate limiting**: event code redemption is rate-limited to prevent brute force.

### CI/CD

- **Tests before publish**: all 60 tests (including 9 security tests) must pass before npm publish.
- **SAST gates publish**: Semgrep and Gitleaks must pass before npm publish.
- **Dependabot**: automated weekly dependency updates for CLI, dashboard, and GitHub Actions.
- **No secrets in code**: Gitleaks enforced on every commit range.
- **Token permissions**: all workflows use `permissions: read-all` with job-level escalation only where needed.
- **Branch protection**: main branch requires PR reviews for external contributors.
