# Weather API MCP Server

A Model Context Protocol (MCP) server implementation for weather information, providing current weather data and forecasts using the 和风天气 (QWeather) API.

## Features

- **Current Weather**: Get current weather data for any location
- **Weather Forecast**: Get 3-day to 30-day weather forecasts
- **Hourly Forecast**: Get 24-hour weather forecasts
- **City Lookup**: Look up city information and IDs for more precise weather data
- **Customizable Options**: Configure units, language, and additional details
- **Powered by QWeather**: Integrates with the 和风天气 (QWeather) API for accurate weather data

## Installation

```bash
npm install mcp-weather-api
```

Or use it directly with npx:

```bash
npx mcp-weather-api
```

## API Reference

### Weather Tools

The server provides four weather tools that can be called through MCP:

#### 1. Get Current Weather

```typescript
// Tool name: getWeather
{
  location: "New York, NY",  // Can be city name, coordinates like "119.98,30.24", or QWeather location ID
  options: {
    units: "metric",        // "metric" (Celsius) or "imperial" (Fahrenheit)
    language: "en",         // Language code (en, zh, etc.)
  }
}
```

#### 2. Get Weather Forecast

```typescript
// Tool name: getWeatherForecast
{
  location: "London, UK",   // Can be city name, coordinates like "119.98,30.24", or QWeather location ID
  options: {
    units: "imperial",      // "metric" (Celsius) or "imperial" (Fahrenheit)
    days: 3,                // Supports 3, 7, 10, 15, or 30 days
    language: "en"          // Language code (en, zh, etc.)
  }
}
```

#### 3. Get Hourly Weather Forecast

```typescript
// Tool name: getHourlyWeather
{
  location: "Tokyo, Japan", // Can be city name, coordinates like "119.98,30.24", or QWeather location ID
  options: {
    units: "metric",        // "metric" (Celsius) or "imperial" (Fahrenheit)
    hours: 24,              // Number of hours (default: 24, max: 24)
    language: "ja"          // Language code (en, zh, ja, etc.)
  }
}
```

#### 4. City Lookup

```typescript
// Tool name: lookupCity
{
  location: "Beijing",      // City name or coordinates like "119.98,30.24"
  options: {
    language: "en"          // Language code (en, zh, etc.)
  }
}
```

### Weather Options

Current weather tool options:

```typescript
interface WeatherOptions {
  units?: "metric" | "imperial"; // Temperature units (default: metric)
  language?: string; // Response language code
}
```

Forecast tool options:

```typescript
interface ForecastOptions {
  units?: "metric" | "imperial"; // Temperature units (default: metric)
  days?: number; // Number of days (default: 3)
  language?: string; // Response language code
}
```

Hourly forecast tool options:

```typescript
interface HourlyForecastOptions {
  units?: "metric" | "imperial"; // Temperature units (default: metric)
  hours?: number; // Number of hours (default: 24, max: 24)
  language?: string; // Response language code
}
```

City lookup tool options:

```typescript
interface CityLookupOptions {
  language?: string; // Response language code
}
```

## Response Format

All tools return responses in the following format:

```typescript
{
  content: Array<{
    type: "text";
    text: string;
  }>;
}
```

### Sample Responses

#### Current Weather Response

```
Weather for New York:

Observation Time: 2023-11-15T12:30+08:00
Current Conditions: Partly Cloudy (Icon: 101)
Temperature: 18.5°C
Feels Like: 19.2°C

Wind Information:
- Direction: Northeast (45°)
- Scale: 3
- Speed: 15 km/h

Other Information:
- Humidity: 65%
- Precipitation: 0.0 mm
- Pressure: 1013 hPa
- Visibility: 25 km
- Cloud Cover: 30%
- Dew Point: 12.1°C

Updated: 2023-11-15T12:35+08:00

Data Sources: QWeather
License: QWeather Developers License
```

#### Weather Forecast Response

