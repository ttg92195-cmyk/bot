// ============================================
// Kumastream Telegram Bot
// Framework: Node.js + Telegraf
// ============================================

const { Telegraf } = require('telegraf');

// Bot Token ကို Environment Variable ကနေယူပါတယ်
// Railway/Render မှာ BOT_TOKEN လို့ Setting ထဲမှာထည့်ပေးပါ
const token = process.env.BOT_TOKEN;

if (!token) {
  console.error('BOT_TOKEN environment variable မရှိပါ!');
  console.error('Railway/Render မှာ Environment Variable အနေနဲ့ BOT_TOKEN ထည့်ပါ');
  process.exit(1);
}

const bot = new Telegraf(token);

// --------------------------------------------
// /start command - Bot ကိုစတင်သုံးချင်ပေါ်လာတဲ့ message
// --------------------------------------------
bot.start((ctx) => {
  ctx.reply('မင်္ဂလာပါ Kumastream မှ ကြိုဆိုပါတယ်');
});

// --------------------------------------------
// "hi" message - User က "hi" ပို့ရင် "Hello bro!" ပြန်ဖြေ
// --------------------------------------------
bot.hears('hi', (ctx) => {
  ctx.reply('Hello bro!');
});

// စာလုံးအကြီး/အသေး ခွဲမှာမဟုတ်ပါ - Hi, HI, hI အကုန်ဖြေပါမယ်
bot.hears(/hi/i, (ctx) => {
  ctx.reply('Hello bro!');
});

// --------------------------------------------
// အခြား message တွေအတွက် (optional)
// --------------------------------------------
bot.on('message', (ctx) => {
  ctx.reply('ကျွန်တော်ဟာ Kumastream Bot ပါ။ "hi" လို့ ရိုက်ကြည့်ပါ!');
});

// --------------------------------------------
// Bot ကို Start လုပ်ခြင်း
// --------------------------------------------
bot.launch().then(() => {
  console.log('Kumastream Bot အသက်ဝင်ပါပြီး!');
}).catch((err) => {
  console.error('Bot စတင်မှု မအောင်မြင်ပါ:', err);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
