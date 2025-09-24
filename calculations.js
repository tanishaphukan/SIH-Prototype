// WHO/EPA permissible limits (mg/L)
const permissibleLimits = {
    lead: 0.01,
    mercury: 0.006,
    cadmium: 0.003,
    arsenic: 0.01,
    chromium: 0.05,
    copper: 2.0,
    zinc: 3.0,
    nickel: 0.07
};

// Heavy Metal Pollution Index (HPI) Calculation
function calculateHPI(metals) {
    let weightedSum = 0;
    let totalWeight = 0;
    
    const weights = {
        lead: 4, mercury: 4, cadmium: 3, arsenic: 4,
        chromium: 2, copper: 2, zinc: 1, nickel: 2
    };
    
    for (const [metal, concentration] of Object.entries(metals)) {
        if (concentration > 0 && permissibleLimits[metal]) {
            const weight = weights[metal];
            const subIndex = (concentration / permissibleLimits[metal]) * 100;
            weightedSum += weight * subIndex;
            totalWeight += weight;
        }
    }
    
    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(2) : '0.00';
}

// Heavy Metal Evaluation Index (HEI) Calculation
function calculateHEI(metals) {
    let hei = 0;
    for (const [metal, concentration] of Object.entries(metals)) {
        if (concentration > 0 && permissibleLimits[metal]) {
            hei += concentration / permissibleLimits[metal];
        }
    }
    return hei.toFixed(2);
}

// Contamination Degree (Cd) Calculation
function calculateContaminationDegree(metals) {
    let cd = 0;
    for (const [metal, concentration] of Object.entries(metals)) {
        if (concentration > 0 && permissibleLimits[metal]) {
            cd += concentration / permissibleLimits[metal];
        }
    }
    return cd.toFixed(2);
}

// Water Quality Status Classification
function getWaterQualityStatus(hpi) {
    if (hpi < 15) return { text: 'Excellent', class: 'status-excellent' };
    if (hpi < 30) return { text: 'Good', class: 'status-good' };
    if (hpi < 45) return { text: 'Poor', class: 'status-poor' };
    return { text: 'Very Poor', class: 'status-very-poor' };
}

// Health Risk Weight Factors
function getHealthRiskWeight(metal) {
    const weights = {
        lead: 0.8, mercury: 0.9, cadmium: 0.7, arsenic: 0.8,
        chromium: 0.6, copper: 0.4, zinc: 0.2, nickel: 0.5
    };
    return weights[metal] || 0.5;
}
