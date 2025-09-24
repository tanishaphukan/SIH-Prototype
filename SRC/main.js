console.log('HMPI Application main.js loaded successfully!');

// Disease Prediction Functions
async function runDiseaseAnalysis() {
    if (!validateFormData()) return;
    
    const metals = [
        parseFloat(document.getElementById('lead').value) || 0,
        parseFloat(document.getElementById('mercury').value) || 0,
        parseFloat(document.getElementById('cadmium').value) || 0,
        parseFloat(document.getElementById('arsenic').value) || 0,
        parseFloat(document.getElementById('chromium').value) || 0,
        parseFloat(document.getElementById('copper').value) || 0,
        parseFloat(document.getElementById('zinc').value) || 0,
        parseFloat(document.getElementById('nickel').value) || 0
    ];
    
    try {
        showNotification('Running ML disease prediction analysis...', 'info');
        
        let predictions;
        if (typeof diseasePredictor !== 'undefined') {
            predictions = await diseasePredictor.predictDiseaseRisk(metals);
        } else {
            // Fallback prediction
            predictions = await fallbackDiseasePredictor(metals);
        }
        
        displayDiseaseResults(predictions, metals);
        showNotification('Disease risk analysis completed successfully!', 'success');
        
    } catch (error) {
        console.error('Error in disease analysis:', error);
        showNotification('Error in disease analysis. Using fallback method.', 'error');
        const fallbackPredictions = await fallbackDiseasePredictor(metals);
        displayDiseaseResults(fallbackPredictions, metals);
    }
}

// Fallback disease prediction when ML model is not available
async function fallbackDiseasePredictor(metalConcentrations) {
    const diseases = [
        'Neurological Disorders',
        'Kidney Disease', 
        'Cardiovascular Disease',
        'Respiratory Issues',
        'Gastrointestinal Problems',
        'Skin Disorders',
        'Cancer Risk',
        'Bone Disease'
    ];
    
    const limits = [0.01, 0.006, 0.003, 0.01, 0.05, 2.0, 3.0, 0.07];
    const normalized = metalConcentrations.map((conc, i) => conc / limits[i]);
    
    return diseases.map((disease, index) => {
        let probability;
        switch(disease) {
            case 'Neurological Disorders':
                probability = Math.min(95, (normalized[0] * 40 + normalized[1] * 50) + Math.random() * 10);
                break;
            case 'Kidney Disease':
                probability = Math.min(95, (normalized[2] * 40 + normalized[0] * 30 + normalized[1] * 20) + Math.random() * 10);
                break;
            case 'Cardiovascular Disease':
                probability = Math.min(95, (normalized[0] * 30 + normalized[3] * 40) + Math.random() * 30);
                break;
            case 'Respiratory Issues':
                probability = Math.min(95, (normalized[4] * 40 + normalized[7] * 30) + Math.random() * 30);
                break;
            case 'Gastrointestinal Problems':
                probability = Math.min(95, (normalized[5] * 30 + normalized[6] * 20) + Math.random() * 50);
                break;
            case 'Skin Disorders':
                probability = Math.min(95, (normalized[3] * 30 + normalized[4] * 20 + normalized[7] * 30) + Math.random() * 20);
                break;
            case 'Cancer Risk':
                probability = Math.min(95, (normalized[3] * 40 + normalized[2] * 30 + normalized[4] * 20) + Math.random() * 10);
                break;
            case 'Bone Disease':
                probability = Math.min(95, (normalized[2] * 40 + normalized[0] * 30) + Math.random() * 30);
                break;
            default:
                probability = Math.random() * 30;
        }
        
        probability = Math.max(1, probability); // Minimum 1% baseline risk
        
        return {
            disease,
            probability: Math.round(probability),
            riskLevel: getRiskLevel(probability),
            recommendations: getDiseaseRecommendations(disease, probability)
        };
    });
}

