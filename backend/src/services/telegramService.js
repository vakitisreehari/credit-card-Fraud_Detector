const axios = require('axios');

class TelegramService {
  static async sendFraudAlert(transaction) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    const riskBadge = transaction.riskScore >= 75 ? '🚨 HIGH RISK 🚨' : '⚠️ MEDIUM RISK ⚠️';
    const maskedCard = transaction.cardNumber;
    
    // Format message
    const message = `
*${riskBadge} Fraud Alert*
-----------------------------------
*Cardholder:* ${transaction.cardholderName}
*Card:* ${maskedCard}
*Amount:* $${transaction.amount.toFixed(2)}
*Merchant:* ${transaction.merchant} (${transaction.merchantCategory || 'Retail'})
*Location:* ${transaction.location?.city || 'Unknown'}, ${transaction.location?.country || 'Unknown'}
*IP Address:* ${transaction.ipAddress || 'Unknown'}

*Risk Analysis:*
• *Risk Score:* \`${transaction.riskScore}%\`
• *Decision:* \`${transaction.decision}\`
• *Velocity (1h):* ${transaction.velocity_1h} tx
• *Device Risk:* \`${(transaction.device_risk_score * 100).toFixed(1)}%\`
• *Distance:* \`${transaction.distance_from_home.toFixed(1)} km\`
• *Declined Before?:* ${transaction.is_declined_before ? 'Yes' : 'No'}

*Top Indicators:*
${transaction.explanation.slice(0, 3).map(e => `- *${e.feature}*: \`${e.percentage}%\` impact (val: ${e.value.toFixed(1)})`).join('\n')}

