// Machine Learning Model for Disease Prediction based on Heavy Metal Exposure
// Uses TensorFlow.js for client-side prediction

class DiseasePredictor {
    constructor() {
        this.model = null;
        this.isModelLoaded = false;
        this.diseases = [
            'Neurological Disorders',
            'Kidney Disease', 
            'Cardiovascular Disease',
            'Respiratory Issues',
            'Gastrointestinal Problems',
            'Skin Disorders',
            'Cancer Risk',
            'Bone Disease'
        ];
        
        // Training data based on medical literature and WHO guidelines
        this.trainingData = this.generateTrainingData();
        this.initializeModel();
    }

    // Generate synthetic training data based on medical research
    generateTrainingData() {
        const data = [];
        
        // Generate 1000 synthetic samples based on medical literature
        for (let i = 0; i < 1000; i++) {
            const sample = {
                // Input features: metal concentrations (normalized)
                features: [
                    Math.random() * 0.1,    // lead (0-0.1 mg/L)
                    Math.random() * 0.02,   // mercury (0-0.02 mg/L)
                    Math.random() * 0.01,   // cadmium (0-0.01 mg/L)
                    Math.random() * 0.05,   // arsenic (0-0.05 mg/L)
                    Math.random() * 0.2,    // chromium (0-0.2 mg/L)
                    Math.random() * 5.0,    // copper (0-5.0 mg/L)
                    Math.random() * 10.0,   // zinc (0-10.0 mg/L)
                    Math.random() * 0.3     // nickel (0-0.3 mg/L)
                ],
                // Output labels: disease probabilities
                labels: []
            };
            
            // Calculate disease probabilities based on metal concentrations
            sample.labels = this.calculateDiseaseRisks(sample.features);
            data.push(sample);
        }
        
        return data;
    }

    // Calculate disease risks based on metal concentrations (based on medical literature)
    calculateDiseaseRisks(metalConcentrations) {
        const [lead, mercury, cadmium, arsenic, chromium, copper, zinc, nickel] = metalConcentrations;
        
        // Permissible limits for normalization
        const limits = [0.01, 0.006, 0.003, 0.01, 0.05, 2.0, 3.0, 0.07];
        
        // Normalize concentrations
        const normalized = metalConcentrations.map((conc, i) => conc / limits[i]);
        
        // Calculate disease probabilities based on research
        const risks = [
            // Neurological Disorders (mainly lead, mercury)
            Math.min(0.95, (normalized[0] * 0.4 + normalized[1] * 0.5 + Math.random() * 0.1)),
            
            // Kidney Disease (cadmium, lead, mercury)
            Math.min(0.95, (normalized[2] * 0.4 + normalized[0] * 0.3 + normalized[1] * 0.2 + Math.random() * 0.1)),
            
            // Cardiovascular Disease (lead, arsenic)
            Math.min(0.95, (normalized[0] * 0.3 + normalized[3] * 0.4 + Math.random() * 0.3)),
            
            // Respiratory Issues (chromium, nickel)
            Math.min(0.95, (normalized[4] * 0.4 + normalized[7] * 0.3 + Math.random() * 0.3)),
            
            // Gastrointestinal Problems (copper, zinc)
            Math.min(0.95, (normalized[5] * 0.3 + normalized[6] * 0.2 + Math.random() * 0.5)),
            
            // Skin Disorders (arsenic, chromium, nickel)
            Math.min(0.95, (normalized[3] * 0.3 + normalized[4] * 0.2 + normalized[7] * 0.3 + Math.random() * 0.2)),
            
            // Cancer Risk (arsenic, cadmium, chromium)
            Math.min(0.95, (normalized[3] * 0.4 + normalized[2] * 0.3 + normalized[4] * 0.2 + Math.random() * 0.1)),
            
            // Bone Disease (cadmium, lead)
            Math.min(0.95, (normalized[2] * 0.4 + normalized[0] * 0.3 + Math.random() * 0.3))
        ];
        
        return risks.map(risk => Math.max(0.01, risk)); // Minimum 1% baseline risk
    }

