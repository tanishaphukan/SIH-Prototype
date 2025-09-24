// Initialize charts
function initializeCharts() {
    const trendsCtx = document.getElementById('trendsChart').getContext('2d');
    chartInstances.trends = new Chart(trendsCtx, {
        type: 'line',
        data: {
            labels: ['No Data'],
            datasets: [{
                label: 'Average HPI',
                data: [0],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Monthly Pollution Trends' }
            }
        }
    });
    
    const distCtx = document.getElementById('distributionChart').getContext('2d');
    chartInstances.distribution = new Chart(distCtx, {
        type: 'doughnut',
        data: {
            labels: ['No Data'],
            datasets: [{
                data: [1],
                backgroundColor: ['#95a5a6']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: { display: true, text: 'Heavy Metal Distribution' }
            }
        }
    });
}

function updateCharts() {
    if (waterQualityData.length === 0) return;
    
    // Update trends chart
    const months = [...new Set(waterQualityData.map(d => d.date.substring(0, 7)))].slice(-6);
    const avgHPI = months.map(month => {
        const monthData = waterQualityData.filter(d => d.date.startsWith(month));
        const total = monthData.reduce((sum, d) => sum + parseFloat(d.indices?.hpi || calculateHPI(d.metals)), 0);
        return (total / monthData.length).toFixed(1);
    });
    
    chartInstances.trends.data.labels = months;
    chartInstances.trends.data.datasets[0].data = avgHPI;
    chartInstances.trends.update();
    
    // Update distribution chart
    const metalSums = { lead: 0, mercury: 0, cadmium: 0, arsenic: 0, chromium: 0, copper: 0, zinc: 0, nickel: 0 };
    waterQualityData.forEach(data => {
        Object.keys(metalSums).forEach(metal => {
            metalSums[metal] += data.metals[metal] || 0;
        });
    });
    
    const labels = Object.keys(metalSums).filter(metal => metalSums[metal] > 0);
    const values = labels.map(metal => metalSums[metal] / waterQualityData.length);
    
    if (labels.length > 0) {
        chartInstances.distribution.data.labels = labels;
        chartInstances.distribution.data.datasets[0].data = values;
        chartInstances.distribution.data.datasets[0].backgroundColor = [
            '#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c', '#f1c40f', '#e67e22'
        ];
        chartInstances.distribution.update();
    }
}
