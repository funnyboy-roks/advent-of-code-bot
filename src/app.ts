import { Client, Message, GatewayIntentBits as Intents } from 'discord.js';
import dotenv from 'dotenv';
import handleCommand, { createCommands } from './commands';
import { setClient, getLeaderboard } from './util';

dotenv.config();

process.env.BOARD_ID = (process.env.BOARD_URL as string).substring(
  (process.env.BOARD_URL as string).lastIndexOf('/') + 1,
);

// getLeaderboard(2021).then(console.log).then(() => getLeaderboard(2021).then(console.log))

const client = new Client({
  intents: [
    Intents.GuildMessages,
    Intents.MessageContent,
    Intents.GuildMessageReactions,
    Intents.GuildMessageTyping,
    Intents.Guilds,
    Intents.GuildBans,
  ],
});

setClient(client);

createCommands();

client.on('ready', async () => {
  console.log('ready!');
  await getLeaderboard();
});

client.on('messageCreate', (message: Message) => {
  if (message.author.bot) return;
  if (message.content.startsWith('!')) {
    handleCommand(message);
  }
});

client.on('interactionCreate', (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.user.bot) return;
  handleCommand(interaction);
});

client.login(process.env.TOKEN);
