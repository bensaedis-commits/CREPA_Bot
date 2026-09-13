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

    // تنفيذ الريأكشنات بالتتالي لتجنب Rate Limit
    for (const emoji of toReact) {
      try {
        await message.react(emoji);
        logger.debug(`[AutoReaction] Reacted ${emoji} on msg ${message.id} (author:${message.author.id})`);
      } catch (err) {
        // أخطاء شائعة: إيموجي غير موجود، البوت لا يملك صلاحية، إيموجي من سيرفر لا يتواجد فيه البوت
        logger.warn(`[AutoReaction] Failed to react ${emoji} on msg ${message.id}: ${err.message} (code:${err.code})`);
        // لا نوقف الحلقة - نحاول باقي الإيموجيات
      }
    }
  },
};
