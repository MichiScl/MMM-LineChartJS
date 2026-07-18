# MMM-LineChartJS

MagicMirror² module for drawing time-series sensor data as one or more Chart.js line graphs.

What it does
- Loads a JSON data source from either a remote URL or a local file path.
- Accepts an array of records or a single object and keeps only entries with a valid timestamp.
- Filters the data window to the latest `hoursToDisplay` hours before drawing.
- Supports multiple datasets in one chart using `chartConfig` entries.
- Lets each line use its own y-axis position, axis label, auto-scaling, smoothing, point styling, and gap handling.
- Dynamically loads Chart.js and the date-fns adapter from a CDN when the module starts.

Data format
The source JSON should be an array of objects, where each object contains a timestamp field and the numeric values you want to plot.

Example:

```json
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
  }
]
```

Installation
```bash
cd ~/MagicMirror/modules
git clone https://github.com/MichiScl/MMM-LineChartJS.git
cd MMM-LineChartJS
npm install
```

Example configuration

```js
{
  module: "MMM-LineChartJS",
  position: "bottom_left",
  config: {
    chartId: "outdoorclimate",
    dataFileUrl: "/home/pi/MagicMirror/modules/MMM-LineChartJS/data/dht_data_outdoor.json",
    xDataID: "timestamp",
    hoursToDisplay: 24,
    chartConfig: [
      {
        yDataID: "temperature",
        yAxisAutoScale: true,
        chartLabel: "Temperature"
      },
      {
        yDataID: "humidity",
        yAxisAutoScale: true,
        chartLabel: "Humidity"
      }
    ]
  }
}
```

Configuration highlights
- `chartId`: unique identifier for each chart instance. Required when using multiple charts.
- `dataFileUrl`: remote URL or local file path for the JSON source.
- `updateInterval`: how often the helper should fetch fresh data. Default: `60000`
- `hoursToDisplay`: keep only records from the last N hours. Default: `24`
- `maxDataPoints`: cap the number of points displayed after filtering.
- `xDataID`: key used for the x-axis timestamp.
- `xDataTimeFormat`: optional timestamp parsing hint, or `undefined` to use automatic parsing.
- `chartConfig`: array of line definitions for the chart.

Each `chartConfig` entry can configure:
- `yDataID`: the JSON field for that line
- `chartLabel`: legend label
- `lineColor`, `backgroundColor`, `fillGraph`
- `pointRadius`, `pointHoverRadius`
- `smoothingFactor`: moving-average smoothing; `0` disables it
- `connectGaps`: whether missing data points should be connected
- `yAxisPosition`, `yAxisLabel`, `yAxisShow`
- `yAxisAutoScale`, `yAxisMin`, `yAxisMax`
- `yAxisAutoTicks`, `yAxisTickSteps`

Runtime behavior
- The node helper reads the JSON, converts timestamps to `Date` objects, and filters entries outside the configured time window.
- When `maxDataPoints` is set, the newest N points are kept.
- The frontend creates one canvas per chart instance and redraws the chart when new data arrives.
- Missing or invalid y values are kept as `null` so gaps can be rendered instead of being dropped entirely.
- If no valid data remains, the module shows a status message rather than rendering a broken chart.

Dependencies
- `node-fetch`
- Chart.js is loaded at runtime from a CDN by the frontend.

License
MIT