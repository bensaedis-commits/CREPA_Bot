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

# Run bot
if [ -f src/index.js ]; then
  echo "[CREPA] Starting bot from src/index.js"
  node src/index.js
elif [ -f index.js ]; then
  echo "[CREPA] Starting bot from index.js"
  node index.js
else
  echo "[CREPA] ERROR: No entry file found!"
  ls -la
  ls -la src/ 2>&1 || echo "No src"
  exit 1
fi
