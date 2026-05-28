// ============================================
// Kumastream Telegram Bot - Level 3 (FINAL v3)
// Framework: Node.js + Telegraf
// Features: Menu, Categories, Trending, Search,
//           FAQ, Download, Subscription, Admin,
//           User Stats, Broadcast, Notification
// Fix v3: Display separated into 3 messages
//   1. Poster + Movie Name (caption, 1024 limit)
//   2. Overview (separate message, 4096 limit)
//   3. Video (separate message)
// ============================================

const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');
const path = require('path');

// Bot Token
const token = process.env.BOT_TOKEN;
if (!token) {
  console.error('BOT_TOKEN environment variable မရှိပါ!');
  process.exit(1);
}

const bot = new Telegraf(token);

// ============================================
// ADMIN CONFIG
// ============================================
const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

// ============================================
// APP DOWNLOAD URL CONFIG
// ============================================
const ANDROID_APK_URL = process.env.ANDROID_APK_URL || 'https://example.com/kumastream.apk';
const IOS_APP_URL = process.env.IOS_APP_URL || '';
const WEB_URL = process.env.WEB_URL || '';

// ============================================
// DATA STORAGE (In-Memory + File Backup)
// ============================================
const DATA_FILE = path.join(__dirname, 'botdata.json');

// ============================================
// ADMIN MOVIE ADDING STATE + SEARCH STATE
// ============================================
const addMovieState = {}; // { adminId: { step: 1|2|3, waitingTitle: false, poster_file_id: '', title: '', overview: '' } }
const searchState = {};  // { userId: true }

let botData = {
  users: {},
  notifications: [],
  adminMovies: [],     // NO LIMIT - unlimited storage
  stats: {
    totalMessages: 0,
    commandsUsed: 0,
    searches: 0,
    startedAt: new Date().toISOString()
  }
};

// Load data from file
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      botData = JSON.parse(raw);
      console.log('Data file မှ ဒေတာများ load ပြုလုပ်ပါပြီ');
    }
  } catch (err) {
    console.error('Data load မအောင်မြင်ပါ:', err.message);
  }
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(botData, null, 2));
  } catch (err) {
    console.error('Data save မအောင်မြင်ပါ:', err.message);
  }
}

// Register user
function registerUser(ctx) {
  const userId = ctx.from.id.toString();
  const now = new Date().toISOString();

  if (!botData.users[userId]) {
    botData.users[userId] = {
      id: ctx.from.id,
      first_name: ctx.from.first_name || 'Unknown',
      username: ctx.from.username || '',
      joinedAt: now,
      lastActive: now,
      subscribed: false
    };
  } else {
    botData.users[userId].lastActive = now;
    botData.users[userId].first_name = ctx.from.first_name || botData.users[userId].first_name;
    botData.users[userId].username = ctx.from.username || botData.users[userId].username;
  }

  saveData();
}

// Check admin
function isAdmin(ctx) {
  if (ADMIN_IDS.length === 0) {
    console.warn(`⚠️ ADMIN_IDS မထည့်ထားပါ! User ${ctx.from.id} (${ctx.from.first_name}) က Admin Command သုံးချင်ပါတယ်။`);
    return false;
  }
  return ADMIN_IDS.includes(ctx.from.id);
}

// Admin မဟုတ်တဲ့သူ ဝင်ရောက်စရင် log လုပ်မယ်
function logUnauthorizedAccess(ctx, command) {
  console.warn(`🚫 Unauthorized Access! User: ${ctx.from.id} (${ctx.from.first_name}) tried: ${command}`);
}

// ============================================
// HELPER: Escape HTML special characters
// ဒီ function က movie title ထဲမှာ special chars ရှိရင်
// HTML parse_mode မှာ safe ဖြစ်အောင် လုပ်ပေးတယ်
// ============================================
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Load data on startup
loadData();

// Startup logging - data status ပြမယ်
console.log(`🚀 Kumastream Bot စတင်ပါပြီ!`);
console.log(`📊 Data Status:`);
console.log(`   - Users: ${Object.keys(botData.users || {}).length}`);
console.log(`   - Movies: ${(botData.adminMovies || []).length}`);
console.log(`   - Searches: ${botData.stats?.searches || 0}`);
console.log(`⚠️ Note: Railway ephemeral filesystem ကြောင့် container restart လုပ်ရင် botdata.json ပျောက်သွားနိုင်ပါတယ်`);

// ============================================
// MOVIES DATABASE
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
    { title: "Five Nights at Freddy's", year: 2023, rating: '5.5', desc: 'Animatronic တွေကြားမှာ အသက်ရှူသွားရတဲ့ည' },
    { title: 'Scream VI', year: 2023, rating: '6.5', desc: 'Ghostface ပြန်လာတဲ့ NYC Horror' },
    { title: 'Insidious: The Red Door', year: 2023, rating: '5.7', desc: 'Dalton ပြန်ဝင်တဲ့ The Further ကမ္ဘာ' },
    { title: 'M3GAN', year: 2023, rating: '6.4', desc: 'AI Robot ကလေး ထိန်းမနိုင်သွားတဲ့ Horror' },
  ],
  romance: [
    { title: 'Anyone But You', year: 2023, rating: '6.2', desc: 'ရန်သူနှစ်ယောက် ချစ်သူဖြစ်သွားတဲ့ Story' },
    { title: 'Purple Hearts', year: 2022, rating: '7.1', desc: 'စစ်သားနဲ့ သီချင်းဆရာမရဲ့ အတုချစ်ခြင်း' },
    { title: 'After Everything', year: 2023, rating: '5.2', desc: 'Hardin နဲ့ Tessa ရဲ့ နောက်ဆုံးအပိုင်း' },
    { title: 'Red, White & Royal Blue', year: 2023, rating: '6.9', desc: 'US President သားနဲ့ British Prince ချစ်ကြတဲ့ Story' },
    { title: 'The Idea of You', year: 2024, rating: '6.5', desc: 'Boy Band ခေါင်းဆောင်နဲ့ အမေရဲ့ ချစ်ခြင်း' },
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
// HELPER: Display Admin Movie search result
// ပြသမှု အဆင့် ၃ ဆင့်:
//   1. Poster + Movie Name (Photo caption - 1024 char limit)
//   2. Overview (Separate text message - 4096 char limit)
//   3. Video (Separate video message)
// ဒီလိုခွဲမှ overview ရှည်ရင်ပြည့်စုံပြနိုင်တယ်
// ============================================
async function displayAdminMovie(ctx, movie) {
  const displayOverview = movie.overview_text || movie.overview || '';
  const safeTitle = escapeHtml(movie.title);
  const safeOverview = escapeHtml(displayOverview);

  try {
    // ===== 1. Poster + Movie Name =====
    // Caption မှာ Movie Name ပဲထည့်မယ် (1024 limit မကျော်ဘဲ)
    if (movie.poster_file_id) {
      const caption = `🎬 <b>${safeTitle}</b>\n\n📂 Kumastream မှ ရရှိနိုင်ပါသည်`;
      // Caption က 1024 chars ထက်ကြီးရင် ဖြတ်ပါ (မကြီးသင့်ပေမဲ့ safety)
      const safeCaption = caption.length > 1000 ? caption.substring(0, 1000) + '...' : caption;

      await ctx.replyWithPhoto(movie.poster_file_id, {
        caption: safeCaption,
        parse_mode: 'HTML',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
        ])
      });
    } else {
      // Poster မရှိရင် စာသားနဲ့ပြမယ်
      await ctx.reply(
        `🎬 <b>${safeTitle}</b>\n\n📂 Kumastream မှ ရရှိနိုင်ပါသည်`,
        {
          parse_mode: 'HTML',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
          ])
        }
      );
    }

    // ===== 2. Overview (Separate Message - 4096 char limit) =====
    // Overview ကို သီးသန့် message နဲ့ပြမယ် - စာရှည်ရင်လည်း ပြည့်စုံတယ်
    if (safeOverview) {
      const overviewText = `📝 <b>Overview:</b>\n\n${safeOverview}`;
      // Regular message limit = 4096 chars
      const safeOverviewText = overviewText.length > 4000 ? overviewText.substring(0, 4000) + '...' : overviewText;

      await ctx.reply(safeOverviewText, {
        parse_mode: 'HTML'
      });
    }

    // ===== 3. Video (Separate Message) =====
    if (movie.video_file_id) {
      await ctx.replyWithVideo(movie.video_file_id, {
        caption: `🎬 ${safeTitle}`,
        parse_mode: 'HTML',
      });
    }
  } catch (err) {
    console.error(`❌ Display movie error ("${movie.title}"):`, err.message);
    // Fallback: plain text (no formatting)
    try {
      await ctx.reply(
        `🎬 ${movie.title}\n\n📂 Kumastream မှ ရရှိနိုင်ပါသည်`,
        Markup.inlineKeyboard([
          [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
        ])
      );
      if (displayOverview) {
        await ctx.reply(`📝 Overview:\n\n${displayOverview}`);
      }
      if (movie.video_file_id) {
        await ctx.replyWithVideo(movie.video_file_id, {
          caption: `🎬 ${movie.title}`,
        });
      }
    } catch (err2) {
      console.error(`❌ Fallback display also failed:`, err2.message);
    }
  }
}

