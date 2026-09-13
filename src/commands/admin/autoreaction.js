const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const autoReactionManager = require('../../managers/AutoReactionManager');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoreaction')
    .setDescription('إدارة نظام الريأكشن التلقائي')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('إضافة/تحديث ريأكشن تلقائي لعضو')
        .addUserOption((opt) => opt.setName('user').setDescription('العضو المستهدف').setRequired(true))
        .addStringOption((opt) =>
          opt
            .setName('emoji')
            .setDescription('الإيموجي (انسخ <:name:id> أو <a:name:id> أو أرسل Emoji ID)')
            .setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('حذف الريأكشن التلقائي لعضو')
        .addUserOption((opt) => opt.setName('user').setDescription('العضو').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('عرض كل الريأكشنات التلقائية')),

  /**
   * @param {import('discord.js').ChatInputCommandInteraction} interaction
   */
  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // تحقق صلاحية إضافي (حتى لو DefaultMemberPermissions يمنع، نتأكد)
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.reply({ content: '❌ تحتاج صلاحية `Administrator` لاستخدام هذا الأمر.', ephemeral: true });
    }

    if (sub === 'add') {
      const user = interaction.options.getUser('user');
      const emojiInput = interaction.options.getString('emoji');

      if (!autoReactionManager.isValidEmoji(emojiInput)) {
        return interaction.reply({
          content: '❌ صيغة الإيموجي غير صحيحة.\n✅ الصحيح: انسخ الإيموجي كـ `\\<a:name:id>` أو `\\<:name:id>` أو أرسل `Emoji ID` فقط (مثل: `1381234567890123456`).',
          ephemeral: true,
        });
      }

      const parsed = autoReactionManager.parseEmoji(emojiInput);

      // محاولة اختبار الإيموجي (اختياري - نحاول جلب الإيموجي للتأكد)
      // لا نمنع الحفظ إذا فشل الاختبار لأن الإيموجي قد يكون من سيرفر آخر
      let preview = parsed;
      // إذا كان ID فقط نحاول جلبه
      if (/^\d{17,20}$/.test(parsed)) {
        const fetched = interaction.client.emojis.cache.get(parsed);
        if (fetched) preview = fetched.toString();
      }

      autoReactionManager.set(user.id, parsed);

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('✅ تم حفظ الريأكشن التلقائي')
        .setDescription(`سيتم التفاعل تلقائياً بـ ${preview} في الحالات التالية:\n• عندما يكتب <@${user.id}> أي رسالة\n• عندما يتم منشنة <@${user.id}> في أي رسالة`)
        .addFields(
          { name: 'العضو', value: `${user.tag} (<@${user.id}>)`, inline: true },
          { name: 'الإيموجي المحفوظ', value: `\`${parsed}\``, inline: true }
        )
        .setFooter({ text: `Member ID: ${user.id} | Emoji: ${parsed}` })
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'remove') {
      const user = interaction.options.getUser('user');
      const existed = autoReactionManager.delete(user.id);
      if (!existed) {
        return interaction.reply({ content: `⚠️ العضو ${user.tag} لا يملك ريأكشن تلقائي.`, ephemeral: true });
      }
      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle('🗑️ تم الحذف')
        .setDescription(`تم حذف الريأكشن التلقائي للعضو ${user.tag} (<@${user.id}>)`)
        .setTimestamp();
      return interaction.reply({ embeds: [embed] });
    }

    if (sub === 'list') {
      const all = autoReactionManager.getAll();
      if (all.length === 0) {
        return interaction.reply({ content: '📭 لا يوجد أي ريأكشن تلقائي حالياً.', ephemeral: true });
      }

      // تقسيم إلى صفحات إذا كان كثير (discord limit 6000 chars)
      const lines = all.map(({ userId, emoji }, i) => {
        // محاولة عرض الإيموجي بشكل جميل
        let display = `\`${emoji}\``;
        // إذا كان ID، حاول تحويله لإيموجي
        if (/^\d{17,20}$/.test(emoji)) {
          const e = interaction.client.emojis.cache.get(emoji);
          if (e) display = `${e.toString()} (\`${emoji}\`)`;
        } else if (/^<a?:\w+:\d+>$/.test(emoji)) {
          display = `${emoji} (\`${emoji}\`)`;
        }
        return `**${i + 1}.** <@${userId}> (\`${userId}\`) → ${display}`;
      });

      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(`📌 قائمة الريأكشنات التلقائية (${all.length})`)
        .setDescription(lines.join('\n').slice(0, 4000))
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });
    }
  },
};
