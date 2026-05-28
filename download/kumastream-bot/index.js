// ============================================
// Kumastream Telegram Bot
// Framework: Node.js + Telegraf
// ============================================

const { Telegraf } = require('telegraf');

// ⚠️ လုံခြုံမှုအတွက် Token ကို environment variable ကနေယူသင့်ပါတယ်
// ဥပမာ: const token = process.env.BOT_TOKEN;
const token = 'ဒီနေရာမှာ သင့်ရဲ့ Token အသစ်ကို ထည့်ပါ';

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
