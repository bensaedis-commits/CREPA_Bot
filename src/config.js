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

  // التحقق من المتغيرات المطلوبة - محسن
  validate() {
    const missing = [];
    if (!this.token || this.token.trim().length < 50) missing.push('DISCORD_TOKEN (invalid or missing)');
    if (!this.clientId) missing.push('CLIENT_ID');
    if (missing.length > 0) {
      console.error('[CONFIG] Missing env:', missing.join(', '));
      console.error('[CONFIG] Check .env file exists and has correct values');
      throw new Error(`Missing required env variables: ${missing.join(', ')}`);
    }
    // تنظيف التوكن من المسافات
    this.token = this.token.trim();
  },
};

module.exports = config;
