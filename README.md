# Description
A MagicMirror² module for flexible display of sensor data as configurable line charts using Chart.js.\
It supports reading data from local files or external URLs and allows displaying multiple independent data lines within a single chart.

MMM-LineChartJS is a powerful module for MagicMirror² designed to graphically represent various types of time-series data.\
It is ideal for displaying sensor data such as temperature, humidity, pressure, or other numerical values over a specified period.\
The module uses Chart.js for chart rendering and offers extensive configuration options to customize its appearance and data sources.

# Pictures
// to be added

# Data Input

## Data Source

The module expects data to be provided in JSON format.\
The data source to this module can be configured, to use a local file.

Example local file path:
````
dataFileUrl = "/home/pi/MagicMirror/modules/MMM-LineChartJS/data/dht_data_outdoor.json",
````
or via fetch from an URL (detected by string starting with 'http'):
````
dataFileUrl = "http://192.168.XXX.XX/sensordata/dht_data_outdoor.json",
````

## Data Format
The module expects JSON data which is an array of objects.\
The module expects JSON data which is an array of objects. Each object needs to contain at least two data elements (e.g. timestamp & data value)
Ensure that the `xDataID` and `yDataID` in your config.js exactly matches the keys in your JSON data.\
In example below `xDataID = timestamp` and `yDataID = temperature`

## Example data dht_data_outdoor.json:
````
[
  {
    "timestamp": "2025-06-12T20:22:06",
    "temperature": 27.5,
    "humidity": 45
  },
  {
    "timestamp": "2025-06-12T20:23:09",
    "temperature": 27.5,
    "humidity": 45.1
  },
  {
    "timestamp": "2025-06-12T20:24:11",
    "temperature": 27.5,
    "humidity": 45
  }
]
````

# Installation
To install this module in your MagicMirror² execute following steps:
````
cd ~/MagicMirror/modules
git clone https://github.com/MichiScl/MMM-LineChartJS.git
cd ~/MagicMirror/modules/MMM-LineChartJS
npm install
````

# Configuration
Add the module to your config.js file within the modules array. 
You can add multiple instances of the module by using different chartIds and configurations.

## Minimum configuration for two displayed lines:
````
{
    module: "MMM-LineChartJS",
    position: "bottom_left", // Or any other valid MagicMirror position
    config: {
        chartId: "outdoorclimate",                                                                 
        dataFileUrl: "/home/pi/MagicMirror/modules/MMM-LineChartJS/data/dht_data_outdoor.json",
        xDataID: "timestamp",  
        hoursToDisplay: 24,

        chartConfig: [
            {
                yDataID: "temperature", 
                yAxisAutoScale: true
            },
            {
                yDataID: "humidity",
                yAxisAutoScale: true
            }
        ]
    }
}
````
## All avaialble configuration options

