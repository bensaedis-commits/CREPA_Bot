const logger = require('../utils/logger');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    logger.success(`Logged in as ${client.user.tag} (${client.user.id})`);
    logger.info(`Serving ${client.guilds.cache.size} guild(s)`);

    // حالة البوت
    client.user.setPresence({
      activities: [{ name: 'CREPA Server | Auto Reaction', type: 3 }], // Watching
      status: 'online',
    });
  },
};
