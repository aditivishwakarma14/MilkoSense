const validateSensorReading = (req, res, next) => {
    const { ph, temperature, tds, turbidity, gas } = req.body;

    const errors = [];

    // Helper: Is it numeric
    const isNum = (val) => typeof val === 'number' && !isNaN(val);

    // 1. pH checks
    if (ph === undefined || ph === null) {
        errors.push('pH value is required');
    } else if (!isNum(ph)) {
        errors.push('pH value must be a number');
    } else if (ph < 0 || ph > 14) {
        errors.push('pH value must be between 0 and 14');
    }

    // 2. Temperature checks
    if (temperature === undefined || temperature === null) {
        errors.push('Temperature is required');
    } else if (!isNum(temperature)) {
        errors.push('Temperature must be a number');
    }

    // 3. TDS checks
    if (tds === undefined || tds === null) {
        errors.push('TDS value is required');
    } else if (!isNum(tds)) {
        errors.push('TDS value must be a number');
    } else if (tds < 0) {
        errors.push('TDS value cannot be negative');
    }

    // 4. Turbidity checks
    if (turbidity === undefined || turbidity === null) {
        errors.push('Turbidity is required');
    } else if (!isNum(turbidity)) {
        errors.push('Turbidity must be a number');
    } else if (turbidity < 0) {
        errors.push('Turbidity value cannot be negative');
    }

    // 5. Gas checks
    if (gas === undefined || gas === null) {
        errors.push('Gas reading is required');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            error: 'Validation Failed',
            messages: errors,
            timestamp: new Date().toISOString()
        });
    }

    // Normalize gas value (if string, convert to numeric equivalents)
    if (typeof req.body.gas === 'string') {
        const gasMap = {
            'NORMAL': 125,
            'LOW': 80,
            'MEDIUM': 150,
            'HIGH': 200,
            'CRITICAL': 250
        };
        req.body.gas = gasMap[req.body.gas.toUpperCase()] || 125;
    }

    next();
};

module.exports = {
    validateSensorReading
};
