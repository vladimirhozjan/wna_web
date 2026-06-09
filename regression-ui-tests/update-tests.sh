#!/usr/bin/env bash
#
# Re-parses .claude/wna-test-cases.md and updates the regression dashboard data files.
# Run this after adding or editing test cases in .claude/wna-test-cases.md.
#
# Usage:  ./update-tests.sh
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== WNA Regression Test Updater ==="
echo ""

# Check that Node.js is available
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed or not in PATH."
  echo "       Install Node.js and try again."
  exit 1
fi

# Check that the source markdown exists
MD_FILE="$SCRIPT_DIR/../.claude/wna-test-cases.md"
if [ ! -f "$MD_FILE" ]; then
  echo "ERROR: wna-test-cases.md not found at $MD_FILE"
  exit 1
fi

# Check that the parser script exists
PARSER="$SCRIPT_DIR/parse-test-cases.cjs"
if [ ! -f "$PARSER" ]; then
  echo "ERROR: parse-test-cases.cjs not found at $PARSER"
  exit 1
fi

# Show current state
CURRENT_COUNT=$(grep -c '^### TC-' "$MD_FILE" || true)
echo "Source:  $(basename "$MD_FILE")"
echo "Found:   $CURRENT_COUNT test cases in markdown"
echo ""

# Detect duplicate test-case IDs before parsing
DUPLICATES=$(grep -oE '^### (TC-[0-9]+[a-z]?):' "$MD_FILE" \
  | sed -E 's/^### (TC-[0-9]+[a-z]?):/\1/' \
  | sort | uniq -d || true)
if [ -n "$DUPLICATES" ]; then
  echo "ERROR: Duplicate test-case IDs found in $(basename "$MD_FILE"):"
  while IFS= read -r dup; do
    echo "  $dup used on lines: $(grep -nE "^### ${dup}:" "$MD_FILE" | cut -d: -f1 | paste -sd ', ' -)"
  done <<< "$DUPLICATES"
  echo ""
  echo "       Each TC ID must be unique. Renumber the duplicates and re-run."
  exit 1
fi

# Run the parser
echo "Parsing..."
node "$PARSER"

echo ""
echo "Updated files:"
echo "  - test-cases.json"
echo "  - test-data.js"
echo ""
echo "Done. Refresh the dashboard in your browser to see the changes."
