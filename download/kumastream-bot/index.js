// ============================================
// Kumastream Telegram Bot - Level 2
// Framework: Node.js + Telegraf
// Features: Menu, Categories, Trending, Search,
//           Enhanced FAQ, Download Links
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
// MOVIES DATABASE (ဒေတာသိမ်းဆည်းခြင်း)
// ============================================
const moviesDB = {
  action: [
    { title: 'Avengers: Endgame', year: 2019, rating: '8.4', desc: 'Thanos ကိုတိုက်ဖို့ Heroes အကုန်ပြန်စုစည်းတဲ့ Epic Battle' },
    { title: 'Spider-Man: No Way Home', year: 2021, rating: '8.2', desc: 'Multiverse ဖွင့်မိလို့ Spider-Man ၃ ယောက်ပေါင်းတဲ့ Adventure' },
    { title: 'John Wick: Chapter 4', year: 2023, rating: '7.7', desc: 'John Wick ရဲ့ နောက်ဆုံးတိုက်ပွဲကြီး' },
    { title: 'Top Gun: Maverick', year: 2022, rating: '8.3', desc: 'Pilot အဖြစ် ပြန်လာတဲ့ Maverick ရဲ့ စိတ်လှုပ်ရှားဖွယ် Mission' },
    { title: 'Godzilla x Kong', year: 2024, rating: '6.5', desc: 'Godzilla နဲ့ Kong ပူးပေါင်းတိုက်တဲ့ Action Blockbuster' },
    { title: 'Fast X', year: 2023, rating: '5.9', desc: 'Dom ရဲ့ မိသားစုကို ခြိမ်းခြောက်လာတဲ့ Dante' },
    { title: 'Extraction 2', year: 2023, rating: '7.1', desc: 'Tyler Rake ပြန်လာတဲ့ အသက်ရှူမဝတဲ့ Action' },
    { title: 'The Batman', year: 2022, rating: '7.8', desc: 'Batman အသစ်ဗားရှင်း - Dark, Gritty Detective Story' },
  ],
  comedy: [
    { title: 'The Super Mario Bros. Movie', year: 2023, rating: '7.1', desc: 'Mario နဲ့ Luigi ရဲ့ Mushroom Kingdom ကိုကယ်တင်တဲ့ခရီး' },
    { title: 'Barbie', year: 2023, rating: '6.9', desc: 'Barbie Land ကနေ Real World ကိုသွားတဲ့ ရယ်ရတဲ့ခရီး' },
    { title: 'No Hard Feelings', year: 2023, rating: '6.4', desc: 'Jennifer Lawrence ရဲ့ Hilarious Comedy' },
    { title: 'Elemental', year: 2023, rating: '7.0', desc: 'မီးနဲ့ေရတို့ရဲ့ ချစ်ခြင်းမေတ္တာ Story' },
    { title: 'Wonka', year: 2023, rating: '7.1', desc: 'Chocolate ဘုရင် Wonka ရဲ့ ငယ်ဘဝ Story' },
    { title: 'Anyone But You', year: 2023, rating: '6.2', desc: 'ရန်သူနှစ်ယောက် ချစ်သူဖြစ်သွားတဲ့ Romantic Comedy' },
  ],
  horror: [
    { title: 'Talk to Me', year: 2023, rating: '7.1', desc: 'ဝိဉာဉ်ခေါ်တဲ့လက်ပတ်ကိုသုံးတဲ့ ဆိုးကျိုး' },
    { title: 'The Nun II', year: 2023, rating: '5.6', desc: 'Demon Nun ပြန်လာတဲ့ ကြောက်ရွံ့ဖွယ် Sequel' },
    { title: 'Five Nights at Freddy\'s', year: 2023, rating: '5.5', desc: 'Animatronic တွေကြားမှာ အသက်ရှူသွားရတဲ့ည' },
    { title: 'Scream VI', year: 2023, rating: '6.5', desc: 'Ghostface ပြန်လာတဲ့ NYC Horror' },
    { title: 'Insidious: The Red Door', year: 2023, rating: '5.7', desc: 'Dalton ပြန်ဝင်တဲ့ The Further ကမ္ဘာ' },
    { title: 'M3GAN', year: 2023, rating: '6.4', desc: 'AI Robot ကလေး ထိန်းမနိုင်သွားတဲ့ Horror' },
  ],
  romance: [
    { title: 'Anyone But You', year: 2023, rating: '6.2', desc: 'ရန်သူနှစ်ယောက် ချစ်သူဖြစ်သွားတဲ့ Story' },
    { title: 'Purple Hearts', year: 2022, rating: '7.1', desc: 'စစ်သားနဲ့ သီချင်းဆရာမရဲ့ အတုချစ်ခြင်း' },
    { title: 'After Everything', year: 2023, rating: '5.2', desc: 'Hardin နဲ့ Tessa ရဲ့ နောက်ဆုံးအပိုင်း' },
    { title: 'Red, White & Royal Blue', year: 2023, rating: '6.9', desc: 'US President သားနဲ့ British Prince ချစ်ကြတဲ့ Story' },
    { title: 'The Idea of You', year: 2024, rating: '6.5', desc: ' Boy Band ခေါင်းဆောင်နဲ့ အမေရဲ့ ချစ်ခြင်း' },
  ],
  scifi: [
    { title: 'Dune: Part Two', year: 2024, rating: '8.6', desc: 'Paul Atreides ရဲ့ Arrakis ကမ္ဘာပေါ်မှာ တိုက်ပွဲကြီး' },
    { title: 'Oppenheimer', year: 2023, rating: '8.3', desc: 'အဏုမြူဗုံးဖန်တီးသူရဲ့ ဇာတ်ကြောင်း' },
    { title: 'The Creator', year: 2023, rating: '6.8', desc: 'AI နဲ့ လူသားတွေရဲ့ စစ်ပွဲကြီး' },
    { title: 'Guardians of the Galaxy Vol. 3', year: 2023, rating: '8.0', desc: 'Guardians ရဲ့ နောက်ဆုံးခရီးစဉ်' },
    { title: 'Rebel Moon', year: 2023, rating: '5.5', desc: 'Zack Snyder ရဲ့ Space Epic' },
    { title: '65', year: 2023, rating: '5.4', desc: 'Dinosaur ခေတ်မှာ ပြန်ရောက်သွားတဲ့ Space Pilot' },
  ],
};

