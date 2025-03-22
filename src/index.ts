#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import axios from "axios";

// QWeather API configuration
const QWEATHER_API_KEY = process.env.QWEATHER_API_KEY;
const QWEATHER_API_BASE_URL =
  process.env.QWEATHER_API_URL || "https://devapi.qweather.com/v7";
const QWEATHER_GEO_API_BASE_URL =
  process.env.QWEATHER_GEO_API_URL || "https://geoapi.qweather.com/v2";
const DEFAULT_LOCATION = process.env.WEATHER_DEFAULT_LOCATION || "101010100"; // beijing

// Default options from environment variables
const DEFAULT_UNITS = process.env.WEATHER_DEFAULT_UNITS || "metric";
const DEFAULT_LANGUAGE = process.env.WEATHER_DEFAULT_LANGUAGE || "en";
const DEFAULT_INCLUDE_DETAILS = process.env.WEATHER_INCLUDE_DETAILS === "true";
const DEFAULT_FORECAST_DAYS = parseInt(
  process.env.WEATHER_FORECAST_DAYS || "3",
  10
);

// Create MCP server
const server = new McpServer({
  name: "Weather API MCP Server",
  version: "1.0.0",
});

// Define option types
interface WeatherOptions {
  units?: "metric" | "imperial";
  language?: string;
}

interface ForecastOptions {
  units?: "metric" | "imperial";
  days?: number;
  language?: string;
}

// New interface for hourly forecast options
interface HourlyForecastOptions {
  units?: "metric" | "imperial";
  hours?: number;
  language?: string;
}

// Define detailed weather data type
interface DetailedWeatherData {
  feelsLike: number;
  pressure: number;
  visibility: number;
  cloud: number;
  dewPoint: number;
}

// Define city lookup response interface
interface CityInfo {
  name: string;
  id: string;
  lat: string;
  lon: string;
  adm2: string;
  adm1: string;
  country: string;
  tz: string;
  utcOffset: string;
  isDst: string;
  type: string;
  rank: string;
  fxLink: string;
}

