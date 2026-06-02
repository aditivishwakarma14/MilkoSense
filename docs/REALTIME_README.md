# MilkoSense Real-Time Firebase Integration

## Overview
This project now includes **real-time monitoring** capabilities that fetch milk quality data from Firebase Realtime Database every 3 seconds and perform automatic AI analysis.

## Firebase Database
**Database URL:** `https://minorproject-a64cd-default-rtdb.firebaseio.com/sensors.json`

**Current Data Structure:**
```json
{
  "gas": "NORMAL",
  "ph": 7.05,
  "quality": "GOOD",
  "tds": 0,
  "temperature": 24.37,
  "turbidity": 16
}
```

## New Features

### 1. Real-Time Dashboard (`realtime-dashboard.html`)
- **Live Data Monitoring**: Fetches sensor data from Firebase every 3 seconds
- **Automatic Analysis**: AI-powered milk quality analysis runs automatically
- **Visual Updates**: Real-time charts and sensor cards with live indicators
- **Historical Tracking**: Maintains history of last 100 readings
- **Quality Grading**: Instant A/B/C/D grade display based on milk parameters

### 2. Firebase Integration Module (`firebase-integration.js`)
- **FirebaseDataFetcher**: Handles real-time data fetching from Firebase
- **RealTimeMilkAnalyzer**: Processes and analyzes incoming sensor data
- **Auto-retry Logic**: Handles connection errors gracefully
- **Event System**: Custom events for UI updates

## How to Use

### Step 1: Start the Server
```bash
python -m http.server 8000
```

### Step 2: Open the Real-Time Dashboard
Navigate to: `http://localhost:8000/realtime-dashboard.html`

### Step 3: Start Monitoring
1. Click the **"Start Monitoring"** button
2. Watch as data is fetched from Firebase every 3 seconds
3. See real-time analysis and quality grading
4. Monitor historical trends on the chart

### Step 4: Stop Monitoring
Click the **"Stop Monitoring"** button to pause data fetching

## Features in Detail

### Real-Time Updates Every 3 Seconds
- Fetches latest sensor data from Firebase
- Updates all sensor cards with current values
- Shows countdown timer until next update
- Displays update count

### AI-Powered Analysis
- **Quality Grading**: A (Excellent), B (Good), C (Fair), D (Poor)
- **Score Calculation**: 0-100 based on all parameters
- **Parameter Status**: Optimal, Good, Fair, Poor for each sensor
- **Recommendations**: AI-generated suggestions for improvement

### Sensor Monitoring
1. **pH Level** (Optimal: 6.5-6.7)
2. **Temperature** (Optimal: 15°C-20°C)
3. **Turbidity** (Optimal: 10-20 NTU)
4. **TDS** (Optimal: 800-1200 ppm)
5. **Gas Sensor** (Optimal: 100-150)

### Visual Features
- Live indicator (pulsing red dot)
- Color-coded status badges
- Progress bars for each parameter
- Animated card updates
- Historical trend charts (ECharts)
- Responsive design

## Navigation

The Real-Time Dashboard is accessible from:
- **Home page**: Added to main navigation menu
- **Sensors page**: Big green button at the top
- **Direct URL**: `/realtime-dashboard.html`

## Technical Details

### Data Normalization
The system handles various data formats:
- String gas values ("NORMAL", "LOW", "HIGH") → Numeric values
- Automatic data validation and range checking
- Timestamp addition to all readings

### Error Handling
- Maximum 5 consecutive errors before stopping
- Connection status indicator
- Error event notifications
- Graceful degradation

### Storage
- Latest data stored in `localStorage`
- Analysis history (last 20 entries)
- Persistent across page reloads

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Edge, Safari)
- Requires JavaScript enabled
- Uses Fetch API for data retrieval

## Files Modified/Created

### New Files:
1. `firebase-integration.js` - Core Firebase integration module
2. `realtime-dashboard.html` - Real-time monitoring dashboard

### Modified Files:
1. `sensors.html` - Added "Real-Time Firebase Monitoring" button
2. `index.html` - Added "Real-Time" link to navigation

## Project Status

✅ Firebase real-time data fetching working  
✅ 3-second update interval implemented  
✅ AI analysis integration complete  
✅ Real-time dashboard UI complete  
✅ Navigation updates complete  
✅ Server running on http://localhost:8000  

## Next Steps (Optional Enhancements)

1. **Database Write**: Add ability to write test data to Firebase
2. **Alerts**: Email/SMS notifications for poor quality milk
3. **Export**: Download analysis history as CSV/PDF
4. **Multi-Sensor**: Support for multiple sensor feeds
5. **Authentication**: Secure Firebase access with auth
6. **Mobile App**: Native mobile application
7. **Cloud Functions**: Serverless analysis on Firebase

## Support

For issues or questions:
- Check browser console for error messages
- Verify Firebase URL is accessible
- Ensure internet connection is active
- Check that Python HTTP server is running

## License
Educational Project - MilkoSense Prototype

---
**Last Updated:** December 18, 2025  
**Version:** 1.0.0  
**Server:** http://localhost:8000
