require("dotenv").config();

const dedent = require("dedent");
const Discord = require("discord.js");
const { Command } = require("commander");

const {
  getStation,
  getStationData,
  constructMessageAQI,
  constructMessageDetailed,
  sendMessage
} = require("./utils");

const client = new Discord.Client();
const trigger = new Command("vonage-aqi");

let message = {};

trigger.exitOverride();

trigger.addHelpCommand(false);

trigger
  .command("brief <searchterm...>")
  .alias("b")
  .action(async (searchterm) => {
    searchterm = searchterm.join(" ");
    const station = await getStation(searchterm);
    if (station.error) {
      await sendMessage(station.error, message);
      return;
    }
    const stationData = await getStationData(station);
    if (stationData.error) {
      await sendMessage(stationData.error, message);
      return;
    }
    await sendMessage(constructMessageAQI(station, stationData), message);
  });

trigger
  .command("info <searchterm...>")
  .alias("i")
  .action(async (searchterm) => {
    searchterm = searchterm.join(" ");
    const station = await getStation(searchterm);
    if (station.error) {
      await sendMessage(station.error, message);
      return;
    }
    const stationData = await getStationData(station);
    if (stationData.error) {
      await sendMessage(stationData.error, message);
      return;
    }
    await sendMessage(constructMessageDetailed(station, stationData), message);
  });

trigger.command("act").action(async () => {
  await sendMessage(
    dedent`
      Here are some reasons why you should care about increasing air pollution:
      1. Polluted air is creating a health emergency.
      2. Children are most at risk.
      3. Pollution and poverty go hand in hand.
      4. The cheaper the fuels, the higher the costs.
      5. The right to clean air is a human right.
      Read https://www.worldenvironmentday.global/get-involved/practical-guides and find out what you can do to involve your business, school and families. And call on your government to enforce the World Health Organization guidelines for ambient and indoor air quality. Remember, clean air is your right!`,
    message
  );
});

trigger
  .command("help")
  .alias("h")
  .action(async () => {
    await sendMessage(
      new Discord.MessageEmbed()
        .setColor("#7ECE29")
        .setTitle("Help Menu")
        .setDescription(
          dedent`\`\`\`!aqi brief: Brief Information about the Air Quality
            !aqi info: Detailed Information about the Air Quality
            !aqi act: Resources about the effects of Air Pollution
            !aqi help: Help Information\`\`\``
        ),
      message
    );
  });

client.on("ready", () => {
  console.log(`logged in as ${client.user.tag}`);
});

client.on("message", async (msg) => {
  try {
    message = msg;
    if (!message.content.startsWith("!aqi") || message.author.bot) return;
    trigger.parse(message.content.slice(4).trim().split(/ +/), {
      from: "user"
    });
  } catch (err) {
    if (
      err.code === "commander.unknownCommand" ||
      err.code === "commander.missingArgument"
    )
      await sendMessage(
        new Discord.MessageEmbed()
          .setColor("#7ECE29")
          .setTitle("Supported Commands")
          .setDescription(
            dedent`\`\`\`!aqi brief <station-name> (alias: !aqi b)
              !aqi info <station-name> (alias: !aqi i)
              !aqi act
              !aqi help (alias: !aqi h)\`\`\``
          ),
        msg
      );
    else console.log(err);
  }
});

client.login(process.env.DISCORD_TOKEN);
