const trendPredictionService = {
  /**
   * Performs Double Exponential Smoothing (Holt's Linear Trend Model)
   * Suitable for detecting trends in time-series telemetry data.
   * @param {Array<number>} data - Historical sequence of values
   * @param {number} alpha - Data smoothing factor (0 to 1)
   * @param {number} beta - Trend smoothing factor (0 to 1)
   * @param {number} forecastSteps - Number of steps to project forward
   */
  calculateHoltTrend(data, alpha = 0.3, beta = 0.1, forecastSteps = 5) {
    if (!Array.isArray(data) || data.length < 2) {
      return { smoothed: data, forecast: [] };
    }

    const n = data.length;
    const level = new Array(n);
    const trend = new Array(n);
    const smoothed = new Array(n);

    // 1. Initialize level and trend
    level[0] = data[0];
    trend[0] = data[1] - data[0];
    smoothed[0] = data[0];

    // 2. Perform smoothing loop
    for (let i = 1; i < n; i++) {
      level[i] = alpha * data[i] + (1 - alpha) * (level[i - 1] + trend[i - 1]);
      trend[i] = beta * (level[i] - level[i - 1]) + (1 - beta) * trend[i - 1];
      smoothed[i] = level[i] + trend[i];
    }

    // 3. Extrapolate forecast steps into the future
    const forecast = [];
    const lastLevel = level[n - 1];
    const lastTrend = trend[n - 1];

    for (let h = 1; h <= forecastSteps; h++) {
      forecast.push(lastLevel + h * lastTrend);
    }

    return {
      smoothed,
      forecast
    };
  }
};

export default trendPredictionService;
