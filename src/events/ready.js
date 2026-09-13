const logger = require('../utils/logger');

module.exports = {
  name: 'clientReady',
  once: true,
  // دعم both ready و clientReady للتوافق مع v14 و v15
  alternateName: 'ready',
  execute(client) {
    logger.success(`Logged in as ${client.user.tag} (${client.user.id})`);
    logger.info(`Serving ${client.guilds.cache.size} guild(s) | AutoReaction: ${require('../managers/AutoReactionManager').size()} users`);
    logger.success('CREPA Bot is ONLINE and ready for auto-reactions!');

    // حالة البوت - محسنة
    client.user.setPresence({
      activities: [{ name: 'CREPA | Auto Reaction ✨', type: 3 }], // Watching
      status: 'online',
    });
  },
};
