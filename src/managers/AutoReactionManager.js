const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// المسار الأساسي الجديد حسب طلبك: config.json في جذر المشروع
const CONFIG_PATH = path.join(__dirname, '../../config.json');
// مسار قديم للتوافق (لو موجود)
const LEGACY_PATH = path.join(__dirname, '../data/autoReactions.json');

/**
 * مدير الريأكشن التلقائي
 * يخزن البيانات على شكل: { "userId": "emojiIdentifier" }
 * emojiIdentifier يمكن أن يكون:
 *  - "<a:name:id>" أو "<:name:id>" للإيموجي المخصص
 *  - "id" فقط للإيموجي المخصص
 *  - "😀" للإيموجي العادي
 */
class AutoReactionManager {
  constructor() {
    this.reactions = new Map();
    this.load();
    this.watchConfig();
  }

  /**
   * تحميل البيانات من config.json (الحقل autoReactions)
   * يدعم أيضاً الملف القديم للتوافق
   */
  load() {
    try {
      let data = null;

      // 1) حاول قراءة config.json الجديد
      if (fs.existsSync(CONFIG_PATH)) {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
        // إزالة التعليقات من نوع // لأن JSON لا يدعمها (نحذف أسطر التعليقات)
        const cleaned = raw
          .split('\n')
          .filter((line) => !line.trim().startsWith('//'))
          .join('\n');
        const json = JSON.parse(cleaned);
        // يدعم صيغتين: { "autoReactions": { "id": "emoji" } } أو { "autoReactions": [ {userId, emojiId} ] }
        if (json.autoReactions) {
          if (Array.isArray(json.autoReactions)) {
            data = Object.fromEntries(json.autoReactions.map((e) => [e.userId || e.memberId || e.id, e.emojiId || e.emoji]));
          } else if (typeof json.autoReactions === 'object') {
            data = json.autoReactions;
          }
        } else {
          // لو الملف نفسه هو map مباشر
          data = json;
        }
      } else if (fs.existsSync(LEGACY_PATH)) {
        // توافق مع النظام القديم
        const raw = fs.readFileSync(LEGACY_PATH, 'utf-8');
        data = JSON.parse(raw);
        logger.warn('[AutoReaction] Using legacy data file, please migrate to config.json');
      } else {
        // إنشاء config.json فارغ
        this.save();
        logger.info('[AutoReaction] Created new config.json');
        return;
      }

      // تنظيف: احذف التعليقات المفتاحية (_comment, _example) والمدخلات الفارغة
      const entries = Object.entries(data || {}).filter(([k, v]) => k && v && !k.startsWith('//') && !k.startsWith('_') && k !== '//');
      this.reactions = new Map(entries);
      logger.info(`[AutoReaction] Loaded ${this.reactions.size} entries from config.json`);
    } catch (err) {
      logger.error('[AutoReaction] Failed to load config.json:', err);
      this.reactions = new Map();
    }
  }

  /**
   * حفظ البيانات إلى config.json (يحافظ على باقي الحقول)
   */
  save() {
    try {
      let existing = {};
      let preservedComments = {};
      if (fs.existsSync(CONFIG_PATH)) {
        try {
          const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
          const cleaned = raw
            .split('\n')
            .filter((line) => !line.trim().startsWith('//'))
            .join('\n');
          existing = JSON.parse(cleaned);
          // احتفظ بمفاتيح الشرح التي تبدأ بـ _ حتى لا تضيع الأمثلة
          if (existing.autoReactions && typeof existing.autoReactions === 'object' && !Array.isArray(existing.autoReactions)) {
            for (const [k, v] of Object.entries(existing.autoReactions)) {
              if (k.startsWith('_')) preservedComments[k] = v;
            }
          }
        } catch (_) {
          existing = {};
        }
      }
      existing.autoReactions = { ...preservedComments, ...Object.fromEntries(this.reactions) };
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(existing, null, 2), 'utf-8');
    } catch (err) {
      logger.error('[AutoReaction] Failed to save config.json:', err);
    }
  }

  /**
   * مراقبة config.json وإعادة التحميل تلقائياً بدون ريستارت
   */
  watchConfig() {
    try {
      if (!fs.existsSync(CONFIG_PATH)) return;
      fs.watchFile(CONFIG_PATH, { interval: 1000 }, (curr, prev) => {
        if (curr.mtime !== prev.mtime) {
          logger.info('[AutoReaction] config.json changed -> reloading...');
          this.load();
        }
      });
    } catch (err) {
      logger.warn('[AutoReaction] Failed to watch config.json:', err.message);
    }
  }

  /**
   * تحويل مدخل الإيموجي إلى معرف صالح لـ message.react()
   * يدعم:
   *  - "<a:name:id>" -> "a:name:id" أو يبقى كما هو
   *  - "<:name:id>" -> "name:id"
   *  - "123456789012345678" (ID فقط) -> يبقى كما هو
   *  - "😀" -> يبقى كما هو
   */
  parseEmoji(input) {
    const trimmed = input.trim();

    // إذا كان بالصيغة <a:name:id> أو <:name:id>
    const customMatch = trimmed.match(/^<a?:(\w+):(\d+)>$/);
    if (customMatch) {
      return trimmed; // discord.js يقبل الصيغة الكاملة
    }

    // إذا كان ID فقط (أرقام 17-20 خانة)
    if (/^\d{17,20}$/.test(trimmed)) {
      return trimmed;
    }

    // غير ذلك اعتبره إيموجي عادي أو معرف مخصص بصيغة name:id
    return trimmed;
  }

  /**
   * التحقق من صحة الإيموجي
   */
  isValidEmoji(input) {
    const trimmed = input.trim();
    if (!trimmed) return false;
    if (/^<a?:\w+:\d+>$/.test(trimmed)) return true;
    if (/^\d{17,20}$/.test(trimmed)) return true;
    // إيموجي يونيكود (على الأقل حرف واحد)
    if (trimmed.length >= 1 && trimmed.length <= 20) return true;
    return false;
  }

  /**
   * إضافة أو تحديث ريأكشن لعضو
   * @param {string} userId - معرف العضو
   * @param {string} emojiInput - الإيموجي (ID أو <a:name:id> أو يونيكود)
   * @returns {string} المعرف المحفوظ
   */
  set(userId, emojiInput) {
    const emoji = this.parseEmoji(emojiInput);
    this.reactions.set(userId, emoji);
    this.save();
    logger.info(`[AutoReaction] Set ${userId} -> ${emoji}`);
    return emoji;
  }

  /**
   * حذف ريأكشن عضو
   */
  delete(userId) {
    const existed = this.reactions.delete(userId);
    if (existed) this.save();
    return existed;
  }

  /**
   * جلب إيموجي عضو
   */
  get(userId) {
    return this.reactions.get(userId) || null;
  }

  /**
   * هل يوجد ريأكشن لهذا العضو
   */
  has(userId) {
    return this.reactions.has(userId);
  }

  /**
   * جلب كل المدخلات
   */
  getAll() {
    return Array.from(this.reactions.entries()).map(([userId, emoji]) => ({
      userId,
      emoji,
    }));
  }

  /**
   * عدد المدخلات
   */
  size() {
    return this.reactions.size;
  }
}

// Singleton
const manager = new AutoReactionManager();
module.exports = manager;
