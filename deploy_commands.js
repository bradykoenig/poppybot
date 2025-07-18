const { REST, Routes, SlashCommandBuilder } = require("discord.js");
require("dotenv").config();

const commands = [
  new SlashCommandBuilder()
    .setName("poop")
    .setDescription("Summon the Poppy Pooperz patrol"),

  new SlashCommandBuilder()
    .setName("quote")
    .setDescription("Get a random quote from the wall"),

  new SlashCommandBuilder()
    .setName("addquote")
    .setDescription("Add a quote to the wall")
    .addStringOption((option) =>
      option
        .setName("quote")
        .setDescription("The quote text")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("author")
        .setDescription("Who said it (optional)")
        .setRequired(false),
    ),

  new SlashCommandBuilder()
    .setName("removequote")
    .setDescription(
      "Remove one of your own quotes (or any if you are an admin)",
    )
    .addStringOption((option) =>
      option
        .setName("quote")
        .setDescription("The full quote text to delete")
        .setRequired(true),
    ),

  new SlashCommandBuilder()
    .setName("wheel")
    .setDescription("Spin the game wheel and pick a game"),

  new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("See your Roblox or Minecraft avatars"),

  new SlashCommandBuilder()
    .setName("media")
    .setDescription("Pick and share a media item from the website"),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Send an announcement to the current channel")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The announcement text")
        .setRequired(true),
    ),
].map((command) => command.toJSON());

const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log("📡 Registering slash commands...");
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
      body: commands,
    });
    console.log("✅ Slash commands registered!");
  } catch (error) {
    console.error("❌ Failed to register commands:", error);
  }
})();
