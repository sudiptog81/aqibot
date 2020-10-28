const Axios = require("axios");
const dedent = require("dedent");

const getKeyNames = () => ({
  "co": "Carbon Monooxide",
  "dew": "Dew Point",
  "h": "Relative Humidity",
  "no2": "Nitrogen Dioxide",
  "o3": "Ozone",
  "p": "Atmospheric Pressure",
  "pm10": "PM 10",
  "pm25": "PM 2.5",
  "so2": "Sulphur Dioxide",
  "t": "Temperature",
  "w": "Wind",
  "wd": "Wind Direction"
})

const getUnits = () => ({
  "co": "ppm",
  "dew": "°C",
  "h": "%",
  "no2": "µg/m3",
  "o3": "µg/m3",
  "p": "hPa",
  "pm10": "µg/m3",
  "pm25": "µg/m3",
  "so2": "µg/m3",
  "t": "°C",
  "w": "m/s",
  "wd": "°",
})

const getSeverity = (aqi) => {
  if (aqi > 300) {
    return "Hazardous";
  } else if (aqi > 200) {
    return "Very Unhealthy";
  } else if (aqi > 150) {
    return "Unhealthy";
  } else if (aqi > 100) {
    return "Unhealthy for Sensitive Groups";
  } else if (aqi > 50) {
    return "Moderate";
  } else if (aqi >= 0) {
    return "Good";
  }
  return "NA";
}

const getPollutantLevels = (data) => {
  let string = "";
  const units = getUnits();
  const keyNames = getKeyNames();
  const POLLUTANTS = ["co", "no2", "so2", "pm25", "pm10", "o3"];
  try {
    Object
      .keys(data)
      .filter((k) => POLLUTANTS.includes(k))
      .map((key) =>
        string += `${keyNames[key]} (${units[key]}): ${data[key].v}\n`
      );
  } catch (e) {
    console.log(data);
  }
  return string;
}

const getWeatherStats = (data) => {
  let string = "";
  const units = getUnits();
  const keyNames = getKeyNames();
  const WEATHERSTATS = ["d", "t", "h", "w", "wd", "p"];
  try {
    Object
      .keys(data)
      .filter((k) => WEATHERSTATS.includes(k))
      .map((key) =>
        string += `${keyNames[key]} (${units[key]}): ${data[key].v}\n`
      );
  } catch (e) {
    console.log(data);
  }
  return string;
}

const getStation = async (keyword) => {
  const stationData = await Axios
    .get(
      "https://api.waqi.info/search/",
      {
        params: {
          token: process.env.AQICN_TOKEN,
          keyword
        }
      });
  if (stationData.data.data.length === 0) {
    return { error: "No Stations Found. Try Again." };
  }
  return stationData.data.data[0].station;
}

const getStationData = async (station) => {
  const aqiData = await Axios
    .get(
      `https://api.waqi.info/feed/${station.url}/`,
      {
        params: {
          token: process.env.AQICN_TOKEN,
        }
      });
  if (aqiData.data.data.status === "error") {
    return { error: "Could not get data. Try Again." }
  }
  return aqiData.data.data;
}

const constructMessageAQI = (station, stationData) => (dedent`
  *Air Quality Information*

  Current AQI: ${stationData.aqi} (${getSeverity(stationData.aqi)})

  Last Updated at ${new Date(Date.parse(stationData.time.iso)).toString()}

  Station: ${station.name}
  
  To get more details, send *info <station>*. If you want to learn what actions you can take, to minimize air pollution, send *act*. To know how to use this tool, send *help*.`
);

const constructMessageDetailed = (station, stationData) => (dedent`
  *Air Quality Information*

  Current AQI: ${stationData.aqi} (${getSeverity(stationData.aqi)})
  Dominant Pollutant: ${stationData.dominentpol ? getKeyNames()[stationData.dominentpol] : "NA"}

  _Pollutant Levels_
  ${getPollutantLevels(stationData.iaqi)}
  _Weather Information_
  ${getWeatherStats(stationData.iaqi)}
  Last Updated at ${new Date(Date.parse(stationData.time.iso)).toString()}

  Station: ${station.name}
  Source: ${stationData.attributions[0].name}

  To get less detail, send *aqi <station>*. If you want to learn what actions you can take, to minimize air pollution, send *act*. To know how to use this tool, send *help*.`
);

const sendMessage = async (message, body) => {
  const response = await Axios
    .post(
      "https://messages-sandbox.nexmo.com/v0.1/messages",
      {
        from: {
          type: body.from.type,
          [`${body.from.type === "messenger" ? "id" : "number"}`]:
            body.from.type === "messenger" ? process.env.VONAGE_PAGE_ID : process.env.VONAGE_NUMBER
        },
        to: {
          type: body.from.type,
          [`${body.from.type === "messenger" ? "id" : "number"}`]:
            body.from.type === "messenger" ? body.from.id : body.from.number
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
}

module.exports = {
  getUnits,
  getKeyNames,
  getSeverity,
  getWeatherStats,
  getPollutantLevels,
  getStation,
  getStationData,
  constructMessageAQI,
  constructMessageDetailed,
  sendMessage
}
