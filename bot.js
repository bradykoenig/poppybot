require("./keep_alive");
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  PermissionsBitField,
} = require("discord.js");
const fetch = require("node-fetch");
require("dotenv").config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  presence: {
    activities: [{ name: "you poop 💩", type: "WATCHING" }],
    status: "online",
  },
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  // Force presence update every 15 seconds
  setInterval(() => {
    if (client.user) {
      client.user.setActivity("you poop 💩", { type: "WATCHING" });
    }
  }, 15000);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isStringSelectMenu())
    return;

  const { commandName, user, member } = interaction;

  if (interaction.isChatInputCommand()) {
    if (commandName === "poop") {
      return interaction.reply("💩 Pooper Patrol on duty!");
    }

    if (commandName === "quote") {
      try {
        const res = await fetch(
          "https://us-central1-poppy-d5573.cloudfunctions.net/getQuotes",
        );
        const quotes = await res.json();
        const random = quotes[Math.floor(Math.random() * quotes.length)];
        return interaction.reply(`💬 "${random.quote}" — ${random.author}`);
      } catch {
        return interaction.reply("❌ Failed to load quote.");
      }
    }

    if (commandName === "addquote") {
      const quote = interaction.options.getString("quote");
      const author = interaction.options.getString("author") || user.username;

      try {
        const res = await fetch(
          "https://us-central1-poppy-d5573.cloudfunctions.net/addQuote",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quote, author, discordId: user.id }),
          },
        );

        if (!res.ok) throw new Error("Failed to save quote");
        return interaction.reply(`✅ Quote added: "${quote}" — ${author}`);
      } catch {
        return interaction.reply("❌ Failed to save quote.");
      }
    }

    if (commandName === "removequote") {
      const quote = interaction.options.getString("quote");

      try {
        const res = await fetch(
          "https://us-central1-poppy-d5573.cloudfunctions.net/removeQuote",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quote,
              discordId: user.id,
              isAdmin: member.permissions.has(
                PermissionsBitField.Flags.Administrator,
              ),
            }),
          },
        );

        const result = await res.json();
        if (!res.ok)
          throw new Error(result.message || "Failed to delete quote");

        return interaction.reply(`🗑️ Quote removed: "${quote}"`);
      } catch (err) {
        return interaction.reply(`❌ ${err.message}`);
      }
    }

    if (commandName === "wheel") {
      try {
        const res = await fetch(
          "https://us-central1-poppy-d5573.cloudfunctions.net/getGames",
        );
        const games = await res.json();
        const choice = games[Math.floor(Math.random() * games.length)];
        return interaction.reply(
          `🎡 The Game Wheel landed on: **${choice.name}**`,
        );
      } catch {
        return interaction.reply("❌ Failed to spin the wheel.");
      }
    }

    if (commandName === "avatar") {
      try {
        const res = await fetch(
          "https://us-central1-poppy-d5573.cloudfunctions.net/getAvatars",
        );
        const avatars = await res.json();
        const match = avatars.find((e) => e.discordId === user.id);

        if (!match)
          return interaction.reply("😕 You haven't submitted any avatars.");

        let response = `🎭 **Avatars for ${user.username}**\n`;
        if (match.robloxUsername)
          response += `🕹 Roblox: ${match.robloxUsername}\n`;
        if (match.minecraftUsername)
          response += `⛏ Minecraft: ${match.minecraftUsername}`;
        return interaction.reply(response);
      } catch {
        return interaction.reply("❌ Couldn't fetch avatars.");
      }
    }

    if (commandName === "media") {
      try {
        const res = await fetch(
          "https://us-central1-poppy-d5573.cloudfunctions.net/getMedia",
        );
        const media = await res.json();

        if (!media || media.length === 0)
          return interaction.reply("No media uploaded yet.");

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
      } catch {
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
      const channel = interaction.channel;

      try {
        await channel.send(`📢 **Announcement:** ${message}`);
        return interaction.reply({
          content: "✅ Announcement sent.",
          ephemeral: true,
        });
      } catch {
        return interaction.reply("❌ Failed to send announcement.");
      }
    }
  }

  // Media dropdown handler
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "media_select"
  ) {
    await interaction.channel.send(
      `📸 Selected media:\n${interaction.values[0]}`,
    );
    await interaction.update({
      content: "✅ Media sent to chat.",
      components: [],
    });
  }
});

// Legacy message listener (forces presence visibility)
client.on("messageCreate", (message) => {
  if (message.content === "!poop") {
    message.reply("💩 Status check: Pooper Patrol is watching!");
  }
});

client.login(process.env.DISCORD_TOKEN);
