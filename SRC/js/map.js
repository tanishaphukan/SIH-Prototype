// Enhanced map with heatmap functionality
let heatmapLayer = null;
let heatmapData = [];
let isHeatmapVisible = false;

// Initialize map with heatmap capabilities
function initializeMap() {
    map = L.map('map').setView([20.5937, 78.9629], 5);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
    
    // Add heatmap control buttons
    addHeatmapControls();
    
    map.on('click', function(e) {
        document.getElementById('latitude').value = e.latlng.lat.toFixed(6);
        document.getElementById('longitude').value = e.latlng.lng.toFixed(6);
        showNotification('Location selected from map!', 'success');
    });
    
    // Initialize empty heatmap layer
    initializeHeatmapLayer();
}

// Initialize heatmap layer
function initializeHeatmapLayer() {
    // Create heatmap layer with Leaflet.heat plugin fallback
    if (typeof L.heatLayer !== 'undefined') {
        heatmapLayer = L.heatLayer([], {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            max: 1.0,
            gradient: {
                0.0: '#2ecc71',  // Green (low pollution)
                0.3: '#f39c12',  // Orange (moderate)
                0.6: '#e67e22',  // Dark orange (high)
                1.0: '#e74c3c'   // Red (very high pollution)
            }
        });
    } else {
        console.warn('Heatmap plugin not available, using fallback visualization');
        createFallbackHeatmap();
    }
}

// Fallback heatmap using circle markers when plugin unavailable
function createFallbackHeatmap() {
    heatmapLayer = L.layerGroup();
}

// Add heatmap control buttons to the map
function addHeatmapControls() {
    const heatmapControl = L.control({ position: 'topright' });
    
    heatmapControl.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'heatmap-controls');
        div.innerHTML = `
            <div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);">
                <div style="margin-bottom: 10px;">
                    <button id="toggle-heatmap" onclick="toggleHeatmap()" 
                            style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; width: 100%;">
                        <i class="fas fa-fire"></i> Show Heatmap
                    </button>
                </div>
                <div style="margin-bottom: 8px;">
                    <label style="font-size: 12px; font-weight: bold; color: #333;">Metal:</label>
                    <select id="heatmap-metal" onchange="updateHeatmapData()" 
                            style="width: 100%; padding: 4px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
                        <option value="hpi">Overall HPI</option>
                        <option value="lead">Lead</option>
                        <option value="mercury">Mercury</option>
                        <option value="cadmium">Cadmium</option>
                        <option value="arsenic">Arsenic</option>
                        <option value="chromium">Chromium</option>
                        <option value="copper">Copper</option>
                        <option value="zinc">Zinc</option>
                        <option value="nickel">Nickel</option>
                    </select>
                </div>
                <div>
                    <label style="font-size: 12px; font-weight: bold; color: #333;">Intensity:</label>
                    <input type="range" id="heatmap-intensity" min="0.1" max="2.0" step="0.1" value="1.0" 
                           onchange="updateHeatmapIntensity()" 
                           style="width: 100%;">
                    <span id="intensity-value" style="font-size: 11px; color: #666;">1.0</span>
                </div>
            </div>
        `;
        
        // Prevent map events when interacting with controls
        L.DomEvent.disableClickPropagation(div);
        L.DomEvent.disableScrollPropagation(div);
        
        return div;
    };
    
    heatmapControl.addTo(map);
}

// Toggle heatmap visibility
function toggleHeatmap() {
    const button = document.getElementById('toggle-heatmap');
    
    if (isHeatmapVisible) {
        // Hide heatmap
        if (heatmapLayer && map.hasLayer(heatmapLayer)) {
            map.removeLayer(heatmapLayer);
        }
        isHeatmapVisible = false;
        button.innerHTML = '<i class="fas fa-fire"></i> Show Heatmap';
        button.style.background = '#667eea';
    } else {
        // Show heatmap
        if (waterQualityData.length === 0) {
            showNotification('No data available for heatmap. Please add monitoring locations first.', 'info');
            return;
        }
        
        updateHeatmapData();
        if (heatmapLayer) {
            map.addLayer(heatmapLayer);
        }
        isHeatmapVisible = true;
        button.innerHTML = '<i class="fas fa-fire"></i> Hide Heatmap';
        button.style.background = '#e74c3c';
    }
}

