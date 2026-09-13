const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const logger = require('../utils/logger');

function loadCommands(client) {
  client.commands = new Collection();
  const commandsPath = path.join(__dirname, '../commands');

  if (!fs.existsSync(commandsPath)) return;

  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        const command = require(full);
        if (!command.data || !command.execute) {
          logger.warn(`[CommandHandler] Skipping invalid command: ${full}`);
          continue;
        }
        client.commands.set(command.data.name, command);
        logger.info(`[CommandHandler] Loaded command: ${command.data.name}`);
      }
    }
  };

  walk(commandsPath);
}

module.exports = { loadCommands };