const seriesDB = {
  trending: [
    { title: 'Squid Game Season 2', year: 2024, rating: '7.8', status: 'Now Airing', desc: 'Game ပြန်စ်တဲ့ Seong Gi-hun' },
    { title: 'The Last of Us Season 2', year: 2025, rating: '8.7', status: 'Now Airing', desc: 'Joel နဲ့ Ellie ရဲ့ Post-Apocalyptic ခရီး' },
    { title: 'Wednesday Season 2', year: 2025, rating: '8.1', status: 'Coming Soon', desc: 'Wednesday Addams ရဲ့ နောက်ထပ် Mystery' },
    { title: 'Stranger Things Season 5', year: 2025, rating: '8.7', status: 'Final Season', desc: 'Hawkins ကိုကယ်တင်တဲ့ နောက်ဆုံးတိုက်ပွဲ' },
    { title: 'House of the Dragon Season 2', year: 2024, rating: '8.4', status: 'Now Airing', desc: 'Targaryen မျိုးနွယ်ရဲ့ ပြည်တွင်းစစ်' },
  ],
  korean: [
    { title: 'Squid Game', year: 2021, rating: '8.0', status: '2 Seasons', desc: 'လူငွေရှာတဲ့ Game ကိုဆက်တက်တဲ့သူတွေ' },
    { title: 'All of Us Are Dead', year: 2022, rating: '7.5', status: '1 Season', desc: 'Zombie ပိုးဝင်တဲ့ကျောင်းကနေ အသက်ရှူသွားရတဲ့သူများ' },
    { title: 'Sweet Home', year: 2020, rating: '7.3', status: '3 Seasons', desc: 'Monster ဖြစ်သွားတဲ့လူတွေနဲ့ ရင်ဆိုင်တဲ့သူ' },
    { title: 'My Name', year: 2021, rating: '7.8', status: '1 Season', desc: 'အဖေဘားကြောင့် ဂိုဏ်းဝင်တဲ့မိန်းကလေး' },
    { title: 'Hellbound', year: 2021, rating: '7.3', status: '2 Seasons', desc: 'ငရဲကပေးတဲ့ ပြစ်ဒဏ်ကို ကြောက်ရွံ့တဲ့လူ့အဖွဲ့' },
  ],
  anime: [
    { title: 'Demon Slayer Season 4', year: 2024, rating: '8.9', status: 'Now Airing', desc: 'Tanjiro ရဲ့ Hashira Training Arc' },
    { title: 'Jujutsu Kaisen Season 3', year: 2024, rating: '8.6', status: 'Now Airing', desc: 'Culling Game ရဲ့ နောက်ထပ်တိုက်ပွဲ' },
    { title: 'One Piece', year: 1999, rating: '9.0', status: 'Ongoing', desc: 'Luffy ရဲ့ Pirate King ဖြစ်ဖို့ခရီး' },
    { title: 'Attack on Titan', year: 2013, rating: '9.1', status: 'Complete', desc: 'Titan တွေကိုတိုက်တဲ့ လူသားတွေရဲ့ပွဲ' },
    { title: 'Solo Leveling Season 2', year: 2025, rating: '8.5', status: 'Coming Soon', desc: 'Sung Jin-woo ရဲ့ နောက်ထပ် Level Up' },
  ],
  western: [
    { title: 'Breaking Bad', year: 2008, rating: '9.5', status: 'Complete', desc: 'ဆရာဝနးဖြစ်စဉ် Meth ထုတ်တဲ့ Walter White' },
    { title: 'Money Heist', year: 2017, rating: '8.2', status: 'Complete', desc: 'Professor ဦးဆောင်တဲ့ ဘဏ်လုတဲ့အဖွဲ့' },
    { title: 'Peaky Blinders', year: 2013, rating: '8.8', status: 'Complete', desc: 'Tommy Shelby ရဲ့ Crime Empire' },
    { title: 'The Witcher', year: 2019, rating: '8.0', status: '3 Seasons', desc: 'Geralt ရဲ့ Monster Hunter ဘဝ' },
    { title: 'The Boys', year: 2019, rating: '8.7', status: '4 Seasons', desc: 'Superhero တွေရဲ့ အမှန်တရားကိုဖော်ထုတ်တဲ့သူတွေ' },
  ],
};