// Update heatmap data based on selected metal
function updateHeatmapData() {
    if (!isHeatmapVisible || waterQualityData.length === 0) return;
    
    const selectedMetal = document.getElementById('heatmap-metal').value;
    const newHeatmapData = [];
    
    waterQualityData.forEach(data => {
        let value = 0;
        let normalizedValue = 0;
        
        if (selectedMetal === 'hpi') {
            value = parseFloat(data.indices?.hpi || calculateHPI(data.metals));
            normalizedValue = Math.min(value / 100, 1.0); // Normalize HPI (0-100+ scale)
        } else {
            value = data.metals[selectedMetal] || 0;
            // Normalize based on WHO/EPA limits
            const limits = {
                lead: 0.01, mercury: 0.006, cadmium: 0.003, arsenic: 0.01,
                chromium: 0.05, copper: 2.0, zinc: 3.0, nickel: 0.07
            };
            normalizedValue = Math.min(value / (limits[selectedMetal] || 1), 1.0);
        }
        
        if (value > 0) {
            newHeatmapData.push([
                data.latitude,
                data.longitude,
                normalizedValue
            ]);
        }
    });
    
    heatmapData = newHeatmapData;
    
    // Update heatmap layer
    if (typeof L.heatLayer !== 'undefined' && heatmapLayer) {
        // Remove old layer
        if (map.hasLayer(heatmapLayer)) {
            map.removeLayer(heatmapLayer);
        }
        
        // Create new heatmap layer
        heatmapLayer = L.heatLayer(heatmapData, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            max: 1.0,
            gradient: getHeatmapGradient(selectedMetal)
        });
        
        map.addLayer(heatmapLayer);
    } else {
        // Fallback to circle markers
        updateFallbackHeatmap();
    }
}

// Get appropriate gradient colors for different metals
function getHeatmapGradient(metal) {
    const gradients = {
        hpi: {
            0.0: '#2ecc71', 0.3: '#f39c12', 0.6: '#e67e22', 1.0: '#e74c3c'
        },
        lead: {
            0.0: '#3498db', 0.5: '#e67e22', 1.0: '#8b0000'
        },
        mercury: {
            0.0: '#2ecc71', 0.4: '#f1c40f', 0.7: '#e67e22', 1.0: '#8b0000'
        },
        cadmium: {
            0.0: '#3498db', 0.5: '#9b59b6', 1.0: '#8b0000'
        },
        arsenic: {
            0.0: '#27ae60', 0.4: '#f39c12', 0.8: '#e74c3c', 1.0: '#8b0000'
        },
        default: {
            0.0: '#2ecc71', 0.3: '#f39c12', 0.6: '#e67e22', 1.0: '#e74c3c'
        }
    };
    
    return gradients[metal] || gradients.default;
}

// Update heatmap intensity
function updateHeatmapIntensity() {
    const intensity = document.getElementById('heatmap-intensity').value;
    document.getElementById('intensity-value').textContent = intensity;
    
    if (heatmapLayer && typeof L.heatLayer !== 'undefined') {
        heatmapLayer.setOptions({
            max: parseFloat(intensity)
        });
    } else if (heatmapLayer) {
        // Update fallback visualization
        updateFallbackHeatmap();
    }
}

// Fallback heatmap using colored circles
function updateFallbackHeatmap() {
    if (!heatmapLayer) {
        heatmapLayer = L.layerGroup();
    }
    
    // Clear existing circles
    heatmapLayer.clearLayers();
    
    const intensity = parseFloat(document.getElementById('heatmap-intensity').value);
    const selectedMetal = document.getElementById('heatmap-metal').value;
    
    heatmapData.forEach(point => {
        const [lat, lng, value] = point;
        const adjustedValue = Math.min(value * intensity, 1.0);
        const color = getColorForValue(adjustedValue);
        const radius = Math.max(5, adjustedValue * 30);
        
        const circle = L.circle([lat, lng], {
            color: color,
            fillColor: color,
            fillOpacity: 0.6,
            radius: radius * 1000, // Convert to meters
            weight: 2
        });
        
        circle.bindPopup(`
            <strong>${selectedMetal.toUpperCase()}</strong><br>
            Normalized Value: ${adjustedValue.toFixed(3)}<br>
            Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}
        `);
        
        heatmapLayer.addLayer(circle);
    });
    
    if (isHeatmapVisible && !map.hasLayer(heatmapLayer)) {
        map.addLayer(heatmapLayer);
    }
}

// Get color based on normalized value
function getColorForValue(value) {
    if (value < 0.25) return '#2ecc71';      // Green
    if (value < 0.5) return '#f39c12';       // Orange
    if (value < 0.75) return '#e67e22';      // Dark orange
    return '#e74c3c';                        // Red
}

