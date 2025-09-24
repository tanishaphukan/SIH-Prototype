// Chatbot functions
function toggleChatbot() {
    const chatbot = document.getElementById('chatbot-window');
    chatbot.classList.toggle('active');
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatbot-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    addChatMessage(message, 'user');
    input.value = '';
    
    setTimeout(() => {
        const response = generateBotResponse(message);
        addChatMessage(response, 'bot');
    }, 500);
}

function addChatMessage(message, sender) {
    const messagesContainer = document.getElementById('chatbot-messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    if (sender === 'user') {
        messageDiv.innerHTML = `<strong>You:</strong> ${message}`;
    } else {
        messageDiv.innerHTML = `<strong>HMPI Assistant:</strong> ${message}`;
    }
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function generateBotResponse(userMessage) {
    const message = userMessage.toLowerCase();
    
    if (message.includes('data') && waterQualityData.length > 0) {
        return `You have ${waterQualityData.length} monitoring locations. The latest is "${waterQualityData[waterQualityData.length - 1].location}".`;
    }
    
    if (message.includes('hpi')) {
        return 'HPI (Heavy Metal Pollution Index) represents overall water quality. Values: <15 = Excellent, 15-30 = Good, 30-45 = Poor, >45 = Very Poor.';
    }
    
    if (message.includes('hei')) {
        return 'HEI (Heavy Metal Evaluation Index) is the sum of concentration ratios to permissible limits. Lower values indicate better water quality.';
    }
    
    if (message.includes('health') || message.includes('risk')) {
        return 'Health risk prediction considers metal toxicity and exposure. Higher concentrations increase risk, especially for lead, mercury, and arsenic.';
    }
    
    if (message.includes('upload')) {
        return 'Upload CSV files with columns: location, latitude, longitude, date, and metal concentrations (lead, mercury, cadmium, arsenic, etc.).';
    }
    
    if (message.includes('map')) {
        return 'The map shows your monitoring locations. Click on the map to set coordinates, or click markers for detailed information.';
    }
    
    if (message.includes('formula') || message.includes('calculate')) {
        return 'HPI uses weighted metal concentrations: HPI = Σ(Wi × Qi)/ΣWi, where Wi is weight and Qi is sub-index for each metal.';
    }
    
    if (message.includes('limits') || message.includes('standard')) {
        return 'WHO/EPA limits (mg/L): Lead 0.01, Mercury 0.006, Cadmium 0.003, Arsenic 0.01, Chromium 0.05, Copper 2.0, Zinc 3.0, Nickel 0.07.';
    }
    
    if (message.includes('export') || message.includes('download')) {
        return 'You can export data as CSV or generate PDF reports from the Analytics tab. Use the Export & Reports section.';
    }
    
    if (message.includes('help') || message.includes('how')) {
        return 'I can help with: pollution calculations, data interpretation, health risks, file uploads, map usage, and export features. What specific topic interests you?';
    }
    
    if (message.includes('clear') || message.includes('delete')) {
        return 'Use the Clear Form button to reset all input fields. Note: this doesn\'t delete saved monitoring data, only clears the current form.';
    }
    
    return 'I can help with pollution indices (HPI, HEI), health risks, data upload, map features, and analytics. What would you like to know?';
}