// ============================================
// HELPER: Format movie/series list
// ============================================
function formatList(items, emoji = '🎥') {
  return items.map((item, i) => {
    const statusText = item.status ? ` | ${item.status}` : '';
    return `${emoji} *${i + 1}. ${item.title}*\n   ⭐ ${item.rating} | ${item.year}${statusText}\n   ${item.desc}`;
  }).join('\n\n');
}

// ============================================
// Main Menu Keyboard (Inline Buttons)
// ============================================
const mainMenu = Markup.inlineKeyboard([
  [
    Markup.button.callback('🎬 ရုပ်ရှင်များ', 'movies'),
    Markup.button.callback('📺 TV Shows', 'series')
  ],
  [
    Markup.button.callback('🔥 Trending', 'trending'),
    Markup.button.callback('📂 အမျိုးအစား', 'categories')
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
// /start command
// ============================================
bot.start((ctx) => {
  const welcomeText = `
🎬 *Kumastream မှ ကြိုဆိုပါတယ်!*

သင်၏ ရုပ်ရှင်နှင့် TV Shows ကြည့်ရှုရေး Bot ပါ။

အောက်ပါ Menu မှ ရွေးချယ်နိုင်ပါတယ်:

/help - အကူအညီ
/about - Kumastream အကြောင်း
/movies - ရုပ်ရှင်များ
/series - TV Shows
/trending - လူကြိုက်များနေသည်
/categories - အမျိုးအစားများ
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
/movies - ရုပ်ရှင်များကြည့်ရန်
/series - TV Shows ကြည့်ရန်
/trending - လူကြိုက်များနေသည်
/categories - အမျိုးအစားရွေးရန်
/search - ရှာဖွေရန်

*ခလုတ်များ:*
🎬 ရုပ်ရှင်များ - အမျိုးအစားအလိုက် ရုပ်ရှင်
📺 TV Shows - အမျိုးအစားအလိုက် Series
🔥 Trending - လူကြိုက်များနေသည်
📂 အမျိုးအစား - Action, Comedy, Horror စသဖြင့်
🔍 ရှာရန် - ရုပ်ရှင်/Series ရှာဖွေရန်
❓ FAQ - မေးလေ့ရှိသောမေးခွန်းများ
📱 App Download - Kumastream App ဒေါင်းလုပ်
ℹ️ အကြောင်း - Bot အကြောင်းသိရန်
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
🔥 Trending - လူကြိုက်များနေတဲ့ အကြောင်းအရာ
📂 Categories - အမျိုးအစားအလိုက် ရွေးချယ်နိုင်
🔍 Search - ရုပ်ရှင်/Series ရှာဖွေနိုင်
📱 မည်သည့် Device မဆို ကြည့်ရှုနိုင်
🔄 အမြန် Update - အပိုင်းအသစ် အမြန်တင်ပေး
🎯 Myanmar Subtitle - မြန်မာစာမျက်နှာစာ ပါဝင်

*ဆက်သွယ်ရန်:*
🌐 Telegram: @kumastream132_bot
`;

  ctx.reply(aboutText, {
    parse_mode: 'Markdown',
    ...mainMenu
  });
});

// ============================================
// /movies command
// ============================================
bot.command('movies', (ctx) => {
  ctx.reply('🎬 *ရုပ်ရှင်အမျိုးအစားရွေးချယ်ပါ*', {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('💥 Action', 'cat_action'),
        Markup.button.callback('😂 Comedy', 'cat_comedy')
      ],
      [
        Markup.button.callback('👻 Horror', 'cat_horror'),
        Markup.button.callback('💕 Romance', 'cat_romance')
      ],
      [
        Markup.button.callback('🚀 Sci-Fi', 'cat_scifi'),
        Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')
      ]
    ])
  });
});

