/**
 * aiService.test.js — Jest tests for aiService.js
 * Tests graceful fallback when Python ML service is unavailable
 */

const axios = require('axios');
jest.mock('axios');

// Load the service after mocking axios
const aiService = require('../backend/src/services/aiService');

describe('AIService.callMLService()', () => {
  let service = aiService;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns null when Python service throws a network error', async () => {
    axios.post.mockRejectedValue(new Error('connect ECONNREFUSED 127.0.0.1:8000'));

    const safeData = {
      raw: { pH: 6.65, fat: 4.2, SNF: 8.7, protein: 3.3,
             density: 1.032, conductivity: 4.5 }
    };

    const result = await service.callMLService(safeData);
    expect(result).toBeNull();
  });

  test('does not throw when Python service is down', async () => {
    axios.post.mockRejectedValue(new Error('ECONNREFUSED'));

    const safeData = { raw: {} };
    await expect(service.callMLService(safeData)).resolves.not.toThrow();
  });

  test('full analyzeSensorData does not crash when ML service is down', async () => {
    axios.post.mockRejectedValue(new Error('ECONNREFUSED'));

    const result = await service.analyzeSensorData({
      raw: { pH: 6.65, fat: 4.2, SNF: 8.7, protein: 3.3,
             density: 1.032, conductivity: 4.5,
             tvc_cfu_ml: 50000 }
    });

    // Must complete without throwing
    expect(result).toBeDefined();
    expect(result.results).toBeDefined();

    // Fallback flag must be present
    expect(result.results.adulteration.source).toBe('js_fallback');
  });

  test('adulteration result has source=js_fallback when Python is down', async () => {
    axios.post.mockRejectedValue(new Error('timeout'));

    const result = await service.analyzeSensorData({ raw: {} });
    expect(result.results.adulteration.source).toBe('js_fallback');
  });

  test('sends X-API-Key header when PYTHON_ML_API_KEY env is set', async () => {
    process.env.PYTHON_ML_API_KEY = 'test-secret-key';
    axios.post.mockResolvedValue({
      data: {
        prediction: {
          ensemble:    { predictedClass: 'Pure', overallRisk: 'Low', confidence: 95, classProbabilities: {} },
          models:      { randomForest: { predictedClass: 'Pure', confidence: 95 },
                         xgboost:      { predictedClass: 'Pure', confidence: 94 } },
          anomaly:     { isolationForestScore: -0.1, isAnomaly: false, anomalyRiskPercent: 2.0 },
          uncertainty: { ci95Lower: 90, ci95Upper: 99 },
          explanation: { available: false },
          drift:       { isDrifted: false, maxZScore: 0.3 },
          breakdown:   { waterPercent: 1.2, ureaAdulteration: 0.5, detergentAdulteration: 0.3,
                         starchAdulteration: 0.2, syntheticMilk: 0.1 },
          totalRiskValue: 2.3,
          latencyMs:   11.2,
          modelVersion: '1.0.0',
        }
      }
    });

    await service.callMLService({ raw: {} });

    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-API-Key': 'test-secret-key' })
      })
    );

    delete process.env.PYTHON_ML_API_KEY;
  });
});