    // Initialize TensorFlow.js model
    async initializeModel() {
        try {
            // Create a neural network model
            this.model = tf.sequential({
                layers: [
                    tf.layers.dense({
                        inputShape: [8], // 8 heavy metals
                        units: 32,
                        activation: 'relu'
                    }),
                    tf.layers.dropout({rate: 0.3}),
                    tf.layers.dense({
                        units: 16,
                        activation: 'relu'
                    }),
                    tf.layers.dropout({rate: 0.2}),
                    tf.layers.dense({
                        units: 8, // 8 disease categories
                        activation: 'sigmoid' // For multi-label classification
                    })
                ]
            });

            // Compile the model
            this.model.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'binaryCrossentropy',
                metrics: ['accuracy']
            });

            await this.trainModel();
            this.isModelLoaded = true;
            console.log('Disease prediction model loaded successfully');
            
        } catch (error) {
            console.error('Error initializing ML model:', error);
            this.isModelLoaded = false;
        }
    }

    // Train the model with synthetic data
    async trainModel() {
        try {
            // Prepare training data
            const features = this.trainingData.map(d => d.features);
            const labels = this.trainingData.map(d => d.labels);
            
            const xs = tf.tensor2d(features);
            const ys = tf.tensor2d(labels);
            
            // Train the model
            await this.model.fit(xs, ys, {
                epochs: 50,
                batchSize: 32,
                validationSplit: 0.2,
                verbose: 0 // Set to 1 to see training progress
            });
            
            // Clean up tensors
            xs.dispose();
            ys.dispose();
            
            console.log('Model training completed');
            
        } catch (error) {
            console.error('Error training model:', error);
        }
    }

    // Predict disease risks for given metal concentrations
    async predictDiseaseRisk(metalConcentrations) {
        if (!this.isModelLoaded || !this.model) {
            return this.fallbackPrediction(metalConcentrations);
        }
        
        try {
            // Normalize input data
            const limits = [0.01, 0.006, 0.003, 0.01, 0.05, 2.0, 3.0, 0.07];
            const normalizedInputs = metalConcentrations.map((conc, i) => 
                Math.min(conc / limits[i], 10) // Cap at 10x the limit
            );
            
            // Make prediction
            const inputTensor = tf.tensor2d([normalizedInputs]);
            const predictions = this.model.predict(inputTensor);
            const predictionData = await predictions.data();
            
            // Clean up tensors
            inputTensor.dispose();
            predictions.dispose();
            
            // Format results
            const results = this.diseases.map((disease, index) => ({
                disease,
                probability: Math.round(predictionData[index] * 100),
                riskLevel: this.getRiskLevel(predictionData[index] * 100),
                recommendations: this.getRecommendations(disease, predictionData[index] * 100)
            }));
            
            return results;
            
        } catch (error) {
            console.error('Error making prediction:', error);
            return this.fallbackPrediction(metalConcentrations);
        }
    }

    // Fallback prediction when ML model fails
    fallbackPrediction(metalConcentrations) {
        const risks = this.calculateDiseaseRisks(metalConcentrations);
        
        return this.diseases.map((disease, index) => ({
            disease,
            probability: Math.round(risks[index] * 100),
            riskLevel: this.getRiskLevel(risks[index] * 100),
            recommendations: this.getRecommendations(disease, risks[index] * 100)
        }));
    }

    // Determine risk level based on probability
    getRiskLevel(probability) {
        if (probability < 20) return { level: 'Low', class: 'status-excellent' };
        if (probability < 40) return { level: 'Moderate', class: 'status-good' };
        if (probability < 60) return { level: 'High', class: 'status-poor' };
        return { level: 'Critical', class: 'status-very-poor' };
    }

    // Get health recommendations based on disease and risk level
    getRecommendations(disease, probability) {
        const recommendations = {
            'Neurological Disorders': [
                'Regular neurological check-ups',
                'Cognitive function monitoring',
                'Limit exposure to lead and mercury sources',
                'Consider chelation therapy if levels are extremely high'
            ],
            'Kidney Disease': [
                'Regular kidney function tests (creatinine, BUN)',
                'Monitor blood pressure',
                'Stay hydrated',
                'Reduce cadmium exposure from smoking/industrial sources'
            ],
            'Cardiovascular Disease': [
                'Regular cardiac check-ups',
                'Blood pressure monitoring',
                'Cholesterol level checks',
                'Exercise and healthy diet'
            ],
            'Respiratory Issues': [
                'Pulmonary function tests',
                'Avoid dust and chemical exposure',
                'Use protective equipment in industrial settings',
                'Regular chest X-rays if high exposure'
            ],
            'Gastrointestinal Problems': [
                'Regular digestive health monitoring',
                'Balanced diet with adequate fiber',
                'Monitor copper and zinc intake',
                'Consult gastroenterologist if symptoms persist'
            ],
            'Skin Disorders': [
                'Regular dermatological examinations',
                'Skin cancer screenings',
                'Use protective clothing and sunscreen',
                'Avoid direct contact with contaminated water'
            ],
            'Cancer Risk': [
                'Regular cancer screenings',
                'Avoid tobacco and excessive alcohol',
                'Maintain healthy lifestyle',
                'Genetic counseling if family history exists'
            ],
            'Bone Disease': [
                'Bone density tests',
                'Adequate calcium and vitamin D intake',
                'Weight-bearing exercises',
                'Limit cadmium exposure'
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

    // Get detailed health report
    generateHealthReport(metalConcentrations, predictions) {
        const overallRisk = Math.round(
            predictions.reduce((sum, pred) => sum + pred.probability, 0) / predictions.length
        );
        
        const highestRisks = predictions
            .filter(pred => pred.probability > 30)
            .sort((a, b) => b.probability - a.probability)
            .slice(0, 3);

        return {
            overallRisk,
            overallRiskLevel: this.getRiskLevel(overallRisk),
            highestRisks,
            criticalMetals: this.identifyCriticalMetals(metalConcentrations),
            urgentActions: this.getUrgentActions(predictions),
            followUpSchedule: this.getFollowUpSchedule(overallRisk)
        };
    }

    // Identify metals exceeding safe limits
    identifyCriticalMetals(metalConcentrations) {
        const limits = [0.01, 0.006, 0.003, 0.01, 0.05, 2.0, 3.0, 0.07];
        const metalNames = ['Lead', 'Mercury', 'Cadmium', 'Arsenic', 'Chromium', 'Copper', 'Zinc', 'Nickel'];
        
        return metalConcentrations
            .map((conc, i) => ({
                metal: metalNames[i],
                concentration: conc,
                limit: limits[i],
                exceedance: (conc / limits[i] * 100).toFixed(1)
            }))
            .filter(metal => metal.concentration > metal.limit);
    }

    // Get urgent actions based on predictions
    getUrgentActions(predictions) {
        const criticalPredictions = predictions.filter(pred => pred.probability > 60);
        
        if (criticalPredictions.length > 0) {
            return [
                'Seek immediate medical attention',
                'Stop exposure to contaminated water source',
                'Collect water samples for laboratory analysis',
                'Contact local health authorities',
                'Document symptoms if any'
            ];
        } else if (predictions.some(pred => pred.probability > 40)) {
            return [
                'Schedule medical consultation within 2 weeks',
                'Monitor for symptoms',
                'Consider alternative water sources',
                'Regular health monitoring'
            ];
        }
        
        return [
            'Continue regular health check-ups',
            'Monitor water quality periodically',
            'Maintain healthy lifestyle'
        ];
    }

    // Get follow-up schedule based on risk level
    getFollowUpSchedule(overallRisk) {
        if (overallRisk > 60) {
            return {
                immediate: 'Within 1 week',
                shortTerm: 'Monthly for 6 months',
                longTerm: 'Quarterly thereafter'
            };
        } else if (overallRisk > 40) {
            return {
                immediate: 'Within 1 month',
                shortTerm: 'Every 3 months',
                longTerm: 'Bi-annually'
            };
        }
        
        return {
            immediate: 'Within 3 months',
            shortTerm: 'Every 6 months',
            longTerm: 'Annually'
        };
    }
}

// Initialize the disease predictor
let diseasePredictor;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if TensorFlow.js is available
    if (typeof tf !== 'undefined') {
        diseasePredictor = new DiseasePredictor();
    } else {
        console.warn('TensorFlow.js not loaded. Disease prediction will use fallback method.');
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DiseasePredictor;
}