// ============================================
// /series command
// ============================================
bot.command('series', (ctx) => {
  ctx.reply('📺 *TV Shows အမျိုးအစားရွေးချယ်ပါ*', {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('🔥 Trending', 'ser_trending'),
        Markup.button.callback('🇰🇷 Korean', 'ser_korean')
      ],
      [
        Markup.button.callback('🇯🇵 Anime', 'ser_anime'),
        Markup.button.callback('🇺🇸 Western', 'ser_western')
      ],
      [
        Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')
      ]
    ])
  });
});

// ============================================
// /trending command
// ============================================
bot.command('trending', (ctx) => {
  const trendingMovies = moviesDB.action.slice(0, 3);
  const trendingSeries = seriesDB.trending.slice(0, 3);

  const text = `
🔥 *လူကြိုက်များနေသည်*

*— ရုပ်ရှင်များ —*
${formatList(trendingMovies, '🎬')}

*— TV Shows —*
${formatList(trendingSeries, '📺')}

📌 ပိုမိုကြည့်ရှုလိုပါက Kumastream App တွင် ဝင်ရောက်ကြည့်ရှုပါ
`;

  ctx.reply(text, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('🎬 ရုပ်ရှင်ပိုမို', 'movies'),
        Markup.button.callback('📺 TV Showsပိုမို', 'series')
      ],
      [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
    ])
  });
});

// ============================================
// /categories command
// ============================================
bot.command('categories', (ctx) => {
  const catText = `
📂 *အမျိုးအစားများ*

ရုပ်ရှင် ဒါမှမဟုတ် TV Shows အမျိုးအစားကို ရွေးချယ်ပါ
`;

  ctx.reply(catText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🎬 ရုပ်ရှင်အမျိုးအစား', 'movies')],
      [Markup.button.callback('📺 TV Shows အမျိုးအစား', 'series')],
      [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
    ])
  });
});

