import { SlashCommandBuilder } from 'discord.js';
import { Command } from './index';
import {
  getLatestYear,
  getLeaderboard, LeaderboardData, MemberData,
} from '../util';

const GOLD_STAR = '★';
const SILVER_STAR = '☆';

const getStars = (user: MemberData): {count: number, str: string} => {
  let out = '';
  let count = 0;
  for (let i = 1; i <= 25; ++i) {
    // @ts-ignore
    if (user.completion_day_level[i]) {
      // @ts-ignore
      out += user.completion_day_level[i][2] ? GOLD_STAR : SILVER_STAR;
      // @ts-ignore
      count += user.completion_day_level[i][2] ? 2 : 1;
    } else {
      out += ' ';
    }
  }
  return {
    count,
    str: out,
  };
};

const getEmbed = async (year = getLatestYear()): Promise<any | null> => {
  let data: LeaderboardData | undefined;

  try {
    data = await getLeaderboard(year);
  } catch (e) {
    data = undefined;
  }

  if (!data) return null;

  const maxLength = Object.values(data.members)
    .map((user: MemberData) => user.name.length)
    .reduce((a, b) => Math.max(a, b), 5);

  const startLength = Math.floor(Math.log10(Object.values(data.members).length))
  + 1 + 2 + maxLength + 1 + 3 + 1;

  const today = new Date();
  const cornerText = today.getUTCMonth() === 11 && today.getUTCDate() <= 25 && year === today.getUTCFullYear() ? ` Day ${today.getUTCDate()}` : '';

  const dayLabels = `${cornerText}${' '.repeat(startLength + 9 - cornerText.length) + '₁'.repeat(10) + '₂'.repeat(6)}\n${' '.repeat(startLength)}${'₁₂₃₄₅₆₇₈₉₀'.repeat(2)}₁₂₃₄₅`;

  let top: MemberData = Object.values(data.members)[0];

  const players = Object.values(data.members)
    .sort((a: MemberData, b: MemberData) => b.local_score - a.local_score)
    .map((user: MemberData, index, arr) => {
      if (!index) top = user;
      const stars = getStars(user);
      const starsCount: string = stars.count === 50 ? '💯%' : `${`${Math.floor((stars.count / 50) * 100)}`.padStart(2, ' ')}%`;
      return `${(`${index + 1}`).padStart(Math.floor(Math.log10(arr.length)) + 1, ' ')}) ${user.name.padStart(maxLength, ' ')} ${user.local_score.toString().padStart(3, ' ')} ${stars.str} ${starsCount}`;
    }).join('\n');
  const embed = {
    title: `${year} stats`,
    description: `Top: \`${top.name}\` (${top.local_score})
\`\`\`js
${dayLabels}
${players}
\`\`\``,

  };

  return embed;
};

export default {
  commandData: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('View the stats of a year')
    .addIntegerOption((op) => op
      .setName('year')
      .setDescription('Year to lookup, defaults to latest')
      .setMinValue(2015)),
  name: 'Stats',
  async exec(interaction: any) {
    const year = interaction.options.getInteger('year');
    const embed = year ? await getEmbed(year) : await getEmbed();

    if (!embed) return;

    await interaction.reply({
      embeds: [
        embed,
      ],
    });
  },
} as Command;
