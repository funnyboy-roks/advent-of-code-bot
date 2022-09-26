import axios from 'axios';
import { ActivityType, Client } from 'discord.js';
import fs from 'fs';

export type DayData = {
    '1': {get_star_ts: number};
    '2': {get_star_ts: number};
}

export type MemberData = {
    stars: number;
    completion_day_level: Map<number, DayData>;
    name: string;
    id: string;
    local_score: number;
    last_star_ts: number;
    global_score: number;
}

export type LeaderboardData = {
    owner_id: string;
    members: Map<number, MemberData>;
    event: string;
};

export type CacheData = {
    leaderboardData: LeaderboardData;
    cacheDate: number;
}

let data: Map<string, CacheData> | null = null;

const saveFile = () => {
  fs.writeFileSync('data.json', JSON.stringify(Object.fromEntries(data?.entries() || []), null, 4));
};

const loadFile = () => {
  if (data) return;
  if (fs.existsSync('data.json')) {
    console.log('Loading from data.json');

    data = new Map<string, CacheData>(Object.entries(JSON.parse(fs.readFileSync('data.json', 'utf-8'))));
    console.log(`Loaded ${data.size} url(s)`);
  } else {
    data = new Map<string, CacheData>();
  }
};

export const getLatestYear = (): number => {
  const date = new Date();
  if (date.getUTCMonth() >= 11) return date.getUTCFullYear();
  return date.getUTCFullYear() - 1;
};

export const getStatus = async (): Promise<string> => {
  const leaderboard = data?.get(`https://adventofcode.com/${getLatestYear()}/leaderboard/private/view/${process.env.BOARD_ID}.json`);
  if (!leaderboard) return 'Advent of Code!';
  const memberCount = Object.keys(leaderboard.leaderboardData.members).length;
  return `AoC with ${memberCount} ${memberCount !== 1 ? 'members' : 'member'}`;
};

let client: Client;

export const setClient = (c: Client) => {
  client = c;
};

export const updateActivity = async () => {
  client?.user?.setActivity({
    name: await getStatus(),
    type: ActivityType.Playing,
  });
};

export const getLeaderboard = async (year: number = getLatestYear()):
Promise<LeaderboardData|undefined> => {
  loadFile();

  const url = `https://adventofcode.com/${year}/leaderboard/private/view/${process.env.BOARD_ID}.json`;
  let current = data?.get(url);
  if (!current || (Date.now() - current.cacheDate) > (15 * 60 * 1000)) {
    console.log(`Fetching data for year ${year}!`);

    const res = await axios.get(url, {
      headers: {
        Cookie: `session=${(process.env.COOKIE as string).trim()}`,
      },
    });
    current = {
      leaderboardData: res.data as LeaderboardData,
      cacheDate: Date.now(),
    };
    data?.set(url, current);
  }

  await updateActivity();
  saveFile();
  return current?.leaderboardData;
};