// Add weather tool
server.tool(
  "getWeather",
  "Get current weather information for a location. Returns weather data including temperature, humidity, and conditions.",
  {
    location: z
      .string()
      .optional()
      .describe(
        "The location to get weather for (city name, zip code, coordinates, etc.). If not provided, default location will be used."
      ),
    options: z
      .object({
        units: z
          .enum(["metric", "imperial"])
          .optional()
          .describe(
            "Temperature units: metric (Celsius) or imperial (Fahrenheit)"
          ),
        language: z
          .string()
          .optional()
          .describe(
            "Response language code (e.g., 'en' for English, 'es' for Spanish, 'zh' for Chinese)"
          ),
      })
      .optional()
      .describe("Weather configuration options, all fields are optional"),
  },
  async ({
    location = "",
    options = {},
  }: {
    location?: string;
    options?: WeatherOptions;
  }) => {
    try {
      // Merge provided options with defaults from environment variables
      const mergedOptions: WeatherOptions = {
        units: options.units || (DEFAULT_UNITS as "metric" | "imperial"),
        language: options.language || DEFAULT_LANGUAGE,
      };

      // Resolve location to city ID if needed
      let cityId: string;
      try {
        cityId = await resolveCityId(location, mergedOptions.language);
      } catch (error: any) {
        throw new Error(`Failed to resolve location: ${error.message}`);
      }

      // Make API request to QWeather for current weather
      const response = await axios.get(`${QWEATHER_API_BASE_URL}/weather/now`, {
        params: {
          location: cityId,
          //   lang: mergedOptions.language,
        },
        headers: {
          "X-QW-Api-Key": QWEATHER_API_KEY,
        },
      });

      // Process the response
      const data = response.data;

      if (data.code !== "200") {
        throw new Error(`QWeather API Error: ${data.code}`);
      }

      // Extract current weather data from the now object
      const { now } = data;

      const weatherData = {
        location: location,
        obsTime: now.obsTime,
        temperature: parseFloat(now.temp), // Celsius by default
        feelsLike: parseFloat(now.feelsLike),
        icon: now.icon,
        conditions: now.text,
        wind360: now.wind360,
        windDirection: now.windDir,
        windScale: now.windScale,
        windSpeed: parseFloat(now.windSpeed),
        humidity: parseFloat(now.humidity),
        precip: parseFloat(now.precip),
        pressure: parseFloat(now.pressure),
        visibility: parseFloat(now.vis),
        cloud: parseFloat(now.cloud),
        dewPoint: parseFloat(now.dew),
        updateTime: data.updateTime,
      };

      // Convert temperature if needed
      if (mergedOptions.units === "imperial") {
        weatherData.temperature = (weatherData.temperature * 9) / 5 + 32;
        weatherData.feelsLike = (weatherData.feelsLike * 9) / 5 + 32;
      }

      const tempUnit = mergedOptions.units === "imperial" ? "°F" : "°C";

      // Format the current weather data according to API documentation
      let weatherText = `Weather for ${weatherData.location}:\n\n`;
      weatherText += `Observation Time: ${weatherData.obsTime}\n`;
      weatherText += `Current Conditions: ${weatherData.conditions} (Icon: ${weatherData.icon})\n`;
      weatherText += `Temperature: ${weatherData.temperature.toFixed(
        1
      )}${tempUnit}\n`;
      weatherText += `Feels Like: ${weatherData.feelsLike.toFixed(
        1
      )}${tempUnit}\n`;

      weatherText += `\nWind Information:\n`;
      weatherText += `- Direction: ${weatherData.windDirection} (${weatherData.wind360}°)\n`;
      weatherText += `- Scale: ${weatherData.windScale}\n`;
      weatherText += `- Speed: ${weatherData.windSpeed} km/h\n`;

      weatherText += `\nOther Information:\n`;
      weatherText += `- Humidity: ${weatherData.humidity}%\n`;
      weatherText += `- Precipitation: ${weatherData.precip} mm\n`;
      weatherText += `- Pressure: ${weatherData.pressure} hPa\n`;
      weatherText += `- Visibility: ${weatherData.visibility} km\n`;

      if (!isNaN(weatherData.cloud)) {
        weatherText += `- Cloud Cover: ${weatherData.cloud}%\n`;
      }

      weatherText += `- Dew Point: ${weatherData.dewPoint}°C\n`;
      weatherText += `\nUpdated: ${weatherData.updateTime}\n`;

      // Add attribution
      if (data.refer && data.refer.sources) {
        weatherText += `\nData Sources: ${data.refer.sources.join(", ")}\n`;
      }

      if (data.refer && data.refer.license) {
        weatherText += `License: ${data.refer.license.join(", ")}\n`;
      }

      return {
        content: [
          {
            type: "text",
            text: weatherText,
          },
        ],
      };
    } catch (error: any) {
      // Handle case where the API request fails or returns an error
      if (error.response) {
        throw new Error(
          `Weather fetch failed: API responded with status ${error.response.status}`
        );
      } else if (error.request) {
        throw new Error(`Weather fetch failed: No response received from API`);
      } else {
        throw new Error(`Weather fetch failed: ${error.message}`);
      }
    }
  }
);

