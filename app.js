// Application Data from JSON
const MapData = {
    config: {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5,
        maxZoom: 18,
        minZoom: 4
    },
    disasterZones: [
        {
            id: "flood_mumbai_001",
            type: "flood",
            location: { lat: 19.0760, lng: 72.8777 },
            radius: 15000,
            color: "#3498db",
            probability: 78,
            severity: "high",
            affectedPopulation: 250000,
            description: "Monsoon flood prediction for Mumbai coastal areas",
            timeframe: "Next 48 hours",
            recommendations: ["Move to higher ground", "Avoid low-lying areas", "Keep emergency supplies ready"]
        },
        {
            id: "earthquake_delhi_001",
            type: "earthquake",
            location: { lat: 28.6139, lng: 77.2090 },
            radius: 25000,
            color: "#e74c3c",
            probability: 45,
            severity: "medium",
            affectedPopulation: 500000,
            description: "Seismic activity prediction for Delhi NCR region",
            timeframe: "Next 7 days",
            recommendations: ["Secure heavy objects", "Identify safe spots", "Prepare emergency kit"]
        },
        {
            id: "cyclone_chennai_001",
            type: "cyclone",
            location: { lat: 13.0827, lng: 80.2707 },
            radius: 20000,
            color: "#2ecc71",
            probability: 65,
            severity: "high",
            affectedPopulation: 180000,
            description: "Cyclone landfall prediction for Chennai coastline",
            timeframe: "Next 72 hours",
            recommendations: ["Secure loose objects", "Stock food/water for 3 days", "Avoid coastal areas"]
        },
        {
            id: "drought_bangalore_001",
            type: "drought",
            location: { lat: 12.9716, lng: 77.5946 },
            radius: 18000,
            color: "#f39c12",
            probability: 72,
            severity: "medium",
            affectedPopulation: 320000,
            description: "Water scarcity prediction for Bangalore region",
            timeframe: "Next 30 days",
            recommendations: ["Conserve water", "Harvest rainwater", "Avoid non-essential water use"]
        },
        {
            id: "wildfire_uttarakhand_001",
            type: "wildfire",
            location: { lat: 30.0668, lng: 79.0193 },
            radius: 12000,
            color: "#e67e22",
            probability: 58,
            severity: "medium",
            affectedPopulation: 45000,
            description: "Forest fire risk prediction for Uttarakhand hills",
            timeframe: "Next 5 days",
            recommendations: ["Avoid forest areas", "Report smoke immediately", "Keep fire extinguishers ready"]
        }
    ],
    hospitals: [
        {
            id: "h001",
            name: "AIIMS Delhi",
            location: { lat: 28.5687, lng: 77.2084 },
            city: "Delhi",
            type: "Government",
            beds: { total: 2478, available: 156, icu: 45, emergency: 78 },
            contact: "+91-11-26588500",
            specialties: ["Cardiology", "Neurology", "Emergency Medicine"]
        },
        {
            id: "h002",
            name: "Apollo Hospital Mumbai",
            location: { lat: 19.0176, lng: 72.8562 },
            city: "Mumbai",
            type: "Private",
            beds: { total: 670, available: 45, icu: 12, emergency: 23 },
            contact: "+91-22-26777500",
            specialties: ["Cardiology", "Orthopedics", "Gastroenterology"]
        },
        {
            id: "h003",
            name: "Fortis Chennai",
            location: { lat: 13.0369, lng: 80.2317 },
            city: "Chennai",
            type: "Private",
            beds: { total: 400, available: 28, icu: 8, emergency: 15 },
            contact: "+91-44-28154000",
            specialties: ["Cardiac Surgery", "Emergency Medicine"]
        },
        {
            id: "h004",
            name: "Medical College Kolkata",
            location: { lat: 22.5675, lng: 88.3758 },
            city: "Kolkata",
            type: "Government",
            beds: { total: 1200, available: 89, icu: 15, emergency: 35 },
            contact: "+91-33-22875435",
            specialties: ["General Surgery", "Internal Medicine"]
        },
        {
            id: "h005",
            name: "Manipal Hospital Bangalore",
            location: { lat: 12.9279, lng: 77.6271 },
            city: "Bangalore",
            type: "Private",
            beds: { total: 650, available: 52, icu: 18, emergency: 28 },
            contact: "+91-80-25023333",
            specialties: ["Neurosurgery", "Oncology"]
        }
    ],
    activeEmergencies: [
        {
            id: "emergency_001",
            type: "flood",
            title: "Flash Flood in Hyderabad",
            location: { lat: 17.3850, lng: 78.4867 },
            severity: "critical",
            affectedPopulation: 15000,
            casualties: { injured: 12, missing: 3, rescued: 45 },
            status: "Active Response"
        },
        {
            id: "emergency_002",
            type: "earthquake",
            title: "Earthquake M6.2 - Assam",
            location: { lat: 26.2006, lng: 92.9376 },
            severity: "high",
            affectedPopulation: 85000,
            casualties: { injured: 34, missing: 2, rescued: 0 },
            status: "Search & Rescue Operations"
        }
    ]
};

