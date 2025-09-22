/* MMM-LineChartJS.js
 * MagicMirror Module
 *
 * This module fetches sensor data from a JSON source via node_helper
 * and displays it as configurable line chart using Chart.js.
 * Allows displaying multiple independent instances.
 */
Module.register("MMM-LineChartJS", {
    // Default module configuration.
    defaults: {
        updateInterval: 60 * 1000, // Update every 60 seconds
        hoursToDisplay: 24, // Show data for the last X hours
		dataFileUrl: undefined, // Your data JSON URL. Set to undefined by default.
        maxDataPoints: null, // Maximum number of data points
		chartHeight: 300, // Height of the chart
		chartWidth: 600, // Width of the chart
        chartId: "defaultChart", // Unique ID for this chart instance (default value)
        chartTitle: "Chart Title", // Title for the card

        // Settings for x-axis data (global for all chartConfigs)
        xDataID: "timestamp", // JSON identifier to use as x-axis timestamps
        xDataTimeFormat: undefined, // Configuration option for the raw data time format (String, e.g., "YYYY-MM-DD HH:MM:SS"). Undefined = node_helper attempts automatic parsing.
        xAxisDisplayFormat: "HH:mm", // Display format on the x-axis
        xAxisPosition: "bottom", // "bottom" or "top"
        xAxisLabel: "Record Time", // Label for the x-axis
        xAxisLabelShow: false, // Show x-axis label
        xAxisAutoTicks: true, // Automatically calculate grid ticks in equal steps depending on hoursToDisplay
        xAxisTickSteps: 1, // To use if xAxisAutoTicks = false

        // Configurations for individual line graphs
        chartConfig: [
            {
                // Example Chart 1: Temperature
                responsive: true,
                chartLabel: "Temperature Values",
                showChartLabel: true,
                lineColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fillGraph: false,
                pointRadius: 1, // Default point size
                pointHoverRadius: 5, // Default hover point size
                smoothingFactor: 0, // New: Smoothing factor (0 = disabled, 1 = light, 2 = stronger, etc.)

                // Settings for y-axis data
                yDataID: "temperature", // JSON identifier to use as y data
                yAxisAutoScale: true, // Automatic Y-axis scaling based on displayed data
                yAxisMin: -10,
                yAxisMax: 40,
                yAxisShow: true, // NEW: Show or hide the y-axis
                yAxisPosition: "left", // "left" or "right"
                yAxisLabel: "Temperature (°C)", // Label for the y-axis
                yAxisLabelShow: false, // Show y-axis label
                yAxisAutoTicks: true, // Automatically calculate grid ticks in equal steps
                yAxisTickSteps: 2, // To use if yAxisAutoTicks = false
            },
            {
                // Example Chart 2: Humidity
                responsive: true,
                chartLabel: "Humidity Values",
                showChartLabel: true,
                lineColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fillGraph: false,
                pointRadius: 1,
                pointHoverRadius: 5,
                smoothingFactor: 0, // New: Smoothing factor (0 = disabled, 1 = light, 2 = stronger, etc.)

                // Settings for y-axis data
                yDataID: "humidity",
                yAxisAutoScale: true,
                yAxisMin: 0,
                yAxisMax: 100,
                yAxisShow: true, // NEW: Show or hide the y-axis
                yAxisPosition: "right",
                yAxisLabel: "Humidity (%)",
                yAxisLabelShow: false,
                yAxisAutoTicks: true,
                yAxisTickSteps: 10,
            }
        ]
    },

    // Override the start method.
    start: function() {
        Log.info(`Starting module: ${this.name} (ChartID: ${this.config.chartId})`);
        this.dataLoaded = false;
        this.sensorData = [];
        this.chartInstance = null; // Store Chart.js instance
        this.canvasCreated = false; // Flag to track if canvas is created
        this.chartContainer = null; // Reference to the card container (div containing title, canvas)
        this.canvasElement = null; // Reference to the actual canvas DOM element

        this.loadChartJsScript();
    },

    // Dynamically load Chart.js script
    loadChartJsScript: function() {
        const self = this;
        if (!self.config.dataFileUrl || self.config.dataFileUrl.trim() === '') {
            Log.error(`MMM-LineChartJS (${self.config.chartId}): 'dataFileUrl' is not configured. Please specify a data source URL in config.js.`);
            if (this.canvasElement) {
                this.canvasElement.style.display = 'none'; // Hide canvas if URL is missing
            }
            const errorMsg = document.createElement("div");
            errorMsg.className = "dimmed light small status-message";
            errorMsg.innerHTML = `Error: Data file URL is not configured.`;
            if (this.chartContainer) {
                this.chartContainer.appendChild(errorMsg);
            }
            // Do not proceed with data fetching or scheduling updates
            return;
        }
        // Check if Chart.js is already loaded
        if (typeof Chart === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4'; // CDN for Chart.js 4
            script.onload = () => {
                // Ensure the date-fns adapter is loaded after Chart.js
                const adapterScript = document.createElement('script');
                adapterScript.src = 'https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3'; // CDN for date-fns adapter
                adapterScript.onload = () => {
                    Log.info(`MMM-LineChartJS (${self.config.chartId}): Chart.js and date-fns adapter loaded.`);
                    // *** IMPORTANT: Initial data fetch and update scheduling after libraries are loaded ***
                    self.sendSocketNotification("FETCH_SENSOR_DATA", {
                        url: self.config.dataFileUrl,
                        chartId: self.config.chartId,
                        hoursToDisplay: self.config.hoursToDisplay,
                        maxDataPoints: self.config.maxDataPoints,
                        xDataID: self.config.xDataID,
                        xDataTimeFormat: self.config.xDataTimeFormat // Send time format
                    });
                    self.scheduleUpdate();
                };
                adapterScript.onerror = () => {
                    Log.error(`MMM-LineChartJS (${self.config.chartId}): Error loading Chart.js date-fns adapter.`);
                };
                document.head.appendChild(adapterScript);
            };
            script.onerror = () => {
                Log.error(`MMM-LineChartJS (${self.config.chartId}): Error loading Chart.js.`);
            };
            document.head.appendChild(script);
        } else {
            Log.info(`MMM-LineChartJS (${self.config.chartId}): Chart.js already loaded. Initial data fetch and update scheduling.`);
            // If Chart.js is already loaded (e.g., on module reload or previous instance),
            // ensure data is fetched and the update cycle is started.
            self.sendSocketNotification("FETCH_SENSOR_DATA", {
                url: self.config.dataFileUrl,
                chartId: self.config.chartId,
                hoursToDisplay: self.config.hoursToDisplay,
                maxDataPoints: self.config.maxDataPoints,
                xDataID: self.config.xDataID,
                xDataTimeFormat: self.config.xDataTimeFormat // Send time format
            });
            self.scheduleUpdate();
        }
    },

    // Override the getDom method.
    getDom: function() {
        let wrapper = document.createElement("div");
        wrapper.className = "mmm-linechartjs-wrapper"; // Keep generic class name

        if (!this.canvasCreated)
        {
            // Create the card container only once
            const card = document.createElement("div");
            card.className = "mmm-linechartjs-card";
            wrapper.appendChild(card);

            // Add title
            const titleElement = document.createElement("div");
            titleElement.className = "mmm-linechartjs-header";
            titleElement.textContent = this.config.chartTitle; // Use chartTitle
            card.appendChild(titleElement);
		

            // Add canvas container
            const canvasContainer = document.createElement("div");
            canvasContainer.className = "mmm-linechartjs-canvas-container";
            canvasContainer.style.width = this.config.chartWidth + 'px';
            canvasContainer.style.height = this.config.chartHeight + 'px';
            card.appendChild(canvasContainer);

            // Add canvas element
            const canvasElement = document.createElement("canvas");
            // The ID will now also include the chartId to make it even more unique
            canvasElement.id = `chartCanvasJS-${this.identifier}-${this.config.chartId}`;
            canvasContainer.appendChild(canvasElement);

            this.canvasCreated = true; // Mark canvas as created
            this.chartContainer = card; // Store reference to the card for later updates
            this.canvasElement = canvasElement; // Store reference to the actual canvas element

            // Initial status: Loading message (will be replaced by data or error message)
            const loading = document.createElement("div");
            loading.className = "dimmed light small status-message"; // Use a general message class
            loading.innerHTML = this.translate("LOADING");
            this.chartContainer.appendChild(loading); // Append to the card

        }
        else
        {
            // If canvas is already created, return the existing wrapper structure
            // This is crucial to avoid "Canvas is already in use" by MagicMirror's updateDom
            return this.chartContainer.parentNode; // Return the outer wrapper
        }

        return wrapper; // Return the originally created wrapper
    },

	// Helper function to update/create the chart
	updateChart: function() {
		const self = this;
		const chartElement = this.canvasElement; // Use the stored reference

		if (!chartElement) {
			Log.error(`MMM-LineChartJS (${this.config.chartId}): Chart canvas element not found for updateChart. Aborting.`);
			return;
		}

		// Destroy existing Chart instance before creating a new one
		if (this.chartInstance) {
			this.chartInstance.destroy();
			this.chartInstance = null;
			Log.info(`MMM-LineChartJS (${this.config.chartId}): Existing chart instance destroyed.`);
		}

		const datasets = [];
		const yAxesConfig = {}; // Object to store Y-axis configurations
		let globalYMin = Infinity;
		let globalYMax = -Infinity;
		let autoScaleActive = false; // Flag to check if any chart uses auto-scaling

		// Ensure chartConfig exists and is an array
		if (!Array.isArray(this.config.chartConfig) || this.config.chartConfig.length === 0) {
			Log.error(`MMM-LineChartJS (${this.config.chartId}): 'chartConfig' is not configured as an array or is empty. No graphs can be drawn.`);
			if (this.canvasElement)
			{
				this.canvasElement.style.display = 'none';
			}
			const errorMsg = document.createElement("div");
			errorMsg.className = "dimmed light small status-message";
			errorMsg.innerHTML = `Error: 'chartConfig' is not configured correctly.`;
			if (this.chartContainer)
			{
				 this.chartContainer.appendChild(errorMsg);
			}
			return;
		}

		// First pass: Prepare data and determine global min/max for auto-scaled charts
		this.config.chartConfig.forEach((chartLineConfig, index) => {
			let lineData = [];
			// Filter and prepare data points for this specific line
			this.sensorData.forEach(entry => {
				// Safely convert parsedTimestamp to a Date object if it's still a string
				let xValue = entry.parsedTimestamp;
				if (typeof xValue === 'string') {
					const tempDate = new Date(xValue);
					if (!isNaN(tempDate.getTime())) {
						xValue = tempDate;
					} else {
						Log.warn(`MMM-LineChartJS (${self.config.chartId}): Timestamp '${xValue}' could not be re-converted to a Date object.`);
						xValue = undefined; // Set to undefined to mark it as invalid
					}
				}

				const yValue = entry[chartLineConfig.yDataID]; // y-axis is dynamic via yDataID

				// Additional check: Ensure xValue is a Date object
				const isValidXValue = (xValue instanceof Date && !isNaN(xValue.getTime()));

				// Ensure both x and y values exist and are valid
				if (isValidXValue && yValue !== undefined && yValue !== null && !isNaN(yValue)) {
					lineData.push({ x: xValue, y: yValue });
					// Check if this chart uses auto-scaling and update global min/max
					if (chartLineConfig.yAxisAutoScale) {
						autoScaleActive = true;
						globalYMin = Math.min(globalYMin, yValue);
						globalYMax = Math.max(globalYMax, yValue);
					}
				} else {
					Log.warn(`MMM-LineChartJS (${self.config.chartId}): Invalid data point for '${chartLineConfig.yDataID}' skipped. xValue: ${xValue}, yValue: ${yValue}, Original Entry: ${JSON.stringify(entry)}`);
				}
			});

			// Sort only if data exists
			if (lineData.length > 0) {
				lineData.sort((a, b) => {
					// Additional checks before calling getTime()
					if (a.x instanceof Date && b.x instanceof Date) {
						return a.x.getTime() - b.x.getTime();
					} else {
						Log.error(`MMM-LineChartJS (${self.config.chartId}): Invalid data type for x-axis during sorting. Expected: Date, Received: a.x type=${typeof a.x}, b.x type=${typeof b.x}`);
						// Fallback: If types are wrong, do not sort
						return 0;
					}
				});

				// Apply smoothing if smoothingFactor is greater than 0
				const smoothingFactor = chartLineConfig.smoothingFactor || 0;
				if (smoothingFactor > 0) {
					const smoothedLineData = [];
					for (let i = 0; i < lineData.length; i++) {
						let sum = 0;
						let count = 0;
						// Determine the window for the moving average
						for (let j = Math.max(0, i - smoothingFactor); j <= Math.min(lineData.length - 1, i + smoothingFactor); j++) {
							sum += lineData[j].y;
							count++;
						}
						smoothedLineData.push({ x: lineData[i].x, y: sum / count });
					}
					lineData = smoothedLineData; // Use the smoothed data
					Log.info(`MMM-LineChartJS (${self.config.chartId}): Applied smoothing with factor ${smoothingFactor} to '${chartLineConfig.chartLabel}'.`);
				}
			}

			if (lineData.length > 0) {
				datasets.push({
					label: chartLineConfig.chartLabel,
					data: lineData,
					borderColor: chartLineConfig.lineColor,
					backgroundColor: chartLineConfig.backgroundColor,
					yAxisID: `yAxis-${index}-${chartLineConfig.yAxisPosition}`, // Unique ID for each Y-axis
					tension: 0.1, // Smooth line
					fill: chartLineConfig.fillGraph,
					pointRadius: chartLineConfig.pointRadius,
					pointHoverRadius: chartLineConfig.pointHoverRadius,
				});
			}
		});

		if (datasets.length === 0) {
			Log.warn(`MMM-LineChartJS (${self.config.chartId}): No valid data available to display the chart.`);
			if (this.canvasElement) {
				this.canvasElement.style.display = 'none';
			}
			const noValidDataMsg = document.createElement("div");
			noValidDataMsg.className = "dimmed light small status-message";
			noValidDataMsg.innerHTML = `No valid data available for the chart.`;
			if (this.chartContainer) {
				 this.chartContainer.appendChild(noValidDataMsg);
			}
			return;
		}

		// Second pass: Configure the Y-axes based on the calculated global min/max
		this.config.chartConfig.forEach((chartLineConfig, index) => {
			const yAxisId = `yAxis-${index}-${chartLineConfig.yAxisPosition}`;
			const yMin = chartLineConfig.yAxisAutoScale ? globalYMin : chartLineConfig.yAxisMin;
			const yMax = chartLineConfig.yAxisAutoScale ? globalYMax : chartLineConfig.yAxisMax;

			yAxesConfig[yAxisId] = {
				type: 'linear',
				display: chartLineConfig.yAxisShow,
				position: chartLineConfig.yAxisPosition,
				title: {
					display: chartLineConfig.yAxisLabelShow,
					text: chartLineConfig.yAxisLabel,
					color: '#ccc',
				},
				ticks: {
					color: '#ccc',
					autoSkip: chartLineConfig.yAxisAutoTicks,
					stepSize: chartLineConfig.yAxisAutoTicks ? undefined : chartLineConfig.yAxisTickSteps,
				},
				grid: { color: 'rgba(200, 200, 200, 0.1)', drawBorder: false },
				min: yMin,
				max: yMax,
			};
		});

		// X-axis configuration remains unchanged
		const xAxisConfig = {
			type: 'time',
			time: {
				unit: 'hour',
				displayFormats: {
					hour: this.config.xAxisDisplayFormat
				},
				tooltipFormat: 'dd.MM.yyyy HH:mm:ss'
			},
			title: {
				display: this.config.xAxisLabelShow,
				text: this.config.xAxisLabel,
				color: '#ccc'
			},
			ticks: {
				color: '#ccc',
				autoSkip: this.config.xAxisAutoTicks,
				maxTicksLimit: this.config.xAxisAutoTicks ? 10 : undefined,
				stepSize: this.config.xAxisAutoTicks ? undefined : this.config.xAxisTickSteps,
			},
			grid: { color: 'rgba(200, 200, 200, 0.1)', drawBorder: false },
			position: this.config.xAxisPosition,
			min: new Date(Date.now() - (this.config.hoursToDisplay * 60 * 60 * 1000)).toISOString(),
			max: new Date().toISOString(),
		};

		// Combine all axis configurations
		const scalesConfig = {
			x: xAxisConfig,
			...yAxesConfig
		};

		// Chart.js Configuration
		const config = {
			type: 'line',
			data: {
				datasets: datasets
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: {
					mode: 'index',
					intersect: false,
				},
				stacked: false,
				plugins: {
					title: {
						display: false,
					},
					legend: {
						display: true,
						labels: {
							color: '#eee',
						}
					},
					tooltip: {
						callbacks: {
							title: function(context) {
								return new Date(context[0].parsed.x).toLocaleString('de-DE', {
									year: 'numeric', month: '2-digit', day: '2-digit',
									hour: '2-digit', minute: '2-digit', second: '2-digit'
								});
							},
							label: function(context) {
								let label = context.dataset.label || '';
								if (label) {
									label += ': ';
								}
								if (context.parsed.y !== null) {
									label += context.parsed.y.toFixed(1);
									const yAxisId = context.dataset.yAxisID;
									if (self.chartInstance && self.chartInstance.options.scales[yAxisId] && self.chartInstance.options.scales[yAxisId].title && self.chartInstance.options.scales[yAxisId].title.text) {
										const match = self.chartInstance.options.scales[yAxisId].title.text.match(/\(([^)]+)\)/);
										if (match) {
											label += ` ${match[1]}`;
										}
									}
								}
								return label;
							}
						}
					}
				},
				scales: scalesConfig
			}
		};

		// Create the new Chart instance
		this.chartInstance = new Chart(chartElement, config);
		Log.info(`MMM-LineChartJS (${self.config.chartId}): New chart instance created.`);
	},


    notificationReceived: function(notification, payload, sender) {
        if (notification === "DOM_OBJECTS_CREATED") {
            // Ensure we have a reference to the canvas element after the DOM is fully loaded
            if (!this.canvasElement) {
                // The ID must include the chartId to find the correct canvas instance
                this.canvasElement = document.getElementById(`chartCanvasJS-${this.identifier}-${this.config.chartId}`);
                if (!this.canvasElement) {
                    Log.error(`MMM-LineChartJS (${this.config.chartId}): Canvas element not found after DOM_OBJECTS_CREATED. Chart cannot be drawn.`);
                }
            }
        }
    },


    // Add socketNotificationReceived method for data from node_helper
    socketNotificationReceived: function(notification, payload) {
        const self = this;

        // Check if the received data belongs to this module instance
        if (notification === "SENSOR_DATA_FETCHED" && payload.chartId === this.config.chartId) {
            // Remove any existing status messages (loading, no data, error)
            const existingMessage = this.chartContainer ? this.chartContainer.querySelector('.status-message') : null;
            if (existingMessage) {
                existingMessage.remove();
            }

            if (payload.success) {
                // Data is already filtered in node_helper, but parsedTimestamp might still be a string.
                // Safely convert parsedTimestamp to a Date object here if necessary.
                this.sensorData = payload.data.map(entry => {
                    if (typeof entry.parsedTimestamp === 'string') {
                        const date = new Date(entry.parsedTimestamp);
                        if (!isNaN(date.getTime())) {
                            entry.parsedTimestamp = date;
                        } else {
                            Log.warn(`MMM-LineChartJS (${self.config.chartId}): Error re-parsing timestamp '${entry.parsedTimestamp}'. Treating as invalid.`);
                            entry.parsedTimestamp = undefined; // Mark timestamp as invalid
                        }
                    }
                    return entry;
                }).filter(entry => entry.parsedTimestamp !== undefined); // Filter out invalid entries here

                Log.info(`MMM-LineChartJS (${self.config.chartId}): Sensor data received and filtered. Total valid entries:`, this.sensorData.length);
                // Additional log to check received raw data
                Log.info(`MMM-LineChartJS (${self.config.chartId}): Received sensor data (partial):`, JSON.stringify(this.sensorData.slice(0, 5), null, 2)); // The first 5 entries
                this.dataLoaded = true;

                if (this.sensorData.length > 0) {
                    if (this.canvasElement) {
                        this.canvasElement.style.display = 'block'; // Show canvas
                        setTimeout(() => {
                            if (typeof Chart !== 'undefined') {
                                this.updateChart();
                            } else {
                                Log.warn(`MMM-LineChartJS (${self.config.chartId}): Chart.js not yet defined. Chart cannot be updated after data fetch.`);
                            }
                        }, 100);
                    } else {
                        Log.warn(`MMM-LineChartJS (${self.config.chartId}): Canvas element not available when data was fetched. Forcing DOM update.`);
                        self.updateDom();
                    }
                } else {
                    if (this.canvasElement) {
                        this.canvasElement.style.display = 'none'; // Hide canvas if no data
                    }
                    const noData = document.createElement("div");
                    noData.className = "dimmed light small status-message";
                    noData.innerHTML = this.translate("NO_DATA");
                    if (this.chartContainer) {
                        this.chartContainer.appendChild(noData);
                    } else {
                        Log.error(`MMM-LineChartJS (${self.config.chartId}): chartContainer not found to append 'no data' message.`);
                        self.updateDom();
                    }
                }
            } else {
                Log.error(`MMM-LineChartJS (${self.config.chartId}): Error fetching sensor data:`, payload.error);
                this.dataLoaded = true;
                this.sensorData = [];
                if (this.canvasElement) {
                    this.canvasElement.style.display = 'none'; // Hide canvas on error
                }
                const errorMsg = document.createElement("div");
                errorMsg.className = "dimmed light small status-message";
                errorMsg.innerHTML = "Error: " + payload.error;
                if (this.chartContainer) {
                    this.chartContainer.appendChild(errorMsg);
                } else {
                    Log.error(`MMM-LineChartJS (${self.config.chartId}): chartContainer not found to append error message.`);
                    self.updateDom();
                }
            }
        }
    },

    // Schedule next update.
    scheduleUpdate: function() {
        const self = this;
        if (this.updateIntervalId) {
            clearInterval(this.updateIntervalId);
        }
        this.updateIntervalId = setInterval(function() {
            self.sendSocketNotification("FETCH_SENSOR_DATA", {
                url: self.config.dataFileUrl,
                chartId: self.config.chartId,
                hoursToDisplay: self.config.hoursToDisplay,
                maxDataPoints: self.config.maxDataPoints,
                xDataID: self.config.xDataID,
                xDataTimeFormat: self.config.xDataTimeFormat
            });
        }, this.config.updateInterval);
    },

    // Add custom CSS to the module
    getStyles: function() {
        return ["MMM-Charts.css"]; // CSS file remains the same for now, as this is just a naming convention for the module.
    },

    // Clean up chart and interval when module is suspended/removed
    suspend: function() {
        if (this.chartInstance) {
            this.chartInstance.destroy();
            this.chartInstance = null;
            Log.info(`MMM-LineChartJS (${this.config.chartId}): Existing chart instance destroyed on suspend.`);
        }
        if (this.updateIntervalId) {
            clearInterval(this.updateIntervalId);
            this.updateIntervalId = null;
            Log.info(`MMM-LineChartJS (${this.config.chartId}): Update interval cleared on suspend.`);
        }
    },

    resume: function() {
        Log.info(`MMM-LineChartJS (${this.config.chartId}): Module resumed. Fetching data...`);
        // Fetch new data immediately when resuming the module
        this.sendSocketNotification("FETCH_SENSOR_DATA", {
            url: this.config.dataFileUrl,
            chartId: this.config.chartId,
            hoursToDisplay: this.config.hoursToDisplay,
            maxDataPoints: this.config.maxDataPoints,
            xDataID: this.config.xDataID,
            xDataTimeFormat: this.config.xDataTimeFormat
        });
        // Ensure the update schedule is restarted if it was stopped during suspend
        this.scheduleUpdate();
    }
});