// ============================================
// MIDDLEWARE: Register user + Handle 3-step Add Movie
// ============================================
bot.use(async (ctx, next) => {
  if (ctx.from) {
    registerUser(ctx);
    botData.stats.totalMessages++;
    saveData();
  }

  // ============================================
  // 3-STEP ADD MOVIE HANDLER
  // Step 1: Poster (Photo) + Movie Name (Caption)
  //   - Photo ပို့တဲ့အခါ Caption မှာ ရုပ်ရှင်အမည် ရိုက်ပါ
  //   - Caption မပါရင် ခဏစောင့်ပြီး အမည်ကို သီးသန့်မေးမယ်
  // Step 2: Overview/Description (Text)
  // Step 3: Video File
  // ============================================
  const adminId = ctx.from ? ctx.from.id : 0;
  const state = addMovieState[adminId];

  if (state && isAdmin(ctx)) {

    // STEP 1: Poster (Photo) လက်ခံခြင်း + Caption ကနေ ရုပ်ရှင်အမည်ယူမယ်
    if (state.step === 1 && ctx.message && ctx.message.photo) {
      const photo = ctx.message.photo;
      const fileId = photo[photo.length - 1].file_id;
      state.poster_file_id = fileId;

      // Caption မှာ ရုပ်ရှင်အမည် ရှိမရှိ စစ်ဆေးမယ်
      const caption = (ctx.message.caption || '').trim();
      if (caption) {
        // Caption ပါရင် → ရုပ်ရှင်အမည် ရယူပြီး Step 2 (Overview) ကိုသွားမယ်
        state.title = caption;
        state.step = 2;

        await ctx.reply(
          `✅ Poster + ရုပ်ရှင်အမည် လက်ခံရရှိပါပြီး!\n\n🖼️ Poster ✅\n🎬 အမည်: ${state.title}\n\n📝 *အဆင့် ၂/၃: Overview/ဖော်ပြချက် ရေးပါ*\n\nဇတ်ကားအကြောင်း အသေးစိတ်ဖော်ပြချက်ကို ရေးပါ။\n\nဥပမာ:\nဒီဇတ်ကားက Sci-Fi Animation တစ်ကားဖြစ်ပြီး...`,
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('⏭️ Overview မပါ', 'skip_overview')],
              [Markup.button.callback('❌ ပယ်ဖျက်', 'cancel_addmovie')]
            ])
          }
        );
      } else {
        // Caption မပါရင် → ရုပ်ရှင်အမည် သီးသန့်မေးမယ်
        state.waitingTitle = true;

        await ctx.reply(
          '✅ Poster လက်ခံရရှိပါပြီး!\n\n📝 *ရုပ်ရှင်အမည် ရိုက်ပါ*\n\nရုပ်ရှင်အမည်ကို သီးသန့်ရိုက်ပါ။\nဒီအမည်နဲ့ User တွေက /search မှာ ရှာလို့ရမှာပါ။\n\nဥပမာ:\nAppleseed Ex Machina (2007)\nAvengers: Endgame\nSquid Game Season 2',
          {
            parse_mode: 'Markdown',
            ...Markup.inlineKeyboard([
              [Markup.button.callback('❌ ပယ်ဖျက်', 'cancel_addmovie')]
            ])
          }
        );
      }
      return;
    }

    // STEP 1b: Caption မပါခဲ့ရင် ရုပ်ရှင်အမည် သီးသန့်လက်ခံခြင်း
    if (state.step === 1 && state.waitingTitle && ctx.message && ctx.message.text && !ctx.message.text.startsWith('/')) {
      state.title = ctx.message.text.trim();
      state.waitingTitle = false;
      state.step = 2;

      await ctx.reply(
        `✅ ရုပ်ရှင်အမည်: ${state.title}\n\n📝 *အဆင့် ₂/₃: Overview/ဖော်ပြချက် ရေးပါ*\n\nဇတ်ကားအကြောင်း အသေးစိတ်ဖော်ပြချက်ကို ရေးပါ။`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('⏭️ Overview မပါ', 'skip_overview')],
            [Markup.button.callback('❌ ပယ်ဖျက်', 'cancel_addmovie')]
          ])
        }
      );
      return;
    }

    // STEP 2: Overview (Text) လက်ခံခြင်း
    if (state.step === 2 && ctx.message && ctx.message.text && !ctx.message.text.startsWith('/')) {
      state.overview = ctx.message.text;
      state.step = 3;

      await ctx.reply(
        '✅ Overview လက်ခံရရှိပါပြီး!\n\n🎬 *အဆင့် ၃/၃: Video File ပို့ပါ*\n\nVideo ဖိုင်ကို ဒီ Chat ထဲမှာ ပို့ပါ။\nVideo ပို့ပြီးရင် ဇတ်ကားအသစ် သိမ်းဆည်းသွားပါမယ်။',
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('⏭️ Video မပါ', 'skip_video')],
            [Markup.button.callback('❌ ပယ်ဖျက်', 'cancel_addmovie')]
          ])
        }
      );
      return;
    }

    // STEP 3: Video File လက်ခံခြင်း
    if (state.step === 3 && ctx.message && (ctx.message.video || ctx.message.document)) {
      const videoFileId = ctx.message.video ? ctx.message.video.file_id : ctx.message.document.file_id;

      const newMovie = {
        title: state.title || 'Unknown Movie',
        poster_file_id: state.poster_file_id,
        overview: state.overview || '',
        overview_text: state.overview || '',
        video_file_id: videoFileId,
        addedBy: ctx.from.first_name,
        addedAt: new Date().toISOString()
      };

      if (!botData.adminMovies) botData.adminMovies = [];
      botData.adminMovies.push(newMovie);
      saveData();

      console.log(`✅ New movie added: "${newMovie.title}" | Total: ${botData.adminMovies.length}`);

      delete addMovieState[adminId];

      await ctx.reply(
        `✅ *ဇတ်ကားအသစ် သိမ်းဆည်းပြီးပါပြီ!*\n\n🎬 အမည်: ${newMovie.title}\n🖼️ Poster ✅\n📝 Overview ✅\n🎬 Video ✅\n\n🔍 User တွေက /search ${newMovie.title} နဲ့ ရှာလို့ရပါပြီ`,
        { parse_mode: 'Markdown' }
      );
      return;
    }
  }

  return next();
});

// ============================================
// Main Menu Keyboard
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
    Markup.button.callback('🔔 အကြောင်းကြားခြင်း', 'subscribe'),
    Markup.button.callback('📱 App Download', 'download')
  ],
  [
    Markup.button.callback('ℹ️ အကြောင်း', 'about')
  ]
]);

