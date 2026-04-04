#!/usr/bin/env bash

set -euo pipefail

MONITORING_FILE="${1:-$(dirname "$0")/latest-monitoring.md}"
CAPTURE_DIR="${2:-$(dirname "$0")/../capture/notes}"

if [[ ! -f "$MONITORING_FILE" ]]; then
  echo "Monitoring file not found: $MONITORING_FILE" >&2
  exit 1
fi

echo "# Intermezzo brief"
echo
echo "## Co říct"
echo

healthy_count="$(rg -c 'healthy-handoff-surface' "$MONITORING_FILE" || true)"
thin_count="$(rg -c 'context-exists-but-verification-thin' "$MONITORING_FILE" || true)"
blocked_count="$(rg -c 'facilitator-check-in-needed' "$MONITORING_FILE" || true)"

echo "- U stolů je právě ${healthy_count:-0} týmů s dobrým základem pro handoff."
echo "- ${thin_count:-0} týmů má kontext, ale slabé ověření. Připomeň build/test příkazy a reviewed output."
echo "- ${blocked_count:-0} týmů potřebuje konkrétní facilitátorský zásah."

latest_capture="$(find "$CAPTURE_DIR" -type f -name '*.md' 2>/dev/null | sort | tail -n 1 || true)"

if [[ -n "$latest_capture" ]]; then
  key_observation="$(rg -n '^## Princip|^## Co se stalo|^- ' "$latest_capture" 2>/dev/null | head -n 5 || true)"
  if [[ -n "$key_observation" ]]; then
    echo "- Nejčerstvější pozorování z walkaroundu:"
    echo "$key_observation" | sed 's/^/  /'
  fi
else
  echo "- V capture notes zatím není žádný záznam. Připomeň týmům checkpoint větu 'co jsme změnili a proč'."
fi

echo "- Princip pro tuto chvíli: přesuňte trvalá pravidla z promptu do repa."
echo "- CTA pro týmy: do příštího sprintu musí být jasné, co už funguje, co je rozdělané a kde začít po rotaci."
