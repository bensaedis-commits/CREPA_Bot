#!/bin/bash
cd /home/container
echo "[CREPA] Starting setup..."

# Fix flat file structure from previous incorrect upload
if [[ -f AutoReactionManager.js ]] || [[ -f config.js && ! -f src/config.js ]]; then
  echo "[CREPA] Detected flat file structure - fixing..."
  rm -f AutoReactionManager.js autoReactions.json autoreaction.js commandHandler.js config.js deploy-commands.js eventHandler.js index.js interactionCreate.js logger.js messageCreate.js ready.js 2>/dev/null
  rm -f test-upload.txt test-*.txt 2>/dev/null
  echo "[CREPA] Cleaned flat files"
fi

# Clone from GitHub if src/index.js doesn't exist
if [[ ! -f src/index.js ]]; then
  echo "[CREPA] src/index.js not found - cloning from GitHub..."
  rm -rf /tmp/clone
  git clone https://github.com/bensaedis-commits/CREPA_Bot.git /tmp/clone
  if [[ $? -eq 0 ]]; then
    echo "[CREPA] Clone success, copying files..."
    cp -r /tmp/clone/* /home/container/ 2>/dev/null
    cp -r /tmp/clone/.git /home/container/ 2>/dev/null || true
    # Also copy hidden files like .env.example if needed (but not .env)
    cp /tmp/clone/.env.example /home/container/ 2>/dev/null || true
    cp /tmp/clone/.gitignore /home/container/ 2>/dev/null || true
    rm -rf /tmp/clone
    echo "[CREPA] Copy complete"
    ls -la src/ 2>&1 | head -20
  else
    echo "[CREPA] Clone failed!"
  fi
else
  echo "[CREPA] src/index.js exists - checking for updates..."
  if [[ -d .git ]] && [[ "1" == "1" ]]; then
    echo "[CREPA] Pulling latest..."
    # استعمل fetch + reset لتجاوز تعارض الملفات غير المتتبعة (مثل start.sh الذي رفعناه يدوياً)
    git fetch origin && git reset --hard origin/main || echo "[CREPA] git pull failed"
  fi
fi

# Install dependencies
if [ -f package.json ]; then
  echo "[CREPA] Installing dependencies..."
  npm install
fi

# Deploy commands if needed (optional)
if [ -f src/deploy-commands.js ]; then
  echo "[CREPA] Deploying commands..."
  node src/deploy-commands.js 2>&1 || echo "[CREPA] Deploy failed (maybe token not yet set)"
fi

# Check .env exists
if [[ ! -f .env ]]; then
  echo "[CREPA] ERROR: .env not found! Creating from example..."
  if [[ -f .env.example ]]; then
    cp .env.example .env
    echo "[CREPA] Created .env from example - PLEASE SET TOKEN!"
  fi
fi
echo "[CREPA] .env check:"
cat .env | sed 's/DISCORD_TOKEN=.*/DISCORD_TOKEN=***/' | head -5

# Run bot with auto-restart on crash
if [ -f src/index.js ]; then
  echo "[CREPA] Starting bot from src/index.js (Node $(node -v))"
  # Loop to restart on crash
  while true; do
    node src/index.js
    EXIT_CODE=$?
    echo "[CREPA] Bot exited with code $EXIT_CODE - restarting in 5s..."
    sleep 5
  done
elif [ -f index.js ]; then
  echo "[CREPA] Starting bot from index.js"
  while true; do
    node index.js
    EXIT_CODE=$?
    echo "[CREPA] Bot exited with code $EXIT_CODE - restarting in 5s..."
    sleep 5
  done
else
  echo "[CREPA] ERROR: No entry file found!"
  ls -la
  ls -la src/ 2>&1 || echo "No src"
  exit 1
fi
