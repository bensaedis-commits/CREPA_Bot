require('dotenv').config();

const config = {
  token: process.env.DISCORD_TOKEN,
  guildId: process.env.GUILD_ID,
  clientId: process.env.CLIENT_ID,
  env: process.env.NODE_ENV || 'production',

  // إعدادات البوت
  colors: {
    primary: 0x5865F2,
    success: 0x57F287,
    error: 0xED4245,
    warning: 0xFEE75C,
  },

  // التحقق من المتغيرات المطلوبة
  validate() {
    const missing = [];
    if (!this.token) missing.push('DISCORD_TOKEN');
    if (!this.clientId) missing.push('CLIENT_ID');
    // GUILD_ID اختياري - إذا لم يوجد ستنشر الأوامر Globally
    if (missing.length > 0) {
      throw new Error(`Missing required env variables: ${missing.join(', ')}`);
    }
  },
};

module.exports = config;
