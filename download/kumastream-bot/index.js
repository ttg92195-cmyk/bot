// ============================================
// Kumastream Telegram Bot - Level 1
// Framework: Node.js + Telegraf
// Features: Menu, /help, /about, /movies, /series
// ============================================

const { Telegraf, Markup } = require('telegraf');

// Bot Token ကို Environment Variable ကနေယူပါတယ်
const token = process.env.BOT_TOKEN;

if (!token) {
  console.error('BOT_TOKEN environment variable မရှိပါ!');
  console.error('Railway/Render မှာ Environment Variable အနေနဲ့ BOT_TOKEN ထည့်ပါ');
  process.exit(1);
}

const bot = new Telegraf(token);

// ============================================
// Main Menu Keyboard (Inline Buttons)
// ============================================
const mainMenu = Markup.inlineKeyboard([
  [
    Markup.button.callback('🎬 ရုပ်ရှင်များ', 'movies'),
    Markup.button.callback('📺 TV Shows', 'series')
  ],
  [
    Markup.button.callback('🔍 ရှာရန်', 'search'),
    Markup.button.callback('❓ FAQ', 'faq')
  ],
  [
    Markup.button.callback('📱 App Download', 'download'),
    Markup.button.callback('ℹ️ အကြောင်း', 'about')
  ]
]);

// ============================================
// /start command - ကြိုဆိုမှု + Menu ပြပါမယ်
// ============================================
bot.start((ctx) => {
  const welcomeText = `
🎬 *Kumastream မှ ကြိုဆိုပါတယ်!*

သင်၏ ရုပ်ရှင်နှင့် TV Shows ကြည့်ရှုရေး Bot ပါ။

အောက်ပါ Menu မှ ရွေးချယ်နိုင်ပါတယ် ဒါမှမဟုတ် Command တွေသုံးနိုင်ပါတယ်:

/help - အကူအညီ
/about - Kumastream အကြောင်း
/movies - ရုပ်ရှင်များ
/series - TV Shows
`;

  ctx.reply(welcomeText, {
    parse_mode: 'Markdown',
    ...mainMenu
  });
});

// ============================================
// /help command
// ============================================
bot.command('help', (ctx) => {
  const helpText = `
📖 *Kumastream Bot အကူအညီ*

*Command များ:*
/start - Bot ကိုစတင်ရန်
/help - အကူအညီရယူရန်
/about - Kumastream အကြောင်းသိရန်
/movies - ရုပ်ရှင်အသစ်များကြည့်ရန်
/series - TV Shows အသစ်များကြည့်ရန်

*ခလုတ်များ:*
🎬 ရုပ်ရှင်များ - လတ်တလော ရုပ်ရှင်စာရင်း
📺 TV Shows - လတ်တလော Series စာရင်း
🔍 ရှာရန် - ရုပ်ရှင်/Series ရှာဖွေရန်
❓ FAQ - မေးလေ့ရှိသောမေးခွန်းများ
📱 App Download - Kumastream App ဒေါင်းလုပ်
ℹ️ အကြောင်း - Bot အကြောင်းသိရန်

*မက်ဆေ့ခ်တင်ပို့ခြင်း:*
hi - ဟယ်လို ဖြေပါမယ်
`;

  ctx.reply(helpText, {
    parse_mode: 'Markdown',
    ...mainMenu
  });
});

// ============================================
// /about command
// ============================================
bot.command('about', (ctx) => {
  const aboutText = `
ℹ️ *Kumastream အကြောင်း*

Kumastream သည် ရုပ်ရှင်များနှင့် TV Shows များကို အခမဲ့ကြည့်ရှုနိုင်သော Platform တစ်ခုဖြစ်ပါသည်။

*Features:*
🎬 ရုပ်ရှင်အသစ်များ - အမြဲတမ်း Update ဖြစ်နေ
📺 TV Shows များ - နာမည်ကြီး Series တွေ
📱 မည်သည့် Device မဆို ကြည့်ရှုနိုင်
🔄 အမြန် Update - အပိုင်းအသစ် အမြန်တင်ပေး
🎯 အမျိုးအစားစုံ - Action, Comedy, Horror, Romance စသဖြင့်

*ဆက်သွယ်ရန်:*
🌐 Telegram: @kumastream132_bot
`;

  ctx.reply(aboutText, {
    parse_mode: 'Markdown',
    ...mainMenu
  });
});

