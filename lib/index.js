require("dotenv").config();

const dedent = require("dedent");
const express = require("express");
const { Command } = require("commander");

const {
  getStation,
  getStationData,
  constructMessageAQI,
  constructMessageDetailed,
  sendMessage
} = require("./utils");

let reqBody = {};

const app = express();
const PORT = process.env.PORT || 3070;

const trigger = new Command("vonage-aqi");

trigger.exitOverride();

trigger.addHelpCommand(false);

trigger
  .command("aqi <searchterm...>")
  .alias("a")
  .action(async (searchterm) => {
    searchterm = searchterm.join(" ");
    const station = await getStation(searchterm);
    if (station.error) {
      await sendMessage(station.error, reqBody);
      return;
    }
    const stationData = await getStationData(station);
    if (stationData.error) {
      await sendMessage(stationData.error, reqBody);
      return;
    }
    await sendMessage(constructMessageAQI(station, stationData), reqBody);
  });

trigger
  .command("info <searchterm...>")
  .alias("i")
  .action(async (searchterm) => {
    searchterm = searchterm.join(" ");
    const station = await getStation(searchterm);
    if (station.error) {
      await sendMessage(station.error, reqBody);
      return;
    }
    const stationData = await getStationData(station);
    if (stationData.error) {
      await sendMessage(stationData.error, reqBody);
      return;
    }
    await sendMessage(constructMessageDetailed(station, stationData), reqBody);
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
    reqBody
  );
});

trigger
  .command("help")
  .alias("h")
  .action(async () => {
    await sendMessage(
      dedent`Help Menu:
        1. *aqi* - Displays Brief Information about the Air Quality (Required Argument: station name)
        2. *info* - Displays Detailed Information about the Air Quality (Required Argument: station name)
        3. *act* - Displays Information about what Actions one can take to know more about the effects of Air Pollution
        4. *help* - Displays Help Information`,
      reqBody
    );
  });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/webhook/inbound", async (req, res) => {
  console.log(`${req.body.message_uuid} received`);
  try {
    reqBody = req.body;
    trigger.parse(
      req.body.message.content.text.trim().toLowerCase().split(" "),
      {
        from: "user"
      }
    );
  } catch (err) {
    if (
      err.code === "commander.unknownCommand" ||
      err.code === "commander.missingArgument"
    )
      await sendMessage(
        dedent`Supported Commands:
          1. *aqi <station-name>* (alias: *a*)
          2. *info <station-name>* (alias: *i*)
          3. *act*
          4. *help* (alias: *h*)
          
          Examples: *info okhla*, *a kolkata*`,
        req.body
      );
    else console.log(err);
  } finally {
    res.status(200).end();
  }
});

app.post("/webhook/status", (req, res) => {
  console.log(`${req.body.message_uuid} ${req.body.status}`);
  res.status(200).end();
});

app.listen(PORT, () => console.log(`Listening on Port ${PORT}...`));
