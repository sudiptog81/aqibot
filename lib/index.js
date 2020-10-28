require('dotenv').config();

const express = require('express');
const { Command } = require('commander');

const {
  getStation,
  getStationData,
  constructMessageAQI,
  constructMessageDetailed,
  sendMessage
} = require('./utils');
const dedent = require('dedent');

let reqBody = {};

const app = express();
const PORT = process.env.PORT || 3070;

const trigger = new Command();

trigger
  .exitOverride();

trigger
  .addHelpCommand(false);

trigger
  .name("vonage-aqi");

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
    await sendMessage(
      constructMessageAQI(station, stationData),
      reqBody
    );
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
    await sendMessage(
      constructMessageDetailed(station, stationData),
      reqBody
    );
  });

trigger
  .command("act")
  .action(async () => {
    await sendMessage(
      dedent`
      Here are some reasons why you should care about increasing air pollution:

      - Polluted air is creating a health emergency.
      - Children are most at risk.
      - Pollution and poverty go hand in hand.
      - The cheaper the fuels, the higher the costs.
      - The right to clean air is a human right.

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
        1. *aqi* - Displays Brief Information about the Air Quality (Required Argument: station)
        2. *info* - Displays Detailed Information about the Air Quality (Required Argument: station)
        2. *act* - Displays Information about what Actions once can take
        3. *help* - Displays Help Information`,
      reqBody
    );
  });

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post('/webhook/incoming', async (req, res) => {
  try {
    reqBody = req.body;
    trigger
      .parse(
        req.body.message.content.text
          .trim()
          .toLowerCase()
          .split(" "),
        {
          from: 'user'
        });
  }
  catch (err) {
    if (err.code === "commander.unknownCommand" ||
      err.code === "commander.missingArgument")
      await sendMessage(
        dedent`Supported Commands:
          1. *aqi <station>* or *a <station>*
          2. *info <station>* or *i <station>*
          3. *help* or *h*
          
          Example: *info okhla*`,
        req.body);
    else
      console.log(err);
  }
  finally {
    res.status(200).end();
  }
});

app.listen(PORT, () => console.log(`Listening on Port ${PORT}...`));
