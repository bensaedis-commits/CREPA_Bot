const autoReactionManager = require('../managers/AutoReactionManager');
const logger = require('../utils/logger');

module.exports = {
  name: 'messageCreate',
  /**
   * @param {import('discord.js').Message} message
   */
  async execute(message, client) {
    // تجاهل رسائل البوتات لمنع الحلقات اللانهائية
    if (message.author.bot) return;
    // تجاهل الرسائل في الخاص (اختياري - يعمل فقط في السيرفرات)
    if (!message.guild) return;

    const toReact = new Set();

    // 1) إذا كاتب الرسالة لديه ريأكشن مخصص -> أضفه
    const authorEmoji = autoReactionManager.get(message.author.id);
    if (authorEmoji) {
      toReact.add(authorEmoji);
    }

    // 2) إذا تم منشنة أي شخص لديه ريأكشن مخصص -> أضف ريأكشنه
    // message.mentions.users يحتوي كل المنشنات في الرسالة
    for (const [userId] of message.mentions.users) {
      // لا تكرر ريأكشن الكاتب إذا كان هو نفسه ممنشن
      const emoji = autoReactionManager.get(userId);
      if (emoji) {
        toReact.add(emoji);
      }
    }

    // لا يوجد شيء للتفاعل به
    if (toReact.size === 0) return;

    // تنفيذ الريأكشنات بشكل متوازي وسريع مع معالجة الأخطاء
    const promises = Array.from(toReact).map(async (emoji) => {
      try {
        await message.react(emoji);
        logger.debug(`[AutoReaction] Reacted ${emoji} on msg ${message.id}`);
      } catch (err) {
        // تجاهل أخطاء الريأكشن المكرر أو الإيموجي غير الصالح
        if (err.code === 30010) {
          logger.warn(`[AutoReaction] Max reactions reached on ${message.id}`);
        } else if (err.code === 10014) {
          logger.warn(`[AutoReaction] Unknown emoji ${emoji} - check if bot is in emoji server`);
        } else if (err.code !== 90001) { // تجاهل already reacted
          logger.warn(`[AutoReaction] Failed ${emoji} on ${message.id}: ${err.message} (code:${err.code})`);
        }
      }
    });
    await Promise.all(promises);
  },
};
