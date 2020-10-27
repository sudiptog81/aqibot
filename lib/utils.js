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
  Object.keys(data)
    .filter((k) => POLLUTANTS.includes(k))
    .map((key) =>
      string += `${keyNames[key]} (${units[key]}): ${data[key].v}\n`
    )
  return string;
}

const getWeatherStats = (data) => {
  let string = "";
  const units = getUnits();
  const keyNames = getKeyNames();
  const WEATHERSTATS = ["d", "t", "h", "w", "wd", "p"];
  Object.keys(data)
    .filter((k) => WEATHERSTATS.includes(k))
    .map((key) =>
      string += `${keyNames[key]} (${units[key]}): ${data[key].v}\n`
    )
  return string;
}

module.exports = {
  getUnits,
  getKeyNames,
  getSeverity,
  getWeatherStats,
  getPollutantLevels
}