// ============================================
// /search command - ရှာဖွေခြင်း (Enhanced)
// ============================================
bot.command('search', (ctx) => {
  const query = ctx.message.text.replace('/search', '').trim();

  if (!query) {
    ctx.reply(
      '🔍 *ရုပ်ရှင်/Series ရှာဖွေရန်*\n\nရှာလိုသောအမည်ကို အောက်ပါပုံစံဖြင့်ပို့ပါ:\n\n`/search ရုပ်ရှင်အမည်`\n\nဥပမာ:\n`/search Avengers`\n`/search Squid Game`\n`/search action`',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const queryLower = query.toLowerCase();

  // ရုပ်ရှင်ထဲမှာရှာမယ်
  const movieResults = [];
  for (const [cat, movies] of Object.entries(moviesDB)) {
    for (const movie of movies) {
      if (movie.title.toLowerCase().includes(queryLower) || cat.includes(queryLower)) {
        movieResults.push({ ...movie, category: cat });
      }
    }
  }

  // Series ထဲမှာရှာမယ်
  const seriesResults = [];
  for (const [cat, shows] of Object.entries(seriesDB)) {
    for (const show of shows) {
      if (show.title.toLowerCase().includes(queryLower) || cat.includes(queryLower)) {
        seriesResults.push({ ...show, category: cat });
      }
    }
  }

  if (movieResults.length === 0 && seriesResults.length === 0) {
    ctx.reply(
      `🔍 *"${query}" ရှာမတွေ့ပါ*\n\nတခြားစကားလုံးနဲ့ ထပ်ရှာကြည့်ပါ ဒါမှမဟုတ် Categories ကနေရွေးချယ်ပါ`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('📂 အမျိုးအစားများ', 'categories')],
          [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
        ])
      }
    );
    return;
  }

  let resultText = `🔍 *"${query}" ရှာဖွေရလဒ်များ*\n\n`;

  if (movieResults.length > 0) {
    resultText += `*— ရုပ်ရှင်များ (${movieResults.length}) —*\n${formatList(movieResults.slice(0, 5), '🎬')}\n\n`;
  }

  if (seriesResults.length > 0) {
    resultText += `*— TV Shows (${seriesResults.length}) —*\n${formatList(seriesResults.slice(0, 5), '📺')}\n\n`;
  }

  resultText += '📌 ပိုမိုကြည့်ရှုလိုပါက Kumastream App တွင် ဝင်ရောက်ကြည့်ရှုပါ';

  ctx.reply(resultText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
    ])
  });
});

// ============================================
// INLINE BUTTON CALLBACKS
// ============================================

// 🎬 ရုပ်ရှင်များ Menu
bot.action('movies', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText('🎬 *ရုပ်ရှင်အမျိုးအစားရွေးချယ်ပါ*', {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('💥 Action', 'cat_action'),
        Markup.button.callback('😂 Comedy', 'cat_comedy')
      ],
      [
        Markup.button.callback('👻 Horror', 'cat_horror'),
        Markup.button.callback('💕 Romance', 'cat_romance')
      ],
      [
        Markup.button.callback('🚀 Sci-Fi', 'cat_scifi'),
        Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')
      ]
    ])
  });
});

// 📺 TV Shows Menu
bot.action('series', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText('📺 *TV Shows အမျိုးအစားရွေးချယ်ပါ*', {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('🔥 Trending', 'ser_trending'),
        Markup.button.callback('🇰🇷 Korean', 'ser_korean')
      ],
      [
        Markup.button.callback('🇯🇵 Anime', 'ser_anime'),
        Markup.button.callback('🇺🇸 Western', 'ser_western')
      ],
      [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
    ])
  });
});

