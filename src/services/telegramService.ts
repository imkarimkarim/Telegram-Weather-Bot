import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

export class TelegramService {
  private readonly token: string;
  private readonly chatId: string;
  private readonly bot: TelegramBot;

  constructor() {
    this.token = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
    this.bot = new TelegramBot(this.token, { polling: false });
  }

  async sendMessage(message: string): Promise<void> {
    try {
      await this.bot.sendMessage(this.chatId, message);
    } catch (error) {
      throw new Error(
        `Failed to send Telegram message: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }
}
