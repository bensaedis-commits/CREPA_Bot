/**
 * سكريبت نشر أوامر السلاش
 * - إذا وُجد GUILD_ID ينشر الأوامر على السيرفر فقط (فوري - للتطوير)
 * - إذا لم يوجد ينشر Globally (يأخذ حتى ساعة)
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('./config');
const logger = require('./utils/logger');

config.validate();

const commands = [];
const commandsPath = path.join(__dirname, 'commands');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && entry.name.endsWith('.js')) {
      const cmd = require(full);
      if (cmd.data) {
        commands.push(cmd.data.toJSON());
        logger.info(`[Deploy] Found: ${cmd.data.name}`);
      }
    }
  }
}

walk(commandsPath);

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    logger.info(`Deploying ${commands.length} command(s)...`);

    let data;
    if (config.guildId) {
      // نشر خاص بالسيرفر (instant)
      data = await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), {
        body: commands,
      });
      logger.success(`Successfully deployed ${data.length} GUILD command(s) to ${config.guildId}`);
    } else {
      // نشر Global
      data = await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
      logger.success(`Successfully deployed ${data.length} GLOBAL command(s)`);
    }
  } catch (err) {
    logger.error('Deploy failed:', err);
    process.exit(1);
  }
})();