// ---- ရုပ်ရှင် Category Callbacks ----
const movieCategories = {
  cat_action: { key: 'action', label: '💥 Action', emoji: '💥' },
  cat_comedy: { key: 'comedy', label: '😂 Comedy', emoji: '😂' },
  cat_horror: { key: 'horror', label: '👻 Horror', emoji: '👻' },
  cat_romance: { key: 'romance', label: '💕 Romance', emoji: '💕' },
  cat_scifi: { key: 'scifi', label: '🚀 Sci-Fi', emoji: '🚀' },
};

for (const [actionId, catInfo] of Object.entries(movieCategories)) {
  bot.action(actionId, (ctx) => {
    ctx.answerCbQuery();
    const movies = moviesDB[catInfo.key];
    const text = `${catInfo.label} *ရုပ်ရှင်များ*\n\n${formatList(movies, catInfo.emoji)}\n\n📌 ပိုမိုကြည့်ရှုလိုပါက Kumastream App တွင် ဝင်ရောက်ကြည့်ရှုပါ`;

    ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 ရုပ်ရှင်အမျိုးအစား', 'movies')],
        [Markup.button.callback('🏠 ပင်မမီနူး', 'back_menu')]
      ])
    });
  });
}

// ---- TV Shows Category Callbacks ----
const seriesCategories = {
  ser_trending: { key: 'trending', label: '🔥 Trending', emoji: '🔥' },
  ser_korean: { key: 'korean', label: '🇰🇷 Korean Drama', emoji: '🇰🇷' },
  ser_anime: { key: 'anime', label: '🇯🇵 Anime', emoji: '🇯🇵' },
  ser_western: { key: 'western', label: '🇺🇸 Western', emoji: '🇺🇸' },
};

for (const [actionId, catInfo] of Object.entries(seriesCategories)) {
  bot.action(actionId, (ctx) => {
    ctx.answerCbQuery();
    const shows = seriesDB[catInfo.key];
    const text = `${catInfo.label} *TV Shows*\n\n${formatList(shows, catInfo.emoji)}\n\n📌 ပိုမိုကြည့်ရှုလိုပါက Kumastream App တွင် ဝင်ရောက်ကြည့်ရှုပါ`;

    ctx.editMessageText(text, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 TV Shows အမျိုးအစား', 'series')],
        [Markup.button.callback('🏠 ပင်မမီနူး', 'back_menu')]
      ])
    });
  });
}

// 🔥 Trending
bot.action('trending', (ctx) => {
  ctx.answerCbQuery();
  const trendingMovies = moviesDB.action.slice(0, 3);
  const trendingSeries = seriesDB.trending.slice(0, 3);

  const text = `
🔥 *လူကြိုက်များနေသည်*

*— ရုပ်ရှင်များ —*
${formatList(trendingMovies, '🎬')}

*— TV Shows —*
${formatList(trendingSeries, '📺')}

📌 ပိုမိုကြည့်ရှုလိုပါက Kumastream App တွင် ဝင်ရောက်ကြည့်ရှုပါ
`;

  ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [
        Markup.button.callback('🎬 ရုပ်ရှင်ပိုမို', 'movies'),
        Markup.button.callback('📺 TV Showsပိုမို', 'series')
      ],
      [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
    ])
  });
});

// 📂 အမျိုးအစား
bot.action('categories', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText('📂 *အမျိုးအစားများ*\n\nရုပ်ရှင် ဒါမှမဟုတ် TV Shows အမျိုးအစားကို ရွေးချယ်ပါ', {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🎬 ရုပ်ရှင်အမျိုးအစား', 'movies')],
      [Markup.button.callback('📺 TV Shows အမျိုးအစား', 'series')],
      [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
    ])
  });
});

// 🔍 ရှာရန်
bot.action('search', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    '🔍 *ရုပ်ရှင်/Series ရှာဖွေရန်*\n\nရှာလိုသောအမည်ကို အောက်ပါပုံစံဖြင့်ပို့ပါ:\n\n`/search ရုပ်ရှင်အမည်`\n\nဥပမာ:\n`/search Avengers`\n`/search Squid Game`\n`/search action`',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
      ])
    }
  );
});