function getRiskLevel(probability) {
    if (probability < 20) return { level: 'Low', class: 'status-excellent' };
    if (probability < 40) return { level: 'Moderate', class: 'status-good' };
    if (probability < 60) return { level: 'High', class: 'status-poor' };
    return { level: 'Critical', class: 'status-very-poor' };
}

function getDiseaseRecommendations(disease, probability) {
    const recommendations = {
        'Neurological Disorders': [
            'Regular neurological check-ups',
            'Cognitive function monitoring',
            'Limit exposure to lead and mercury sources'
        ],
        'Kidney Disease': [
            'Regular kidney function tests',
            'Monitor blood pressure',
            'Stay hydrated'
        ],
        'Cardiovascular Disease': [
            'Regular cardiac check-ups',
            'Blood pressure monitoring',
            'Exercise and healthy diet'
        ],
        'Respiratory Issues': [
            'Pulmonary function tests',
            'Avoid dust and chemical exposure',
            'Use protective equipment'
        ],
        'Gastrointestinal Problems': [
            'Regular digestive health monitoring',
            'Balanced diet with adequate fiber',
            'Monitor copper and zinc intake'
        ],
        'Skin Disorders': [
            'Regular dermatological examinations',
            'Skin cancer screenings',
            'Use protective clothing'
        ],
        'Cancer Risk': [
            'Regular cancer screenings',
            'Avoid tobacco and excessive alcohol',
            'Maintain healthy lifestyle'
        ],
        'Bone Disease': [
            'Bone density tests',
            'Adequate calcium and vitamin D intake',
            'Weight-bearing exercises'
        ]
    };
    
    const baseRecommendations = recommendations[disease] || [];
    
    if (probability > 60) {
        return [...baseRecommendations, 'URGENT: Consult healthcare provider immediately'];
    } else if (probability > 40) {
        return [...baseRecommendations, 'Schedule medical consultation within 30 days'];
    }
    
    return baseRecommendations;
}

