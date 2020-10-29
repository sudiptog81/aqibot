const { default: Axios } = require("axios");
const dedent = require("dedent");

const getKeyNames = () => ({
  co: "Carbon Monooxide",
  dew: "Dew Point",
  h: "Humidity",
  no2: "Nitrogen Dioxide",
  o3: "Ozone",
  p: "Atmospheric Pressure",
  pm10: "PM 10",
  pm25: "PM 2.5",
  so2: "Sulphur Dioxide",
  t: "Temperature",
  w: "Wind",
  wd: "Wind Direction"
});

const getUnits = () => ({
  co: "ppm",
  dew: "°C",
  h: "%",
  no2: "ppb",
  o3: "ppb",
  p: "hPa",
  pm10: "µg/m3",
  pm25: "µg/m3",
  so2: "ppb",
  t: "°C",
  w: "m/s",
  wd: "°"
});

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
};

const getAdvice = (aqi) => {
  if (aqi > 300) {
    return "Air quality is extremely poor. Try to stay indooors. Close doors and windows.";
  } else if (aqi > 200) {
    return "Everyone should limit outdoor exertion. Sensitive groups should avoid all outdoor exertion.";
  } else if (aqi > 150) {
    return "Everyone should limit prolonged outdoor exertion. People with health issues should stay indoors.";
  } else if (aqi > 100) {
    return "Outdoor physical activity is okay for most people, but increase rest periods and lower breathing rates. People with asthma, respiratory or cardiovascular conditions should be medically managing their condition.";
  } else if (aqi > 50) {
    return "Prolonged physical activity is fine for most people. Unusually sensitive individuals should limit intense physical activity.";
  } else if (aqi >= 0) {
    return "A great day to be outdoors.";
  }
  return "AQI Information Not Available.";
};

const getPollutantLevels = (data) => {
  let string = "";
  const units = getUnits();
  const keyNames = getKeyNames();
  const POLLUTANTS = ["co", "no2", "so2", "pm25", "pm10", "o3"];
  try {
    Object.keys(data)
      .filter((k) => POLLUTANTS.includes(k))
      .map(
        (key) =>
          (string += `${keyNames[key]} (${units[key]}): ${
            data[key].v.toString().includes(".")
              ? data[key].v.toFixed(1)
              : data[key].v
          }\n`)
      );
  } catch (e) {
    console.log(data);
  }
  return string;
};

const getWeatherStats = (data) => {
  let string = "";
  const units = getUnits();
  const keyNames = getKeyNames();
  const WEATHERSTATS = ["d", "t", "h", "w", "wd", "p"];
  try {
    Object.keys(data)
      .filter((k) => WEATHERSTATS.includes(k))
      .map(
        (key) =>
          (string += `${keyNames[key]} (${units[key]}): ${
            data[key].v.toString().includes(".")
              ? data[key].v.toFixed(1)
              : data[key].v
          }\n`)
      );
  } catch (e) {
    console.log(data);
  }
  return string;
};

const getStation = async (keyword) => {
  const stationData = await Axios.get("https://api.waqi.info/search/", {
    params: {
      token: process.env.AQICN_TOKEN,
      keyword
    }
  });
  if (stationData.data.data.length === 0) {
    return { error: "No Stations Found. Try Again." };
  }
  return stationData.data.data[0].station;
};

const getStationData = async (station) => {
  const aqiData = await Axios.get(
    `https://api.waqi.info/feed/${station.url}/`,
    {
      params: {
        token: process.env.AQICN_TOKEN
      }
    }
  );
  if (aqiData.data.data.status === "error") {
    return { error: "Could not get data. Try Again." };
  }
  return aqiData.data.data;
};

const constructMessageAQI = (station, stationData) => dedent`
  Current AQI: ${stationData.aqi} (${getSeverity(stationData.aqi)})

  ${getAdvice(stationData.aqi)}

  Last Updated at ${new Date(Date.parse(stationData.time.iso)).toString()}

  Station: ${station.name}
  
  To get more details, send *info <station>*.`;

const constructMessageDetailed = (station, stationData) => dedent`
  *Air Quality Information*

  Current AQI: ${stationData.aqi} (${getSeverity(stationData.aqi)})
  Dominant Pollutant: ${
    stationData.dominentpol ? getKeyNames()[stationData.dominentpol] : "NA"
  }

  _Pollutant Levels_
  ${getPollutantLevels(stationData.iaqi)}
  _Weather Information_
  ${getWeatherStats(stationData.iaqi)}
  Last Updated at ${new Date(Date.parse(stationData.time.iso)).toString()}

  Station: ${station.name}
  Source: ${stationData.attributions[0].name}

  To get less detail, send *aqi <station>*.`;

const sendMessage = async (message, body) => {
  await Axios.post(
    "https://messages-sandbox.nexmo.com/v0.1/messages",
    {
      from: {
        type: body.from.type,
        [`${body.from.type === "messenger" ? "id" : "number"}`]:
          body.from.type === "messenger"
            ? process.env.VONAGE_PAGE_ID
            : process.env.VONAGE_NUMBER
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
    },
    {
      headers: {
        Authorization: `Basic ${Buffer.from(
          process.env.VONAGE_API_KEY + ":" + process.env.VONAGE_API_SECRET,
          "binary"
        ).toString("base64")}`
      }
    }
  );
};

module.exports = {
  getUnits,
  getKeyNames,
  getSeverity,
  getAdvice,
  getWeatherStats,
  getPollutantLevels,
  getStation,
  getStationData,
  constructMessageAQI,
  constructMessageDetailed,
  sendMessage
};
