#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(CDPATH="" cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(CDPATH="" cd "$SCRIPT_DIR/.." && pwd)"
SOURCE_DIR="$REPO_ROOT/.codex/skills"
TARGET_ROOT="${CODEX_HOME:-$HOME/.codex}"
TARGET_DIR="$TARGET_ROOT/skills"

if [[ ! -d "$SOURCE_DIR" ]]; then
  echo "ERROR: source skills directory not found: $SOURCE_DIR" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"

installed=0

for skill_dir in "$SOURCE_DIR"/*; do
  if [[ ! -d "$skill_dir" ]]; then
    continue
  fi

  skill_name="$(basename "$skill_dir")"
  rm -rf "$TARGET_DIR/$skill_name"
  cp -R "$skill_dir" "$TARGET_DIR/$skill_name"
  installed=$((installed + 1))
  echo "Installed $skill_name -> $TARGET_DIR/$skill_name"
done

if [[ "$installed" -eq 0 ]]; then
  echo "ERROR: no skills found under $SOURCE_DIR" >&2
  exit 1
fi

echo
echo "Installed $installed repository skills into $TARGET_DIR"
echo "Restart Codex or open a new session if the skills do not appear immediately."