// Application State
const AppState = {
    currentTab: 'dashboard',
    realTimeInterval: null,
    charts: {},
    notifications: [],
    map: null,
    mapLayers: {
        disasterZones: null,
        hospitals: null,
        emergencies: null
    },
    layerControls: null,
    mapInitialized: false
};

// Notification System
class NotificationManager {
    constructor() {
        this.container = document.getElementById('notificationContainer');
    }

    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <strong>${type.charAt(0).toUpperCase() + type.slice(1)}</strong>
                <p>${message}</p>
            </div>
        `;

        this.container.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }
}

const notifications = new NotificationManager();

// Map Implementation
class DisasterMap {
    constructor() {
        this.map = null;
        this.layers = {
            disasterZones: L.layerGroup(),
            hospitals: L.layerGroup(),
            emergencies: L.layerGroup()
        };
        this.layerControl = null;
        this.initialized = false;
    }

    async initializeMap() {
        try {
            console.log('Starting map initialization...');
            
            // Check if Leaflet is available
            if (typeof L === 'undefined') {
                throw new Error('Leaflet library not loaded');
            }

            const mapContainer = document.getElementById('interactiveMap');
            if (!mapContainer) {
                throw new Error('Map container not found');
            }

            const mapLoading = document.getElementById('mapLoading');
            if (mapLoading) {
                mapLoading.classList.remove('hidden');
            }

            // Clear any existing map
            if (this.map) {
                this.map.remove();
            }

            // Initialize the map with error handling
            this.map = L.map('interactiveMap', {
                center: [MapData.config.center.lat, MapData.config.center.lng],
                zoom: MapData.config.zoom,
                minZoom: MapData.config.minZoom,
                maxZoom: MapData.config.maxZoom,
                zoomControl: true,
                scrollWheelZoom: true,
                preferCanvas: true
            });

            console.log('Map object created successfully');

            // Add tile layers with multiple fallbacks
            const primaryTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18,
                errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            });

            const satelliteTiles = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '© Esri & contributors',
                maxZoom: 18,
                errorTileUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
            });

            // Add primary tiles
            primaryTiles.addTo(this.map);
            console.log('Base tiles added successfully');

            // Wait for map to be ready
            await new Promise((resolve) => {
                this.map.whenReady(() => {
                    console.log('Map is ready');
                    resolve();
                });
            });

            // Create all map features
            console.log('Creating disaster zones...');
            await this.createDisasterZones();
            
            console.log('Creating hospital markers...');
            await this.createHospitalMarkers();
            
            console.log('Creating emergency markers...');
            await this.createEmergencyMarkers();

            // Add all layers to map
            this.layers.disasterZones.addTo(this.map);
            this.layers.hospitals.addTo(this.map);
            this.layers.emergencies.addTo(this.map);

            console.log('All layers added to map');

            // Create layer control
            const baseLayers = {
                "Street Map": primaryTiles,
                "Satellite": satelliteTiles
            };

            const overlayLayers = {
                "🌪️ Disaster Zones": this.layers.disasterZones,
                "🏥 Hospitals": this.layers.hospitals,
                "🚨 Active Emergencies": this.layers.emergencies
            };

            this.layerControl = L.control.layers(baseLayers, overlayLayers, {
                position: 'topleft',
                collapsed: false
            }).addTo(this.map);

            console.log('Layer control added');

            // Store reference for global access
            AppState.map = this.map;
            AppState.mapLayers = this.layers;
            AppState.layerControls = this.layerControl;
            AppState.mapInitialized = true;
            this.initialized = true;

            // Hide loading indicator
            if (mapLoading) {
                mapLoading.classList.add('hidden');
            }

            // Add map event handlers
            this.addMapEventHandlers();

            // Show success notification
            notifications.show('Interactive map loaded successfully with all disaster zones, hospitals, and emergency markers!', 'success');

            console.log('Map initialization completed successfully');

            // Force a map resize to ensure proper display
            setTimeout(() => {
                this.map.invalidateSize();
            }, 100);

        } catch (error) {
            console.error('Map initialization failed:', error);
            notifications.show(`Map failed to load: ${error.message}. Please refresh and try again.`, 'error');
            
            // Hide loading indicator
            const mapLoading = document.getElementById('mapLoading');
            if (mapLoading) {
                mapLoading.classList.add('hidden');
            }
        }
    }

    async createDisasterZones() {
        try {
            console.log(`Creating ${MapData.disasterZones.length} disaster zones...`);
            
            MapData.disasterZones.forEach((zone, index) => {
                console.log(`Creating disaster zone ${index + 1}: ${zone.type} in`, zone.location);
                
                // Create circle for disaster zone
                const circle = L.circle([zone.location.lat, zone.location.lng], {
                    radius: zone.radius,
                    fillColor: zone.color,
                    color: zone.color,
                    weight: 3,
                    opacity: 0.8,
                    fillOpacity: 0.3
                });

                // Create popup content
                const popupContent = `
                    <div class="disaster-popup">
                        <h4>${this.getDisasterIcon(zone.type)} ${zone.type.charAt(0).toUpperCase() + zone.type.slice(1)} Risk Zone</h4>
                        <div class="risk-level ${zone.severity}">${zone.severity.toUpperCase()} RISK</div>
                        <p><strong>Probability:</strong> ${zone.probability}%</p>
                        <p><strong>Timeframe:</strong> ${zone.timeframe}</p>
                        <p><strong>Affected Population:</strong> ${zone.affectedPopulation.toLocaleString()}</p>
                        <p><strong>Description:</strong> ${zone.description}</p>
                        <div class="recommendations">
                            <strong>Recommendations:</strong>
                            <ul>
                                ${zone.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `;

                // Bind popup with options
                circle.bindPopup(popupContent, {
                    maxWidth: 300,
                    closeButton: true,
                    autoClose: false,
                    closeOnClick: false
                });
                
                // Add click event for debugging
                circle.on('click', (e) => {
                    console.log('Disaster zone clicked:', zone.type, zone.location);
                });
                
                // Add to disaster zones layer
                this.layers.disasterZones.addLayer(circle);
                console.log(`Disaster zone ${index + 1} added successfully`);
            });
            
            console.log('All disaster zones created successfully');
        } catch (error) {
            console.error('Error creating disaster zones:', error);
            throw error;
        }
    }

    async createHospitalMarkers() {
        try {
            console.log(`Creating ${MapData.hospitals.length} hospital markers...`);
            
            MapData.hospitals.forEach((hospital, index) => {
                console.log(`Creating hospital marker ${index + 1}: ${hospital.name}`);
                
                // Create custom hospital icon
                const hospitalIcon = L.divIcon({
                    html: '<div style="background: white; border-radius: 50%; padding: 5px; border: 2px solid #e74c3c; font-size: 16px;">🏥</div>',
                    iconSize: [32, 32],
                    className: 'custom-hospital-icon',
                    iconAnchor: [16, 16]
                });

                const marker = L.marker([hospital.location.lat, hospital.location.lng], {
                    icon: hospitalIcon
                });

                // Create popup content
                const popupContent = `
                    <div class="hospital-popup">
                        <h4>🏥 ${hospital.name}</h4>
                        <div class="hospital-type">${hospital.type}</div>
                        <p><strong>City:</strong> ${hospital.city}</p>
                        <p><strong>Contact:</strong> ${hospital.contact}</p>
                        <div class="beds-info">
                            <div class="bed-stat">
                                <span class="number">${hospital.beds.available}</span>
                                <span class="label">Available</span>
                            </div>
                            <div class="bed-stat">
                                <span class="number">${hospital.beds.icu}</span>
                                <span class="label">ICU</span>
                            </div>
                            <div class="bed-stat">
                                <span class="number">${hospital.beds.emergency}</span>
                                <span class="label">Emergency</span>
                            </div>
                            <div class="bed-stat">
                                <span class="number">${hospital.beds.total}</span>
                                <span class="label">Total Beds</span>
                            </div>
                        </div>
                        <p><strong>Specialties:</strong> ${hospital.specialties.join(', ')}</p>
                    </div>
                `;

                // Bind popup
                marker.bindPopup(popupContent, {
                    maxWidth: 350,
                    closeButton: true,
                    autoClose: false,
                    closeOnClick: false
                });
                
                // Add click event for debugging
                marker.on('click', (e) => {
                    console.log('Hospital marker clicked:', hospital.name);
                });
                
                // Add to hospitals layer
                this.layers.hospitals.addLayer(marker);
                console.log(`Hospital marker ${index + 1} added successfully`);
            });
            
            console.log('All hospital markers created successfully');
        } catch (error) {
            console.error('Error creating hospital markers:', error);
            throw error;
        }
    }

    async createEmergencyMarkers() {
        try {
            console.log(`Creating ${MapData.activeEmergencies.length} emergency markers...`);
            
            MapData.activeEmergencies.forEach((emergency, index) => {
                console.log(`Creating emergency marker ${index + 1}: ${emergency.title}`);
                
                // Create emergency icon based on severity
                const iconHtml = emergency.severity === 'critical' ? 
                    '<div style="background: #e74c3c; color: white; border-radius: 50%; padding: 5px; font-size: 16px; animation: pulse 2s infinite;">🚨</div>' :
                    '<div style="background: #f39c12; color: white; border-radius: 50%; padding: 5px; font-size: 16px;">⚠️</div>';

                const emergencyIcon = L.divIcon({
                    html: iconHtml,
                    iconSize: [30, 30],
                    className: 'custom-emergency-icon',
                    iconAnchor: [15, 15]
                });

                const marker = L.marker([emergency.location.lat, emergency.location.lng], {
                    icon: emergencyIcon
                });

                // Create popup content
                const popupContent = `
                    <div class="emergency-popup">
                        <h4>${this.getDisasterIcon(emergency.type)} ${emergency.title}</h4>
                        <div class="severity ${emergency.severity}">${emergency.severity.toUpperCase()}</div>
                        <p><strong>Status:</strong> ${emergency.status}</p>
                        <p><strong>Affected Population:</strong> ${emergency.affectedPopulation.toLocaleString()}</p>
                        <div class="casualties-info">
                            <div class="casualty-stat">
                                <span class="number">${emergency.casualties.injured}</span>
                                <span class="label">Injured</span>
                            </div>
                            <div class="casualty-stat">
                                <span class="number">${emergency.casualties.missing}</span>
                                <span class="label">Missing</span>
                            </div>
                            <div class="casualty-stat">
                                <span class="number">${emergency.casualties.rescued}</span>
                                <span class="label">Rescued</span>
                            </div>
                        </div>
                    </div>
                `;

                // Bind popup
                marker.bindPopup(popupContent, {
                    maxWidth: 300,
                    closeButton: true,
                    autoClose: false,
                    closeOnClick: false
                });
                
                // Add click event for debugging
                marker.on('click', (e) => {
                    console.log('Emergency marker clicked:', emergency.title);
                });
                
                // Add to emergencies layer
                this.layers.emergencies.addLayer(marker);
                console.log(`Emergency marker ${index + 1} added successfully`);
            });
            
            console.log('All emergency markers created successfully');
        } catch (error) {
            console.error('Error creating emergency markers:', error);
            throw error;
        }
    }

    getDisasterIcon(type) {
        const icons = {
            flood: '🌊',
            earthquake: '🌍',
            cyclone: '🌀',
            drought: '🌵',
            wildfire: '🔥',
            tsunami: '🌊',
            landslide: '⛰️'
        };
        return icons[type] || '⚠️';
    }

    addMapEventHandlers() {
        if (!this.map) return;

        // Map click handler
        this.map.on('click', (e) => {
            console.log('Map clicked at:', e.latlng);
        });

        // Zoom event handlers
        this.map.on('zoomend', () => {
            const zoom = this.map.getZoom();
            console.log('Map zoom level:', zoom);
        });

        // Layer visibility change handlers
        this.map.on('overlayadd', (e) => {
            notifications.show(`${e.name} layer enabled`, 'info', 2000);
        });

        this.map.on('overlayremove', (e) => {
            notifications.show(`${e.name} layer disabled`, 'info', 2000);
        });

        // Popup events
        this.map.on('popupopen', (e) => {
            console.log('Popup opened');
        });

        this.map.on('popupclose', (e) => {
            console.log('Popup closed');
        });
    }

    refreshMapData() {
        if (!this.initialized) {
            notifications.show('Map not initialized yet', 'warning');
            return;
        }

        // Simulate data refresh
        notifications.show('Refreshing map data...', 'info', 2000);
        
        // Add some animation to existing markers
        setTimeout(() => {
            // Update disaster zone probabilities (simulation)
            MapData.disasterZones.forEach((zone, index) => {
                zone.probability = Math.min(100, zone.probability + Math.floor(Math.random() * 10 - 5));
            });
            
            // Force map redraw
            if (this.map) {
                this.map.invalidateSize();
            }
            
            notifications.show('Map data refreshed successfully!', 'success');
        }, 1500);
    }

    toggleLayers() {
        if (!this.initialized) {
            notifications.show('Map not initialized yet', 'warning');
            return;
        }

        const layers = [this.layers.disasterZones, this.layers.hospitals, this.layers.emergencies];
        
        layers.forEach((layer) => {
            if (this.map.hasLayer(layer)) {
                this.map.removeLayer(layer);
            } else {
                this.map.addLayer(layer);
            }
        });
        
        notifications.show('Map layers toggled', 'info', 2000);
    }
}

// Initialize map instance
const disasterMap = new DisasterMap();

// Tab Navigation
function initializeTabNavigation() {
    const tabButtons = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTab = button.dataset.tab;
            
            // Remove active class from all tabs and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            button.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            AppState.currentTab = targetTab;
            
            // Initialize tab-specific functionality
            switch(targetTab) {
                case 'dashboard':
                    // Reinitialize map if needed
                    if (!AppState.mapInitialized && document.getElementById('interactiveMap')) {
                        setTimeout(() => disasterMap.initializeMap(), 100);
                    } else if (AppState.map) {
                        // Refresh existing map
                        setTimeout(() => AppState.map.invalidateSize(), 100);
                    }
                    break;
                case 'predictions':
                    setTimeout(() => initializeSeasonalChart(), 200);
                    break;
                case 'resources':
                    setTimeout(() => initializeSupplyChart(), 200);
                    break;
                case 'analytics':
                    setTimeout(() => {
                        initializeTrendsChart();
                        initializeRegionalChart();
                    }, 200);
                    break;
            }
        });
    });
}

// Real-time Data Updates
function updateRealTimeData() {
    // Update seismic activity
    const seismicValue = (Math.random() * 2 + 3.5).toFixed(1);
    const seismicProgress = (seismicValue / 7.0) * 100;
    const seismicValueElement = document.getElementById('seismicValue');
    const seismicProgressElement = document.getElementById('seismicProgress');
    
    if (seismicValueElement) seismicValueElement.textContent = seismicValue;
    if (seismicProgressElement) seismicProgressElement.style.width = `${seismicProgress}%`;

    // Update weather index
    const weatherValue = Math.floor(Math.random() * 20 + 65);
    const weatherProgress = (weatherValue / 100) * 100;
    const weatherValueElement = document.getElementById('weatherValue');
    const weatherProgressElement = document.getElementById('weatherProgress');
    
    if (weatherValueElement) weatherValueElement.textContent = weatherValue;
    if (weatherProgressElement) weatherProgressElement.style.width = `${weatherProgress}%`;

    // Update population at risk
    const populationValue = Math.floor(Math.random() * 5000 + 10000);
    const populationValueElement = document.getElementById('populationValue');
    if (populationValueElement) populationValueElement.textContent = populationValue.toLocaleString();

    // Update response time
    const responseValue = (Math.random() * 2 + 2.5).toFixed(1);
    const responseProgress = ((5.0 - responseValue) / 5.0) * 100;
    const responseValueElement = document.getElementById('responseValue');
    const responseProgressElement = document.getElementById('responseProgress');
    
    if (responseValueElement) responseValueElement.textContent = responseValue;
    if (responseProgressElement) responseProgressElement.style.width = `${responseProgress}%`;

    // Update status bar
    const activeAlertsElement = document.getElementById('activeAlerts');
    if (activeAlertsElement) activeAlertsElement.textContent = Math.floor(Math.random() * 3 + 1);
    
    const riskLevels = ['Low', 'Moderate', 'High'];
    const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
    const riskElement = document.getElementById('riskLevel');
    if (riskElement) {
        riskElement.textContent = riskLevel;
        riskElement.className = `status-value status--${riskLevel.toLowerCase() === 'high' ? 'error' : riskLevel.toLowerCase() === 'moderate' ? 'warning' : 'success'}`;
    }

    // Update last update timestamp
    const lastUpdateElement = document.getElementById('lastUpdate');
    if (lastUpdateElement) lastUpdateElement.textContent = new Date().toLocaleTimeString();
}

function startRealTimeUpdates() {
    updateRealTimeData(); // Initial update
    AppState.realTimeInterval = setInterval(updateRealTimeData, 30000); // Update every 30 seconds
}

// Risk Analysis Form
function initializeRiskAnalysisForm() {
    const form = document.getElementById('riskAnalysisForm');
    const buildingStandardsSlider = document.getElementById('buildingStandards');
    const economicIndexSlider = document.getElementById('economicIndex');
    
    if (!form || !buildingStandardsSlider || !economicIndexSlider) return;
    
    // Update slider values display
    buildingStandardsSlider.addEventListener('input', (e) => {
        const valueElement = document.getElementById('buildingStandardsValue');
        if (valueElement) valueElement.textContent = e.target.value;
    });
    
    economicIndexSlider.addEventListener('input', (e) => {
        const valueElement = document.getElementById('economicIndexValue');
        if (valueElement) valueElement.textContent = e.target.value;
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        runRiskAnalysis();
    });
}

function runRiskAnalysis() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const analyzeText = document.getElementById('analyzeText');
    const analyzeLoading = document.getElementById('analyzeLoading');
    const resultsContent = document.getElementById('resultsContent');

    if (!analyzeBtn || !analyzeText || !analyzeLoading || !resultsContent) return;

    // Show loading state
    analyzeText.classList.add('hidden');
    analyzeLoading.classList.remove('hidden');
    analyzeBtn.disabled = true;

    // Get form data
    const formData = {
        coordinates: document.getElementById('citySelect')?.value,
        hazardType: document.getElementById('hazardType')?.value,
        populationDensity: document.getElementById('populationDensity')?.value,
        infrastructureAge: document.getElementById('infrastructureAge')?.value,
        buildingStandards: document.getElementById('buildingStandards')?.value,
        economicIndex: document.getElementById('economicIndex')?.value,
        responseCapacity: document.getElementById('responseCapacity')?.value,
        historicalFrequency: document.getElementById('historicalFrequency')?.value
    };

    // Simulate analysis delay
    setTimeout(() => {
        const results = generateRiskAnalysisResults(formData);
        displayRiskAnalysisResults(results);

        // Hide loading state
        analyzeText.classList.remove('hidden');
        analyzeLoading.classList.add('hidden');
        analyzeBtn.disabled = false;

        notifications.show('Risk analysis completed successfully!', 'success');
    }, 2000);
}

function generateRiskAnalysisResults(formData) {
    // Calculate risk factors
    const baseRisk = Math.random() * 0.5 + 0.3;
    const populationFactor = Math.min(formData.populationDensity / 50000, 1);
    const infrastructureFactor = Math.min(formData.infrastructureAge / 50, 1);
    const buildingFactor = (10 - formData.buildingStandards) / 10;
    const economicFactor = (100 - formData.economicIndex) / 100;
    const historyFactor = Math.min(formData.historicalFrequency / 10, 1);

    const overallRisk = (baseRisk + populationFactor * 0.2 + infrastructureFactor * 0.15 + 
                        buildingFactor * 0.15 + economicFactor * 0.1 + historyFactor * 0.2);

    const riskLevel = overallRisk > 0.7 ? 'high' : overallRisk > 0.4 ? 'medium' : 'low';
    const confidence = Math.floor(Math.random() * 15 + 85);

    return {
        overallRisk: Math.min(overallRisk, 1),
        riskLevel,
        confidence,
        hazardType: formData.hazardType,
        recommendations: generateRecommendations(riskLevel, formData.hazardType)
    };
}

function generateRecommendations(riskLevel, hazardType) {
    const recommendations = {
        high: [
            'Immediate evacuation protocols should be activated',
            'Emergency services should be on high alert',
            'Public warning systems must be activated',
            'Emergency shelters should be prepared'
        ],
        medium: [
            'Increase monitoring and surveillance',
            'Prepare emergency response teams',
            'Issue public advisories',
            'Review evacuation routes'
        ],
        low: [
            'Continue routine monitoring',
            'Maintain emergency preparedness',
            'Regular system checks',
            'Community awareness programs'
        ]
    };

    return recommendations[riskLevel] || recommendations.medium;
}

function displayRiskAnalysisResults(results) {
    const resultsContent = document.getElementById('resultsContent');
    
    if (!resultsContent) return;
    
    resultsContent.innerHTML = `
        <div class="results-grid">
            <div class="result-item">
                <h4>Overall Risk Assessment</h4>
                <div class="risk-meter">
                    <div class="progress-bar">
                        <div class="progress-fill ${results.riskLevel === 'high' ? 'error' : results.riskLevel === 'medium' ? 'warning' : 'success'}" 
                             style="width: ${results.overallRisk * 100}%"></div>
                    </div>
                    <span class="risk-level ${results.riskLevel}">${results.riskLevel.toUpperCase()}</span>
                </div>
                <p>Risk Score: ${(results.overallRisk * 100).toFixed(1)}%</p>
                <p>Confidence: ${results.confidence}%</p>
            </div>
            <div class="result-item">
                <h4>AI Recommendations</h4>
                <ul style="margin: 0; padding-left: 20px;">
                    ${results.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
            <div class="result-item">
                <h4>Emergency Protocols</h4>
                <p>For ${results.hazardType} events in this area:</p>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>Activate early warning systems</li>
                    <li>Deploy emergency response teams</li>
                    <li>Establish communication channels</li>
                    <li>Coordinate with local authorities</li>
                </ul>
            </div>
        </div>
    `;
}

// Chart Initialization Functions
function initializeSeasonalChart() {
    if (AppState.charts.seasonal) {
        AppState.charts.seasonal.destroy();
    }

    const ctx = document.getElementById('seasonalChart');
    if (!ctx) return;

    AppState.charts.seasonal = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
                {
                    label: 'Flood Risk',
                    data: [20, 25, 30, 35, 45, 75, 85, 80, 70, 40, 30, 25],
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Cyclone Risk',
                    data: [15, 10, 20, 45, 55, 30, 20, 25, 35, 65, 70, 40],
                    borderColor: '#FFC185',
                    backgroundColor: 'rgba(255, 193, 133, 0.1)',
                    tension: 0.4,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim()
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim()
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim()
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim()
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim()
                    }
                }
            }
        }
    });
}

function initializeSupplyChart() {
    if (AppState.charts.supply) {
        AppState.charts.supply.destroy();
    }

    const ctx = document.getElementById('supplyChart');
    if (!ctx) return;

    AppState.charts.supply = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Medical Supplies', 'Food & Water', 'Shelter Materials', 'Communication Equipment'],
            datasets: [{
                data: [25, 35, 20, 20],
                backgroundColor: ['#1FB8CD', '#FFC185', '#B4413C', '#5D878F'],
                borderWidth: 2,
                borderColor: getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim()
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim(),
                        padding: 15
                    }
                }
            }
        }
    });
}

function initializeTrendsChart() {
    if (AppState.charts.trends) {
        AppState.charts.trends.destroy();
    }

    const ctx = document.getElementById('trendsChart');
    if (!ctx) return;

    AppState.charts.trends = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['2019', '2020', '2021', '2022', '2023', '2024'],
            datasets: [
                {
                    label: 'Floods',
                    data: [12, 8, 15, 11, 18, 14],
                    backgroundColor: '#1FB8CD'
                },
                {
                    label: 'Cyclones',
                    data: [4, 6, 3, 7, 5, 8],
                    backgroundColor: '#FFC185'
                },
                {
                    label: 'Earthquakes',
                    data: [2, 1, 3, 2, 4, 2],
                    backgroundColor: '#B4413C'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim()
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim()
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim()
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim()
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim()
                    }
                }
            }
        }
    });
}

function initializeRegionalChart() {
    if (AppState.charts.regional) {
        AppState.charts.regional.destroy();
    }

    const ctx = document.getElementById('regionalChart');
    if (!ctx) return;

    AppState.charts.regional = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Bangalore'],
            datasets: [{
                label: 'Risk Index',
                data: [85, 65, 78, 72, 45],
                backgroundColor: 'rgba(31, 184, 205, 0.2)',
                borderColor: '#1FB8CD',
                borderWidth: 2,
                pointBackgroundColor: '#1FB8CD',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim()
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text-secondary').trim()
                    },
                    grid: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-border').trim()
                    },
                    pointLabels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim()
                    }
                }
            }
        }
    });
}

// Response Center Features
function initializeResponseCenter() {
    const alertForm = document.getElementById('alertForm');
    const messageInput = document.getElementById('messageInput');
    const sendMessageBtn = document.getElementById('sendMessage');

    if (!alertForm || !messageInput || !sendMessageBtn) return;

    // Alert form submission
    alertForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const alertTypeElement = document.getElementById('alertType');
        const affectedAreaElement = document.getElementById('affectedArea');
        const messageElement = document.getElementById('alertMessage');
        
        if (!alertTypeElement || !affectedAreaElement || !messageElement) return;
        
        const alertType = alertTypeElement.value;
        const affectedArea = affectedAreaElement.value;
        const message = messageElement.value;

        if (message.trim()) {
            notifications.show(`${alertType.toUpperCase()} alert sent to ${affectedArea}`, 'success');
            alertForm.reset();
        }
    });

    // Message sending
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            addMessage(message, 'outgoing', 'Central Command');
            messageInput.value = '';
            
            // Simulate response after delay
            setTimeout(() => {
                const responses = [
                    'Message received and acknowledged.',
                    'Executing orders immediately.',
                    'Status update: Operation in progress.',
                    'Additional resources requested.'
                ];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                addMessage(randomResponse, 'incoming', 'Field Team');
            }, 1000 + Math.random() * 2000);
        }
    }

    sendMessageBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
}

function addMessage(content, type, sender) {
    const commMessages = document.getElementById('commMessages');
    if (!commMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `
        <span class="sender">${sender}</span>
        <span class="content">${content}</span>
        <span class="timestamp">${new Date().toLocaleTimeString()}</span>
    `;
    
    commMessages.appendChild(messageDiv);
    commMessages.scrollTop = commMessages.scrollHeight;
}

// Map Controls
function initializeMapControls() {
    const refreshBtn = document.getElementById('refreshData');
    const toggleLayersBtn = document.getElementById('toggleLayers');

    if (!refreshBtn || !toggleLayersBtn) return;

    refreshBtn.addEventListener('click', () => {
        refreshBtn.classList.add('loading');
        if (disasterMap) {
            disasterMap.refreshMapData();
        }
        setTimeout(() => {
            refreshBtn.classList.remove('loading');
        }, 1500);
    });

    toggleLayersBtn.addEventListener('click', () => {
        if (disasterMap) {
            disasterMap.toggleLayers();
        }
    });
}

// Initialize Application
function initializeApp() {
    console.log('Initializing Disaster Management System...');
    
    // Initialize core features
    initializeTabNavigation();
    initializeRiskAnalysisForm();
    initializeResponseCenter();
    initializeMapControls();
    
    // Start real-time updates
    startRealTimeUpdates();
    
    // Initialize map when DOM is ready with error handling
    setTimeout(() => {
        const mapContainer = document.getElementById('interactiveMap');
        if (mapContainer) {
            console.log('Map container found, initializing map...');
            disasterMap.initializeMap().catch(error => {
                console.error('Failed to initialize map:', error);
                notifications.show('Failed to initialize map. Please refresh the page.', 'error');
            });
        } else {
            console.warn('Map container not found');
        }
    }, 1000);

    // Show welcome notification
    setTimeout(() => {
        notifications.show('Disaster Management AI System initialized successfully!', 'success');
    }, 1500);

    console.log('System ready!');
}

// Cleanup function
function cleanup() {
    if (AppState.realTimeInterval) {
        clearInterval(AppState.realTimeInterval);
    }
    
    // Destroy all charts
    Object.values(AppState.charts).forEach(chart => {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    });

    // Clean up map
    if (AppState.map) {
        AppState.map.remove();
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeApp);
window.addEventListener('beforeunload', cleanup);

// Handle visibility change to pause/resume updates
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        if (AppState.realTimeInterval) {
            clearInterval(AppState.realTimeInterval);
        }
    } else {
        startRealTimeUpdates();
    }
});

// Export for potential external usage
window.DisasterManagement = {
    notifications,
    updateRealTimeData,
    AppState,
    MapData,
    disasterMap
};