const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config');
const logger = require('./utils/logger');
const { loadEvents } = require('./handlers/eventHandler');
const { loadCommands } = require('./handlers/commandHandler');

config.validate();
logger.info(`[Config] Guild: ${config.guildId || 'GLOBAL'} | Client: ${config.clientId} | AutoReaction entries: ${require('./managers/AutoReactionManager').size()}`);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // مطلوب لقراءة محتوى الرسائل + المنشن
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  // تحسينات الأداء
  allowedMentions: { parse: ['users'], repliedUser: false },
  rest: { retries: 3, timeout: 15000 },
});

loadCommands(client);
loadEvents(client);

// معالجة الأخطاء العامة - محسنة
process.on('unhandledRejection', (err) => logger.error('[UnhandledRejection]', err?.stack || err));
process.on('uncaughtException', (err) => {
  logger.error('[UncaughtException]', err?.stack || err);
  // لا نخرج مباشرة، نعطي فرصة لإعادة الاتصال
});
client.on('error', (err) => logger.error('[ClientError]', err));
client.on('shardError', (err) => logger.error('[ShardError]', err));
client.on('shardDisconnect', () => logger.warn('[Shard] Disconnected - will reconnect...'));
client.on('shardReconnecting', () => logger.info('[Shard] Reconnecting...'));

// تسجيل دخول مع إعادة محاولة
async function start() {
  try {
    logger.info('[Login] Connecting to Discord...');
    await client.login(config.token);
  } catch (err) {
    logger.error('Failed to login:', err?.message || err);
    logger.error('Check DISCORD_TOKEN in .env - will retry in 10s');
    setTimeout(start, 10000);
  }
}
start();
