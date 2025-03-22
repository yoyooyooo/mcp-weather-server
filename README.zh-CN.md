[English](./README.md) | [中文](./README.zh-CN.md)

# 天气 API MCP 服务器

基于模型上下文协议（Model Context Protocol，MCP）的天气信息服务器实现，使用和风天气（QWeather）API 提供当前天气数据和预报。

## 功能特点

- **当前天气**：获取任何地点的当前天气数据
- **天气预报**：获取 3 天至 30 天的天气预报
- **小时预报**：获取 24 小时天气预报
- **城市查询**：查询城市信息和 ID，以获得更精确的天气数据
- **可定制选项**：配置单位、语言和其他详细信息
- **由和风天气驱动**：集成和风天气（QWeather）API，提供准确的天气数据

## 安装

### 通过 npm 安装

```bash
npm install mcp-weather-server
```

或者直接使用 npx：

```bash
npx mcp-weather-server
```

### 通过 Smithery 安装

要通过 Smithery 自动为各种 AI 助手安装天气 API 服务器：

```bash
npx -y @smithery/cli install mcp-weather-server --client claude
```

## MCP 使用方法

将天气 MCP 服务器添加到你的 MCP 配置中：

```json
{
  "mcpServers": {
    "weather": {
      "command": "npx",
      "args": ["-y", "mcp-weather-server"],
      "env": {
        "QWEATHER_API_KEY": "你的-api-密钥",
        "WEATHER_DEFAULT_UNITS": "metric",
        "WEATHER_DEFAULT_LANGUAGE": "zh",
        "WEATHER_INCLUDE_DETAILS": "true",
        "WEATHER_FORECAST_DAYS": "3"
      }
    }
  }
}
```

注意：请确保将 `你的-api-密钥` 替换为您实际的和风天气 API 密钥（如果您使用自己的密钥）。软件包中包含了用于测试目的的演示 API 密钥。

## 天气工具

服务器通过 MCP 提供四种天气工具：

### 1. 获取当前天气

```typescript
// 工具名称: getWeather
{
  location: "北京",  // 城市名称、坐标或和风天气位置 ID
  options: {
    units: "metric",        // "metric"（摄氏度）或 "imperial"（华氏度）
    language: "zh"          // 语言代码（en、zh 等）
  }
}
```

### 2. 获取天气预报

```typescript
// 工具名称: getWeatherForecast
{
  location: "上海",   // 城市名称、坐标或和风天气位置 ID
  options: {
    units: "metric",      // "metric"（摄氏度）或 "imperial"（华氏度）
    days: 3,                // 支持 3、7、10、15 或 30 天
    language: "zh"          // 语言代码（en、zh 等）
  }
}
```

### 3. 获取小时天气预报

```typescript
// 工具名称: getHourlyWeather
{
  location: "广州", // 城市名称、坐标或和风天气位置 ID
  options: {
    units: "metric",        // "metric"（摄氏度）或 "imperial"（华氏度）
    hours: 24,              // 小时数（默认：24，最大：24）
    language: "zh"          // 语言代码（en、zh、ja 等）
  }
}
```

### 4. 城市查询

```typescript
// 工具名称: lookupCity
{
  location: "深圳",      // 城市名称或坐标
  options: {
    language: "zh"          // 语言代码（en、zh 等）
  }
}
```

## 配置选项

您可以通过 MCP 配置中的环境变量配置各种选项：

```json
{
  "mcpServers": {
    "weather": {
      "command": "npx",
      "args": ["-y", "mcp-weather-server"],
      "env": {
        "QWEATHER_API_KEY": "你的-api-密钥",
        "QWEATHER_API_URL": "https://devapi.qweather.com/v7",
        "QWEATHER_GEO_API_URL": "https://geoapi.qweather.com/v2",
        "WEATHER_DEFAULT_LOCATION": "101010100",
        "WEATHER_DEFAULT_UNITS": "metric",
        "WEATHER_DEFAULT_LANGUAGE": "zh",
        "WEATHER_INCLUDE_DETAILS": "true",
        "WEATHER_FORECAST_DAYS": "7"
      }
    }
  }
}
```

### 可用环境变量

| 变量                       | 描述                      | 默认值                         |
| -------------------------- | ------------------------- | ------------------------------ |
| `QWEATHER_API_KEY`         | 和风天气 API 密钥         | 演示密钥（已包含）             |
| `QWEATHER_API_URL`         | 和风天气 API 基础 URL     | https://devapi.qweather.com/v7 |
| `QWEATHER_GEO_API_URL`     | 和风天气地理 API 基础 URL | https://geoapi.qweather.com/v2 |
| `WEATHER_DEFAULT_LOCATION` | 默认位置代码或坐标        | -                              |
| `WEATHER_DEFAULT_UNITS`    | 默认温度单位              | metric                         |
| `WEATHER_DEFAULT_LANGUAGE` | 默认语言代码              | en                             |
| `WEATHER_INCLUDE_DETAILS`  | 包含额外天气详情          | true                           |
| `WEATHER_FORECAST_DAYS`    | 默认预报天数              | 3                              |

## 位置格式

您可以使用三种格式指定位置：

1. **城市名称**：例如，"北京"、"上海"、"广州"
2. **坐标**：例如，"119.98,30.24"（经度,纬度）
3. **和风天气位置 ID**：例如，"101010100"（北京）

使用 `lookupCity` 工具查找适当的位置 ID，以获得更精确的目标定位。

## 响应格式

所有工具都以以下格式返回响应：

```typescript
{
  content: Array<{
    type: "text";
    text: string;
  }>;
}
```

### 示例响应（当前天气）

```
北京的天气：

观测时间：2023-11-15T12:30+08:00
当前状况：多云（图标：101）
温度：18.5°C
体感温度：19.2°C

风力信息：
- 风向：东北风（45°）
- 风力等级：3
- 风速：15 公里/小时

其他信息：
- 湿度：65%
- 降水量：0.0 毫米
- 气压：1013 百帕
- 能见度：25 公里
- 云量：30%
- 露点：12.1°C

更新时间：2023-11-15T12:35+08:00

数据来源：和风天气
许可证：和风天气开发者许可证
```

## 错误处理

所有工具都包含适当的错误处理，如果出现问题，将显示描述性错误消息。

## 使用 MCP Inspector 进行调试

对于开发和调试，我们推荐使用 MCP Inspector，这是一个强大的 MCP 服务器开发工具。

Inspector 提供以下用户界面功能：

- 测试工具调用
- 查看服务器响应
- 调试工具执行
- 监控服务器状态

## 开发

### 先决条件

- Node.js 16 或更高版本
- npm 或 yarn

### 设置

1. 克隆仓库
2. 安装依赖：

```bash
npm install
```

### 构建

```bash
npm run build
```

### 在开发模式下运行

```bash
npm run dev
```

## 贡献

欢迎贡献！请随时提交拉取请求。

1. Fork 仓库
2. 创建功能分支（`git checkout -b feature/Amazing功能`）
3. 提交更改（`git commit -m '添加一些Amazing功能'`）
4. 推送到分支（`git push origin feature/Amazing功能`）
5. 打开拉取请求

## 许可证

该项目采用 MIT 许可证。

## 支持

如有任何问题或疑问：

- 和风天气 API：参考[和风天气文档](https://dev.qweather.com/docs/)
- MCP 集成：参考 MCP 文档
