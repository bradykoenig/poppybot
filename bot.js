require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
} = require("discord.js");

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
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user, member } = interaction;

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
      return interaction.reply({
        content: "✅ Announcement sent.",
        ephemeral: true,
      });
    } catch (err) {
      console.error(err);
      return interaction.reply("❌ Failed to send announcement.");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