// ============================================
// /movies command - ရုပ်ရှင်စာရင်း
// ============================================
bot.command('movies', (ctx) => {
  const moviesText = `
🎬 *လတ်တလော ရုပ်ရှင်များ*

*1.* 🎥 Avengers: Endgame
   ။ Action, Sci-Fi | 2019

*2.* 🎥 Spider-Man: No Way Home
   ။ Action, Adventure | 2021

*3.* 🎥 Oppenheimer
   ။ Drama, Biography | 2023

*4.* 🎥 Dune: Part Two
   ။ Sci-Fi, Adventure | 2024

*5.* 🎥 Godzilla x Kong
   ။ Action, Sci-Fi | 2024

📌 ပိုမိုကြည့်ရှုလိုပါက Kumastream App တွင် ဝင်ရောက်ကြည့်ရှုပါ
`;

  ctx.reply(moviesText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔄 ပိုမိုကြည့်ရန်', 'more_movies')],
      [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
    ])
  });
});

// ============================================
// /series command - TV Shows စာရင်း
// ============================================
bot.command('series', (ctx) => {
  const seriesText = `
📺 *လတ်တလော TV Shows များ*

*1.* 📺 Squid Game
   ။ Thriller, Drama | Season 2

*2.* 📺 The Last of Us
   ။ Drama, Horror | Season 2

*3.* 📺 Wednesday
   ။ Comedy, Mystery | Season 2

*4.* 📺 Stranger Things
   ။ Sci-Fi, Horror | Season 5

*5.* 📺 Money Heist
   ။ Crime, Thriller | Complete

📌 ပိုမိုကြည့်ရှုလိုပါက Kumastream App တွင် ဝင်ရောက်ကြည့်ရှုပါ
`;

  ctx.reply(seriesText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔄 ပိုမိုကြည့်ရန်', 'more_series')],
      [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
    ])
  });
});

// ============================================
// Inline Button Callbacks (ခလုတ်နှိပ်ချက်)
// ============================================

// 🎬 ရုပ်ရှင်များ ခလုတ်
bot.action('movies', (ctx) => {
  ctx.answerCbQuery();
  // Reuse /movies command logic
  const moviesText = `
🎬 *လတ်တလော ရုပ်ရှင်များ*

*1.* 🎥 Avengers: Endgame
   ။ Action, Sci-Fi | 2019

*2.* 🎥 Spider-Man: No Way Home
   ။ Action, Adventure | 2021

*3.* 🎥 Oppenheimer
   ။ Drama, Biography | 2023

*4.* 🎥 Dune: Part Two
   ။ Sci-Fi, Adventure | 2024

*5.* 🎥 Godzilla x Kong
   ။ Action, Sci-Fi | 2024

📌 ပိုမိုကြည့်ရှုလိုပါက Kumastream App တွင် ဝင်ရောက်ကြည့်ရှုပါ
`;

  ctx.editMessageText(moviesText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔄 ပိုမိုကြည့်ရန်', 'more_movies')],
      [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
    ])
  });
});

// 📺 TV Shows ခလုတ်
bot.action('series', (ctx) => {
  ctx.answerCbQuery();
  const seriesText = `
📺 *လတ်တလော TV Shows များ*

*1.* 📺 Squid Game
   ။ Thriller, Drama | Season 2

*2.* 📺 The Last of Us
   ။ Drama, Horror | Season 2

*3.* 📺 Wednesday
   ။ Comedy, Mystery | Season 2

*4.* 📺 Stranger Things
   ။ Sci-Fi, Horror | Season 5

*5.* 📺 Money Heist
   ။ Crime, Thriller | Complete

📌 ပိုမိုကြည့်ရှုလိုပါက Kumastream App တွင် ဝင်ရောက်ကြည့်ရှုပါ
`;

  ctx.editMessageText(seriesText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔄 ပိုမိုကြည့်ရန်', 'more_series')],
      [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
    ])
  });
});

// 🔍 ရှာရန် ခလုတ်
bot.action('search', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '🔍 *ရုပ်ရှင်/Series ရှာရန်*\n\nရှာလိုသောအမည်ကို အောက်ပါပုံစံဖြင့်ပို့ပါ:\n\n`/search ရုပ်ရှင်အမည်`\n\nဥပမာ: `/search Avengers`',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
      ])
    }
  );
});

// ❓ FAQ ခလုတ်
bot.action('faq', (ctx) => {
  ctx.answerCbQuery();
  const faqText = `
❓ *မေးလေ့ရှိသောမေးခွန်းများ*

*Q: Kumastream အခမဲ့လား?*
A: ဟုတ်ကဲ့၊ အခမဲ့ကြည့်ရှုနိုင်ပါတယ်။

*Q: ဘယ် Devices တွေမှာကြည့်လို့ရလဲ?*
A: Android, iOS, Web Browser အကုန်မှာကြည့်လို့ရပါတယ်။

*Q: ရုပ်ရှင်အသစ်တွေဘယ်လောက်နှုန်း Update လဲ?*
A: နေ့စဉ် Update ပြုလုပ်ပေးနေပါတယ်။

*Q: Subtitle ရှိလား?*
A: ဟုတ်ကဲ့၊ Myanmar Subtitle ပါဝင်ပါတယ်။

*Q: Download လုပ်လို့ရလား?*
A: ဟုတ်ကဲ့၊ Offlineကြည့်ဖို့ Download လုပ်လို့ရပါတယ်။
`;

  ctx.editMessageText(faqText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
    ])
  });
});

