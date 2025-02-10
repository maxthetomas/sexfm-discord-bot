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
  const guild = await bot.guilds.fetch("1091122897273245756");
  const voiceChannel = await bot.channels.fetch("1091122897713643581");

  console.log("voicechannel", voiceChannel?.type);

  if (voiceChannel === null) return null;
  if (!voiceChannel.isVoiceBased()) return null;

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