```
Weather Forecast for London:

2023-11-15:
Time Information:
- Sunrise: 07:12, Sunset: 16:30
- Moonrise: 15:40, Moonset: 03:25
- Moon Phase: Waxing Gibbous (Icon: 802)

Day Weather:
- Conditions: Rain (Icon: 305)
- Temperature Range: 12.0°F / 7.0°F
- Wind: Northwest (315°)
- Wind Scale: 3, Speed: 18 km/h

Night Weather:
- Conditions: Cloudy (Icon: 101)
- Wind: North (0°)
- Wind Scale: 2, Speed: 10 km/h

Other Information:
- Humidity: 75%
- Precipitation: 5.2 mm
- Pressure: 1008 hPa
- Visibility: 10 km
- Cloud Cover: 85%
- UV Index: 2

...additional days...

Data Sources: QWeather
License: QWeather Developers License
```

#### City Lookup Response

```
Location Information:

1. Beijing (ID: 101010100)
   Location: 39.90499, 116.40529
   Region: Beijing, Beijing, China
   Timezone: Asia/Shanghai (UTC +8.0)
   Type: city, Rank: 10

2. Beijing Shi (ID: 101010000)
   Location: 39.90998, 116.40529
   Region: Beijing, Beijing, China
   Timezone: Asia/Shanghai (UTC +8.0)
   Type: city, Rank: 10

Note: Use the ID (e.g., "101010100") in other weather tools to get weather information for this location.

Data Sources: QWeather
License: QWeather Developers License
```

## Usage with MCP

Add the Weather MCP server to your MCP configuration:

```json
{
  "mcpServers": {
    "weather": {
      "command": "npx",
      "args": ["-y", "mcp-weather-api"]
    }
  }
}
```

## QWeather API

