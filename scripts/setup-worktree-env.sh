#!/usr/bin/env bash
# =============================================================================
# setup-worktree-env.sh
#
# Manage .env.local in a git worktree by symlinking it to the main
# repository's .env.local. This ensures all worktrees share a single
# source of truth without copying secrets.
#
# Usage:
#   bash scripts/setup-worktree-env.sh            # create symlink
#   bash scripts/setup-worktree-env.sh --force    # overwrite existing
#   bash scripts/setup-worktree-env.sh --status   # show link status
#   bash scripts/setup-worktree-env.sh --help     # show this help
#
# npm shortcuts (from any worktree):
#   npm run env:setup
#   npm run env:setup -- --force
#   npm run env:status
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Constants & colours
# ---------------------------------------------------------------------------

SCRIPT_NAME="$(basename "$0")"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
RESET='\033[0m'

# ---------------------------------------------------------------------------
# usage
# ---------------------------------------------------------------------------

usage() {
  cat <<EOF
Usage: $SCRIPT_NAME [OPTIONS]

Options:
  (none)      Create a symlink: <worktree>/.env.local → <main>/.env.local
              Skips with a warning if .env.local already exists.
  --force     Remove any existing .env.local and recreate the symlink.
  --status    Show the current .env.local link status and exit.
  --help      Show this help message and exit.
EOF
}

# ---------------------------------------------------------------------------
# detect_main_root
#
# Returns the absolute path of the main (primary) repository root.
# Works regardless of where the worktree lives on disk.
# ---------------------------------------------------------------------------

detect_main_root() {
  local common_dir
  common_dir="$(git rev-parse --git-common-dir 2>/dev/null)" || {
    echo -e "${RED}✗ Not inside a git repository.${RESET}" >&2
    exit 1
  }

  # --git-common-dir points to the shared .git directory.
  # Its parent directory is the main repository root.
  local abs_common_dir
  abs_common_dir="$(cd "$common_dir" && pwd)"

  echo "$(dirname "$abs_common_dir")"
}

# ---------------------------------------------------------------------------
# show_status
#
# Prints the current .env.local link status for the working directory.
# ---------------------------------------------------------------------------

show_status() {
  local worktree_env=".env.local"

  if [[ ! -e "$worktree_env" && ! -L "$worktree_env" ]]; then
    echo -e "${RED}✗ .env.local is not configured in this worktree.${RESET}"
    echo "  Run: npm run env:setup"
    return
  fi

  if [[ -L "$worktree_env" ]]; then
    local target
    target="$(readlink "$worktree_env")"
    if [[ -e "$worktree_env" ]]; then
      echo -e "${GREEN}✓ .env.local is linked → $target (valid)${RESET}"
    else
      echo -e "${YELLOW}⚠ .env.local is a symlink but the target is missing: $target${RESET}"
      echo "  Run: npm run env:setup -- --force"
    fi
  else
    echo -e "${YELLOW}⚠ .env.local exists as a regular file (not a symlink).${RESET}"
    echo "  To replace with a symlink: npm run env:setup -- --force"
  fi
}

# ---------------------------------------------------------------------------
# setup_env
#
# Creates a symlink: <worktree>/.env.local → <main_root>/.env.local
# Errors if the source does not exist.
# Skips (or replaces with --force) if a target already exists.
# ---------------------------------------------------------------------------

setup_env() {
  local force="${1:-false}"

  local main_root
  main_root="$(detect_main_root)"

  local source="$main_root/.env.local"
  local target=".env.local"

  # Guard: source file must exist in the main repo
  if [[ ! -f "$source" ]]; then
    echo -e "${RED}✗ .env.local not found in the main repository:${RESET}" >&2
    echo "    $source" >&2
    echo "" >&2
    echo "  Follow docs/env-setup.md to create it first." >&2
    exit 1
  fi

  # Guard: handle existing target
  if [[ -e "$target" || -L "$target" ]]; then
    if [[ "$force" == "true" ]]; then
      rm -f "$target"
      echo "  Removed existing .env.local (--force applied)"
    else
      echo -e "${YELLOW}⚠ .env.local already exists in this worktree. Skipping.${RESET}"
      echo "  To replace with the symlink: npm run env:setup -- --force"
      return
    fi
  fi

  ln -s "$source" "$target"
  echo -e "${GREEN}✓ .env.local → $source (symlink created)${RESET}"
}

# ---------------------------------------------------------------------------
# main
# ---------------------------------------------------------------------------

main() {
  local mode="setup"
  local force=false

  for arg in "$@"; do
    case "$arg" in
      --force)  force=true ;;
      --status) mode="status" ;;
      --help|-h) usage; exit 0 ;;
      *)
        echo -e "${RED}Unknown option: $arg${RESET}" >&2
        usage >&2
        exit 1
        ;;
    esac
  done

  case "$mode" in
    status) show_status ;;
    setup)  setup_env "$force" ;;
  esac
}

main "$@"