// 📱 App Download ခလုတ်
bot.action('download', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '📱 *Kumastream App Download*\n\nKumastream App ကို ဒီမှာ Download လုပ်နိုင်ပါတယ်:\n\n🤖 Telegram Bot: @kumastream132_bot\n\n📌 App Link များ မကြာခင် Update ပြုလုပ်ပေးသွားပါမည်',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
      ])
    }
  );
});

// ℹ️ အကြောင်း ခလုတ်
bot.action('about', (ctx) => {
  ctx.answerCbQuery();
  const aboutText = `
ℹ️ *Kumastream အကြောင်း*

Kumastream သည် ရုပ်ရှင်များနှင့် TV Shows များကို အခမဲ့ကြည့်ရှုနိုင်သော Platform တစ်ခုဖြစ်ပါသည်။

*Features:*
🎬 ရုပ်ရှင်အသစ်များ - အမြဲတမ်း Update ဖြစ်နေ
📺 TV Shows များ - နာမည်ကြီး Series တွေ
📱 မည်သည့် Device မဆို ကြည့်ရှုနိုင်
🔄 အမြန် Update - အပိုင်းအသစ် အမြန်တင်ပေး
🎯 အမျိုးအစားစုံ - Action, Comedy, Horror, Romance စသဖြင့်

*ဆက်သွယ်ရန်:*
🌐 Telegram: @kumastream132_bot
`;

  ctx.editMessageText(aboutText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
    ])
  });
});

// 🔄 ပိုမိုကြည့်ရန် (Movies)
bot.action('more_movies', (ctx) => {
  ctx.answerCbQuery('ရုပ်ရှင်ပိုမိုကြည့်ရန် Kumastream App တွင်ဝင်ရောက်ပါ');
});

// 🔄 ပိုမိုကြည့်ရန် (Series)
bot.action('more_series', (ctx) => {
  ctx.answerCbQuery('TV Shows ပိုမိုကြည့်ရန် Kumastream App တွင်ဝင်ရောက်ပါ');
});

// 🔙 ပင်မမီနူး ပြန်သွား
bot.action('back_menu', (ctx) => {
  ctx.answerCbQuery();
  const welcomeText = `
🎬 *Kumastream မှ ကြိုဆိုပါတယ်!*

သင်၏ ရုပ်ရှင်နှင့် TV Shows ကြည့်ရှုရေး Bot ပါ။

ဘာလုပ်ချင်ပါသလဲ?
`;

  ctx.editMessageText(welcomeText, {
    parse_mode: 'Markdown',
    ...mainMenu
  });
});

// ============================================
// /search command - ရှာဖွေခြင်း
// ============================================
bot.command('search', (ctx) => {
  const query = ctx.message.text.replace('/search', '').trim();

  if (!query) {
    ctx.reply(
      '🔍 *ရှာဖွေရန်*\n\nရှာလိုသောအမည်ကိုထည့်ပါ:\n`/search ရုပ်ရှင်အမည်`\n\nဥပမာ: `/search Avengers`',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  ctx.reply(
    `🔍 *"${query}" ကိုရှာဖွေခြင်း...*\n\n📌 ရလဒ်များကို Kumastream App တွင်ကြည့်ရှုပါ\n\n🤖 မကြာခင် Search Feature အပြည့်အစုံထွက်ပါမည်`,
    {
      parse_mode: 'Markdown',
      ...mainMenu
    }
  );
});

// ============================================
// "hi" message - ဖြေကြားခြင်း
// ============================================
bot.hears(/hi/i, (ctx) => {
  ctx.reply(
    'Hello bro! 👋\n\nဘာကူညီပေးရမလဲ?',
    mainMenu
  );
});

// ============================================
// အခြား message များအတွက်
// ============================================
bot.on('message', (ctx) => {
  ctx.reply(
    '🤖 ကျွန်တော်ဟာ Kumastream Bot ပါ။\n\nခလုတ်တွေနှိပ်ပြီး အသုံးပြုပါ ဒါမှမဟုတ် "hi" လို့ရိုက်ကြည့်ပါ!',
    mainMenu
  );
});

// ============================================
// Bot ကို Start လုပ်ခြင်း
// ============================================
bot.launch().then(() => {
  console.log('Kumastream Bot Level 1 အသက်ဝင်ပါပြီး!');
}).catch((err) => {
  console.error('Bot စတင်မှု မအောင်မြင်ပါ:', err);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