| Configuration Option | Description | Default Value | Possible Values |
| :------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------- |
| `module` | Specifies the name of the MagicMirror module to load. | `"MMM-LineChartJS"` | `"MMM-LineChartJS"` |
| `position` | Defines the position where the module will be displayed on the MagicMirror screen. | `"bottom_left"` | `"top_bar"`, `"top_left"`, `"top_center"`, `"top_right"`, `"upper_third"`, `"middle_center"`, `"lower_third"`, `"bottom_left"`, `"bottom_center"`, `"bottom_right"`, `"bottom_bar"`, `"fullscreen_above"`, `"fullscreen_below"` |
| `config` | An object containing all module-specific configuration options. | N/A (container) | An object |
| `config.chartId` | A unique identifier for this specific chart instance. Essential when running multiple instances of the module. | `"defaultChart"` | Any unique string |
| `config.dataFileUrl` | The URL or local file path to the JSON data source for the chart. | `undefined` | A string representing a valid HTTP/HTTPS URL or a local file path. |
| `config.updateInterval` | How often the module fetches new data, in milliseconds. | `60 * 1000` (60 seconds) | Any positive integer (milliseconds) |
| `config.hoursToDisplay` | The number of recent hours for which data should be displayed. Data points older than this will be filtered out by the `node_helper`. | `24` | Any positive integer (hours) |
| `config.maxDataPoints` | The maximum number of data points to display on the chart. If `hoursToDisplay` yields more points, the oldest ones will be removed. | `null` | `null` or any positive integer |
| `config.chartWidth` | The width of the chart area in pixels. Note: CSS can override this for responsiveness. | `600` | Any positive integer (pixels) |
| `config.chartHeight` | The height of the chart area in pixels. Note: CSS can override this for responsiveness. | `300` | Any positive integer (pixels) |
| `config.chartTitle` | The title text displayed above the chart card. | `"Chart Title"` | Any string |
| `config.xDataID` | The key in your JSON data objects that holds the values for the x-axis (e.g., "timestamp"). | `"timestamp"` | Any string (matching a JSON key in your data) |
| `config.xDataTimeFormat` | Optional format string for parsing timestamps in your raw JSON data. If `undefined`, the `node_helper` attempts automatic detection. | `undefined` | A string representing a date/time format (e.g., `"YYYY-MM-DD HH:MM:SS"`, `"DD.MM.YYYYTHH:MM:SSZ"`) or `undefined`. |
| `config.xAxisDisplayFormat` | The display format for the time labels on the x-axis. | `"HH:mm"` | Any valid Chart.js time format string (e.g., `"HH:mm"`, `"MMM D"`, `"YYYY-MM-DD"`) |
| `config.xAxisPosition` | The position of the x-axis. | `"bottom"` | `"bottom"`, `"top"` |
| `config.xAxisLabel` | The label displayed along the x-axis. | `"Record Time"` | Any string |
| `config.xAxisLabelShow` | Controls the visibility of the x-axis label. | `false` | `true`, `false` |
| `config.xAxisAutoTicks` | If `true`, Chart.js automatically calculates grid ticks and their spacing. If `false`, `xAxisTickSteps` is used. | `true` | `true`, `false` |
| `config.xAxisTickSteps` | The step size for x-axis ticks. Only effective when `xAxisAutoTicks` is `false`. | `1` | Any positive number |
| `config.chartConfig` | An array where each object defines a single line (dataset) to be drawn on the chart. | An array containing default temperature and humidity line configurations. | An array of objects, each defining a line's properties. |
| `chartConfig[i].responsive` | If `true`, the specific chart line will resize responsively within its container. | `true` | `true`, `false` |
| `chartConfig[i].chartLabel` | The label for this specific line, displayed in the chart legend and tooltips. | `"Temperature Values"` or `"Humidity Values"` (depending on array index) | Any string |
| `chartConfig[i].showChartLabel` | Controls the visibility of this line's label in the chart legend. | `true` | `true`, `false` |
| `chartConfig[i].lineColor` | The color of the line on the chart. | `'rgb(255, 99, 132)'` (Red) or `'rgb(54, 162, 235)'` (Blue) | Any valid CSS color string (e.g., `'red'`, `'#FF0000'`, `'rgba(255,0,0,0.5)'`) |
| `chartConfig[i].backgroundColor` | The background color underneath the line, used when `fillGraph` is `true`. | `'rgba(255, 99, 132, 0.2)'` or `'rgba(54, 162, 235, 0.2)'` (transparent versions) | Any valid CSS color string (preferably with alpha for transparency) |
| `chartConfig[i].fillGraph` | If `true`, the area below this line will be filled with `backgroundColor`. | `false` | `true`, `false` |
| `chartConfig[i].pointRadius` | The radius of data points on the line. | `1` | Any non-negative number |
| `chartConfig[i].pointHoverRadius` | The radius of data points when hovered over. | `5` | Any non-negative number |
| `chartConfig[i].smoothingFactor` | The number of datapoins used for smoothing the line data via a moving average. `0` disables smoothing. Higher values result in stronger smoothing. | `0` | Any non-negative integer (0, 1, 2, ...) |
| `chartConfig[i].yDataID` | The key in your JSON data objects that holds the values for this line's y-axis. | `"temperature"` or `"humidity"` (depending on array index) | Any string (matching a JSON key in your data) |
| `chartConfig[i].yAxisAutoScale` | If `true`, the y-axis for this line will automatically scale based on the data's min/max values. If `false`, `yAxisMin` and `yAxisMax` are used. | `true` | `true`, `false` |
| `chartConfig[i].yAxisMin` | The minimum value for the y-axis. Only effective when `yAxisAutoScale` is `false`. | `-10` (for Temperature) or `0` (for Humidity) | Any number |
| `chartConfig[i].yAxisMax` | The maximum value for the y-axis. Only effective when `yAxisAutoScale` is `false`. | `40` (for Temperature) or `100` (for Humidity) | Any number |
| `chartConfig[i].yAxisPosition` | The position of the y-axis for this specific line. Multiple lines can share the same side or use opposite sides. | `"left"` (for Temperature) or `"right"` (for Humidity) | `"left"`, `"right"` |
| `chartConfig[i].yAxisLabel` | The label displayed along the y-axis for this specific line. | `"Temperature (°C)"` or `"Humidity (%)"` | Any string |
| `chartConfig[i].yAxisLabelShow` | Controls the visibility of this line's y-axis label. | `false` | `true`, `false` |
| `chartConfig[i].yAxisAutoTicks` | If `true`, Chart.js automatically calculates grid ticks and their spacing for this y-axis. If `false`, `yAxisTickSteps` is used. | `true` | `true`, `false` |
| `chartConfig[i].yAxisTickSteps` | The step size for y-axis ticks. Only effective when `yAxisAutoTicks` is `false`. | `2` (for Temperature) or `10` (for Humidity) | Any positive number |