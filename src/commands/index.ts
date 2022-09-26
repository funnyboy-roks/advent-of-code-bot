import {
  Message, REST, SlashCommandBuilder, Routes, Interaction, CacheType,
} from 'discord.js';

import stats from './stats';

export type Command = {
    commandData: SlashCommandBuilder,
    name: string;
    exec: (interaction: Interaction<CacheType>) => Promise<void>|void;
}

const commands = new Map<string, Command>(Object.entries({
  stats,
}));

export const createCommands = async () => {
  const rest = new REST({ version: '10' }).setToken(process.env.TOKEN as string);

  const body = [...commands.values()].map((v) => v.commandData.toJSON());

  console.log(body);

  const data = await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID as string,
      process.env.GUILD_ID as string,
    ),
    { body },
  ) as any[];

  console.log(`Successfully registered ${data.length} application commands.`);
};

const handleCommand = async (interaction: Interaction<CacheType> | any) => {
  // const rawCommand = message.content.substring(1);

  const { commandName } = interaction;

  const cmd = commands.get(commandName);
  if (cmd) {
    await cmd.exec(interaction);
  }
};

export default handleCommand;