_Action Links:_
[Approve Transaction](${process.env.APP_URL || 'http://localhost:5173'}/alerts/approve/${transaction._id}) | [Block Card](${process.env.APP_URL || 'http://localhost:5173'}/alerts/block/${transaction._id})
`;

    // Console Logging always
    console.log('==================================================');
    console.log(`TELEGRAM OUTGOING ALERT [Chat: ${chatId || 'MOCK_CHAT'}]:`);
    console.log(message);
    console.log('==================================================');

    if (!token || !chatId) {
      console.log('Telegram Alert not sent via HTTP: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID environment variables are missing.');
      return false;
    }

    try {
      const url = `https://api.telegram.org/bot${token}/sendMessage`;
      await axios.post(url, {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Approve & Dismiss', callback_data: `dismiss_${transaction._id}` },
              { text: '❌ Block Credit Card', callback_data: `block_${transaction._id}` }
            ]
          ]
        }
      });
      console.log('Telegram Alert dispatched successfully.');
      return true;
    } catch (err) {
      console.error(`Failed to send Telegram message: ${err.message}`);
      if (err.response && err.response.data) {
        console.error('Telegram API Error details:', err.response.data);
      }
      return false;
    }
  }

  // Processes webhook calls from Telegram Bot (e.g. inline buttons press)
  static async handleWebhook(body) {
    if (!body || !body.callback_query) return null;
    
    const query = body.callback_query;
    const data = query.data; // e.g. "block_tx123"
    const messageId = query.message.message_id;
    const chatId = query.message.chat.id;
    
    const [action, txId] = data.split('_');
    
    console.log(`Telegram Bot Action: ${action} on Transaction ID: ${txId}`);
    
    const TransactionModel = require('../models/Transaction');
    const transaction = await TransactionModel.findById(txId);
    
    if (!transaction) {
      return {
        text: 'Transaction not found.',
        chat_id: chatId,
        message_id: messageId
      };
    }

    // Idempotency State Locking
    if (transaction.status !== 'PENDING_REVIEW' && transaction.status !== 'PENDING_OTP') {
      const token = process.env.TELEGRAM_BOT_TOKEN;
      if (token) {
        try {
          await axios.post(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
            callback_query_id: query.id,
            text: `⚠️ State Locked: This transaction has already been resolved!`,
            show_alert: true
          });
        } catch (e) {}
      }
      return `Action already completed. State is locked at: ${transaction.status}`;
    }

    let statusUpdate = {};
    let responseText = '';

    if (action === 'block') {
      statusUpdate = { status: 'BLOCKED', decision: 'BLOCKED' };
      responseText = `Blocked credit card for ${transaction.cardholderName}.`;
    } else if (action === 'dismiss') {
      statusUpdate = { status: 'APPROVED', decision: 'APPROVED' };
      responseText = `Approved transaction of $${transaction.amount} for ${transaction.cardholderName}.`;
    }

    await TransactionModel.findByIdAndUpdate(txId, statusUpdate);

    // Edit message in Telegram chat to show result
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (token) {
      try {
        await axios.post(`https://api.telegram.org/bot${token}/editMessageText`, {
          chat_id: chatId,
          message_id: messageId,
          text: `${query.message.text}\n\n*Operator Decision:* ${action === 'block' ? '🔴 BLOCKED' : '🟢 APPROVED'} (by Telegram)`,
          parse_mode: 'Markdown'
        });
      } catch (err) {
        console.error('Failed to update Telegram message:', err.message);
      }
    }

    return responseText;
  }

  static async processIncomingUpdate(update) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;

    if (update.callback_query) {
      await this.handleWebhook({ callback_query: update.callback_query });
      return;
    }

    if (!update.message || !update.message.text) return;
    const msg = update.message;
    const text = msg.text.trim();
    const chatId = msg.chat.id;

    // ── START / HELP COMMANDS ──
    if (text === '/start' || text === '/help') {
      const welcome = `
*Welcome to FraudShield AI Assistant Bot!* 🛡️
I am your interactive credentials, security, and verification helper.

*Available Commands:*
• \`/check <card_number>\` - Verifies card validity, brand, BIN, and risk score.
• \`/status\` - Checks if the FraudShield backend is active.
• \`/otp [code]\` - Lists active challenges or verifies a transaction OTP (e.g. \`/otp 123456\`).
• \`/mail <email>\` - Simulates a registration confirmation mail dispatch.
• \`/credentials\` - Dynamically generates & saves a secure dashboard login for you.
• \`/support <query>\` - Interactive AI support helpdesk desk.
`;
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: welcome,
        parse_mode: 'Markdown'
      }).catch(err => console.error('Error sending bot message:', err.message));
      return;
    }

    // ── STATUS COMMAND ──
    if (text === '/status') {
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: `✅ *FraudShield AI System Status:* \`ONLINE\``,
        parse_mode: 'Markdown'
      }).catch(err => console.error('Error sending bot message:', err.message));
      return;
    }

    // ── OTP VERIFICATION ASSISTANT ──
    if (text.startsWith('/otp')) {
      const args = text.split(/\s+/).slice(1);
      const otpCodeInput = args[0] ? args[0].replace(/\D/g, '') : '';
      
      const TransactionModel = require('../models/Transaction');

      try {
        // Find latest transaction awaiting OTP
        const activeTx = await TransactionModel.getMongoModel().findOne({ status: 'PENDING_OTP' }).sort({ createdAt: -1 });

        if (!activeTx) {
          await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: `❌ *No Active OTP Challenges Found.*\nThere are currently no transactions in the review queue awaiting an SMS or email OTP verification. Try running the *Medium-Risk Preset* in the Simulator to trigger one!`,
            parse_mode: 'Markdown'
          });
          return;
        }

        // If no OTP code was supplied, display details of the challenge
        if (!otpCodeInput) {
          const detailMsg = `
🔑 *Active OTP Challenge Detected*
-----------------------------------
• *Transaction ID:* \`${activeTx._id}\`
• *Cardholder:* \`${activeTx.cardholderName}\`
• *Amount:* \`$${activeTx.amount.toFixed(2)}\`
• *Merchant:* \`${activeTx.merchant}\`
• *Status:* \`AWAITING OTP VERIFICATION\`

To complete the authentication for this customer, reply with:
\`/otp <6-digit-code>\` _(e.g., \`/otp ${activeTx.otpCode}\` to approve, or guess another code)_
`;
          await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: detailMsg,
            parse_mode: 'Markdown'
          });
          return;
        }

        // Verify the supplied code
        if (activeTx.otpCode === otpCodeInput) {
          // Approved
          await TransactionModel.getMongoModel().findByIdAndUpdate(activeTx._id, {
            status: 'APPROVED',
            otpVerified: true
          });

          await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: `✅ *OTP Verification Successful!*\nThe transaction of *$${activeTx.amount.toFixed(2)}* for *${activeTx.cardholderName}* has been authenticated and approved securely.`,
            parse_mode: 'Markdown'
          });
        } else {
          // Failed / Blocked
          await TransactionModel.getMongoModel().findByIdAndUpdate(activeTx._id, {
            status: 'BLOCKED',
            otpVerified: false
          });

          await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
            chat_id: chatId,
            text: `🚨 *OTP Verification Failed!*\nThe code \`${otpCodeInput}\` is invalid. The transaction for *${activeTx.cardholderName}* has been blocked to prevent account takeover.`,
            parse_mode: 'Markdown'
          });
        }
      } catch (err) {
        console.error('Error handling /otp command:', err.message);
      }
      return;
    }

    // ── EMAIL CONFIRMATION DISPATCH SIMULATOR ──
    if (text.startsWith('/mail')) {
      const args = text.split(/\s+/).slice(1);
      const email = args[0] ? args[0].trim() : '';

      if (!email || !email.includes('@')) {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
          chat_id: chatId,
          text: `⚠️ *Usage:* \`/mail <email_address>\`\n_Example: \`/mail operator@fraudshield.ai\`_`,
          parse_mode: 'Markdown'
        });
        return;
      }

      const mockConfirmationCode = Math.floor(100000 + Math.random() * 900000).toString();
      const mailMsg = `
✉️ *SMTP Mail Dispatcher Service*
-----------------------------------
• *Status:* \`SENT\` (Simulated)
• *Recipient:* \`${email}\`
• *Subject:* \`Identity Verification Required - FraudShield AI\`
• *Template:* \`3D-Secure Mail Challenge\`
• *Email Confirmation Code:* \`${mockConfirmationCode}\`

*Confirmation Link:*
[Confirm Email Address](${process.env.APP_URL || 'http://localhost:5173'}/confirm-email?address=${encodeURIComponent(email)}&code=${mockConfirmationCode})

_The simulated identity email confirmation has been queued and sent successfully!_
`;
      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: mailMsg,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      });
      return;
    }

    // ── OPERATOR CREDENTIALS GENERATOR & DB DISPATCH ──
    if (text.startsWith('/credentials')) {
      const UserModel = require('../models/User');

      try {
        const randId = Math.floor(1000 + Math.random() * 9000);
        const tempUsername = `operator_bot_${randId}`;
        const tempPassword = `securePass_${randId}`;

        // Create the user inside MongoDB!
        await UserModel.create({
          username: tempUsername,
          password: tempPassword,
          email: `${tempUsername}@fraudshield.ai`,
          role: 'operator',
          status: 'active'
        });

        const credentialsMsg = `
🔑 *Operator Credentials Generated & Saved*
-----------------------------------
A new staff login has been registered in the database:

• *Username:* \`${tempUsername}\`
• *Password:* \`${tempPassword}\`
• *Assigned Role:* \`Operator\`
• *Status:* \`Active (Registered in MongoDB)\`

You can use these credentials to log in to the main dashboard immediately at:
${process.env.APP_URL || 'http://localhost:5173/'}
`;
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
          chat_id: chatId,
          text: credentialsMsg,
          parse_mode: 'Markdown'
        });
      } catch (err) {
        console.error('Error generating operator credentials:', err.message);
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
          chat_id: chatId,
          text: `❌ *Error:* Failed to register credentials inside the MongoDB database.`,
          parse_mode: 'Markdown'
        });
      }
      return;
    }

    // ── AI ASSISTANCE SUPPORT DESK ──
    if (text.startsWith('/support')) {
      const args = text.split(/\s+/).slice(1);
      const query = args.join(' ').toLowerCase();

      if (!query) {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
          chat_id: chatId,
          text: `⚠️ *Usage:* \`/support <your_question>\`\n_Example: \`/support how to change rule limits?\`_`,
          parse_mode: 'Markdown'
        });
        return;
      }

      let answer = '';
      if (query.includes('limit') || query.includes('amount') || query.includes('rule')) {
        answer = `🛡️ *FraudShield Helpdesk — Rules & Limits*:\nBy default, transactions exceeding $2,000 or having a high risk score (>75) trigger manual review. You can create, edit, or toggle rules inside the *Rules* panel in your dashboard console.`;
      } else if (query.includes('connect') || query.includes('mongo') || query.includes('database') || query.includes('ip')) {
        answer = `🔌 *FraudShield Helpdesk — Database Connection*:\nIf your server fails to connect to MongoDB Atlas, ensure your cluster Network Access whitelist includes \`0.0.0.0/0\` (Access from anywhere) to allow connection handshakes.`;
      } else if (query.includes('otp') || query.includes('code') || query.includes('verify')) {
        answer = `🔑 *FraudShield Helpdesk — OTP Verification*:\nHigh-risk transactions trigger a 3D-Secure SMS check. Users submit their 6-digit code on the simulator checkout. You can also view or approve these OTP checks right here in this bot using the \`/otp\` command!`;
      } else {
        answer = `🤖 *FraudShield Helpdesk — General Support*:\nI am your automated AI Support Assistant. I can help you check cards (/check), manage OTPs (/otp), check health, and generate operator accounts (/credentials).\n\nIf you have a dedicated technical inquiry, feel free to email our engineering desk at support@fraudshield.ai.`;
      }

      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: answer,
        parse_mode: 'Markdown'
      });
      return;
    }

    // ── CARD CHECKING UTILITY (Original) ──
    if (text.startsWith('/check')) {
      const args = text.split(/\s+/).slice(1);
      const rawCard = args.join('');
      const cleanCard = rawCard.replace(/\D/g, '');

      if (!cleanCard) {
        await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
          chat_id: chatId,
          text: `⚠️ *Usage:* \`/check <card_number>\`\n_Example: \`/check 4111222233334589\`_`,
          parse_mode: 'Markdown'
        }).catch(err => console.error('Error sending bot message:', err.message));
        return;
      }

      // Run validations
      const cardValidator = require('../utils/cardValidator');
      const ApiVerificationService = require('./apiVerificationService');

      const luhnValid = cardValidator.validateLuhn(cleanCard);
      const brand = cardValidator.detectBrand(cleanCard);
      const fraudPatterns = cardValidator.detectFraudPatterns(cleanCard);
      
      // BIN lookup
      const binInfo = await ApiVerificationService.verifyBIN(cleanCard);
      const cardBrand = binInfo.brand || brand;
      const cardType = binInfo.type;
      const cardIssuer = binInfo.issuer;
      const cardCountry = binInfo.country;

      // Mask card number
      const first4 = cleanCard.substring(0, 4);
      const last4 = cleanCard.substring(cleanCard.length - 4);
      const masked = cleanCard.length >= 12 ? `${first4}********${last4}` : cleanCard;

      let overallRisk = '🟢 LOW RISK';
      let riskScore = 5;

      if (!luhnValid) {
        overallRisk = '🚨 CRITICAL: FAKE CARD (Luhn Failed)';
        riskScore = 100;
      } else if (fraudPatterns.length > 0) {
        overallRisk = '🔴 HIGH RISK (Pattern Flag)';
        riskScore = 95;
      } else if (cardBrand === 'Unknown') {
        overallRisk = '⚠️ MEDIUM RISK (Unknown Brand)';
        riskScore = 50;
      }

      const report = `
💳 *Card Verification Report*
-----------------------------------
• *Card Number:* \`${masked}\`
• *Detected Brand:* \`${cardBrand}\`
• *Card Type:* \`${cardType}\`
• *Issuer Bank:* \`${cardIssuer}\`
• *Issuer Country:* \`${cardCountry}\`

🔍 *Technical Checksum Validation:*
• *Luhn Check:* ${luhnValid ? '✅ VALID' : '❌ INVALID'}
• *Format Length:* ${cleanCard.length >= 15 && cleanCard.length <= 16 ? '✅ OK' : '⚠️ SUSPICIOUS'}
• *Fraud Patterns:* ${fraudPatterns.length > 0 ? `🚨 Triggered (${fraudPatterns.length})` : '✅ None'}

${fraudPatterns.map(p => `  _- ${p}_`).join('\n')}

🛡️ *AI Risk Analysis Score:* \`${riskScore}%\`
*Verdict:* *${overallRisk}*
`;

      await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
        chat_id: chatId,
        text: report,
        parse_mode: 'Markdown'
      }).catch(err => console.error('Error sending bot message:', err.message));
    }
  }

  static startPolling() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.log('Telegram Bot: No bot token provided. Polling client disabled.');
      return;
    }
    console.log('Telegram Bot: Starting polling engine for commands (getUpdates)...');
    let offset = 0;

    const poll = async () => {
      try {
        const response = await axios.get(`https://api.telegram.org/bot${token}/getUpdates`, {
          params: { offset, timeout: 5 },
          timeout: 10000
        });

        if (response.data && response.data.ok) {
          const updates = response.data.result;
          for (const update of updates) {
            offset = update.update_id + 1;
            // Run async to avoid blocking polling loop
            TelegramService.processIncomingUpdate(update).catch(err => {
              console.error('Error processing update:', err.message);
            });
          }
        }
      } catch (err) {
        if (err.code !== 'ECONNABORTED' && err.message !== 'timeout of 10000ms exceeded') {
          console.error(`Telegram Bot Polling Error: ${err.message}`);
        }
      }
      // Poll again in 3 seconds
      setTimeout(poll, 3000);
    };

    poll();
  }
}

module.exports = TelegramService;
