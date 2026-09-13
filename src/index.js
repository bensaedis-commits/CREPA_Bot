const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config');
const logger = require('./utils/logger');
const { loadEvents } = require('./handlers/eventHandler');
const { loadCommands } = require('./handlers/commandHandler');

config.validate();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // مطلوب لقراءة محتوى الرسائل + المنشن
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

loadCommands(client);
loadEvents(client);

// معالجة الأخطاء العامة
process.on('unhandledRejection', (err) => logger.error('[UnhandledRejection]', err));
process.on('uncaughtException', (err) => logger.error('[UncaughtException]', err));

client.login(config.token).catch((err) => {
  logger.error('Failed to login:', err);
  process.exit(1);
});
