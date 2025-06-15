/* node_helper.js
 * MagicMirror Module
 *
 * This helper fetches JSON sensor data from the specified URL.
 * Now supports reading from local JSON files.
 * Filters data by 'hoursToDisplay' and 'maxDataPoints' before sending to the module.
 */
const NodeHelper = require("node_helper");
const fetch = require("node-fetch"); // Used to fetch data from HTTP URL
const fs = require('fs').promises; // Node.js File System module for local file operations

module.exports = NodeHelper.create({
    start: function() {
        console.log("Starting node_helper for " + this.name);
    },

    socketNotificationReceived: function(notification, payload) {
        if (notification === "FETCH_SENSOR_DATA") {
            this.fetchSensorData(payload);
        }
    },

    fetchSensorData: async function(payload) {
        const { url, chartId, hoursToDisplay, maxDataPoints, xDataID, xDataTimeFormat } = payload;
        let data;

        try {
            if (url.startsWith("http://") || url.startsWith("https://")) {
                console.log(`MMM-LineChartJS NodeHelper (${chartId}): Fetching data from URL: ${url}`);
                const response = await fetch(url);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                data = await response.json();
            } else {
                console.log(`MMM-LineChartJS NodeHelper (${chartId}): Reading data from local file: ${url}`);
                const fileContent = await fs.readFile(url, 'utf8');
                data = JSON.parse(fileContent);
            }

            let processedData = [];
            if (Array.isArray(data)) {
                processedData = data;
            } else if (typeof data === 'object' && data !== null) {
                processedData = [data];
            } else {
                throw new Error("Invalid data format: Expected an array or a single object.");
            }

            const now = new Date();
            const cutoffTime = new Date(now.getTime() - (hoursToDisplay * 60 * 60 * 1000));

            let filteredData = processedData.filter(entry => {
                if (typeof entry === 'object' && entry !== null && typeof entry[xDataID] === 'string') {
                    let parsedDate;
                    const timestampString = entry[xDataID];

                    // Attempt to parse the date based on xDataTimeFormat
                    // This is a simple heuristic and might be insufficient for very complex formats.
                    // For full flexibility, 'date-fns/parse' might be needed here,
                    // which would mean an additional dependency in node_helper.
                    if (xDataTimeFormat) {
                        // Example parsing for known formats
                        const regexDDMMYYYYTHHMMSS = /(\d{2})\.(\d{2})\.(\d{4})T(\d{2}):(\d{2}):(\d{2})/; // DD.MM.YYYYTHH:MM:SS
                        const regexYYYYMMDD_HHMMSS = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/; // YYYY-MM-DD HH:MM:SS
                        const regexDDMMYYYY_HHMMSS = /(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})/; // DD.MM.YYYY HH:MM:SS
                        const regexYYYYMMDDTHHMMSSZ = /(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})\.(\d{3})Z?/; // YYYY-MM-DDTHH:MM:SS.SSSZ

                        let match;
                        if (match = timestampString.match(regexDDMMYYYYTHHMMSS)) {
                            // Convert to YYYY-MM-DDTHH:MM:SS for Date object
                            parsedDate = new Date(`${match[3]}-${match[2]}-${match[1]}T${match[4]}:${match[5]}:${match[6]}`);
                        } else if (match = timestampString.match(regexYYYYMMDD_HHMMSS)) {
                            parsedDate = new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}`);
                        } else if (match = timestampString.match(regexDDMMYYYY_HHMMSS)) {
                            parsedDate = new Date(`${match[3]}-${match[2]}-${match[1]}T${match[4]}:${match[5]}:${match[6]}`);
                        } else if (match = timestampString.match(regexYYYYMMDDTHHMMSSZ)) {
                             // Handle ISO 8601 with optional milliseconds and Z
                            parsedDate = new Date(timestampString);
                        } else {
                            // Fallback: Try to parse directly with new Date() if no specific regex matches
                            parsedDate = new Date(timestampString);
                        }
                    } else {
                        // If xDataTimeFormat is not specified, try to parse directly
                        parsedDate = new Date(timestampString);
                    }


                    if (!isNaN(parsedDate.getTime())) {
                        entry.parsedTimestamp = parsedDate; // Store parsed Date object
                        return parsedDate >= cutoffTime; // Include only data points within the last X hours
                    } else {
                        console.warn(`MMM-LineChartJS NodeHelper (${chartId}): Invalid timestamp format or parsing failed for ${xDataID}: '${timestampString}' with format '${xDataTimeFormat || "auto"}'.`);
                        return false;
                    }
                }
                console.warn(`MMM-LineChartJS NodeHelper (${chartId}): Entry skipped due to missing/invalid '${xDataID}' or non-object entry:`, entry);
                return false;
            });

            filteredData.sort((a, b) => a.parsedTimestamp.getTime() - b.parsedTimestamp.getTime());

            if (maxDataPoints && maxDataPoints > 0 && filteredData.length > maxDataPoints) {
                filteredData = filteredData.slice(-maxDataPoints);
                console.log(`MMM-LineChartJS NodeHelper (${chartId}): Data limited to the latest ${maxDataPoints} points.`);
            }

            console.log(`MMM-LineChartJS NodeHelper (${chartId}): Sensor data filtered. Total valid entries:`, filteredData.length);

            this.sendSocketNotification("SENSOR_DATA_FETCHED", { success: true, data: filteredData, chartId: chartId });
        }
        catch (error)
        {
            console.error(`MMM-LineChartJS NodeHelper (${chartId}): Error fetching/reading/processing sensor data:`, error);
            this.sendSocketNotification("SENSOR_DATA_FETCHED", { success: false, error: error.message, chartId: chartId });
        }
    }
});