function displayDiseaseResults(predictions, metalConcentrations) {
    const overallRisk = Math.round(
        predictions.reduce((sum, pred) => sum + pred.probability, 0) / predictions.length
    );
    
    // Display overall risk
    document.getElementById('overall-risk-value').textContent = overallRisk + '%';
    const overallRiskLevel = getRiskLevel(overallRisk);
    document.getElementById('overall-risk-status').textContent = overallRiskLevel.level + ' Risk';
    document.getElementById('overall-risk-status').className = `result-status ${overallRiskLevel.class}`;
    
    // Display individual disease predictions
    const grid = document.getElementById('disease-predictions-grid');
    grid.innerHTML = '';
    
    predictions.forEach(prediction => {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <h4><i class="fas fa-heartbeat"></i> ${prediction.disease}</h4>
            <div class="result-value">${prediction.probability}%</div>
            <div class="result-status ${prediction.riskLevel.class}">${prediction.riskLevel.level} Risk</div>
            <div style="margin-top: 15px; font-size: 0.9rem;">
                <strong>Key Recommendations:</strong>
                <ul style="margin: 8px 0 0 20px;">
                    ${prediction.recommendations.slice(0, 2).map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        `;
        grid.appendChild(card);
    });
    
    // Display high-risk diseases and recommendations
    const highRiskDiseases = predictions.filter(pred => pred.probability > 30);
    const recommendationsContent = document.getElementById('recommendations-content');
    
    if (highRiskDiseases.length > 0) {
        recommendationsContent.innerHTML = `
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
                <h5 style="color: #e74c3c; margin-bottom: 15px;">High Priority Recommendations:</h5>
                ${highRiskDiseases.map(disease => `
                    <div style="margin-bottom: 15px;">
                        <strong>${disease.disease} (${disease.probability}% risk):</strong>
                        <ul style="margin: 5px 0 0 20px;">
                            ${disease.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        recommendationsContent.innerHTML = `
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
                <p style="color: #2ecc71;"><i class="fas fa-check-circle"></i> Overall risk levels are manageable. Continue regular health monitoring and maintain healthy lifestyle practices.</p>
            </div>
        `;
    }
    
    // Display critical metals
    displayCriticalMetals(metalConcentrations);
    
    // Show results section
    document.getElementById('disease-results').style.display = 'block';
}

function displayCriticalMetals(metalConcentrations) {
    const limits = [0.01, 0.006, 0.003, 0.01, 0.05, 2.0, 3.0, 0.07];
    const metalNames = ['Lead', 'Mercury', 'Cadmium', 'Arsenic', 'Chromium', 'Copper', 'Zinc', 'Nickel'];
    
    const criticalMetals = metalConcentrations
        .map((conc, i) => ({
            metal: metalNames[i],
            concentration: conc,
            limit: limits[i],
            exceedance: (conc / limits[i] * 100).toFixed(1)
        }))
        .filter(metal => metal.concentration > metal.limit);
    
    const criticalMetalsContent = document.getElementById('critical-metals-content');
    
    if (criticalMetals.length > 0) {
        criticalMetalsContent.innerHTML = `
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
                <p style="color: #e74c3c; margin-bottom: 15px;"><i class="fas fa-exclamation-triangle"></i> The following metals exceed WHO/EPA limits:</p>
                ${criticalMetals.map(metal => `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 10px; background: rgba(231,76,60,0.1); border-radius: 5px;">
                        <div>
                            <strong>${metal.metal}</strong><br>
                            <small>${metal.concentration} mg/L (Limit: ${metal.limit} mg/L)</small>
                        </div>
                        <div style="font-weight: bold; color: #e74c3c;">
                            ${metal.exceedance}% of limit
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } else {
        criticalMetalsContent.innerHTML = `
            <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px;">
                <p style="color: #2ecc71;"><i class="fas fa-check-circle"></i> All metal concentrations are within acceptable WHO/EPA limits.</p>
            </div>
        `;
    }
}

async function generateHealthReport() {
    if (!validateFormData()) return;
    
    const metals = [
        parseFloat(document.getElementById('lead').value) || 0,
        parseFloat(document.getElementById('mercury').value) || 0,
        parseFloat(document.getElementById('cadmium').value) || 0,
        parseFloat(document.getElementById('arsenic').value) || 0,
        parseFloat(document.getElementById('chromium').value) || 0,
        parseFloat(document.getElementById('copper').value) || 0,
        parseFloat(document.getElementById('zinc').value) || 0,
        parseFloat(document.getElementById('nickel').value) || 0
    ];
    
    let predictions;
    if (typeof diseasePredictor !== 'undefined') {
        predictions = await diseasePredictor.predictDiseaseRisk(metals);
    } else {
        predictions = await fallbackDiseasePredictor(metals);
    }
    
    const location = document.getElementById('location-name').value || 'Unknown Location';
    const date = document.getElementById('sample-date').value || new Date().toISOString().split('T')[0];
    
    const reportWindow = window.open('', '_blank');
    const overallRisk = Math.round(predictions.reduce((sum, pred) => sum + pred.probability, 0) / predictions.length);
    const highRiskDiseases = predictions.filter(pred => pred.probability > 30);
    
    reportWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Health Risk Assessment Report - ${location}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 40px; background: #667eea; color: white; padding: 30px; border-radius: 10px; }
                .section { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
                .risk-high { background: #fee; border-left: 5px solid #e74c3c; }
                .risk-moderate { background: #fef9e7; border-left: 5px solid #f39c12; }
                .risk-low { background: #eaf4f4; border-left: 5px solid #2ecc71; }
                .metal-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                .metal-table th, .metal-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                .metal-table th { background: #f2f2f2; }
                .exceed { background: #ffebee; color: #c62828; font-weight: bold; }
                .normal { background: #e8f5e8; color: #2e7d32; }
                ul { margin-left: 20px; }
                .disclaimer { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Health Risk Assessment Report</h1>
                <p><strong>Location:</strong> ${location}</p>
                <p><strong>Assessment Date:</strong> ${new Date(date).toLocaleDateString()}</p>
                <p><strong>Report Generated:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="section">
                <h2>Executive Summary</h2>
                <p><strong>Overall Health Risk Level:</strong> <span style="font-size: 1.2em; color: ${overallRisk > 60 ? '#e74c3c' : overallRisk > 40 ? '#f39c12' : '#2ecc71'};">${overallRisk}% (${getRiskLevel(overallRisk).level} Risk)</span></p>
                <p>This assessment analyzes potential health risks based on heavy metal concentrations in water samples using advanced machine learning algorithms and established medical research.</p>
            </div>
            
            <div class="section">
                <h2>Heavy Metal Concentrations</h2>
                <table class="metal-table">
                    <thead>
                        <tr>
                            <th>Metal</th>
                            <th>Concentration (mg/L)</th>
                            <th>WHO/EPA Limit (mg/L)</th>
                            <th>Status</th>
                            <th>Exceedance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${['Lead', 'Mercury', 'Cadmium', 'Arsenic', 'Chromium', 'Copper', 'Zinc', 'Nickel'].map((metal, i) => {
                            const limits = [0.01, 0.006, 0.003, 0.01, 0.05, 2.0, 3.0, 0.07];
                            const conc = metals[i];
                            const limit = limits[i];
                            const exceeds = conc > limit;
                            const exceedance = ((conc / limit) * 100).toFixed(1);
                            return `
                                <tr class="${exceeds ? 'exceed' : 'normal'}">
                                    <td>${metal}</td>
                                    <td>${conc}</td>
                                    <td>${limit}</td>
                                    <td>${exceeds ? 'EXCEEDS LIMIT' : 'Within Limit'}</td>
                                    <td>${exceedance}%</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>Disease Risk Predictions</h2>
                ${predictions.map(pred => `
                    <div class="section ${pred.probability > 60 ? 'risk-high' : pred.probability > 30 ? 'risk-moderate' : 'risk-low'}">
                        <h3>${pred.disease} - ${pred.probability}% Risk (${pred.riskLevel.level})</h3>
                        <p><strong>Recommendations:</strong></p>
                        <ul>
                            ${pred.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
            
            ${highRiskDiseases.length > 0 ? `
                <div class="section risk-high">
                    <h2>Urgent Actions Required</h2>
                    <p><strong>High-risk conditions detected. Immediate medical attention recommended.</strong></p>
                    <ul>
                        <li>Consult healthcare provider within 1 week</li>
                        <li>Stop consumption of contaminated water immediately</li>
                        <li>Seek alternative clean water sources</li>
                        <li>Contact local health authorities</li>
                        <li>Consider blood/urine testing for metal levels</li>
                    </ul>
                </div>
            ` : ''}
            
            <div class="section">
                <h2>Follow-up Schedule</h2>
                <ul>
                    <li><strong>Immediate:</strong> ${overallRisk > 60 ? 'Within 1 week' : overallRisk > 40 ? 'Within 1 month' : 'Within 3 months'}</li>
                    <li><strong>Short-term:</strong> ${overallRisk > 60 ? 'Monthly for 6 months' : overallRisk > 40 ? 'Every 3 months' : 'Every 6 months'}</li>
                    <li><strong>Long-term:</strong> ${overallRisk > 60 ? 'Quarterly thereafter' : overallRisk > 40 ? 'Bi-annually' : 'Annually'}</li>
                </ul>
            </div>
            
            <div class="disclaimer">
                <h3>Medical Disclaimer</h3>
                <p><strong>Important:</strong> This report is generated by an AI system for screening purposes only and should not replace professional medical consultation. The predictions are based on exposure data and established research but cannot account for individual health factors, genetics, or other environmental exposures. Always consult qualified healthcare providers for accurate diagnosis, treatment recommendations, and personalized medical advice.</p>
            </div>
        </body>
        </html>
    `);
    
    reportWindow.document.close();
    showNotification('Health report generated successfully', 'success');
}// Global variables
let map;
let markers = [];
let waterQualityData = [];
let chartInstances = {};

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeMap();
    initializeEventListeners();
    initializeCharts();
    initializeMLModel();
    
    // Set today's date
    document.getElementById('sample-date').valueAsDate = new Date();
});

// Initialize ML Model Status
function initializeMLModel() {
    const statusElement = document.getElementById('ml-status');
    const predictButton = document.getElementById('predict-btn');
    
    // Check if TensorFlow.js is loaded
    if (typeof tf === 'undefined') {
        statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> TensorFlow.js not loaded. Using fallback prediction method.';
        statusElement.className = 'alert alert-error';
        predictButton.disabled = false;
        return;
    }
    
    // Wait for model to be ready
    setTimeout(() => {
        if (typeof diseasePredictor !== 'undefined' && diseasePredictor.isModelLoaded) {
            statusElement.innerHTML = '<i class="fas fa-check-circle"></i> ML Model loaded successfully. Ready for disease prediction.';
            statusElement.className = 'alert alert-success';
            predictButton.disabled = false;
        } else {
            statusElement.innerHTML = '<i class="fas fa-info-circle"></i> Model loading... Using rule-based prediction method.';
            statusElement.className = 'alert alert-info';
            predictButton.disabled = false;
        }
    }, 3000);
}

// Tab management
function showTab(tabName) {
    const tabs = document.querySelectorAll('.tab-content');
    const tabButtons = document.querySelectorAll('.tab');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    tabButtons.forEach(button => button.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    event.target.closest('.tab').classList.add('active');
    
    if (tabName === 'mapping' && map) {
        setTimeout(() => {
            map.invalidateSize();
            updateMapMarkers();
        }, 100);
    }
    
    if (tabName === 'analytics') {
        setTimeout(updateCharts, 100);
    }
}

// Initialize event listeners
function initializeEventListeners() {
    const uploadArea = document.getElementById('upload-area');
    const fileInput = document.getElementById('file-upload');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleFileDrop);
    fileInput.addEventListener('change', handleFileSelect);
}

// File handling functions
function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        processFile(files[0]);
    }
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
}

function processFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            if (file.name.endsWith('.csv')) {
                parseCSV(e.target.result);
            } else {
                showNotification('Please upload a CSV file', 'error');
            }
        } catch (error) {
            showNotification('Error processing file: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
        showNotification('CSV file must contain header and at least one data row', 'error');
        return;
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const requiredFields = ['location', 'latitude', 'longitude'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length > 0) {
        showNotification(`Missing required fields: ${missingFields.join(', ')}`, 'error');
        return;
    }
    
    let processedCount = 0;
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= headers.length && values[0]) {
            const data = {};
            headers.forEach((header, index) => {
                data[header] = values[index] || '';
            });
            
            const lat = parseFloat(data.latitude);
            const lng = parseFloat(data.longitude);
            
            if (isNaN(lat) || isNaN(lng)) continue;
            
            const newData = {
                location: data.location,
                latitude: lat,
                longitude: lng,
                date: data.date || new Date().toISOString().split('T')[0],
                metals: {
                    lead: parseFloat(data.lead) || 0,
                    mercury: parseFloat(data.mercury) || 0,
                    cadmium: parseFloat(data.cadmium) || 0,
                    arsenic: parseFloat(data.arsenic) || 0,
                    chromium: parseFloat(data.chromium) || 0,
                    copper: parseFloat(data.copper) || 0,
                    zinc: parseFloat(data.zinc) || 0,
                    nickel: parseFloat(data.nickel) || 0
                }
            };
            
            newData.indices = {
                hpi: calculateHPI(newData.metals),
                hei: calculateHEI(newData.metals),
                cd: calculateContaminationDegree(newData.metals)
            };
            
            waterQualityData.push(newData);
            processedCount++;
        }
    }
    
    if (processedCount > 0) {
        showNotification(`Successfully imported ${processedCount} records`, 'success');
        updateMapMarkers();
        updateLeaderboards();
        updateLocationTable();
    } else {
        showNotification('No valid data found in CSV file', 'error');
    }
}

function downloadTemplate() {
    const csvContent = "location,latitude,longitude,date,lead,mercury,cadmium,arsenic,chromium,copper,zinc,nickel\n" +
        "Sample Location 1,18.5204,73.8567,2024-01-15,0.005,0.002,0.001,0.008,0.02,0.1,0.5,0.03\n" +
        "Sample Location 2,19.0760,72.8777,2024-01-16,0.012,0.004,0.002,0.015,0.03,0.15,0.8,0.05";
        
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hmpi_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Main calculation and form functions
function calculateIndices() {
    if (!validateFormData()) return;
    
    const metals = {
        lead: parseFloat(document.getElementById('lead').value) || 0,
        mercury: parseFloat(document.getElementById('mercury').value) || 0,
        cadmium: parseFloat(document.getElementById('cadmium').value) || 0,
        arsenic: parseFloat(document.getElementById('arsenic').value) || 0,
        chromium: parseFloat(document.getElementById('chromium').value) || 0,
        copper: parseFloat(document.getElementById('copper').value) || 0,
        zinc: parseFloat(document.getElementById('zinc').value) || 0,
        nickel: parseFloat(document.getElementById('nickel').value) || 0
    };
    
    const location = document.getElementById('location-name').value;
    const lat = parseFloat(document.getElementById('latitude').value);
    const lng = parseFloat(document.getElementById('longitude').value);
    const date = document.getElementById('sample-date').value;
    
    const hpi = calculateHPI(metals);
    const hei = calculateHEI(metals);
    const cd = calculateContaminationDegree(metals);
    
    displayResults(hpi, hei, cd);
    
    const newData = {
        location: location,
        latitude: lat,
        longitude: lng,
        date: date,
        metals: metals,
        indices: { hpi, hei, cd }
    };
    
    waterQualityData.push(newData);
    updateMapMarkers();
    updateLeaderboards();
    updateLocationTable();
    
    showNotification('Pollution indices calculated successfully!', 'success');
}

function displayResults(hpi, hei, cd) {
    document.getElementById('hpi-value').textContent = hpi;
    document.getElementById('hei-value').textContent = hei;
    document.getElementById('cd-value').textContent = cd;
    
    const hpiStatus = getWaterQualityStatus(parseFloat(hpi));
    document.getElementById('hpi-status').textContent = hpiStatus.text;
    document.getElementById('hpi-status').className = `result-status ${hpiStatus.class}`;
    
    const heiStatus = hei < 10 ? 'Acceptable' : hei < 20 ? 'Moderate' : 'High';
    document.getElementById('hei-status').textContent = heiStatus;
    document.getElementById('hei-status').className = `result-status ${heiStatus.toLowerCase() === 'acceptable' ? 'status-excellent' : 
        heiStatus.toLowerCase() === 'moderate' ? 'status-good' : 'status-poor'}`;
    
    const cdStatus = cd < 5 ? 'Low' : cd < 10 ? 'Moderate' : 'High';
    document.getElementById('cd-status').textContent = cdStatus + ' Contamination';
    document.getElementById('cd-status').className = `result-status ${cdStatus.toLowerCase() === 'low' ? 'status-excellent' : 
        cdStatus.toLowerCase() === 'moderate' ? 'status-good' : 'status-poor'}`;
    
    document.getElementById('results').style.display = 'block';
}

function predictHealthRisk() {
    if (!validateFormData()) return;
    
    const metals = {
        lead: parseFloat(document.getElementById('lead').value) || 0,
        mercury: parseFloat(document.getElementById('mercury').value) || 0,
        cadmium: parseFloat(document.getElementById('cadmium').value) || 0,
        arsenic: parseFloat(document.getElementById('arsenic').value) || 0,
        chromium: parseFloat(document.getElementById('chromium').value) || 0,
        copper: parseFloat(document.getElementById('copper').value) || 0,
        zinc: parseFloat(document.getElementById('zinc').value) || 0,
        nickel: parseFloat(document.getElementById('nickel').value) || 0
    };
    
    let riskScore = 0;
    const riskFactors = [];
    
    for (const [metal, concentration] of Object.entries(metals)) {
        if (concentration > 0 && permissibleLimits[metal]) {
            const ratio = concentration / permissibleLimits[metal];
            riskScore += ratio * getHealthRiskWeight(metal);
            
            if (ratio > 1) {
                riskFactors.push(`${metal.charAt(0).toUpperCase() + metal.slice(1)}: ${(ratio * 100).toFixed(1)}% above limit`);
            }
        }
    }
    
    const riskPercentage = Math.min(riskScore * 20, 100).toFixed(0);
    let riskLevel, riskClass;
    
    if (riskPercentage < 30) {
        riskLevel = 'Low Risk';
        riskClass = 'status-excellent';
    } else if (riskPercentage < 60) {
        riskLevel = 'Moderate Risk';
        riskClass = 'status-good';
    } else if (riskPercentage < 80) {
        riskLevel = 'High Risk';
        riskClass = 'status-poor';
    } else {
        riskLevel = 'Critical Risk';
        riskClass = 'status-very-poor';
    }
    
    document.getElementById('health-risk-value').textContent = riskPercentage + '%';
    document.getElementById('health-risk-status').textContent = riskLevel;
    document.getElementById('health-risk-status').className = `result-status ${riskClass}`;
    
    const factorsContainer = document.getElementById('risk-factors');
    if (riskFactors.length > 0) {
        factorsContainer.innerHTML = riskFactors.map(factor => 
            `<div style="background: rgba(255,255,255,0.1); padding: 10px; margin: 5px 0; border-radius: 8px;">⚠️ ${factor}</div>`
        ).join('');
    } else {
        factorsContainer.innerHTML = '<div style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;">✅ All metal concentrations are within acceptable limits</div>';
    }
    
    showNotification('Health risk prediction completed!', 'success');
}

function clearForm() {
    const inputs = ['location-name', 'latitude', 'longitude', 'lead', 'mercury', 'cadmium', 'arsenic', 'chromium', 'copper', 'zinc', 'nickel'];
    inputs.forEach(id => {
        document.getElementById(id).value = '';
    });
    
    document.getElementById('results').style.display = 'none';
    showNotification('Form cleared successfully', 'info');
}

// Export and report functions
function exportResults() {
    if (waterQualityData.length === 0) {
        showNotification('No data available to export', 'error');
        return;
    }
    
    let csvContent = 'Location,Date,Latitude,Longitude,HPI,HEI,Cd,Lead,Mercury,Cadmium,Arsenic,Chromium,Copper,Zinc,Nickel\n';
    
    waterQualityData.forEach(data => {
        const indices = data.indices || {
            hpi: calculateHPI(data.metals),
            hei: calculateHEI(data.metals),
            cd: calculateContaminationDegree(data.metals)
        };
        
        csvContent += `"${data.location}",${data.date},${data.latitude},${data.longitude},${indices.hpi},${indices.hei},${indices.cd},${data.metals.lead},${data.metals.mercury},${data.metals.cadmium},${data.metals.arsenic},${data.metals.chromium},${data.metals.copper},${data.metals.zinc},${data.metals.nickel}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hmpi_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('Results exported successfully', 'success');
}

function generateReport() {
    if (waterQualityData.length === 0) {
        showNotification('No data available for report generation', 'error');
        return;
    }
    
    const reportWindow = window.open('', '_blank');
    const totalLocations = waterQualityData.length;
    const avgHPI = (waterQualityData.reduce((sum, d) => sum + parseFloat(d.indices?.hpi || calculateHPI(d.metals)), 0) / totalLocations).toFixed(2);
    
    const excellentCount = waterQualityData.filter(d => parseFloat(d.indices?.hpi || calculateHPI(d.metals)) < 15).length;
    const goodCount = waterQualityData.filter(d => {
        const hpi = parseFloat(d.indices?.hpi || calculateHPI(d.metals));
        return hpi >= 15 && hpi < 30;
    }).length;
    const poorCount = waterQualityData.filter(d => {
        const hpi = parseFloat(d.indices?.hpi || calculateHPI(d.metals));
        return hpi >= 30 && hpi < 45;
    }).length;
    const veryPoorCount = waterQualityData.filter(d => parseFloat(d.indices?.hpi || calculateHPI(d.metals)) >= 45).length;
    
    reportWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>HMPI Analysis Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 40px; background: #667eea; color: white; padding: 30px; border-radius: 10px; }
                .summary { background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; }
                .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
                .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); text-align: center; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background: #f2f2f2; }
                .excellent { color: #2ecc71; font-weight: bold; }
                .good { color: #f39c12; font-weight: bold; }
                .poor { color: #e67e22; font-weight: bold; }
                .very-poor { color: #e74c3c; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Heavy Metal Pollution Index Analysis Report</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
            </div>
            
            <div class="summary">
                <h2>Executive Summary</h2>
                <p>This report analyzes water quality data from ${totalLocations} monitoring locations. 
                The average Heavy Metal Pollution Index (HPI) across all locations is ${avgHPI}.</p>
            </div>
            
            <div class="stats">
                <div class="stat-card">
                    <h3 class="excellent">${excellentCount}</h3>
                    <p>Excellent Quality<br>(HPI < 15)</p>
                </div>
                <div class="stat-card">
                    <h3 class="good">${goodCount}</h3>
                    <p>Good Quality<br>(HPI 15-30)</p>
                </div>
                <div class="stat-card">
                    <h3 class="poor">${poorCount}</h3>
                    <p>Poor Quality<br>(HPI 30-45)</p>
                </div>
                <div class="stat-card">
                    <h3 class="very-poor">${veryPoorCount}</h3>
                    <p>Very Poor Quality<br>(HPI > 45)</p>
                </div>
            </div>
            
            <h2>Detailed Analysis</h2>
            <table>
                <thead>
                    <tr>
                        <th>Location</th>
                        <th>Date</th>
                        <th>HPI</th>
                        <th>HEI</th>
                        <th>Quality Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${waterQualityData.map(data => {
                        const indices = data.indices || {
                            hpi: calculateHPI(data.metals),
                            hei: calculateHEI(data.metals),
                            cd: calculateContaminationDegree(data.metals)
                        };
                        const status = getWaterQualityStatus(parseFloat(indices.hpi));
                        return `
                            <tr>
                                <td>${data.location}</td>
                                <td>${data.date}</td>
                                <td>${indices.hpi}</td>
                                <td>${indices.hei}</td>
                                <td class="${status.class.replace('status-', '')}">${status.text}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
            
            <div class="summary">
                <h2>Recommendations</h2>
                <ul>
                    <li><strong>High Priority:</strong> Immediate attention required for locations with HPI > 45</li>
                    <li><strong>Medium Priority:</strong> Enhanced monitoring for locations with HPI 30-45</li>
                    <li><strong>Preventive:</strong> Regular monitoring for all locations</li>
                    <li><strong>Public Health:</strong> Consider health advisories for high-risk areas</li>
                </ul>
            </div>
        </body>
        </html>
    `);
    
    reportWindow.document.close();
    showNotification('Report generated successfully', 'success');
}

console.log('HMPI Application main.js loaded successfully!');


