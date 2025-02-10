import { Client } from "discord.js";
import {
  entersState,
  joinVoiceChannel,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

export async function initializeVoiceChat(
  bot: Client
): Promise<VoiceConnection | null> {
  const guild = await bot.guilds.fetch(process.env.DISCORD_GUILD!);
  const voiceChannel = await bot.channels.fetch(process.env.DISCORD_CHANNEL!);

  if (voiceChannel === null) return null;
  if (!voiceChannel.isVoiceBased()) return null;

  console.log("Channel found! Name:", voiceChannel.name);

  // Retry loop
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`Attempt ${attempt}/${MAX_RETRIES} to connect...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }

      const voiceConnection = joinVoiceChannel({
        selfDeaf: true,
        guildId: guild.id,
        channelId: voiceChannel.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      });

      // Handle disconnection events
      voiceConnection.on("stateChange", async (oldState, newState) => {
        console.log(
          `Connection transitioned from ${oldState.status} to ${newState.status}`
        );

        if (newState.status === VoiceConnectionStatus.Disconnected) {
          try {
            await Promise.race([
              entersState(
                voiceConnection,
                VoiceConnectionStatus.Signalling,
                5_000
              ),
              entersState(
                voiceConnection,
                VoiceConnectionStatus.Connecting,
                5_000
              ),
            ]);
            // Seems to be reconnecting to a new channel
          } catch (error) {
            // Seems to be a real disconnect, try to rejoin
            try {
              voiceConnection.rejoin();
            } catch (e) {
              voiceConnection.destroy();
            }
          }
        } else if (newState.status === VoiceConnectionStatus.Destroyed) {
          // Connection was destroyed, you might want to reconnect here
          console.log("Voice connection was destroyed");
        }
      });

      try {
        // Wait for connection and verify it's stable
        await entersState(voiceConnection, VoiceConnectionStatus.Ready, 15_000);
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2 seconds to ensure stability

        // Double check we're still connected
        if (voiceConnection.state.status === VoiceConnectionStatus.Ready) {
          console.log("Successfully connected to voice channel!");
          return voiceConnection;
        } else {
          throw new Error("Connection became unstable");
        }
      } catch (error) {
        console.error(`Connection attempt ${attempt} failed:`, error);
        voiceConnection.destroy();
        if (attempt === MAX_RETRIES) {
          console.error("All connection attempts failed");
          return null;
        }
        // Continue to next retry
      }
    } catch (error) {
      console.error(
        `Failed to create voice connection (attempt ${attempt}):`,
        error
      );
      if (attempt === MAX_RETRIES) {
        return null;
      }
      // Continue to next retry
    }
  }

  return null;
}