// ============================================
// /start command
// ============================================
bot.start((ctx) => {
  botData.stats.commandsUsed++;
  saveData();

  const userId = ctx.from.id.toString();
  const user = botData.users[userId];
  const subStatus = user && user.subscribed ? ' ✅ စာရင်းသွင်းပြီး' : '';

  const welcomeText = `
🎬 *Kumastream မှ ကြိုဆိုပါတယ်!*

သင်၏ ရုပ်ရှင်နှင့် TV Shows ကြည့်ရှုရေး Bot ပါ။${subStatus}

*Command များ:*
/start - Bot ကိုစတင်ရန်
/help - အကူအညီ
/movies - ရုပ်ရှင်များ
/series - TV Shows
/trending - လူကြိုက်များနေသည်
/categories - အမျိုးအစားများ
/subscribe - အကြောင်းကြားခြင်း
/stats - Bot စာရင်းအချက်အလက်
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
  botData.stats.commandsUsed++;
  saveData();

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
/subscribe - အကြောင်းကြားခြင်းစာရင်းသွင်း/ပယ်ဖျက်
/stats - Bot စာရင်းအချက်အလက်

*ခလုတ်များ:*
🎬 ရုပ်ရှင်များ - အမျိုးအစားအလိုက် ရုပ်ရှင်
📺 TV Shows - အမျိုးအစားအလိုက် Series
🔥 Trending - လူကြိုက်များနေသည်
📂 အမျိုးအစား - Action, Comedy, Horror စသဖြင့်
🔍 ရှာရန် - ရုပ်ရှင်/Series ရှာဖွေရန်
❓ FAQ - မေးလေ့ရှိသောမေးခွန်းများ
🔔 အကြောင်းကြားခြင်း - ရုပ်ရှင်အသစ်တင်ရင် သတိပေး
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
🔔 Notification - ရုပ်ရှင်အသစ်တင်ရင် သတိပေး
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
// /subscribe command
// ============================================
bot.command('subscribe', (ctx) => {
  botData.stats.commandsUsed++;
  saveData();

  const userId = ctx.from.id.toString();
  const user = botData.users[userId];
  const isSubscribed = user && user.subscribed;

  if (isSubscribed) {
    ctx.reply(
      '🔔 *အကြောင်းကြားခြင်း စာရင်းသွင်းပြီးပါပြီ*\n\nရုပ်ရှင်အသစ်၊ TV Shows အသစ်တင်ရင် သင့်ကို အကြောင်းကြားပေးပါမယ်။\n\nစာရင်းကနေပယ်ဖျက်ချင်ရင် အောက်ကခလုတ်နှိပ်ပါ',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('❌ စာရင်းကနေပယ်ဖျက်ရန်', 'unsubscribe')],
          [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
        ])
      }
    );
  } else {
    ctx.reply(
      '🔔 *အကြောင်းကြားခြင်း*\n\nစာရင်းသွင်းရင် အောက်ပါအချက်တွေ သတိပေးပါမယ်:\n\n🎬 ရုပ်ရှင်အသစ်တင်ချိန်\n📺 TV Shows အပိုင်းအသစ်တင်ချိန်\n🔥 Trending ရုပ်ရှင်ပြောင်းချိန်\n📢 အရေးကြီးသတင်းများ',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('✅ စာရင်းသွင်းရန်', 'do_subscribe')],
          [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
        ])
      }
    );
  }
});

// 🔔 စာရင်းသွင်း
bot.action('do_subscribe', (ctx) => {
  ctx.answerCbQuery();
  const userId = ctx.from.id.toString();
  if (botData.users[userId]) {
    botData.users[userId].subscribed = true;
    saveData();
  }
  ctx.editMessageText(
    '✅ *အကြောင်းကြားခြင်း စာရင်းသွင်းပြီးပါပြီ!*\n\nရုပ်ရှင်အသစ်၊ TV Shows အသစ်တင်ရင် သင့်ကို အကြောင်းကြားပေးပါမယ်။',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('❌ စာရင်းကနေပယ်ဖျက်ရန်', 'unsubscribe')],
        [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
      ])
    }
  );
});

// ❌ စာရင်းကနေပယ်ဖျက်
bot.action('unsubscribe', (ctx) => {
  ctx.answerCbQuery();
  const userId = ctx.from.id.toString();
  if (botData.users[userId]) {
    botData.users[userId].subscribed = false;
    saveData();
  }
  ctx.editMessageText(
    '❌ *အကြောင်းကြားခြင်း စာရင်းကနေ ပယ်ဖျက်ပြီးပါပြီ*\n\nထပ်စာရင်းသွင်းချင်ရင် /subscribe ကိုသုံးပါ။',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('✅ ပြန်စာရင်းသွင်းရန်', 'do_subscribe')],
        [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
      ])
    }
  );
});

// 🔔 ခလုတ်
bot.action('subscribe', (ctx) => {
  ctx.answerCbQuery();
  const userId = ctx.from.id.toString();
  const user = botData.users[userId];
  const isSubscribed = user && user.subscribed;

  if (isSubscribed) {
    ctx.editMessageText(
      '🔔 *အကြောင်းကြားခြင်း စာရင်းသွင်းပြီးပါပြီ*\n\nရုပ်ရှင်အသစ်၊ TV Shows အသစ်တင်ရင် သင့်ကို အကြောင်းကြားပေးပါမယ်။',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('❌ စာရင်းကနေပယ်ဖျက်ရန်', 'unsubscribe')],
          [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
        ])
      }
    );
  } else {
    ctx.editMessageText(
      '🔔 *အကြောင်းကြားခြင်း*\n\nစာရင်းသွင်းရင် အောက်ပါအချက်တွေ သတိပေးပါမယ်:\n\n🎬 ရုပ်ရှင်အသစ်တင်ချိန်\n📺 TV Shows အပိုင်းအသစ်တင်ချိန်\n🔥 Trending ရုပ်ရှင်ပြောင်းချိန်\n📢 အရေးကြီးသတင်းများ',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('✅ စာရင်းသွင်းရန်', 'do_subscribe')],
          [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
        ])
      }
    );
  }
});

// ============================================
// /stats command
// ============================================
bot.command('stats', (ctx) => {
  botData.stats.commandsUsed++;
  saveData();

  const totalUsers = Object.keys(botData.users).length;
  const subscribedUsers = Object.values(botData.users).filter(u => u.subscribed).length;
  const today = new Date().toISOString().split('T')[0];
  const todayUsers = Object.values(botData.users).filter(u => u.lastActive && u.lastActive.startsWith(today)).length;
  const uptime = Math.floor((Date.now() - new Date(botData.stats.startedAt).getTime()) / (1000 * 60 * 60));

  const statsText = `
📊 *Kumastream Bot စာရင်းအချက်အလက်*

👥 စုစုပေါင်း User: *${totalUsers}* ယောက်
🔔 စာရင်းသွင်းထားသူ: *${subscribedUsers}* ယောက်
📅 ယနေ့ Active: *${todayUsers}* ယောက်
💬 စုစုပေါင်း Message: *${botData.stats.totalMessages}*
⚡ Command အသုံးပြုမှု: *${botData.stats.commandsUsed}*
🔍 ရှာဖွေမှု: *${botData.stats.searches}*
🎬 တင်ထားသော ဇတ်ကား: *${(botData.adminMovies || []).length}* ကား (Limit မရှိပါ)
⏰ Bot Uptime: *${uptime} နာရီ*
`;

  ctx.reply(statsText, {
    parse_mode: 'Markdown',
    ...mainMenu
  });
});

// ============================================
// ADMIN COMMANDS
// ============================================

// /admin - Admin Panel
bot.command('admin', (ctx) => {
  if (!isAdmin(ctx)) {
    logUnauthorizedAccess(ctx, '/admin');
    ctx.reply('⛔ ဤ Command ကို Admin သာ အသုံးပြုနိုင်ပါသည်။\n\n👤 သင့် Telegram ID: ' + ctx.from.id + '\n\n⚠️ Admin ခွင့်ပြုချက် မရှိပါ။');
    return;
  }

  const totalUsers = Object.keys(botData.users).length;
  const subscribedUsers = Object.values(botData.users).filter(u => u.subscribed).length;
  const movieCount = (botData.adminMovies || []).length;

  ctx.reply(
    `🛡️ *Admin Panel*\n\n👥 Users: ${totalUsers}\n🔔 Subscribed: ${subscribedUsers}\n🎬 Movies: ${movieCount} (Limit မရှိ)`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('📢 Broadcast', 'admin_broadcast'),
          Markup.button.callback('📊 Stats', 'admin_stats')
        ],
        [
          Markup.button.callback('👥 User List', 'admin_users'),
          Markup.button.callback('🔔 Notify All', 'admin_notify')
        ],
        [
          Markup.button.callback('🎬 Add Movie', 'admin_addmovie'),
          Markup.button.callback('📂 Movie List', 'admin_listmovies')
        ],
        [
          Markup.button.callback('📺 Add Series', 'admin_addseries'),
          Markup.button.callback('🗑️ Delete Movie', 'admin_deletemovie')
        ]
      ])
    }
  );
});

// 📊 Admin Stats
bot.action('admin_stats', (ctx) => {
  if (!isAdmin(ctx)) { ctx.answerCbQuery('⛔ Admin သာ'); return; }
  ctx.answerCbQuery();

  const totalUsers = Object.keys(botData.users).length;
  const subscribedUsers = Object.values(botData.users).filter(u => u.subscribed).length;
  const today = new Date().toISOString().split('T')[0];
  const todayUsers = Object.values(botData.users).filter(u => u.lastActive && u.lastActive.startsWith(today)).length;
  const uptime = Math.floor((Date.now() - new Date(botData.stats.startedAt).getTime()) / (1000 * 60 * 60));

  ctx.editMessageText(
    `📊 *Admin - အသေးစိတ်စာရင်း*\n\n👥 စုစုပေါင်း User: ${totalUsers}\n🔔 စာရင်းသွင်းထားသူ: ${subscribedUsers}\n📅 ယနေ့ Active: ${todayUsers}\n💬 စုစုပေါင်း Message: ${botData.stats.totalMessages}\n⚡ Commands: ${botData.stats.commandsUsed}\n🔍 Searches: ${botData.stats.searches}\n🎬 Movies: ${(botData.adminMovies || []).length} (No Limit)\n⏰ Uptime: ${uptime} နာရီ`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Admin Panel', 'admin_back')]
      ])
    }
  );
});

// 👥 User List
bot.action('admin_users', (ctx) => {
  if (!isAdmin(ctx)) { ctx.answerCbQuery('⛔ Admin သာ'); return; }
  ctx.answerCbQuery();

  const users = Object.values(botData.users);
  const recentUsers = users.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive)).slice(0, 10);

  let text = `👥 *နောက်ဆုံး Active Users (Top 10)*\n\n`;
  recentUsers.forEach((u, i) => {
    const sub = u.subscribed ? '🔔' : '';
    const name = u.first_name || 'Unknown';
    const username = u.username ? `@${u.username}` : '';
    text += `${i + 1}. ${name} ${username} ${sub}\n`;
  });

  text += `\n👥 စုစုပေါင်း: ${users.length} ယောက်`;

  ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Admin Panel', 'admin_back')]
    ])
  });
});

// 📢 Broadcast
bot.action('admin_broadcast', (ctx) => {
  if (!isAdmin(ctx)) { ctx.answerCbQuery('⛔ Admin သာ'); return; }
  ctx.answerCbQuery();

  ctx.editMessageText(
    '📢 *Broadcast Message*\n\nUser အားလုံးကို မက်ဆေ့ပို့ရန်:\n\n`/broadcast သင့်မက်ဆေ့ချက်`\n\nဥပမာ:\n`/broadcast ရုပ်ရှင်အသစ်တင်ပြီးပြီ! ကြည့်ပါ!`',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Admin Panel', 'admin_back')]
      ])
    }
  );
});

// 🔔 Notify Subscribers
bot.action('admin_notify', (ctx) => {
  if (!isAdmin(ctx)) { ctx.answerCbQuery('⛔ Admin သာ'); return; }
  ctx.answerCbQuery();

  ctx.editMessageText(
    '🔔 *Notify Subscribers*\n\nစာရင်းသွင်းထားသူတွေကို အကြောင်းကြားရန်:\n\n`/notify သင့်အကြောင်းကြားချက်`\n\nဥပမာ:\n`/notify Squid Game Season 3 ထွက်ပြီ!`',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Admin Panel', 'admin_back')]
      ])
    }
  );
});

// 🎬 Add Movie - 3 Step Flow (NEW!)
bot.action('admin_addmovie', (ctx) => {
  if (!isAdmin(ctx)) { ctx.answerCbQuery('⛔ Admin သာ'); return; }
  ctx.answerCbQuery();

  addMovieState[ctx.from.id] = { step: 1, waitingTitle: false, poster_file_id: '', title: '', overview: '' };

  ctx.editMessageText(
    '🎬 *ရုပ်ရှင်အသစ်ထည့်ရန် - အဆင့် ၁/၃*\n\n🖼️ *Movie Poster ပို့ပါ*\n\nရုပ်ရှင် Poster ပုံကို ဒီ Chat ထဲမှာ ပို့ပါ။\n📌 ရုပ်ရှင်အမည်ကို Poster Caption မှာရိုက်ပါ!\n\n📌 အဆင့် ၃ ဆင့်ရှိပါတယ်:\n၁။ Poster ပုံ (Caption မှာ ရုပ်ရှင်အမည်ရိုက်ပါ)\n၂။ Overview/ဖော်ပြချက်\n၃။ Video File\n\n💡 Caption မပါရင် နောက်မှ အမည်မေးပါမယ်',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('❌ ပယ်ဖျက်', 'cancel_addmovie')],
        [Markup.button.callback('🔙 Admin Panel', 'admin_back')]
      ])
    }
  );
});

// ❌ Cancel Add Movie
bot.action('cancel_addmovie', (ctx) => {
  ctx.answerCbQuery();
  if (addMovieState[ctx.from.id]) {
    delete addMovieState[ctx.from.id];
  }
  ctx.editMessageText('❌ ရုပ်ရှင်ထည့်ခြင်း ပယ်ဖျက်ပြီးပါပြီ', {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔙 Admin Panel', 'admin_back')]
    ])
  });
});

// ⏭️ Skip Overview - Overview မပါရင် ချန်လှပ်
bot.action('skip_overview', async (ctx) => {
  if (!isAdmin(ctx)) { ctx.answerCbQuery('⛔ Admin သာ'); return; }
  ctx.answerCbQuery();

  const adminId = ctx.from.id;
  const state = addMovieState[adminId];

  if (!state) {
    ctx.editMessageText('❌ Session မရှိပါ။ /addmovie ကိုပြန်စပါ');
    return;
  }

  state.overview = '';
  state.step = 3; // သွားတော့ Step 3 (Video)

  await ctx.editMessageText(
    `✅ ရုပ်ရှင်အမည်: ${state.title}\n📝 Overview: ⏭️ ချန်လှပ်\n\n🎬 *အဆင့် ၃/၃: Video File ပို့ပါ*\n\nVideo ဖိုင်ကို ဒီ Chat ထဲမှာ ပို့ပါ။`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('⏭️ Video မပါ', 'skip_video')],
        [Markup.button.callback('❌ ပယ်ဖျက်', 'cancel_addmovie')]
      ])
    }
  );
});

// ⏭️ Skip Video - Video မပါရင် ချန်လှပ်
bot.action('skip_video', async (ctx) => {
  if (!isAdmin(ctx)) { ctx.answerCbQuery('⛔ Admin သာ'); return; }
  ctx.answerCbQuery();

  const adminId = ctx.from.id;
  const state = addMovieState[adminId];

  if (!state) {
    ctx.editMessageText('❌ Session မရှိပါ။ /addmovie ကိုပြန်စပါ');
    return;
  }

  const newMovie = {
    title: state.title || 'Unknown Movie',
    poster_file_id: state.poster_file_id,
    overview: state.overview || '',
    overview_text: state.overview || '',
    video_file_id: '',
    addedBy: ctx.from.first_name,
    addedAt: new Date().toISOString()
  };

  if (!botData.adminMovies) botData.adminMovies = [];
  botData.adminMovies.push(newMovie);
  saveData();

  console.log(`✅ New movie added (no video): "${newMovie.title}" | Total: ${botData.adminMovies.length}`);

  delete addMovieState[adminId];

  await ctx.editMessageText(
    `✅ *ဇတ်ကားအသစ် သိမ်းဆည်းပြီးပါပြီ! (Video မပါ)*\n\n🎬 အမည်: ${newMovie.title}\n🖼️ Poster ✅\n📝 Overview ${newMovie.overview ? '✅' : '⏭️ ချန်လှပ်'}\n🎬 Video ⏭️ ချန်လှပ်\n\n🔍 User တွေက /search ${newMovie.title} နဲ့ ရှာလို့ရပါပြီ`,
    { parse_mode: 'Markdown' }
  );
});

// 📺 Add Series
bot.action('admin_addseries', (ctx) => {
  if (!isAdmin(ctx)) { ctx.answerCbQuery('⛔ Admin သာ'); return; }
  ctx.answerCbQuery();

  ctx.editMessageText(
    '📺 *TV Show အသစ်ထည့်ရန်*\n\nအောက်ပါပုံစံဖြင့်ပို့ပါ:\n\n`/addseries အမျိုးအစား | အမည် | နှစ် | Rating | Status | ဖော်ပြချက်`\n\nဥပမာ:\n`/addseries korean | Sweet Home 3 | 2025 | 7.5 | Now Airing | Monster တွေနဲ့ ရင်ဆိုင်တဲ့သူ`\n\nအမျိုးအစားများ: trending, korean, anime, western',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 Admin Panel', 'admin_back')]
      ])
    }
  );
});

// 📂 Movie List (Admin Panel Button)
bot.action('admin_listmovies', async (ctx) => {
  if (!isAdmin(ctx)) { ctx.answerCbQuery('⛔ Admin သာ'); return; }
  ctx.answerCbQuery();

  const movies = botData.adminMovies || [];

  if (movies.length === 0) {
    ctx.editMessageText(
      '📂 *တင်ထားသော ဇတ်ကားများ မရှိသေးပါ*\n\n🎬 Add Movie နှိပ်ပြီး ဇတ်ကားအသစ်တင်ပါ',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🎬 Add Movie', 'admin_addmovie')],
          [Markup.button.callback('🔙 Admin Panel', 'admin_back')]
        ])
      }
    );
    return;
  }

  let listText = `📂 *တင်ထားသော ဇတ်ကားများ (${movies.length} ကား)*\n\n`;

  movies.forEach((movie, i) => {
    const hasPoster = movie.poster_file_id ? '🖼️' : '❌';
    const hasVideo = movie.video_file_id ? '🎬' : '⏭️';
    const addedDate = movie.addedAt ? new Date(movie.addedAt).toLocaleDateString() : '';
    listText += `${i + 1}. *${movie.title}*\n   ${hasPoster} Poster | 📝 Overview | ${hasVideo} Video | 📅 ${addedDate}\n`;
  });

  listText += '\n💡 ဖျက်ချင်ရင်: /deletemovie အမှတ်စဉ်';
  listText += '\n📊 Storage: Limit မရှိပါ - ဇတ်ကားဘယ်လောက်မဆို တင်လို့ရပါတယ်';

  ctx.editMessageText(listText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🎬 Add Movie', 'admin_addmovie')],
      [Markup.button.callback('🗑️ Delete Movie', 'admin_deletemovie')],
      [Markup.button.callback('🔙 Admin Panel', 'admin_back')]
    ])
  });
});

// 🗑️ Delete Movie (Admin Panel Button)
bot.action('admin_deletemovie', (ctx) => {
  if (!isAdmin(ctx)) { ctx.answerCbQuery('⛔ Admin သာ'); return; }
  ctx.answerCbQuery();

  const movies = botData.adminMovies || [];

  if (movies.length === 0) {
    ctx.editMessageText(
      '📂 *ဖျက်ရန် ဇတ်ကား မရှိပါ*\n\nဇတ်ကားအသစ်တင်ရန် Add Movie နှိပ်ပါ',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🎬 Add Movie', 'admin_addmovie')],
          [Markup.button.callback('🔙 Admin Panel', 'admin_back')]
        ])
      }
    );
    return;
  }

  let listText = `🗑️ *ဖျက်ရန် ဇတ်ကားရွေးချယ်ပါ*\n\nဇတ်ကားစာရင်း:\n\n`;

  movies.forEach((movie, i) => {
    listText += `${i + 1}. ${movie.title}\n`;
  });

  listText += '\nဖျက်ချင်ရင် အောက်ပါပုံစံဖြင့်ရိုက်ပါ:\n`/deletemovie အမှတ်စဉ်`';

  ctx.editMessageText(listText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('📂 Movie List', 'admin_listmovies')],
      [Markup.button.callback('🔙 Admin Panel', 'admin_back')]
    ])
  });
});

// Admin Back
bot.action('admin_back', (ctx) => {
  if (!isAdmin(ctx)) { ctx.answerCbQuery('⛔ Admin သာ'); return; }
  ctx.answerCbQuery();

  const totalUsers = Object.keys(botData.users).length;
  const subscribedUsers = Object.values(botData.users).filter(u => u.subscribed).length;
  const movieCount = (botData.adminMovies || []).length;

  ctx.editMessageText(
    `🛡️ *Admin Panel*\n\n👥 Users: ${totalUsers}\n🔔 Subscribed: ${subscribedUsers}\n🎬 Movies: ${movieCount} (Limit မရှိ)`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [
          Markup.button.callback('📢 Broadcast', 'admin_broadcast'),
          Markup.button.callback('📊 Stats', 'admin_stats')
        ],
        [
          Markup.button.callback('👥 User List', 'admin_users'),
          Markup.button.callback('🔔 Notify All', 'admin_notify')
        ],
        [
          Markup.button.callback('🎬 Add Movie', 'admin_addmovie'),
          Markup.button.callback('📂 Movie List', 'admin_listmovies')
        ],
        [
          Markup.button.callback('📺 Add Series', 'admin_addseries'),
          Markup.button.callback('🗑️ Delete Movie', 'admin_deletemovie')
        ]
      ])
    }
  );
});

// /broadcast command
bot.command('broadcast', (ctx) => {
  if (!isAdmin(ctx)) {
    logUnauthorizedAccess(ctx, '/broadcast');
    ctx.reply('⛔ Admin သာ အသုံးပြုနိုင်ပါသည်');
    return;
  }

  const message = ctx.message.text.replace('/broadcast', '').trim();
  if (!message) {
    ctx.reply('📢 Broadcast Message:\n\n`/broadcast သင့်မက်ဆေ့ချက်`', { parse_mode: 'Markdown' });
    return;
  }

  const users = Object.keys(botData.users);
  let sentCount = 0;
  let failCount = 0;

  const broadcastText = `📢 *Kumastream သတင်း*\n\n${message}`;

  users.forEach(async (userId) => {
    try {
      await bot.telegram.sendMessage(parseInt(userId), broadcastText, { parse_mode: 'Markdown' });
      sentCount++;
    } catch (err) {
      failCount++;
    }
  });

  botData.notifications.push({
    text: message,
    date: new Date().toISOString(),
    sentBy: ctx.from.first_name,
    type: 'broadcast'
  });
  saveData();

  ctx.reply(`📢 Broadcast ပို့ပြီးပါပြီ!\n\n✅ ပို့ရမှု: ${sentCount}\n❌ မပို့နိုင်: ${failCount}`);
});

// /notify command
bot.command('notify', (ctx) => {
  if (!isAdmin(ctx)) {
    logUnauthorizedAccess(ctx, '/notify');
    ctx.reply('⛔ Admin သာ အသုံးပြုနိုင်ပါသည်');
    return;
  }

  const message = ctx.message.text.replace('/notify', '').trim();
  if (!message) {
    ctx.reply('🔔 Notify:\n\n`/notify သင့်အကြောင်းကြားချက်`', { parse_mode: 'Markdown' });
    return;
  }

  const subscribers = Object.entries(botData.users).filter(([id, u]) => u.subscribed);
  let sentCount = 0;
  let failCount = 0;

  const notifyText = `🔔 *Kumastream အကြောင်းကြားချက်*\n\n${message}`;

  subscribers.forEach(async ([userId]) => {
    try {
      await bot.telegram.sendMessage(parseInt(userId), notifyText, { parse_mode: 'Markdown' });
      sentCount++;
    } catch (err) {
      failCount++;
    }
  });

  botData.notifications.push({
    text: message,
    date: new Date().toISOString(),
    sentBy: ctx.from.first_name,
    type: 'notification'
  });
  saveData();

  ctx.reply(`🔔 Notification ပို့ပြီးပါပြီ!\n\n✅ ပို့ရမှု: ${sentCount}\n❌ မပို့နိုင်: ${failCount}`);
});

// /listmovies command
bot.command('listmovies', async (ctx) => {
  if (!isAdmin(ctx)) {
    logUnauthorizedAccess(ctx, '/listmovies');
    ctx.reply('⛔ Admin သာ အသုံးပြုနိုင်ပါသည်');
    return;
  }

  const movies = botData.adminMovies || [];

  if (movies.length === 0) {
    ctx.reply(
      '📂 *တင်ထားသော ဇတ်ကားများ မရှိသေးပါ*\n\n/addmovie ဒါမှမဟုတ် Admin Panel မှာ Add Movie နှိပ်ပြီး ဇတ်ကားအသစ်တင်ပါ',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🎬 Add Movie', 'admin_addmovie')],
          [Markup.button.callback('🔙 Admin Panel', 'admin_back')]
        ])
      }
    );
    return;
  }

  let listText = `📂 *တင်ထားသော ဇတ်ကားများ (${movies.length} ကား)*\n\n`;

  movies.forEach((movie, i) => {
    const hasPoster = movie.poster_file_id ? '🖼️' : '❌';
    const hasVideo = movie.video_file_id ? '🎬' : '⏭️';
    const addedDate = movie.addedAt ? new Date(movie.addedAt).toLocaleDateString() : '';
    listText += `${i + 1}. *${movie.title}*\n   ${hasPoster} Poster | 📝 Overview | ${hasVideo} Video | 📅 ${addedDate}\n`;
  });

  listText += '\n💡 ဖျက်ချင်ရင်: /deletemovie အမှတ်စဉ်';
  listText += '\n📊 Storage: Limit မရှိပါ';

  ctx.reply(listText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🎬 Add Movie', 'admin_addmovie')],
      [Markup.button.callback('🔙 Admin Panel', 'admin_back')]
    ])
  });
});

// /deletemovie command
bot.command('deletemovie', (ctx) => {
  if (!isAdmin(ctx)) {
    logUnauthorizedAccess(ctx, '/deletemovie');
    ctx.reply('⛔ Admin သာ အသုံးပြုနိုင်ပါသည်');
    return;
  }

  const args = ctx.message.text.replace('/deletemovie', '').trim();
  const index = parseInt(args) - 1;

  if (isNaN(index) || index < 0) {
    ctx.reply(
      '❌ *ဇတ်ကားဖျက်ရန် အမှတ်စဉ်ထည့်ပါ*\n\nဥပမာ:\n`/deletemovie 1`\n\nဇတ်ကားစာရင်းကြည့်ရန်: /listmovies',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const movies = botData.adminMovies || [];

  if (index >= movies.length) {
    ctx.reply(`❌ အမှတ်စဉ် ${index + 1} မရှိပါ။ စုစုပေါင်း ${movies.length} ကားသာ ရှိပါသည်။\n/listmovies နဲ့ စာရင်းကြည့်ပါ`);
    return;
  }

  const deletedMovie = movies.splice(index, 1)[0];
  saveData();

  ctx.reply(
    `✅ *ဇတ်ကား ဖျက်ပြီးပါပြီ!*\n\n🎬 ${deletedMovie.title}\n\n📝 ကျန်ရှိသေးသော: ${movies.length} ကား`,
    { parse_mode: 'Markdown' }
  );
});

// /addmovie command - 3 Step Flow
bot.command('addmovie', (ctx) => {
  if (!isAdmin(ctx)) {
    logUnauthorizedAccess(ctx, '/addmovie');
    ctx.reply('⛔ Admin သာ အသုံးပြုနိုင်ပါသည်');
    return;
  }

  addMovieState[ctx.from.id] = { step: 1, waitingTitle: false, poster_file_id: '', title: '', overview: '' };

  ctx.reply(
    '🎬 *ရုပ်ရှင်အသစ်ထည့်ရန် - အဆင့် ၁/၃*\n\n🖼️ *Movie Poster ပို့ပါ*\n\nရုပ်ရှင် Poster ပုံကို ဒီ Chat ထဲမှာ ပို့ပါ။\n📌 ရုပ်ရှင်အမည်ကို Poster Caption မှာရိုက်ပါ!\n\n📌 အဆင့် ၃ ဆင့်ရှိပါတယ်:\n၁။ Poster ပုံ (Caption မှာ ရုပ်ရှင်အမည်ရိုက်ပါ)\n၂။ Overview/ဖော်ပြချက်\n၃။ Video File\n\n💡 Caption မပါရင် နောက်မှ အမည်မေးပါမယ်',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('❌ ပယ်ဖျက်', 'cancel_addmovie')]
      ])
    }
  );
});

// /addseries command
bot.command('addseries', (ctx) => {
  if (!isAdmin(ctx)) {
    logUnauthorizedAccess(ctx, '/addseries');
    ctx.reply('⛔ Admin သာ အသုံးပြုနိုင်ပါသည်');
    return;
  }

  const args = ctx.message.text.replace('/addseries', '').trim();
  const parts = args.split('|').map(p => p.trim());

  if (parts.length < 6) {
    ctx.reply('📺 Format:\n`/addseries အမျိုးအစား | အမည် | နှစ် | Rating | Status | ဖော်ပြချက်`', { parse_mode: 'Markdown' });
    return;
  }

  const [category, title, year, rating, status, desc] = parts;

  if (!seriesDB[category]) {
    ctx.reply(`❌ အမျိုးအစား "${category}" မရှိပါ။\nရနိုင်သည်: trending, korean, anime, western`);
    return;
  }

  seriesDB[category].unshift({
    title: title,
    year: parseInt(year) || 2024,
    rating: rating,
    status: status,
    desc: desc
  });

  ctx.reply(`✅ TV Show အသစ်ထည့်ပြီး!\n\n📺 ${title}\n📂 ${category}\n⭐ ${rating}\n📊 ${status}\n📅 ${year}`);
});

// ============================================
// MOVIES & SERIES COMMANDS
// ============================================
bot.command('movies', (ctx) => {
  botData.stats.commandsUsed++;
  saveData();
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

bot.command('series', (ctx) => {
  botData.stats.commandsUsed++;
  saveData();
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
      [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
    ])
  });
});

bot.command('trending', (ctx) => {
  botData.stats.commandsUsed++;
  saveData();

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

bot.command('categories', (ctx) => {
  botData.stats.commandsUsed++;
  saveData();
  ctx.reply('📂 *အမျိုးအစားများ*\n\nရုပ်ရှင် ဒါမှမဟုတ် TV Shows အမျိုးအစားကို ရွေးချယ်ပါ', {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🎬 ရုပ်ရှင်အမျိုးအစား', 'movies')],
      [Markup.button.callback('📺 TV Shows အမျိုးအစား', 'series')],
      [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
    ])
  });
});

// ============================================
// /search command - FIXED! HTML parse_mode
// ============================================
bot.command('search', async (ctx) => {
  botData.stats.commandsUsed++;
  botData.stats.searches++;
  saveData();

  const query = ctx.message.text.replace('/search', '').trim();

  if (!query) {
    ctx.reply(
      '🔍 *ရုပ်ရှင်/Series ရှာဖွေရန်*\n\nရှာလိုသောအမည်ကို အောက်ပါပုံစံဖြင့်ပို့ပါ:\n\n`/search ရုပ်ရှင်အမည်`\n\nဥပမာ:\n`/search Avengers`\n`/search Appleseed Ex Machina (2007)`',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  console.log(`🔍 Search query: "${query}" from user ${ctx.from.id}`);

  const queryLower = query.toLowerCase();

  // Admin Movies ထဲမှာရှာမယ်
  const adminMovieResults = (botData.adminMovies || []).filter(m =>
    m.title.toLowerCase().includes(queryLower) ||
    (m.overview && m.overview.toLowerCase().includes(queryLower)) ||
    (m.overview_text && m.overview_text.toLowerCase().includes(queryLower))
  );

  // Built-in moviesDB ထဲမှာရှာမယ်
  const movieResults = [];
  for (const [cat, movies] of Object.entries(moviesDB)) {
    for (const movie of movies) {
      if (movie.title.toLowerCase().includes(queryLower) || cat.includes(queryLower)) {
        movieResults.push({ ...movie, category: cat });
      }
    }
  }

  // Built-in seriesDB ထဲမှာရှာမယ်
  const seriesResults = [];
  for (const [cat, shows] of Object.entries(seriesDB)) {
    for (const show of shows) {
      if (show.title.toLowerCase().includes(queryLower) || cat.includes(queryLower)) {
        seriesResults.push({ ...show, category: cat });
      }
    }
  }

  console.log(`🔍 Results: Admin=${adminMovieResults.length}, Movies=${movieResults.length}, Series=${seriesResults.length}`);

  // Admin Movie ရှာတွေ့ရင် - HTML parse_mode နဲ့ပြမယ် (Safe!)
  if (adminMovieResults.length > 0) {
    for (const movie of adminMovieResults.slice(0, 3)) {
      await displayAdminMovie(ctx, movie);
    }
  }

  // ဘာမှမရှာတွေ့ရင်
  if (movieResults.length === 0 && seriesResults.length === 0 && adminMovieResults.length === 0) {
    const adminMovieCount = (botData.adminMovies || []).length;
    let hint = '';
    if (adminMovieCount === 0) {
      hint = '\n\n💡 Admin က ဇတ်ကားတင်ထားခြင်းမရှိသေးပါ။ ဇတ်ကားတင်ရန် /admin ကိုသုံးပါ။';
    }
    ctx.reply(
      `🔍 *"${query}" ရှာမတွေ့ပါ*\n\nတခြားစကားလုံးနဲ့ ထပ်ရှာကြည့်ပါ${hint}`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔍 ပြန်ရှာရန်', 'search')],
          [Markup.button.callback('📂 အမျိုးအစားများ', 'categories')],
          [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
        ])
      }
    );
    return;
  }

  // Built-in results ပြမယ်
  if (movieResults.length > 0 || seriesResults.length > 0) {
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
  } else if (adminMovieResults.length > 0) {
    ctx.reply('👆 ဇတ်ကားရလဒ်များ အပေါ်မှာပါ', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
      ])
    });
  }
});

// ============================================
// PLAIN TEXT SEARCH HANDLER
// 🔍 ခလုတ်နှိပ်ပြီး စာသားရိုက်ရင် Search အဖြစ်လက်ခံမယ်
// ============================================
bot.on('text', async (ctx, next) => {
  // Admin က Add Movie Step 1b (Title) နဲ့ Step 2 (Overview) မှာဆိုရင် Search မဝင်ပါနဲ့
  const adminId = ctx.from ? ctx.from.id : 0;
  const addState = addMovieState[adminId];
  if (addState && isAdmin(ctx) && (addState.waitingTitle || addState.step === 2)) {
    return next(); // Add Movie flow ကိုဆက်သွားစေ
  }

  const userId = ctx.from.id.toString();

  // Search Mode မှာဆိုရင် စာသားကို Search Query အဖြစ်လက်ခံမယ်
  if (searchState[userId]) {
    delete searchState[userId]; // Search Mode ပိတ်

    const query = ctx.message.text.trim();
    if (!query || query.startsWith('/')) {
      return next();
    }

    botData.stats.searches++;
    saveData();

    console.log(`🔍 Text search: "${query}" from user ${ctx.from.id}`);

    const queryLower = query.toLowerCase();

    // Admin Movies ထဲမှာရှာမယ်
    const adminMovieResults = (botData.adminMovies || []).filter(m =>
      m.title.toLowerCase().includes(queryLower) ||
      (m.overview && m.overview.toLowerCase().includes(queryLower)) ||
      (m.overview_text && m.overview_text.toLowerCase().includes(queryLower))
    );

    // Built-in moviesDB ထဲမှာရှာမယ်
    const movieResults = [];
    for (const [cat, movies] of Object.entries(moviesDB)) {
      for (const movie of movies) {
        if (movie.title.toLowerCase().includes(queryLower) || cat.includes(queryLower)) {
          movieResults.push({ ...movie, category: cat });
        }
      }
    }

    // Built-in seriesDB ထဲမှာရှာမယ်
    const seriesResults = [];
    for (const [cat, shows] of Object.entries(seriesDB)) {
      for (const show of shows) {
        if (show.title.toLowerCase().includes(queryLower) || cat.includes(queryLower)) {
          seriesResults.push({ ...show, category: cat });
        }
      }
    }

    // Admin Movie ရှာတွေ့ရင် - HTML parse_mode နဲ့ပြမယ်
    if (adminMovieResults.length > 0) {
      for (const movie of adminMovieResults.slice(0, 3)) {
        await displayAdminMovie(ctx, movie);
      }
    }

    // ဘာမှမရှာတွေ့ရင်
    if (movieResults.length === 0 && seriesResults.length === 0 && adminMovieResults.length === 0) {
      const adminMovieCount = (botData.adminMovies || []).length;
      let hint = '';
      if (adminMovieCount === 0) {
        hint = '\n\n💡 Admin က ဇတ်ကားတင်ထားခြင်းမရှိသေးပါ။ ဇတ်ကားတင်ရန် /admin ကိုသုံးပါ။';
      }
      ctx.reply(
        `🔍 *"${query}" ရှာမတွေ့ပါ*\n\nတခြားစကားလုံးနဲ့ ထပ်ရှာကြည့်ပါ${hint}`,
        {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.callback('🔍 ပြန်ရှာရန်', 'search')],
            [Markup.button.callback('📂 အမျိုးအစားများ', 'categories')],
            [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
          ])
        }
      );
      return;
    }

    // Built-in results ပြမယ်
    if (movieResults.length > 0 || seriesResults.length > 0) {
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
    } else if (adminMovieResults.length > 0) {
      ctx.reply('👆 ဇတ်ကားရလဒ်များ အပေါ်မှာပါ', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
        ])
      });
    }

    return;
  }

  return next();
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
  const userId = ctx.from.id.toString();
  searchState[userId] = true;
  const adminMovieCount = (botData.adminMovies || []).length;
  let infoText = '';
  if (adminMovieCount > 0) {
    infoText = `\n\n🎬 လက်ရှိတင်ထားသော ဇတ်ကား: ${adminMovieCount} ကား`;
  } else {
    infoText = '\n\n⚠️ လက်ရှိ Admin က ဇတ်ကားတင်ထားခြင်းမရှိသေးပါ။ ဇတ်ကားအမည်ရိုက်ရှာလို့ရမည်မဟုတ်ပါ။';
  }
  ctx.reply(
    '🔍 *ရုပ်ရှင်/Series ရှာဖွေရန်*\n\nအောက်မှာ ရှာလိုသော ရုပ်ရှင်အမည်ကို တိုက်ရိုက်ရိုက်ပါ (ဥပမာ: Avengers)\n\nဒါမှမဟုတ် `/search ရုပ်ရှင်အမည်` လို့လည်းရိုက်ရှာလို့ရပါတယ်' + infoText,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        force_reply: true,
        selective: true
      }
    }
  );
});

// ❓ FAQ
bot.action('faq', (ctx) => {
  ctx.answerCbQuery();
  const faqText = `
❓ *မေးလေ့ရှိသောမေးခွန်းများ*

*Q1: Kumastream အခမဲ့လား?*
A: ဟုတ်ကဲ့၊ အခမဲ့ကြည့်ရှုနိုင်ပါတယ်။ အကောင့်ဖွင့်ရုံနဲ့ ချက်ချင်းကြည့်လို့ရပါတယ်။

*Q2: ဘယ် Devices တွေမှာကြည့်လို့ရလဲ?*
A: Android, iPhone, iPad, Web Browser, Smart TV အကုန်မှာကြည့်လို့ရပါတယ်။

*Q3: ရုပ်ရှင်အသစ်တွေဘယ်လောက်နှုန်း Update လဲ?*
A: နေ့စဉ် Update ပြုလုပ်ပေးနေပါတယ်။

*Q4: Myanmar Subtitle ရှိလား?*
A: ဟုတ်ကဲ့၊ Myanmar Subtitle ပါဝင်ပါတယ်။ English Subtitle လည်းရွေးချယ်လို့ရပါတယ်။

*Q5: Download လုပ်လို့ရလား?*
A: ဟုတ်ကဲ့၊ Offline ကြည့်ဖို့ Download လုပ်လို့ရပါတယ်။

*Q6: Video Quality ဘာတွေရှိလဲ?*
A: 360p, 480p, 720p (HD), 1080p (Full HD) ရွေးချယ်လို့ရပါတယ်။

*Q7: ရုပ်ရှင်အသစ်တင်ချိန် ဘယ်လိုသိနိုင်မလဲ?*
A: /subscribe ကိုသုံးပြီး စာရင်းသွင်းပါ။ အသစ်တင်ရင် သတိပေးပါမယ်။

*Q8: Korean Drama တွေရှိလား?*
A: ရှိပါတယ်! Squid Game, All of Us Are Dead, Sweet Home စတဲ့ Korean Drama တွေ အကုန်ရှိပါတယ်။
`;

  ctx.editMessageText(faqText, {
    parse_mode: 'Markdown',
    ...Markup.inlineKeyboard([
      [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
    ])
  });
});

// 📱 App Download
bot.action('download', (ctx) => {
  ctx.answerCbQuery();

  const downloadButtons = [];

  downloadButtons.push([
    Markup.button.url('🤖 Android APK ဒေါင်းလုပ်', ANDROID_APK_URL)
  ]);

  if (IOS_APP_URL) {
    downloadButtons.push([
      Markup.button.url('🍎 iOS App Store', IOS_APP_URL)
    ]);
  }

  if (WEB_URL) {
    downloadButtons.push([
      Markup.button.url('🌐 Web Browser', WEB_URL)
    ]);
  }

  downloadButtons.push([
    Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')
  ]);

  ctx.editMessageText(
    `Hi bro 👋 ရုပ်ရှင် Streaming APP ကို ဒေါင်းချင်ပါသလား?

အောက်ပါ မိမိသုံးချင်တဲ့ APP အမျိုးအစားကို ရွေးပြီး ဒေါင်းလုပ်ဆွဲနိုင်ပါတယ်ဗျာ။

🎬 APP ထဲမှာ ဇတ်ကားအစုံ
📺 4K / 2K / 1080p / 720p Quality
🇲🇲 မြန်မာစာတန်းထိုး ဇတ်ကားအစုံ
💰 အခမဲ့ Free Unlimited
⚡ လျှပ်စစ်မိုဘိုင်း Download မြန်ဆန်

APP စမ်းကြည့်ရင် သိနိုင်ပါမယ်!`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(downloadButtons)
    }
  );
});

// ℹ️ အကြောင်း
bot.action('about', (ctx) => {
  ctx.answerCbQuery();
  ctx.editMessageText(
    `ℹ️ *Kumastream အကြောင်း*

Kumastream သည် ရုပ်ရှင်များနှင့် TV Shows များကို အခမဲ့ကြည့်ရှုနိုင်သော Platform တစ်ခုဖြစ်ပါသည်။

*Features:*
🎬 ရုပ်ရှင်အသစ်များ - အမြဲတမ်း Update
📺 TV Shows - နာမည်ကြီး Series
🔥 Trending - လူကြိုက်များနေသည်
📂 Categories - အမျိုးအစားစုံ
🔍 Search - ရှာဖွေနိုင်
🔔 Notification - အကြောင်းကြားခြင်း
📱 မည်သည့် Device မဆို ကြည့်ရှုနိုင်
🎯 Myanmar Subtitle ပါဝင်

*ဆက်သွယ်ရန်:*
🌐 Telegram: @kumastream132_bot`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
      ])
    }
  );
});

// 🔙 ပင်မမီနူး
bot.action('back_menu', (ctx) => {
  ctx.answerCbQuery();
  const userId = ctx.from.id.toString();
  const user = botData.users[userId];
  const subStatus = user && user.subscribed ? ' ✅' : '';

  ctx.editMessageText(
    `🎬 *Kumastream မှ ကြိုဆိုပါတယ်!*\n\nသင်၏ ရုပ်ရှင်နှင့် TV Shows ကြည့်ရှုရေး Bot ပါ။${subStatus}\n\nဘာလုပ်ချင်ပါသလဲ?`,
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
// Smart Response
// ============================================
bot.on('message', (ctx) => {
  const text = ctx.message.text;
  if (!text) return;

  const movieKeywords = ['movie', 'film', 'ရုပ်ရှင်', 'ကား', 'sin'];
  const seriesKeywords = ['series', 'show', 'drama', 'tv', 'anime'];
  const helpKeywords = ['help', 'ကူ', 'ဘာလုပ်', 'ဘယ်လို', 'မသိ'];

  const textLower = text.toLowerCase();

  if (movieKeywords.some(k => textLower.includes(k))) {
    ctx.reply('🎬 ရုပ်ရှင်ကြည့်ချင်တယ်လား?', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('💥 Action', 'cat_action'), Markup.button.callback('😂 Comedy', 'cat_comedy')],
        [Markup.button.callback('👻 Horror', 'cat_horror'), Markup.button.callback('🚀 Sci-Fi', 'cat_scifi')],
        [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
      ])
    });
  } else if (seriesKeywords.some(k => textLower.includes(k))) {
    ctx.reply('📺 TV Shows ကြည့်ချင်တယ်လား?', {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🔥 Trending', 'ser_trending'), Markup.button.callback('🇰🇷 Korean', 'ser_korean')],
        [Markup.button.callback('🇯🇵 Anime', 'ser_anime'), Markup.button.callback('🇺🇸 Western', 'ser_western')],
        [Markup.button.callback('🔙 ပင်မမီနူး', 'back_menu')]
      ])
    });
  } else if (helpKeywords.some(k => textLower.includes(k))) {
    ctx.reply('🤖 ကျွန်တော်ကို ဘာလုပ်ခိုင်းချင်ပါသလဲ?\n\nခလုတ်တွေနှိပ်ပြီး အသုံးပြုပါ!', mainMenu);
  } else {
    ctx.reply(
      '🤖 ကျွန်တော်ဟာ Kumastream Bot ပါ။\n\nခလုတ်တွေနှိပ်ပြီး အသုံးပြုပါ ဒါမှမဟုတ်:\n\n/search အမည် - ရှာဖွေရန်\n/subscribe - အကြောင်းကြားခြင်း\n/stats - Bot စာရင်း',
      mainMenu
    );
  }
});

// ============================================
// Bot Start
// ============================================
bot.launch().then(() => {
  console.log('✅ Kumastream Bot Level 3 (FINAL v2) အသက်ဝင်ပါပြီး!');
  console.log(`👤 Admin IDs: ${ADMIN_IDS.length > 0 ? ADMIN_IDS.join(', ') : 'မထည့်ရသေးပါ - ADMIN_IDS environment variable ထည့်ပါ'}`);
  console.log(`🎬 Movies in DB: ${(botData.adminMovies || []).length} (No Limit)`);
  console.log(`📊 Storage: Limit မရှိပါ - ဇတ်ကားဘယ်လောက်မဆို တင်လို့ရပါတယ်`);
}).catch((err) => {
  console.error('Bot စတင်မှု မအောင်မြင်ပါ:', err);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
