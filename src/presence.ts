import { ActivityType, Client } from "discord.js";

type CurrentTrack = {
  title: string;
  artist: string;
  art: string;
  start: string;
  played: "True";
  sync_offset: string;
  duration: number;
  end: string;
  source: string;
  status: string;
};

async function fetchLive365Api(): Promise<CurrentTrack | null> {
  let req = await fetch("https://api.live365.com/station/a25222");
  if (req.status !== 200) {
    return null;
  }
  return (await req.json())["current-track"];
}

const UPDATE_PRESENCE_OFFSET = 10_000;
let last_fetch_time = -1;

let previous_song: CurrentTrack | null = null;

async function updatePresence(bot: Client) {
  // Rate-Limit to avoid API spam
  if (Date.now() - last_fetch_time < 10_000)
    await new Promise((cb) => setTimeout(cb, 10_000));

  const current_song = await fetchLive365Api();

  if (current_song === null) {
    console.log("[Song] Error while fetching current song!");
    setTimeout(() => updatePresence(bot), 30_000);
    return;
  }

  if (
    previous_song?.title === current_song.title &&
    previous_song?.artist === current_song.artist
  ) {
    setTimeout(() => updatePresence(bot), 15_000);
    return;
  }

  // Request new data only when necessary
  const endTime = new Date(current_song.end);
  const msUntilNextTrack = endTime.getTime() - Date.now();
  setTimeout(
    () => updatePresence(bot),
    msUntilNextTrack + UPDATE_PRESENCE_OFFSET
  );

  const { title, artist } = current_song;

  console.log(
    `[Song] ${artist} - ${title} ` +
      `(${(current_song.duration / 60).toFixed(1)}m)`
  );

  bot.user?.setStatus("online");
  bot.user?.setActivity({
    type: ActivityType.Listening,
    name: "SexFM",
    state: `${artist} - ${title}`,
  });

  last_fetch_time = Date.now();
  previous_song = current_song;
}

export function setupPresence(bot: Client) {
  updatePresence(bot);
}
