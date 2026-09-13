#!/bin/bash
set -x
cd /home/container
echo "[CREPA] Starting setup... Node $(node -v) | $(date)"
echo "[CREPA] start.sh version 75b36aa-v2"

# Fix flat file structure
if [[ -f AutoReactionManager.js ]] || [[ -f config.js && ! -f src/config.js ]]; then
  echo "[CREPA] Detected flat file structure - fixing..."
  rm -f AutoReactionManager.js autoReactions.json autoreaction.js commandHandler.js config.js deploy-commands.js eventHandler.js index.js interactionCreate.js logger.js messageCreate.js ready.js 2>/dev/null
  rm -f test-upload.txt test-*.txt 2>/dev/null
  echo "[CREPA] Cleaned flat files"
fi

# Clone or pull
if [[ ! -f src/index.js ]]; then
  echo "[CREPA] src/index.js not found - cloning..."
  rm -rf /tmp/clone
  git clone https://github.com/bensaedis-commits/CREPA_Bot.git /tmp/clone && cp -r /tmp/clone/* /home/container/ && cp -r /tmp/clone/.git /home/container/ 2>/dev/null; cp /tmp/clone/.env.example /home/container/ 2>/dev/null; rm -rf /tmp/clone; echo "[CREPA] Clone done"; ls -la src/ | head -20
else
  echo "[CREPA] src/index.js exists - pulling..."
  if [[ -d .git ]]; then
    git fetch origin && git reset --hard origin/main && echo "[CREPA] Pull done - $(git log --oneline -1)" || echo "[CREPA] Pull failed"
  fi
fi

echo "[CREPA] Files after pull:"
ls -la | head -30
ls -la src/ | head -30

# Install
if [ -f package.json ]; then
  echo "[CREPA] npm install..."
  npm install --loglevel=error 2>&1 | tail -20
  echo "[CREPA] npm done"
fi

# Check .env
echo "[CREPA] .env check:"
if [[ -f .env ]]; then
  echo "[CREPA] .env exists - size $(wc -c < .env) bytes"
  cat .env | sed 's/DISCORD_TOKEN=.*/DISCORD_TOKEN=***/' | head -5
  echo "[CREPA] .env first line check:"
  head -1 .env | cat -A
else
  echo "[CREPA] .env MISSING!"
  ls -la .env* 2>&1
fi

# Check config.json
echo "[CREPA] config.json check:"
cat config.json | head -20 2>&1 || echo "No config.json"
echo "[CREPA] Node version: $(node -v) | NPM: $(npm -v)"

# Deploy
if [ -f src/deploy-commands.js ]; then
  echo "[CREPA] Deploying commands..."
  node src/deploy-commands.js 2>&1 || echo "[CREPA] Deploy failed"
fi

# Run bot
echo "[CREPA] Starting bot..."
if [ -f src/index.js ]; then
  echo "[CREPA] Executing: node src/index.js"
  exec node src/index.js
else
  echo "[CREPA] No src/index.js!"
  ls -la src/ 2>&1
  exit 1
fi