// Add heatmap legend
function addHeatmapLegend() {
    const legend = L.control({ position: 'bottomright' });
    
    legend.onAdd = function(map) {
        const div = L.DomUtil.create('div', 'heatmap-legend');
        div.innerHTML = `
            <div style="background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.2); font-size: 12px;">
                <h4 style="margin: 0 0 8px 0; font-size: 14px;">Pollution Level</h4>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 20px; height: 12px; background: #2ecc71; border-radius: 2px;"></div>
                        <span>Low (0-25%)</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 20px; height: 12px; background: #f39c12; border-radius: 2px;"></div>
                        <span>Moderate (25-50%)</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 20px; height: 12px; background: #e67e22; border-radius: 2px;"></div>
                        <span>High (50-75%)</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 20px; height: 12px; background: #e74c3c; border-radius: 2px;"></div>
                        <span>Critical (75-100%)</span>
                    </div>
                </div>
            </div>
        `;
        
        return div;
    };
    
    return legend;
}

// Update map markers (existing function with heatmap integration)
function updateMapMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    if (waterQualityData.length === 0) return;
    
    waterQualityData.forEach(data => {
        const hpi = data.indices?.hpi || calculateHPI(data.metals);
        const status = getWaterQualityStatus(parseFloat(hpi));
        
        const marker = L.marker([data.latitude, data.longitude]).addTo(map);
        marker.bindPopup(`
            <div style="min-width: 250px;">
                <h4>${data.location}</h4>
                <p><strong>Date:</strong> ${data.date}</p>
                <p><strong>HPI:</strong> ${hpi} (${status.text})</p>
                <p><strong>Key Metals:</strong></p>
                <ul style="margin: 5px 0; padding-left: 20px;">
                    <li>Lead: ${data.metals.lead || 0} mg/L</li>
                    <li>Mercury: ${data.metals.mercury || 0} mg/L</li>
                    <li>Arsenic: ${data.metals.arsenic || 0} mg/L</li>
                    <li>Cadmium: ${data.metals.cadmium || 0} mg/L</li>
                </ul>
                <div style="margin-top: 10px;">
                    <button onclick="focusHeatmapOnLocation(${data.latitude}, ${data.longitude})" 
                            style="background: #667eea; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">
                        <i class="fas fa-crosshairs"></i> Focus Heatmap
                    </button>
                </div>
            </div>
        `);
        markers.push(marker);
    });
    
    // Update heatmap data if visible
    if (isHeatmapVisible) {
        updateHeatmapData();
    }
    
    // Add legend if heatmap is visible
    if (isHeatmapVisible && !document.querySelector('.heatmap-legend')) {
        const legend = addHeatmapLegend();
        legend.addTo(map);
    }
}

// Focus heatmap on specific location
function focusHeatmapOnLocation(lat, lng) {
    map.setView([lat, lng], 12);
    if (!isHeatmapVisible) {
        toggleHeatmap();
    }
}

// Enhanced location table with heatmap integration
function updateLocationTable() {
    const tbody = document.querySelector('#locations-table tbody');
    tbody.innerHTML = '';
    
    if (waterQualityData.length === 0) {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td colspan="7" style="text-align: center; padding: 40px; color: #6c757d;">
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
                <button onclick="focusOnLocation(${waterQualityData.indexOf(data)})" 
                        style="background: #3498db; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; margin-right: 5px;">
                    <i class="fas fa-map-marker-alt"></i>
                </button>
                <button onclick="focusHeatmapOnLocation(${data.latitude}, ${data.longitude})" 
                        style="background: #e67e22; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">
                    <i class="fas fa-fire"></i>
                </button>
            </td>
        `;
    });
}

// Enhanced focus on location function
function focusOnLocation(dataIndex) {
    const data = waterQualityData[dataIndex];
    if (data && map) {
        map.setView([data.latitude, data.longitude], 15);
        showTab('mapping');
        showNotification(`Focused on ${data.location}`, 'info');
    }
}

// Export heatmap data
function exportHeatmapData() {
    if (heatmapData.length === 0) {
        showNotification('No heatmap data available to export', 'error');
        return;
    }
    
    const selectedMetal = document.getElementById('heatmap-metal').value;
    const csv = ['Latitude,Longitude,Normalized_Value,Metal_Type'];
    
    heatmapData.forEach(point => {
        const [lat, lng, value] = point;
        csv.push(`${lat},${lng},${value.toFixed(6)},${selectedMetal}`);
    });
    
    const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `heatmap_${selectedMetal}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('Heatmap data exported successfully!', 'success');
}

// Leaderboard functions (existing)
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
        
        item.onclick = () => focusHeatmapOnLocation(data.latitude, data.longitude);
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
        
        item.onclick = () => focusHeatmapOnLocation(data.latitude, data.longitude);
        container.appendChild(item);
    });
}

