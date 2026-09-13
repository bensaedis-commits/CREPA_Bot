const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

function loadEvents(client) {
  const eventsPath = path.join(__dirname, '../events');
  if (!fs.existsSync(eventsPath)) return;

  const files = fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'));

  for (const file of files) {
    const event = require(path.join(eventsPath, file));
    if (!event.name || !event.execute) {
      logger.warn(`[EventHandler] Skipping invalid event file: ${file}`);
      continue;
    }
    const register = (name) => {
      if (event.once) {
        client.once(name, (...args) => event.execute(...args, client));
      } else {
        client.on(name, (...args) => event.execute(...args, client));
      }
    };
    register(event.name);
    // دعم الاسم البديل (ready <-> clientReady) للتوافق
    if (event.alternateName) {
      register(event.alternateName);
    }
    logger.info(`[EventHandler] Loaded event: ${event.name}${event.alternateName ? ` (+${event.alternateName})` : ''}`);
  }
}

module.exports = { loadEvents };
