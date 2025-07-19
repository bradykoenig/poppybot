require("./keep_alive");
require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionsBitField,
} = require("discord.js");

// Native fetch support (Node 18+)
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  presence: {
    status: "online",
    activities: [
      {
        name: "you take a dump 💩",
        type: 3, // WATCHING
      },
    ],
  },
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isStringSelectMenu()) return;

  const { commandName, user, member } = interaction;

  // Slash commands
  if (interaction.isChatInputCommand()) {
    if (commandName === "poop") {
      return interaction.reply("💩 Pooper Patrol on duty!");
    }

    if (commandName === "quote") {
      try {
        const res = await fetch("https://us-central1-poppy-d5573.cloudfunctions.net/getQuotes");
        const quotes = await res.json();
        const random = quotes[Math.floor(Math.random() * quotes.length)];
        return interaction.reply(`💬 "${random.quote}" — ${random.discordTag}`);
      } catch (err) {
        console.error(err);
        return interaction.reply("❌ Failed to load quote.");
      }
    }

    if (commandName === "addquote") {
      const quote = interaction.options.getString("quote");

      try {
        const res = await fetch("https://us-central1-poppy-d5573.cloudfunctions.net/saveQuote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quote,
            discordId: user.id,
            discordTag: `${user.username}#${user.discriminator}`,
          }),
        });

        if (!res.ok) throw new Error("Failed to save quote");
        return interaction.reply(`✅ Quote saved: "${quote}"`);
      } catch (err) {
        console.error(err);
        return interaction.reply("❌ Failed to save quote.");
      }
    }

    if (commandName === "removequote") {
      const id = interaction.options.getString("id");

      try {
        const res = await fetch("https://us-central1-poppy-d5573.cloudfunctions.net/deleteQuote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message || "Failed to delete");

        return interaction.reply(`🗑️ Quote deleted.`);
      } catch (err) {
        console.error(err);
        return interaction.reply(`❌ ${err.message}`);
      }
    }

    if (commandName === "wheel") {
      try {
        const res = await fetch("https://us-central1-poppy-d5573.cloudfunctions.net/getGames");
        const games = await res.json();
        const choice = games[Math.floor(Math.random() * games.length)];
        return interaction.reply(`🎡 The Game Wheel landed on: **${choice.name}**`);
      } catch (err) {
        console.error(err);
        return interaction.reply("❌ Failed to spin the wheel.");
      }
    }

    if (commandName === "avatar") {
      try {
        const res = await fetch("https://us-central1-poppy-d5573.cloudfunctions.net/getAvatars");
        const avatars = await res.json();
        const match = avatars.find((e) => e.discordId === user.id);

        if (!match) return interaction.reply("😕 You haven't submitted any avatars.");

        let response = `🎭 **Avatars for ${user.username}**\n`;
        if (match.robloxUsername) response += `🕹 Roblox: ${match.robloxUsername}\n`;
        if (match.minecraftUsername) response += `⛏ Minecraft: ${match.minecraftUsername}`;
        return interaction.reply(response);
      } catch (err) {
        console.error(err);
        return interaction.reply("❌ Couldn't fetch avatars.");
      }
    }

    if (commandName === "media") {
      try {
        const res = await fetch("https://us-central1-poppy-d5573.cloudfunctions.net/getMedia");
        const media = await res.json();

        if (!media || media.length === 0) return interaction.reply("No media uploaded yet.");

        const options = media.slice(0, 25).map((entry) => ({
          label: `${entry.type === "video" ? "🎥" : "🖼"} ${entry.url.split("/").pop().slice(0, 30)}`,
          value: entry.url,
        }));

        const menu = new StringSelectMenuBuilder()
          .setCustomId("media_select")
          .setPlaceholder("Choose a media item to share")
          .addOptions(options);

        const row = new ActionRowBuilder().addComponents(menu);

        return interaction.reply({
          content: "Select a media item to paste into chat:",
          components: [row],
          ephemeral: true,
        });
      } catch (err) {
        console.error(err);
        return interaction.reply("❌ Couldn't load media.");
      }
    }

    if (commandName === "announce") {
      if (!member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return interaction.reply({
          content: "❌ You do not have permission to use this command.",
          ephemeral: true,
        });
      }

      const message = interaction.options.getString("message");

      try {
        await interaction.channel.send(`📢 **Announcement:** ${message}`);
        return interaction.reply({ content: "✅ Announcement sent.", ephemeral: true });
      } catch (err) {
        console.error(err);
        return interaction.reply("❌ Failed to send announcement.");
      }
    }
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "media_select") {
    await interaction.channel.send(`📸 Selected media:\n${interaction.values[0]}`);
    await interaction.update({ content: "✅ Media sent to chat.", components: [] });
  }
});

client.login(process.env.DISCORD_TOKEN);
