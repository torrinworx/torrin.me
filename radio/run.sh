#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. ~/.nvm/nvm.sh
nvm use 25
cd "$SCRIPT_DIR"
npm i --omit=dev
node --expose-gc main.ts
