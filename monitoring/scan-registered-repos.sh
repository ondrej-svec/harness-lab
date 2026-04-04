#!/usr/bin/env bash

set -euo pipefail

if ! command -v rg >/dev/null 2>&1; then
  echo "rg is required" >&2
  exit 1
fi

REGISTRY_FILE="${1:-$(dirname "$0")/team-repos.tsv}"

if [[ ! -f "$REGISTRY_FILE" ]]; then
  echo "Registry file not found: $REGISTRY_FILE" >&2
  echo "Copy monitoring/team-repos.example.tsv to monitoring/team-repos.tsv and fill local repo paths." >&2
  exit 1
fi

count_files() {
  local pattern="$1"
  local base_dir="$2"
  rg --files "$base_dir" -g "$pattern" 2>/dev/null | wc -l | tr -d ' '
}

find_architecture_doc() {
  local base_dir="$1"
  local result
  result="$(rg --files "$base_dir" -g '*architecture*.md' -g '*adr*.md' -g '*runbook*.md' 2>/dev/null | head -n 1 || true)"
  echo "${result:-none}"
}

while IFS=$'\t' read -r team_id team_name repo_path repo_url; do
  [[ -z "${team_id:-}" ]] && continue
  [[ "${team_id:0:1}" == "#" ]] && continue

  echo "## ${team_name} (${team_id})"
  echo "- repo_url: ${repo_url:-unknown}"

  if [[ -z "${repo_path:-}" || ! -d "${repo_path:-}" ]]; then
    echo "- status: missing-local-path"
    echo "- note: local repo path is required for the MVP scanner"
    echo
    continue
  fi

  agents_path=""
  if [[ -f "$repo_path/AGENTS.md" ]]; then
    agents_path="$repo_path/AGENTS.md"
  else
    agents_path="$(rg --files "$repo_path" -g 'AGENTS.md' 2>/dev/null | head -n 1 || true)"
  fi

  readme_path="$(rg --files "$repo_path" -g 'README.md' -g 'readme.md' 2>/dev/null | head -n 1 || true)"
  skills_count="$(count_files 'SKILL.md' "$repo_path")"
  source_count="$(count_files '*.{ts,tsx,js,jsx,py,go,rs,java,kt,cs,rb,php}' "$repo_path")"
  test_count="$(count_files '*{test,spec}*.{ts,tsx,js,jsx,py,go,rs,java,kt,cs,rb,php}' "$repo_path")"
  architecture_doc="$(find_architecture_doc "$repo_path")"

  commit_count="0"
  if git -C "$repo_path" rev-parse --git-dir >/dev/null 2>&1; then
    commit_count="$(git -C "$repo_path" rev-list --count --since='30 minutes ago' HEAD 2>/dev/null || echo "0")"
  fi

  if [[ -n "$agents_path" ]]; then
    agents_lines="$(wc -l < "$agents_path" | tr -d ' ')"
    echo "- has_agents: yes"
    echo "- agents_path: ${agents_path#$repo_path/}"
    echo "- agents_lines: $agents_lines"
  else
    echo "- has_agents: no"
  fi

  if [[ -n "$readme_path" ]]; then
    echo "- has_readme: yes"
    echo "- readme_path: ${readme_path#$repo_path/}"
  else
    echo "- has_readme: no"
  fi

  echo "- commits_last_30_min: $commit_count"
  echo "- skills_count: $skills_count"
  echo "- source_files: $source_count"
  echo "- test_files: $test_count"
  echo "- architecture_doc: ${architecture_doc#$repo_path/}"

  if [[ -n "$agents_path" && "$test_count" -gt 0 ]]; then
    echo "- signal: healthy-handoff-surface"
  elif [[ -n "$agents_path" ]]; then
    echo "- signal: context-exists-but-verification-thin"
  else
    echo "- signal: facilitator-check-in-needed"
  fi

  echo
done < "$REGISTRY_FILE"
