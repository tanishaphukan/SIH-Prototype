// Initialize map
function initializeMap() {
    map = L.map('map').setView([20.5937, 78.9629], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    map.on('click', function(e) {
        document.getElementById('latitude').value = e.latlng.lat.toFixed(6);
        document.getElementById('longitude').value = e.latlng.lng.toFixed(6);
        showNotification('Location selected from map!', 'success');
    });
}

// Update map markers
function updateMapMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    if (waterQualityData.length === 0) return;
    
    waterQualityData.forEach(data => {
        const hpi = data.indices?.hpi || calculateHPI(data.metals);
        const status = getWaterQualityStatus(parseFloat(hpi));
        
        const marker = L.marker([data.latitude, data.longitude]).addTo(map);
        marker.bindPopup(`
            <div style="min-width: 200px;">
                <h4>${data.location}</h4>
                <p><strong>Date:</strong> ${data.date}</p>
                <p><strong>HPI:</strong> ${hpi} (${status.text})</p>
                <p><strong>Key Metals:</strong></p>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    <li>Lead: ${data.metals.lead} mg/L</li>
                    <li>Mercury: ${data.metals.mercury} mg/L</li>
                    <li>Arsenic: ${data.metals.arsenic} mg/L</li>
                </ul>
            </div>
        `);
        markers.push(marker);
    });
}

// Update location table
function updateLocationTable() {
    const tbody = document.querySelector('#locations-table tbody');
    tbody.innerHTML = '';
    
    if (waterQualityData.length === 0) {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td colspan="6" style="text-align: center; padding: 40px; color: #6c757d;">
                <i class="fas fa-database" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
                No monitoring data available. Start by adding location data!
            </td>
        `;
        return;
    }
    
    waterQualityData.slice(-10).reverse().forEach(data => {
        const hpi = data.indices?.hpi || calculateHPI(data.metals);
        const hei = data.indices?.hei || calculateHEI(data.metals);
        const status = getWaterQualityStatus(parseFloat(hpi));
        
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${data.location}</td>
            <td>${data.date}</td>
            <td>${hpi}</td>
            <td>${hei}</td>
            <td><span class="pollution-score ${status.class.replace('status-', '')}" style="padding: 5px 10px; border-radius: 15px; color: white; font-size: 0.8rem;">${status.text}</span></td>
            <td>
                <button onclick="focusOnLocation(${waterQualityData.indexOf(data)})" style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-map-marker-alt"></i>
                </button>
            </td>
        `;
    });
}

function focusOnLocation(dataIndex) {
    const data = waterQualityData[dataIndex];
    if (data && map) {
        map.setView([data.latitude, data.longitude], 15);
        showTab('mapping');
        showNotification(`Focused on ${data.location}`, 'info');
    }
}

// Leaderboard functions
function updateLeaderboards() {
    updatePollutionLeaderboard();
    updateCleanLeaderboard();
}

function updatePollutionLeaderboard() {
    const container = document.getElementById('pollution-leaderboard');
    
    if (waterQualityData.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info" style="text-align: center;">
                <i class="fas fa-database"></i>
                No pollution data available. Start by adding monitoring data!
            </div>
        `;
        return;
    }
    
    const sortedData = [...waterQualityData].sort((a, b) => {
        const hpiA = parseFloat(a.indices?.hpi || calculateHPI(a.metals));
        const hpiB = parseFloat(b.indices?.hpi || calculateHPI(b.metals));
        return hpiB - hpiA;
    });
    
    container.innerHTML = '';
    sortedData.slice(0, 5).forEach((data, index) => {
        const hpi = data.indices?.hpi || calculateHPI(data.metals);
        const status = getWaterQualityStatus(parseFloat(hpi));
        
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <div class="rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}">${index + 1}</div>
            <div class="location-info">
                <strong>${data.location}</strong>
                <div style="font-size: 0.9rem; color: #666;">${data.date}</div>
            </div>
            <div class="pollution-score ${status.class}">${hpi}</div>
        `;
        container.appendChild(item);
    });
}

function updateCleanLeaderboard() {
    const container = document.getElementById('clean-leaderboard');
    
    if (waterQualityData.length === 0) {
        container.innerHTML = `
            <div class="alert alert-info" style="text-align: center;">
                <i class="fas fa-database"></i>
                No data available. Add monitoring locations to see rankings!
            </div>
        `;
        return;
    }
    
    const sortedData = [...waterQualityData].sort((a, b) => {
        const hpiA = parseFloat(a.indices?.hpi || calculateHPI(a.metals));
        const hpiB = parseFloat(b.indices?.hpi || calculateHPI(b.metals));
        return hpiA - hpiB;
    });
    
    container.innerHTML = '';
    sortedData.slice(0, 5).forEach((data, index) => {
        const hpi = data.indices?.hpi || calculateHPI(data.metals);
        const status = getWaterQualityStatus(parseFloat(hpi));
        
        const item = document.createElement('div');
        item.className = 'leaderboard-item';
        item.innerHTML = `
            <div class="rank ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}">${index + 1}</div>
            <div class="location-info">
                <strong>${data.location}</strong>
                <div style="font-size: 0.9rem; color: #666;">${data.date}</div>
            </div>
            <div class="pollution-score ${status.class}">${hpi}</div>
        `;
        container.appendChild(item);
    });
}