// ❓ FAQ (Enhanced)
bot.action('faq', (ctx) => {
  ctx.answerCbQuery();
  const faqText = `
❓ *မေးလေ့ရှိသောမေးခွန်းများ*

*Q1: Kumastream အခမဲ့လား?*
A: ဟုတ်ကဲ့၊ အခမဲ့ကြည့်ရှုနိုင်ပါတယ်။ အကောင့်ဖွင့်ရုံနဲ့ ချက်ချင်းကြည့်လို့ရပါတယ်။

*Q2: ဘယ် Devices တွေမှာကြည့်လို့ရလဲ?*
A: Android Phone, iPhone, iPad, Web Browser (Chrome, Firefox, Safari) အကုန်မှာကြည့်လို့ရပါတယ်။ Smart TV မှာလည်းကြည့်လို့ရပါတယ်။

*Q3: ရုပ်ရှင်အသစ်တွေဘယ်လောက်နှုန်း Update လဲ?*
A: နေ့စဉ် Update ပြုလုပ်ပေးနေပါတယ်။ ရုပ်ရှင်အသစ်တွေ ရုံတင်တာနဲ့ မကြာခင် တင်ပေးပါတယ်။

*Q4: Myanmar Subtitle ရှိလား?*
A: ဟုတ်ကဲ့၊ ရုပ်ရှင်/Series အများစုမှာ Myanmar Subtitle ပါဝင်ပါတယ်။ English Subtitle လည်းရွေးချယ်လို့ရပါတယ်။

*Q5: Download လုပ်လို့ရလား?*
A: ဟုတ်ကဲ့၊ Offline ကြည့်ဖို့ Download လုပ်လို့ရပါတယ်။ Video Quality ကိုလည်း ရွေးချယ်လို့ရပါတယ်။

*Q6: Video Quality ဘာတွေရှိလဲ?*
A: 360p, 480p, 720p (HD), 1080p (Full HD) ရွေးချယ်လို့ရပါတယ်။ Internet နှုန်းအရ အလိုလိုရွေးပေးပါတယ်။

*Q7: ကြောက်ရွံ့စရာကောင်းတဲ့ ရုပ်ရှင်တွေရှိလား?*
A: ရှိပါတယ်! /categories ကနေ Horror ကိုရွေးပါ။ Ghost, Demon, Psychological Horror အကုန်ရှိပါတယ်။

*Q8: Korean Drama တွေရှိလား?*
A: ရှိပါတယ်! Squid Game, All of Us Are Dead, Sweet Home စတဲ့ နာမည်ကြီး Korean Drama တွေ အကုန်ရှိပါတယ်။
`;

  ctx.editMessageText(faqText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
    ])
  });
});

// 📱 App Download (Enhanced)
bot.action('download', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    `📱 *Kumastream App Download*

*Android:*
🔗 Google Play Store မှာ "Kumastream" ရှာပါ
(ဒေါင်းလုပ်လင့်ခ် မကြာခင်ထည့်ပေးပါမည်)

*iOS (iPhone/iPad):*
🔗 App Store မှာ "Kumastream" ရှာပါ
(ဒေါင်းလုပ်လင့်ခ် မကြာခင်ထည့်ပေးပါမည်)

*Web Browser:*
🔗 Kumastream Website မှာတိုက်ရိုက်ကြည့်ရှုနိုင်ပါတယ်

*ဆက်သွယ်ရန်:*
🤖 Telegram: @kumastream132_bot`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
      ])
    }
  );
});