// Add forecast tool
server.tool(
  "getWeatherForecast",
  "Get weather forecast for a location. Returns weather forecast for the next few days.",
  {
    location: z
      .string()
      .optional()
      .describe(
        "The location to get weather forecast for (city name, zip code, coordinates, etc.). If not provided, default location will be used."
      ),
    options: z
      .object({
        units: z
          .enum(["metric", "imperial"])
          .optional()
          .describe(
            "Temperature units: metric (Celsius) or imperial (Fahrenheit)"
          ),
        days: z
          .number()
          .optional()
          .describe(
            "Number of days to forecast (default: 3, supports 3, 7days)"
          ),
        language: z
          .string()
          .optional()
          .describe(
            "Response language code (e.g., 'en' for English, 'zh' for Chinese)"
          ),
      })
      .optional()
      .describe("Forecast configuration options, all fields are optional"),
  },
  async ({
    location = "",
    options = {},
  }: {
    location?: string;
    options?: ForecastOptions;
  }) => {
    try {
      // Merge provided options with defaults from environment variables
      const mergedOptions: ForecastOptions = {
        units: options.units || (DEFAULT_UNITS as "metric" | "imperial"),
        language: options.language || DEFAULT_LANGUAGE,
        days:
          options.days !== undefined
            ? Math.min(options.days, 30)
            : DEFAULT_FORECAST_DAYS,
      };

      // Resolve location to city ID if needed
      let cityId: string;
      try {
        cityId = await resolveCityId(location, mergedOptions.language);
      } catch (error: any) {
        throw new Error(`Failed to resolve location: ${error.message}`);
      }

      // Select the appropriate forecast endpoint based on requested days
      // QWeather only supports specific forecast periods: 3, 7, 10, 15, or 30 days
      let forecastDays = 3; // Default to 3 days

      if (mergedOptions.days) {
        if (mergedOptions.days <= 3) {
          forecastDays = 3;
        } else if (mergedOptions.days <= 7) {
          forecastDays = 7;
        } else if (mergedOptions.days <= 10) {
          forecastDays = 10;
        } else if (mergedOptions.days <= 15) {
          forecastDays = 15;
        } else {
          forecastDays = 30;
        }
      }

      // 使用QWeather的动态端点获取天气预报
      // API文档: https://dev.qweather.com/docs/api/weather/weather-daily-forecast/
      // 返回结构包含daily数组，每个元素代表一天的预报

      const response = await axios.get(
        `${QWEATHER_API_BASE_URL}/weather/${forecastDays}d`,
        {
          params: {
            location: cityId,
            lang: mergedOptions.language,
          },
          headers: {
            "X-QW-Api-Key": QWEATHER_API_KEY,
          },
        }
      );

      // Process the response
      const data = response.data;

      if (data.code !== "200") {
        throw new Error(`QWeather API Error: ${data.code}`);
      }

      // Use the actual requested days up to the limit of what was returned
      const days = Math.min(
        mergedOptions.days || forecastDays,
        data.daily.length
      );
      const forecasts = [];

      // Process forecast data
      for (let i = 0; i < days; i++) {
        if (i < data.daily.length) {
          const dayData = data.daily[i];

          // Format the forecast using the detailed template
          const forecastDetails = generateWeatherForecast(
            dayData,
            mergedOptions.units === "imperial"
          );
          forecasts.push(forecastDetails);
        }
      }

      // Prepare the forecast text
      let forecastText = `Weather Forecast for ${location}:\n\n${forecasts.join(
        "\n\n"
      )}`;

      // Add attribution if available
      if (data.refer && data.refer.sources) {
        forecastText += `\n\nData Sources: ${data.refer.sources.join(", ")}`;
      }

      if (data.refer && data.refer.license) {
        forecastText += `\nLicense: ${data.refer.license.join(", ")}`;
      }

      return {
        content: [
          {
            type: "text",
            text: forecastText,
          },
        ],
      };
    } catch (error: any) {
      // Handle case where the API request fails or returns an error
      if (error.response) {
        console.log(2222, `${QWEATHER_API_BASE_URL}/weather/${options.days}d`, {
          location: location,
        });

        throw new Error(
          `Forecast fetch failed: API responded with status ${error.response.status}`
        );
      } else if (error.request) {
        throw new Error(`Forecast fetch failed: No response received from API`);
      } else {
        throw new Error(`Forecast fetch failed: ${error.message}`);
      }
    }
  }
);

