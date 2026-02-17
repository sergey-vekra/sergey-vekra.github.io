#!/usr/bin/env bash

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <directory>"
  exit 1
fi

TARGET_DIR="$1"

if [ ! -d "$TARGET_DIR" ]; then
  echo "Error: Directory does not exist: $TARGET_DIR"
  exit 1
fi

find "$TARGET_DIR" \
  -type d \( -name node_modules -o -name dist -o -name build -o -name .git \) -prune -o \
  -type f \( -name "*.html" -o -name "*.js" -o -name "*.css" \) -print \
| sort \
| while read -r file; do

  ext="${file##*.}"

  echo "## $file"
  echo
  echo "\`\`\`$ext"
  cat "$file"
  echo "\`\`\`"
  echo
  echo

done | clip.exe

echo "Markdown-formatted files from '$TARGET_DIR' copied to clipboard."
