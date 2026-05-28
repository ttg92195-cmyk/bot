# Kumastream Telegram Bot

## တပ်ဆင်ခြင်း (Installation)

```bash
cd kumastream-bot
npm install
```

## Bot Token ထည့်ခြင်း

`index.js` ဖိုင်ထဲမှာ အောက်ပါ စာကြောင်းကို သင့် Token နဲ့ အစားထိုးပါ:

```javascript
const token = 'ဒီနေရာမှာ သင့်ရဲ့ Token အသစ်ကို ထည့်ပါ';
```

ဒါမှမဟုတ် ပိုလုံခြုံတဲ့နည်းလမ်း (Environment Variable):

```bash
# Linux/Mac
export BOT_TOKEN=သင့်_Token_ကို_ဒီမှာ_ထည့်ပါ

# Windows CMD
set BOT_TOKEN=သင့်_Token_ကို_ဒီမှာ_ထည့်ပါ

# Windows PowerShell
$env:BOT_TOKEN="သင့်_Token_ကို_ဒီမှာ_ထည့်ပါ"
```

ပြီးရင် `index.js` မှာ:
```javascript
const token = process.env.BOT_TOKEN;
```

## Bot ကို Run လုပ်ခြင်း

```bash
npm start
```

ဒါမှမဟုတ်:
```bash
node index.js
```

## Features

| Command/Message | Bot ပြန်ဖြေမှု |
|---|---|
| `/start` | မင်္ဂလာပါ Kumastream မှ ကြိုဆိုပါတယ် |
| `hi` | Hello bro! |
| အခြားစာ | ကျွန်တော်ဟာ Kumastream Bot ပါ။ "hi" လို့ ရိုက်ကြည့်ပါ! |

## သတိချက်

- Bot Token ကို အများကြည့်နိုင်တဲ့နေရာမှာ မထည့်ပါနဲ့
- Token ပေါ်သွားရင် BotFather မှာ Revoke လုပ်ပြီး အသစ်ထုတ်ပါ
- Hosting မလုပ်ပဲနဲ့ သင့် Computer ပိတ်လိုက်ရင် Bot လည်ပါမယ်
- 24/7 လည်ချင်ရင် Railway, Render, VPS စတဲ့ Platform ပေါ်မှာ Deploy ပါ