// Add hourly weather forecast tool
server.tool(
  "getHourlyWeather",
  "Get hourly weather forecast for a location. Returns weather data hour by hour for the next 24 hours.",
  {
    location: z
      .string()
      .optional()
      .describe(
        "The location to get hourly weather forecast for (city name, zip code, coordinates, etc.). If not provided, default location will be used."
      ),
    options: z
      .object({
        units: z
          .enum(["metric", "imperial"])
          .optional()
          .describe(
            "Temperature units: metric (Celsius) or imperial (Fahrenheit)"
          ),
        hours: z
          .number()
          .optional()
          .describe("Number of hours to forecast (default: 24, max: 24)"),
        language: z
          .string()
          .optional()
          .describe(
            "Response language code (e.g., 'en' for English, 'zh' for Chinese)"
          ),
      })
      .optional()
      .describe(
        "Hourly forecast configuration options, all fields are optional"
      ),
  },
  async ({
    location = "",
    options = {},
  }: {
    location?: string;
    options?: HourlyForecastOptions;
  }) => {
    try {
      // Merge provided options with defaults from environment variables
      const mergedOptions: HourlyForecastOptions = {
        units: options.units || (DEFAULT_UNITS as "metric" | "imperial"),
        language: options.language || DEFAULT_LANGUAGE,
        hours: options.hours !== undefined ? Math.min(options.hours, 24) : 24,
      };

      // Resolve location to city ID if needed
      let cityId: string;
      try {
        cityId = await resolveCityId(location, mergedOptions.language);
      } catch (error: any) {
        throw new Error(`Failed to resolve location: ${error.message}`);
      }

      // Make API request to QWeather for hourly weather forecast (24h)
      const response = await axios.get(`${QWEATHER_API_BASE_URL}/weather/24h`, {
        params: {
          location: cityId,
          lang: mergedOptions.language,
        },
        headers: {
          "X-QW-Api-Key": QWEATHER_API_KEY,
        },
      });

      // Process the response
      const data = response.data;

      if (data.code !== "200") {
        throw new Error(`QWeather API Error: ${data.code}`);
      }

      // Use the actual requested hours up to the limit of what was returned
      const hours = Math.min(mergedOptions.hours || 24, data.hourly.length);

      const isImperial = mergedOptions.units === "imperial";
      const tempUnit = isImperial ? "°F" : "°C";

      // Process hourly forecast data
      let hourlyText = `Hourly Weather Forecast for ${location}:\n\n`;
      hourlyText += `Updated: ${data.updateTime}\n\n`;

      for (let i = 0; i < hours; i++) {
        if (i < data.hourly.length) {
          const hour = data.hourly[i];

          // Convert temperature if needed
          const temp = isImperial
            ? ((parseFloat(hour.temp) * 9) / 5 + 32).toFixed(1)
            : hour.temp;

          const dewPoint =
            isImperial && hour.dew
              ? ((parseFloat(hour.dew) * 9) / 5 + 32).toFixed(1)
              : hour.dew;

          // Format time
          const hourTime = new Date(hour.fxTime);
          const timeStr = hourTime.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          });

          // Format the hourly data
          hourlyText += `${hour.fxTime.split("T")[0]} ${timeStr}:\n`;
          hourlyText += `- Weather: ${hour.text} (Icon: ${hour.icon})\n`;
          hourlyText += `- Temperature: ${temp}${tempUnit}\n`;
          hourlyText += `- Wind: ${hour.windDir} (${hour.wind360}°), Scale: ${hour.windScale}, Speed: ${hour.windSpeed} km/h\n`;
          hourlyText += `- Humidity: ${hour.humidity}%\n`;

          if (hour.pop) {
            hourlyText += `- Precipitation Probability: ${hour.pop}%\n`;
          }

          hourlyText += `- Precipitation: ${hour.precip} mm\n`;
          hourlyText += `- Pressure: ${hour.pressure} hPa\n`;

          if (hour.cloud) {
            hourlyText += `- Cloud Cover: ${hour.cloud}%\n`;
          }

          if (hour.dew) {
            hourlyText += `- Dew Point: ${dewPoint}${tempUnit}\n`;
          }

          hourlyText += `\n`;
        }
      }

      // Add attribution if available
      if (data.refer && data.refer.sources) {
        hourlyText += `Data Sources: ${data.refer.sources.join(", ")}\n`;
      }

      if (data.refer && data.refer.license) {
        hourlyText += `License: ${data.refer.license.join(", ")}\n`;
      }

      return {
        content: [
          {
            type: "text",
            text: hourlyText,
          },
        ],
      };
    } catch (error: any) {
      // Handle case where the API request fails or returns an error
      if (error.response) {
        throw new Error(
          `Hourly forecast fetch failed: API responded with status ${error.response.status}`
        );
      } else if (error.request) {
        throw new Error(
          `Hourly forecast fetch failed: No response received from API`
        );
      } else {
        throw new Error(`Hourly forecast fetch failed: ${error.message}`);
      }
    }
  }
);

