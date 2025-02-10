import { Client } from "discord.js";
import {
  entersState,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";

export async function initializeVoiceChat(
  bot: Client
): Promise<VoiceConnection | null> {
  const guild = await bot.guilds.fetch(process.env.DISCORD_GUILD!);
  const voiceChannel = await bot.channels.fetch(process.env.DISCORD_CHANNEL!);

  if (voiceChannel === null) return null;
  if (!voiceChannel.isVoiceBased()) return null;

  console.log("Channel found! Name:", voiceChannel.name);
  console.log(
    "If your bot doesn't connect to the voice channel within 10-20 seconds, please ctrl+c and try again!"
  );

  // const voiceManager = bot.voice;
  const voiceConnection = joinVoiceChannel({
    selfDeaf: true,
    guildId: guild.id,
    channelId: voiceChannel.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
  });

  await entersState(voiceConnection, VoiceConnectionStatus.Ready, 40_000);

  return voiceConnection;
}