// ℹ️ အကြောင်း
bot.action('about', (ctx) => {
  ctx.answerCbQuery();
  const aboutText = `
ℹ️ *Kumastream အကြောင်း*

Kumastream သည် ရုပ်ရှင်များနှင့် TV Shows များကို အခမဲ့ကြည့်ရှုနိုင်သော Platform တစ်ခုဖြစ်ပါသည်။

*Features:*
🎬 ရုပ်ရှင်အသစ်များ - အမြဲတမ်း Update ဖြစ်နေ
📺 TV Shows များ - နာမည်ကြီး Series တွေ
🔥 Trending - လူကြိုက်များနေတဲ့ အကြောင်းအရာ
📂 Categories - အမျိုးအစားအလိုက် ရွေးချယ်နိုင်
🔍 Search - ရုပ်ရှင်/Series ရှာဖွေနိုင်
📱 မည်သည့် Device မဆို ကြည့်ရှုနိုင်
🔄 အမြန် Update - အပိုင်းအသစ် အမြန်တင်ပေး
🎯 Myanmar Subtitle - မြန်မာစာမျက်နှာစာ ပါဝင်

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

// 🔙 ပင်မမီနူး
bot.action('back_menu', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    `🎬 *Kumastream မှ ကြိုဆိုပါတယ်!*

သင်၏ ရုပ်ရှင်နှင့် TV Shows ကြည့်ရှုရေး Bot ပါ။

ဘာလုပ်ချင်ပါသလဲ?`,
    {
      parse_mode: 'Markdown',
      ...mainMenu
    }
  );
});

// ============================================
// "hi" message
// ============================================
bot.hears(/hi/i, (ctx) => {
  ctx.reply(
    'Hello bro! 👋\n\nဘာကူညီပေးရမလဲ?',
    mainMenu
  );
});

// ============================================
// အခြား message များ - Smart Response
// ============================================
bot.on('message', (ctx) => {
  const text = ctx.message.text;

  // ရုပ်ရှင်ဆိုင်ရာ စကားလုံးတွေကို ခန့်မှန်းပါမယ်
  const movieKeywords = ['movie', 'film', 'ရုပ်ရှင်', 'ကား', 'sin', 'movie'];
  const seriesKeywords = ['series', 'show', 'drama', 'tv', 'anime'];
  const helpKeywords = ['help', 'ကူ', 'ဘာလုပ်', 'ဘယ်လို', 'မသိ'];

  const textLower = text.toLowerCase();

  if (movieKeywords.some(k => textLower.includes(k))) {
    ctx.reply('🎬 ရုပ်ရှင်ကြည့်ချင်တယ်လား? အမျိုးအစားရွေးပါ!', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('💥 Action', 'cat_action'),
          Markup.button.callback('😂 Comedy', 'cat_comedy')
        ],
        [
          Markup.button.callback('👻 Horror', 'cat_horror'),
          Markup.button.callback('🚀 Sci-Fi', 'cat_scifi')
        ],
        [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
      ])
    });
  } else if (seriesKeywords.some(k => textLower.includes(k))) {
    ctx.reply('📺 TV Shows ကြည့်ချင်တယ်လား? အမျိုးအစားရွေးပါ!', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('🔥 Trending', 'ser_trending'),
          Markup.button.callback('🇰🇷 Korean', 'ser_korean')
        ],
        [
          Markup.button.callback('🇯🇵 Anime', 'ser_anime'),
          Markup.button.callback('🇺🇸 Western', 'ser_western')
        ],
        [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
      ])
    });
  } else if (helpKeywords.some(k => textLower.includes(k))) {
    ctx.reply(
      '🤖 ကျွန်တော်ကို ဘာလုပ်ခိုင်းချင်ပါသလဲ?\n\nခလုတ်တွေနှိပ်ပြီး အသုံးပြုပါ!',
      mainMenu
    );
  } else {
    ctx.reply(
      '🤖 ကျွန်တော်ဟာ Kumastream Bot ပါ။\n\nခလုတ်တွေနှိပ်ပြီး အသုံးပြုပါ ဒါမှမဟုတ်:\n\n/search ရုပ်ရှင်အမည် - ရှာဖွေရန်\nhi - ဟယ်လိုဖြေပါမယ်',
      mainMenu
    );
  }
});

// ============================================
// Bot ကို Start လုပ်ခြင်း
// ============================================
bot.launch().then(() => {
  console.log('Kumastream Bot Level 2 အသက်ဝင်ပါပြီး!');
}).catch((err) => {
  console.error('Bot စတင်မှု မအောင်မြင်ပါ:', err);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