// Start the server with stdio transport
const transport = new StdioServerTransport();
await server.connect(transport);

// Helper function to resolve location to city ID
async function resolveCityId(
  location: string,
  language: string = DEFAULT_LANGUAGE
): Promise<string> {
  if (!location) location = DEFAULT_LOCATION;

  // If the location looks like a city ID (purely numeric), return it as is
  if (/^\d+$/.test(location)) {
    return location;
  }

  try {
    // Make API request to QWeather GeoAPI for city lookup
    const response = await axios.get(
      `${QWEATHER_GEO_API_BASE_URL}/city/lookup`,
      {
        params: {
          location,
          lang: language,
        },
        headers: {
          "X-QW-Api-Key": QWEATHER_API_KEY,
        },
      }
    );

    // Process the response
    const data = response.data;

    if (data.code !== "200") {
      throw new Error(`QWeather GeoAPI Error: ${data.code}`);
    }

    // Check if any location was found
    if (!data.location || data.location.length === 0) {
      throw new Error(`No location found for: ${location}`);
    }

    // Return the ID of the first location
    return data.location[0].id;
  } catch (error: any) {
    // If there's an error, throw it for the calling function to handle
    throw error;
  }
}

// Add city lookup tool
server.tool(
  "lookupCity",
  "Look up city information by name, ID, or coordinates. Returns city ID that can be used with other weather tools.",
  {
    location: z
      .string()
      .describe(
        "The location to look up (city name, coordinates, etc.). Examples: 'London', 'New York', '39.9,116.3'"
      ),
    options: z
      .object({
        language: z
          .string()
          .optional()
          .describe(
            "Response language code (e.g., 'en' for English, 'zh' for Chinese)"
          ),
      })
      .optional()
      .describe("Lookup configuration options, all fields are optional"),
  },
  async ({
    location,
    options = {},
  }: {
    location: string;
    options?: { language?: string };
  }) => {
    try {
      // Merge provided options with defaults from environment variables
      const mergedOptions = {
        language: options.language || DEFAULT_LANGUAGE,
      };

      // Make API request to QWeather GeoAPI for city lookup
      const response = await axios.get(
        `${QWEATHER_GEO_API_BASE_URL}/city/lookup`,
        {
          params: {
            location: location,
            lang: mergedOptions.language,
          },
          headers: {
            "X-QW-Api-Key": QWEATHER_API_KEY,
          },
        }
      );

      // Process the response
      const data = response.data;

      if (data.code !== "200") {
        throw new Error(`QWeather GeoAPI Error: ${data.code}`);
      }

      // Check if any location was found
      if (!data.location || data.location.length === 0) {
        throw new Error(`No location found for: ${location}`);
      }

      // Format the location data
      let locationText = `Location Information:\n\n`;

      // Display all found locations
      data.location.forEach((city: CityInfo, index: number) => {
        locationText += `${index + 1}. ${city.name} (ID: ${city.id})\n`;
        locationText += `   Location: ${city.lat}, ${city.lon}\n`;
        locationText += `   Region: ${city.adm2}, ${city.adm1}, ${city.country}\n`;
        locationText += `   Timezone: ${city.tz} (UTC ${city.utcOffset})\n`;
        locationText += `   Type: ${city.type}, Rank: ${city.rank}\n\n`;
      });

      // Add a note about which ID to use
      locationText += `Note: Use the ID (e.g., "${data.location[0].id}") in other weather tools to get weather information for this location.\n`;

      // Add attribution if available
      if (data.refer && data.refer.sources) {
        locationText += `\nData Sources: ${data.refer.sources.join(", ")}\n`;
      }

      if (data.refer && data.refer.license) {
        locationText += `License: ${data.refer.license.join(", ")}\n`;
      }

      return {
        content: [
          {
            type: "text",
            text: locationText,
          },
        ],
      };
    } catch (error: any) {
      // Handle case where the API request fails or returns an error
      if (error.response) {
        throw new Error(
          `City lookup failed: API responded with status ${error.response.status}`
        );
      } else if (error.request) {
        throw new Error(`City lookup failed: No response received from API`);
      } else {
        throw new Error(`City lookup failed: ${error.message}`);
      }
    }
  }
);

