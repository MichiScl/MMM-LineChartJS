# Description
A MagicMirror² module for flexible display of sensor data as configurable line charts using Chart.js. It supports reading data from local files or external URLs and allows displaying multiple independent data lines within a single chart.

MMM-LineChartJS is a powerful module for MagicMirror² designed to graphically represent various types of time-series data. It is ideal for displaying sensor data such as temperature, humidity, pressure, or other numerical values over a specified period. The module uses Chart.js for chart rendering and offers extensive configuration options to customize its appearance and data sources.

# Example Configurations
// pictures to be added

# Installation
To install this module in your MagicMirror²:
````
cd ~/MagicMirror/modules
git clone https://github.com/MichiScl/MMM-LineChartJS.git
cd ~/MagicMirror/modules/MMM-LineChartJS
npm install
````

# Configuration
Add the module to your config.js file within the modules array. 
You can add multiple instances of the module by using different chartIds and configurations.

Minimum configuration for two displayed lines:
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

# Data Format
The module expects JSON data which is an array of objects. Each object should contain a timestamp and the corresponding data points for the defined lines.
Ensure that the xDataID and yDataIDs in your config.js exactly match the keys in your JSON data.

Example dht_data_outdoor.json:
````
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
````
