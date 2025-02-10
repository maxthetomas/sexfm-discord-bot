import { ActivityType, Client } from "discord.js";
import { initializeVoiceChat } from "./audio";
import { createAudioPlayer, createAudioResource } from "@discordjs/voice";
import { setupPresence } from "./presence";

const bot = new Client({
  intents: "GuildVoiceStates",
  presence: {
    status: "idle",
    activities: [
      {
        type: ActivityType.Custom,
        name: "🌐 Logging onto World Wide Web...",
      },
    ],
  },
});

bot.login(process.env.DISCORD_TOKEN!);

const chat = await initializeVoiceChat(bot);

if (!chat) {
  throw new Error("[Voice] Could not initialize voice chat!");
}

setupPresence(bot);

const player = createAudioPlayer();

player.on("stateChange", ({ status: oldStatus }, { status: newStatus }) => {
  console.log(`[Player] State change: ${oldStatus} -> ${newStatus}`);
});

chat?.subscribe(player);

// Close gracefully
process.on("SIGINT", async () => {
  await chat?.disconnect();

  await new Promise((cb) => setTimeout(cb, 1_000));
  process.exit();
});

while (true) {
  const audioResource = await createAudioResource(
    "https://streaming.live365.com/a25222"
  );

  player.play(audioResource);

  // Auto-restart if stream fails.
  while (!audioResource.ended) {
    await new Promise((cb) => setTimeout(cb, 10_000));
  }

  player.stop();
}