// Helper function to format weather forecast data
function generateWeatherForecast(data: any, isImperial: boolean): string {
  if (!data) return "Weather data unavailable.";

  // Convert temperatures if needed
  const tempMax = isImperial
    ? ((parseFloat(data.tempMax) * 9) / 5 + 32).toFixed(1)
    : data.tempMax;
  const tempMin = isImperial
    ? ((parseFloat(data.tempMin) * 9) / 5 + 32).toFixed(1)
    : data.tempMin;
  const tempUnit = isImperial ? "°F" : "°C";

  // Format the forecast using the API fields documented
  let forecast = `${data.fxDate}:\n`;

  // Time information section
  forecast += `Time Information:\n`;
  forecast += `- Sunrise: ${data.sunrise || "N/A"}, Sunset: ${
    data.sunset || "N/A"
  }\n`;

  if (data.moonrise || data.moonset) {
    forecast += `- Moonrise: ${data.moonrise || "N/A"}, Moonset: ${
      data.moonset || "N/A"
    }\n`;
  }

  if (data.moonPhase) {
    forecast += `- Moon Phase: ${data.moonPhase} (Icon: ${
      data.moonPhaseIcon || "N/A"
    })\n`;
  }

  // Day weather section
  forecast += `\nDay Weather:\n`;
  forecast += `- Conditions: ${data.textDay} (Icon: ${data.iconDay})\n`;
  forecast += `- Temperature Range: ${tempMax}${tempUnit} / ${tempMin}${tempUnit}\n`;
  forecast += `- Wind: ${data.windDirDay} (${data.wind360Day}°)\n`;
  forecast += `- Wind Scale: ${data.windScaleDay}, Speed: ${data.windSpeedDay} km/h\n`;

  // Night weather section
  forecast += `\nNight Weather:\n`;
  forecast += `- Conditions: ${data.textNight} (Icon: ${data.iconNight})\n`;
  forecast += `- Wind: ${data.windDirNight} (${data.wind360Night}°)\n`;
  forecast += `- Wind Scale: ${data.windScaleNight}, Speed: ${data.windSpeedNight} km/h\n`;

  // Other information section
  forecast += `\nOther Information:\n`;
  forecast += `- Humidity: ${data.humidity}%\n`;
  forecast += `- Precipitation: ${data.precip} mm\n`;
  forecast += `- Pressure: ${data.pressure} hPa\n`;
  forecast += `- Visibility: ${data.vis} km\n`;

  if (data.cloud) {
    forecast += `- Cloud Cover: ${data.cloud}%\n`;
  }

  if (data.uvIndex) {
    forecast += `- UV Index: ${data.uvIndex}\n`;
  }

  return forecast;
}