This server uses the 和风天气 (QWeather) API to fetch weather data. The API key is included in the package for demo purposes. For production use, you should obtain your own API key from [QWeather](https://dev.qweather.com/).

### API Endpoints Used

1. **Current Weather** - `/weather/now`

   - Returns the current weather conditions
   - Response includes a `now` object with temperature, humidity, etc.
   - [API Documentation](https://dev.qweather.com/docs/api/weather/weather-now/)

2. **Weather Forecast** - `/weather/3d`, `/weather/7d`, `/weather/10d`, `/weather/15d`, `/weather/30d`

   - Returns weather forecast for different periods
   - Response includes a `daily` array with daily forecast data
   - [API Documentation](https://dev.qweather.com/docs/api/weather/weather-daily-forecast/)

3. **Hourly Weather Forecast** - `/weather/24h`

   - Returns hourly weather forecast for the next 24 hours
   - Response includes an `hourly` array with hourly forecast data
   - [API Documentation](https://dev.qweather.com/docs/api/weather/weather-hourly-forecast/)

4. **City Lookup** - `/city/lookup`
   - Looks up city information by name or coordinates
   - Returns city IDs and other location information
   - [API Documentation](https://dev.qweather.com/docs/api/geoapi/city-lookup/)

### API Response Structure

#### Current Weather (`/weather/now`)

```json
{
  "code": "200",
  "updateTime": "2021-11-15T16:35+08:00",
  "now": {
    "temp": "22.5",
    "humidity": "65",
    "text": "Partly cloudy",
    "windSpeed": "10.2",
    "windDir": "East",
    "feelsLike": "24.0",
    "pressure": "1012",
    "vis": "10",
    "cloud": "30",
    "dew": "15.5"
  }
}
```

#### Weather Forecast (`/weather/3d`)

```json
{
  "code": "200",
  "updateTime": "2021-11-15T16:35+08:00",
  "fxLink": "http://hfx.link/2ax1",
  "daily": [
    {
      "fxDate": "2021-11-15",
      "sunrise": "06:58",
      "sunset": "16:59",
      "moonrise": "15:16",
      "moonset": "03:40",
      "moonPhase": "盈凸月",
      "moonPhaseIcon": "803",
      "tempMax": "12",
      "tempMin": "-1",
      "iconDay": "101",
      "textDay": "多云",
      "iconNight": "150",
      "textNight": "晴",
      "wind360Day": "45",
      "windDirDay": "东北风",
      "windScaleDay": "1-2",
      "windSpeedDay": "3",
      "wind360Night": "0",
      "windDirNight": "北风",
      "windScaleNight": "1-2",
      "windSpeedNight": "3",
      "humidity": "65",
      "precip": "0.0",
      "pressure": "1020",
      "vis": "25",
      "cloud": "4",
      "uvIndex": "3"
    }
    // Additional days...
  ]
}
```

#### Hourly Weather Forecast (`/weather/24h`)

```json
{
  "code": "200",
  "updateTime": "2021-11-15T16:35+08:00",
  "fxLink": "http://hfx.link/2ax1",
  "hourly": [
    {
      "fxTime": "2021-11-15T17:00+08:00",
      "temp": "11",
      "icon": "150",
      "text": "晴",
      "wind360": "335",
      "windDir": "西北风",
      "windScale": "3-4",
      "windSpeed": "20",
      "humidity": "73",
      "pop": "7",
      "precip": "0.0",
      "pressure": "1013",
      "cloud": "10",
      "dew": "7"
    }
    // Additional hours...
  ]
}
```

#### City Lookup (`/city/lookup`)

```json
{
  "code": "200",
  "location": [
    {
      "name": "Beijing",
      "id": "101010100",
      "lat": "39.90499",
      "lon": "116.40529",
      "adm2": "Beijing",
      "adm1": "Beijing",
      "country": "China",
      "tz": "Asia/Shanghai",
      "utcOffset": "+08:00",
      "isDst": "0",
      "type": "city",
      "rank": "10",
      "fxLink": "http://hfx.link/2ax1"
    }
    // Additional locations...
  ]
}
```

## Configuration

You can configure various options through environment variables:

```bash
# API Configuration
export QWEATHER_API_KEY=your-api-key
export QWEATHER_API_URL=https://devapi.qweather.com/v7
export QWEATHER_GEO_API_URL=https://geoapi.qweather.com/v2
export WEATHER_DEFAULT_LOCATION=101010100  # Default location code or coordinates

# Default Options
export WEATHER_DEFAULT_UNITS=metric     # or 'imperial'
export WEATHER_DEFAULT_LANGUAGE=en      # language code
export WEATHER_INCLUDE_DETAILS=true     # or 'false'
export WEATHER_FORECAST_DAYS=3          # number of days (max 30)
```

Or in your MCP configuration:

```json
{
  "mcpServers": {
    "weather": {
      "command": "npx",
      "args": ["-y", "mcp-weather-api"],
      "env": {
        "QWEATHER_API_KEY": "your-api-key",
        "QWEATHER_API_URL": "https://devapi.qweather.com/v7",
        "QWEATHER_GEO_API_URL": "https://geoapi.qweather.com/v2",
        "WEATHER_DEFAULT_LOCATION": "101010100",
        "WEATHER_DEFAULT_UNITS": "imperial",
        "WEATHER_DEFAULT_LANGUAGE": "zh",
        "WEATHER_INCLUDE_DETAILS": "true",
        "WEATHER_FORECAST_DAYS": "7"
      }
    }
  }
}
```

## Location Formats

You can specify locations in three formats:

1. **City name**: e.g., "New York", "London", "Beijing"
2. **Coordinates**: e.g., "119.98,30.24" (longitude,latitude)
3. **QWeather location ID**: e.g., "101010100" (Beijing)

When using coordinates, the format must be `longitude,latitude` (e.g., "119.98,30.24"), which will be passed directly to the QWeather API.

Use the `lookupCity` tool to find the appropriate location ID for more precise targeting.

### China City Location Codes

For Chinese cities, you can use the QWeather location ID which provides more precise location targeting. The complete list of Chinese city codes can be found in the [QWeather LocationList repository](https://github.com/qwd/LocationList/blob/master/China-City-List-latest.csv).

This CSV file contains location IDs for Chinese cities in the format:

## Development

### Prerequisites

- Node.js 16 or higher
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Building

```bash
npm run build
```

### Running in Development

```bash
npm run dev
```
