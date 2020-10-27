require('dotenv').config();

const express = require('express');
const dedent = require('dedent');

const Axios = require('axios');
const {
  getPollutantLevels,
  getWeatherStats,
  getSeverity,
  getKeyNames
} = require('./utils');

const app = express();
const PORT = process.env.PORT || 3070;

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.post('/webhook/incoming', async (req, res) => {
  try {
    let message;
    const keywords = req.body.message.content.text.split(" ");

    if (keywords.length != 2 ||
      (keywords.length == 2 &&
        keywords[0].toLowerCase() !== "aqi")) {
      message = "Usage: AQI <station-name>"
    } else {
      const stationData = await Axios
        .get(
          "https://api.waqi.info/search/",
          {
            params: {
              token: process.env.AQICN_TOKEN,
              keyword: keywords[1]
            }
          })

      if (stationData.data.data.length === 0) {
        message = "No Stations Found. Try Again."
      }
      else {
        const station = stationData.data.data[0].station;
        const aqiData = await Axios
          .get(
            `https://api.waqi.info/feed/${station.url}/`,
            {
              params: {
                token: process.env.AQICN_TOKEN,
              }
            })

        message = dedent`
        *Air Quality Information*

        Current AQI: ${aqiData.data.data.aqi} (${getSeverity(aqiData.data.data.aqi)})
        Dominant Pollutant: ${getKeyNames()[aqiData.data.data.dominentpol]}

        _Pollutant Levels_
        ${getPollutantLevels(aqiData.data.data.iaqi)}
        _Weather Information_
        ${getWeatherStats(aqiData.data.data.iaqi)}
        Last Updated at ${new Date(Date.parse(aqiData.data.data.time.iso)).toString()}

        Station: ${station.name}
        Source: ${aqiData.data.data.attributions[0].name}`;
      }
    }

    const response = await Axios
      .post(
        "https://messages-sandbox.nexmo.com/v0.1/messages",
        {
          from: {
            type: req.body.from.type,
            [`${req.body.from.type === "messenger" ? "id" : "number"}`]:
              req.body.from.type === "messenger" ? "107083064136738" : "14157386170"
          },
          to: {
            type: req.body.from.type,
            [`${req.body.from.type === "messenger" ? "id" : "number"}`]:
              req.body.from.type === "messenger" ? req.body.from.id : req.body.from.number
          },
          message: {
            content: {
              type: "text",
              text: message
            }
          }
        }, {
        auth: {
          username: process.env.VONAGE_API_KEY,
          password: process.env.VONAGE_API_SECRET
        }
      })

    console.log(response.data.message_uuid);

    res.status(200).end();
  }
  catch (err) {
    console.log(err);
  }
});

app.listen(PORT, () => console.log(`Listening on Port ${PORT}...`));
