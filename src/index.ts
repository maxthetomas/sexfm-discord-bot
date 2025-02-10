import { ActivityType, Client } from "discord.js";
import { initializeVoiceChat } from "./audio";
import { createAudioPlayer, createAudioResource } from "@discordjs/voice";

const bot = new Client({
  intents: "GuildVoiceStates",
  presence: {
    status: "dnd",
  },
});

bot.login(process.env.DISCORD_TOKEN!);

const chat = await initializeVoiceChat(bot);

if (!chat) {
  throw new Error("Could not initialize voice chat!");
}

const player = createAudioPlayer({ debug: true });

chat?.subscribe(player);

// Close gracefully
process.on("SIGINT", async () => {
  chat?.disconnect();
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
