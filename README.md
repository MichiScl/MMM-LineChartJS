MMM-LineChartJS
A MagicMirror² module for flexible display of sensor data as configurable line charts using Chart.js. It supports reading data from local files or external URLs and allows displaying multiple independent data lines within a single chart.

Brief Description
MMM-LineChartJS is a powerful module for MagicMirror² designed to graphically represent various types of time-series data. It is ideal for displaying sensor data such as temperature, humidity, pressure, or other numerical values over a specified period. The module leverages Chart.js for chart rendering and offers extensive configuration options to customize its appearance and data sources.

Installation
To install this module in your MagicMirror², please follow these steps:

Navigate to your MagicMirror² modules folder:

cd ~/MagicMirror/modules

Clone the module repository (if it's on GitHub):

git clone https://github.com/YourUsername/MMM-LineChartJS.git
# Replace the link with the actual link to your repository.
# If you downloaded the files manually, ensure the folder is named MMM-LineChartJS.

If you copied the files manually, make sure the folder name is MMM-LineChartJS and all .js and .css files are correctly placed within it.

Navigate into the module folder and install dependencies:

cd MMM-LineChartJS
npm install

This step will install node-fetch and any other dependencies declared in the package.json.

Configuration
Add the module to your config.js file within the modules array. You can add multiple instances of the module, each with its own chartId and configuration.

Note: The width and height of the chart should be adjusted to your MagicMirror's resolution for optimal display.

Example config.js:

var config = {
    modules: [
        {
            module: "MMM-LineChartJS",
            position: "bottom_left", // Position on the MagicMirror
            config: {
                chartId: "outdoorclimate", // Unique ID for this module instance
                dataFileUrl: "/home/pi/MagicMirror/modules/MMM-LineChartJS/data/dht_data_outdoor.json",
                // Or an HTTP URL: "http://192.168.XXX.XX/sensordata/dht_data_outdoor.json",
                updateInterval: 10 * 60 * 1000, // Data update interval in milliseconds (here: every 10 minutes)
                hoursToDisplay: 24, // Display data for the last X hours
                maxDataPoints: 500, // Maximum number of data points to display
                chartWidth: 500, // Width of the chart area in pixels
                chartHeight: 250, // Height of the chart area in pixels
                chartTitle: "Outdoor Climate (24h)", // Title displayed above the chart

                // General settings for the x-axis (for all lines in this chart)
                xDataID: "timestamp", // JSON key for x-axis data (timestamps)
                xDataIsTime: true, // true if x-axis represents time data; false for categorical data
                // xDataTimeFormat: "YYYY-MM-DDTHH:MM:SSZ", // Optional: Format of the timestamp in your raw data (e.g., "2025-06-12T18:22:06.000Z")
                                                        // If omitted, the helper attempts automatic detection.
                xAxisDisplayFormat: "HH:mm", // Display format of time on the x-axis (e.g., "14:30")
                xAxisPosition: "bottom", // Position of the x-axis ("bottom" or "top")
                xAxisLabel: "Time", // Label for the x-axis
                xAxisLabelShow: true, // Show x-axis label (true/false)
                xAxisAutoTicks: true, // Automatically calculate grid ticks (true = Chart.js decides)
                xAxisTickSteps: 1, // Step size for x-axis if xAxisAutoTicks: false

                // Configuration for individual data lines/graphs
                chartConfig: [
                    {
                        // First data line: Temperature
                        responsive: true, // Make the graph line responsive
                        chartLabel: "Temperature", // Label for this line in the legend
                        showChartLabel: true, // Show label in the legend
                        lineColor: 'rgb(255, 99, 132)', // Line color (Red)
                        backgroundColor: 'rgba(255, 99, 132, 0.1)', // Background color below the line (for filling)
                        fillGraph: false, // Fill area below the line (true/false)
                        pointRadius: 1, // Size of data points on the line
                        pointHoverRadius: 5, // Size of data points on hover

                        // Settings for the y-axis of this data line
                        yDataID: "temperature", // JSON key for y-axis data (temperature values)
                        yAxisAutoScale: true, // Automatically scale y-axis (true) or use fixed min/max values (false)
                        yAxisMin: -10, // Minimum y-axis value if yAxisAutoScale: false
                        yAxisMax: 40, // Maximum y-axis value if yAxisAutoScale: false
                        yAxisPosition: "left", // Position of the y-axis ("left" or "right")
                        yAxisLabel: "Temperature (°C)", // Label for the y-axis (also used in tooltip)
                        yAxisLabelShow: true, // Show y-axis label (true/false)
                        yAxisAutoTicks: true, // Automatically calculate grid ticks
                        yAxisTickSteps: 2, // Step size for y-axis if yAxisAutoTicks: false
                    },
                    {
                        // Second data line: Humidity
                        responsive: true,
                        chartLabel: "Humidity",
                        showChartLabel: true,
                        lineColor: 'rgb(54, 162, 235)', // Line color (Blue)
                        backgroundColor: 'rgba(54, 162, 235, 0.1)',
                        fillGraph: false,
                        pointRadius: 1,
                        pointHoverRadius: 5,

                        // Settings for the y-axis of this data line
                        yDataID: "humidity", // JSON key for y-axis data (humidity values)
                        yAxisAutoScale: true,
                        yAxisMin: 0,
                        yAxisMax: 100,
                        yAxisPosition: "right",
                        yAxisLabel: "Humidity (%)", // Label for the y-axis
                        yAxisLabelShow: true,
                        yAxisAutoTicks: true,
                        yAxisTickSteps: 10,
                    }
                    // Add more objects here for additional lines within the same chart.
                ]
            }
        },
        // You can add more instances of MMM-LineChartJS here
        // to display separate charts at other positions.
        /*
        {
            module: "MMM-LineChartJS",
            position: "top_right",
            config: {
                chartId: "indoorpressure", // Another unique ID
                dataFileUrl: "/home/pi/MagicMirror/modules/MMM-LineChartJS/data/pressure_data.json",
                updateInterval: 5 * 60 * 1000,
                hoursToDisplay: 12,
                maxDataPoints: 200,
                chartWidth: 400,
                chartHeight: 200,
                chartTitle: "Indoor Pressure (12h)",
                xDataID: "measurement_time",
                xDataIsTime: true,
                xDataTimeFormat: "YYYY-MM-DD HH:mm:ss",
                xAxisDisplayFormat: "HH:mm",
                xAxisPosition: "bottom",
                xAxisLabel: "Time",
                xAxisLabelShow: true,
                xAxisAutoTicks: true,
                xAxisTickSteps: 1,
                chartConfig: [
                    {
                        responsive: true,
                        chartLabel: "Pressure",
                        showChartLabel: true,
                        lineColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        fillGraph: true,
                        pointRadius: 0,
                        pointHoverRadius: 3,
                        yDataID: "pressure_hpa",
                        yAxisAutoScale: true,
                        yAxisMin: 950,
                        yAxisMax: 1050,
                        yAxisPosition: "left",
                        yAxisLabel: "Pressure (hPa)",
                        yAxisLabelShow: true,
                        yAxisAutoTicks: false,
                        yAxisTickSteps: 10,
                    }
                ]
            }
        },
        */
    ]
};

Data Format
The module expects JSON data which is an array of objects. Each object should contain a timestamp and the corresponding data points for the defined lines.

Example dht_data_outdoor.json:

[
  {
    "sensor_id": "outdoor",
    "timestamp": "2025-06-12T20:22:06",
    "timestamp_server_received": "2025-06-12 20:22:06",
    "temperature": 27.5,
    "humidity": 45
  },
  {
    "sensor_id": "outdoor",
    "timestamp": "2025-06-12T20:23:09",
    "timestamp_server_received": "2025-06-12 20:23:09",
    "temperature": 27.5,
    "humidity": 45.1
  },
  {
    "sensor_id": "outdoor",
    "timestamp": "2025-06-12T20:24:11",
    "timestamp_server_received": "2025-06-12 20:24:11",
    "temperature": 27.5,
    "humidity": 45
  }
]

Ensure that the xDataID and yDataIDs in your config.js exactly match the keys in your JSON data.