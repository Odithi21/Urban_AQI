// --- GIS Map Operations Engine ---
class GISMap {
  constructor() {
    this.mapViewport = document.getElementById('map-viewport');
    this.mapGrid = document.getElementById('map-svg-grid');
    this.tooltip = document.getElementById('map-tooltip');
    
    // Zoom and Pan States
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startY = 0;
    
    // Simulation / Active Modes
    this.activeTab = 'dashboard';
    this.simulationMarker = null;
    this.simulationPlume = null;

    // Static coordinates update
    this.coordDisplay = document.getElementById('map-coords');

    this.hotspots = [
      {
        id: 'hotspot-1',
        name: 'Zone A - Industrial Corridor Block C',
        aqi: 360,
        severity: 'severe',
        icon: '☣',
        pollutant: 'PM2.5',
        population: '48,000',
        trend: 'Rising (+12% past hr)',
        updated: '5 mins ago',
        x: 350,
        y: 180,
        sources: [
          { name: 'Factory Emissions', pct: '62%', code: 'factory', desc: 'Active concrete kiln and industrial boilers.' },
          { name: 'Construction Dust', pct: '20%', code: 'construction', desc: 'Highway expansion and infrastructure building.' },
          { name: 'Open Dump Burning', pct: '18%', code: 'waste', desc: 'Combustion reports at landfill storage yard.' }
        ],
        infrastructure: [
          { name: 'Metro General Hospital', type: 'hospital' },
          { name: 'St. Mary Academy', type: 'school' },
          { name: 'Zone C Industrial Park', type: 'industrial' }
        ],
        recommendations: [
          { action: 'Shutdown coal boilers at Cement Kiln A', why: 'Kiln operations account for 62% of local PM2.5 emissions during low-wind nights.', improvement: '-90 AQI', time: 'Immediate', dept: 'State Pollution Control Board' },
          { action: 'Deploy continuous mist sprayers', why: 'Fugitive dust from road widening must be suppressed along construction zones.', improvement: '-25 AQI', time: '2 Hours', dept: 'Municipal Corporation' }
        ]
      },
      {
        id: 'hotspot-2',
        name: 'Zone B - Transit Terminal Intersection',
        aqi: 285,
        severity: 'dangerous',
        icon: '💀',
        pollutant: 'NO2',
        population: '72,000',
        trend: 'Stable',
        updated: '12 mins ago',
        x: 580,
        y: 420,
        sources: [
          { name: 'Vehicle Congestion', pct: '58%', code: 'vehicle', desc: 'Bottleneck of diesel trucks and inter-state buses.' },
          { name: 'Construction Dust', code: 'construction', pct: '22%', desc: 'Excavation work for the metro rail transit corridor.' },
          { name: 'Biomass Burning', pct: '20%', code: 'biomass', desc: 'Heating stoves at temporary worker quarters.' }
        ],
        infrastructure: [
          { name: 'City Pediatric Center', type: 'hospital' },
          { name: 'Model High School', type: 'school' },
          { name: 'Transit Interchange', type: 'road' }
        ],
        recommendations: [
          { action: 'Restrict trucks on Route 4 (7AM-10AM)', why: 'Congestion accounts for 58% of NO2 emissions in peak hours.', improvement: '-60 AQI', time: '1 Hour', dept: 'Traffic Department' },
          { action: 'Deploy mobile air vacuum units', why: 'Accelerates dust removal along construction corridors.', improvement: '-15 AQI', time: 'Immediate', dept: 'Municipal Corporation' }
        ]
      },
      {
        id: 'hotspot-3',
        name: 'Zone C - Central Market Plaza',
        aqi: 165,
        severity: 'unhealthy',
        icon: '⚠️',
        pollutant: 'PM10',
        population: '22,000',
        trend: 'Falling (-5% past hr)',
        updated: '30 mins ago',
        x: 250,
        y: 350,
        sources: [
          { name: 'Waste Burning', pct: '40%', code: 'waste', desc: 'Illegal burning of municipal waste and cardboard packaging.' },
          { name: 'Vehicle Congestion', pct: '35%', code: 'vehicle', desc: 'Commercial deliveries and public transport idling.' },
          { name: 'Biomass Burning', pct: '25%', code: 'biomass', desc: 'Commercial kitchen charcoal stoves.' }
        ],
        infrastructure: [
          { name: 'Central Maternity Home', type: 'hospital' },
          { name: 'Town Hall Elementary', type: 'school' }
        ],
        recommendations: [
          { action: 'Enforce waste segregation & penalty fine', why: 'Open fires from waste dumps account for 40% of surrounding PM10.', improvement: '-40 AQI', time: 'Immediate', dept: 'Municipal Corporation' },
          { action: 'Electrify commercial street kitchens', why: 'Charcoal stoves emit organic aerosols directly in shopping alleys.', improvement: '-25 AQI', time: '24 Hours', dept: 'Urban Development Department' }
        ]
      }
    ];

    this.citizenComplaints = [
      { id: 'comp-101', cat: 'Garbage burning', x: 220, y: 280, desc: 'Open waste burning behind Sector 4 school.' },
      { id: 'comp-102', cat: 'Construction dust', x: 500, y: 150, desc: 'Huge clouds of dust from commercial site.' }
    ];

    this.initMapEvents();
    this.renderHotspots();
    this.renderCitizenPins();
  }

  initMapEvents() {
    // Zoom wheel
    this.mapViewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = 0.1;
      if (e.deltaY < 0) {
        this.zoom = Math.min(this.zoom + zoomFactor, 4.0);
      } else {
        this.zoom = Math.max(this.zoom - zoomFactor, 0.7);
      }
      this.updateMapTransform();
    });

    // Panning drag
    this.mapViewport.addEventListener('mousedown', (e) => {
      if (e.target.closest('.map-hotspot-group') || e.target.closest('.map-ctrl-btn')) return;
      this.isDragging = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      this.mapGrid.style.transition = 'none';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      this.updateMapTransform();
      this.updateCoordinatesDisplay(e.clientX, e.clientY);
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      if (this.mapGrid) {
        this.mapGrid.style.transition = 'transform 0.1s ease-out';
      }
    });

    // Zoom Buttons
    document.getElementById('zoom-in').addEventListener('click', () => {
      this.zoom = Math.min(this.zoom + 0.3, 4.0);
      this.updateMapTransform();
    });

    document.getElementById('zoom-out').addEventListener('click', () => {
      this.zoom = Math.max(this.zoom - 0.3, 0.7);
      this.updateMapTransform();
    });

    // Track Location / GPS simulation
    document.getElementById('track-loc').addEventListener('click', () => {
      this.zoom = 1.6;
      this.panX = -100;
      this.panY = -80;
      this.updateMapTransform();
      alert("Centering Command Grid on user's current GPS location coordinates: 17.3850° N, 78.4867° E");
    });

    // Click Map triggers in AI Prediction Simulation
    this.mapViewport.addEventListener('click', (e) => {
      if (this.activeTab !== 'prediction') return;
      if (e.target.closest('.map-ctrl-btn') || e.target.closest('.map-hotspot-group')) return;

      const rect = this.mapGrid.getBoundingClientRect();
      // Calculate coordinates relative to SVG coordinate space
      const svgX = (e.clientX - rect.left) / this.zoom;
      const svgY = (e.clientY - rect.top) / this.zoom;

      if (svgX > 0 && svgX < 800 && svgY > 0 && svgY < 500) {
        this.triggerSimulationAt(svgX, svgY);
      }
    });
  }

  updateMapTransform() {
    this.mapGrid.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
  }

  updateCoordinatesDisplay(clientX, clientY) {
    const lat = (17.3850 + (clientY / 100000)).toFixed(6);
    const lng = (78.4867 + (clientX / 100000)).toFixed(6);
    this.coordDisplay.textContent = `LAT: ${lat}° N | LNG: ${lng}° E | ZOOM: ${this.zoom.toFixed(1)}x`;
  }

  renderHotspots() {
    // Clear old hotspot groups
    const container = document.getElementById('map-hotspots-layer');
    container.innerHTML = '';

    this.hotspots.forEach(hs => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'map-hotspot-group');
      g.setAttribute('data-id', hs.id);

      // Pulse ring animation
      const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      ring.setAttribute('class', 'map-hotspot-ring');
      ring.setAttribute('cx', hs.x);
      ring.setAttribute('cy', hs.y);
      ring.setAttribute('r', 16);
      ring.setAttribute('stroke', `var(--color-${hs.severity})`);
      g.appendChild(ring);

      // Core Solid Center
      const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      core.setAttribute('class', 'map-hotspot-core');
      core.setAttribute('cx', hs.x);
      core.setAttribute('cy', hs.y);
      core.setAttribute('r', 9);
      core.setAttribute('fill', `var(--color-${hs.severity})`);
      g.appendChild(core);

      // Warning text badge
      if (hs.icon) {
        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('class', 'map-warning-label');
        txt.setAttribute('x', hs.x);
        txt.setAttribute('y', hs.y);
        txt.textContent = hs.icon;
        g.appendChild(txt);
      }

      // Hover / Tooltip logic
      g.addEventListener('mouseenter', (e) => {
        this.tooltip.innerHTML = `
          <h4>${hs.name}</h4>
          <div><strong>AQI:</strong> ${hs.aqi} (${hs.pollutant})</div>
          <div><strong>Impact:</strong> ${hs.population} citizens</div>
          <div><strong>Trend:</strong> ${hs.trend}</div>
          <div style="font-size: 0.65rem; color: #94a3b8; margin-top:0.25rem;">Last update: ${hs.updated}</div>
        `;
        this.tooltip.style.display = 'flex';
        this.updateTooltipPos(e);
      });

      g.addEventListener('mousemove', (e) => {
        this.updateTooltipPos(e);
      });

      g.addEventListener('mouseleave', () => {
        this.tooltip.style.display = 'none';
      });

      // Click logic -> open slide panel
      g.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openHotspotDetails(hs);
      });

      container.appendChild(g);
    });
  }

  renderCitizenPins() {
    const container = document.getElementById('map-complaints-layer');
    container.innerHTML = '';

    this.citizenComplaints.forEach(pin => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'map-hotspot-group');
      
      const core = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      core.setAttribute('cx', pin.x);
      core.setAttribute('cy', pin.y);
      core.setAttribute('r', 6);
      core.setAttribute('fill', '#EF4444');
      core.setAttribute('stroke', '#FFFFFF');
      core.setAttribute('stroke-width', '1.5');
      g.appendChild(core);

      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('class', 'map-warning-label');
      txt.setAttribute('x', pin.x);
      txt.setAttribute('y', pin.y);
      txt.setAttribute('font-size', '6px');
      txt.textContent = '📢';
      g.appendChild(txt);

      g.addEventListener('mouseenter', (e) => {
        this.tooltip.innerHTML = `
          <h4>Citizen Report (Verified)</h4>
          <div><strong>Category:</strong> ${pin.cat}</div>
          <div style="max-width: 180px;">${pin.desc}</div>
        `;
        this.tooltip.style.display = 'flex';
        this.updateTooltipPos(e);
      });
      g.addEventListener('mousemove', (e) => this.updateTooltipPos(e));
      g.addEventListener('mouseleave', () => this.tooltip.style.display = 'none');

      container.appendChild(g);
    });
  }

  updateTooltipPos(e) {
    const rect = this.mapViewport.getBoundingClientRect();
    this.tooltip.style.left = `${e.clientX - rect.left + 15}px`;
    this.tooltip.style.top = `${e.clientY - rect.top + 15}px`;
  }

  openHotspotDetails(hs) {
    const panel = document.getElementById('selected-hotspot-panel');
    panel.querySelector('.hotspot-loc-name').textContent = hs.name;
    
    const aqiNode = panel.querySelector('.hotspot-aqi-badge');
    aqiNode.textContent = `AQI: ${hs.aqi}`;
    aqiNode.className = `hotspot-aqi-badge status-badge status-${hs.severity}`;
    
    panel.querySelector('.hotspot-pollutant').textContent = hs.pollutant;
    
    // Render Sources
    const sourcesBox = panel.querySelector('.hotspot-sources-list');
    sourcesBox.innerHTML = '';
    hs.sources.forEach(src => {
      const srcRow = document.createElement('div');
      srcRow.className = 'source-item';
      
      // Inline visual/icon matching the source code type
      let icon = '🏭'; // Factory default
      if (src.code === 'vehicle') icon = '🚛';
      if (src.code === 'construction') icon = '🏗️';
      if (src.code === 'waste') icon = '🗑️';
      if (src.code === 'biomass') icon = '🪵';
      
      srcRow.innerHTML = `
        <div class="source-item-thumb">
          <span style="font-size: 2.2rem;">${icon}</span>
        </div>
        <div class="source-item-detail">
          <h4>${src.name} (${src.pct})</h4>
          <p>${src.desc}</p>
        </div>
      `;
      sourcesBox.appendChild(srcRow);
    });

    // Render sensitive Infrastructure
    const infraBox = panel.querySelector('.hotspot-infra-grid');
    infraBox.innerHTML = '';
    hs.infrastructure.forEach(inf => {
      const item = document.createElement('div');
      item.className = 'sensitive-item';
      
      let badgeIcon = '🏢';
      if (inf.type === 'hospital') badgeIcon = '🏥';
      if (inf.type === 'school') badgeIcon = '🏫';
      if (inf.type === 'road') badgeIcon = '🛣️';
      
      item.innerHTML = `<span>${badgeIcon}</span> ${inf.name}`;
      infraBox.appendChild(item);
    });

    // Render AI Recommendations
    const recsBox = panel.querySelector('.hotspot-recs-list');
    recsBox.innerHTML = '';
    hs.recommendations.forEach(rec => {
      const recCard = document.createElement('div');
      recCard.className = 'ai-recommendation-card';
      recCard.innerHTML = `
        <h4>${rec.action}</h4>
        <p>${rec.why}</p>
        <div class="ai-rec-metrics">
          <div>Improvement: <span class="ai-rec-metric-val" style="color:var(--color-safe);">${rec.improvement}</span></div>
          <div>ETA: <span class="ai-rec-metric-val">${rec.time}</span></div>
        </div>
        <div style="font-size: 0.7rem; color: var(--color-text-muted); margin-top: 0.25rem;">Responsible: ${rec.dept}</div>
      `;
      recsBox.appendChild(recCard);
    });

    panel.classList.add('active');
  }

  handleTabSwitch(tabId) {
    this.activeTab = tabId;
    
    // Clear prediction drawings
    this.clearSimulation();

    // Toggle map overlay opacity/details depending on tabs
    const complaintsLayer = document.getElementById('map-complaints-layer');
    if (tabId === 'reports') {
      complaintsLayer.style.display = 'block';
    }

    const hotspotsLayer = document.getElementById('map-hotspots-layer');
    if (tabId === 'prediction') {
      // Prompt prediction hints
      alert("Simulation mode active. Click anywhere on the map to forecast the environmental impact of new industrial, infrastructural or highway proposals.");
    }
  }

  triggerSimulationAt(x, y) {
    this.clearSimulation();
    
    const simType = document.getElementById('sim-project-type').value;
    const simScale = document.getElementById('sim-project-scale').value;
    
    // Draw proposal pin
    const pin = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pin.setAttribute('cx', x);
    pin.setAttribute('cy', y);
    pin.setAttribute('r', 8);
    pin.setAttribute('fill', 'var(--color-accent-cyan)');
    pin.setAttribute('stroke', '#ffffff');
    pin.setAttribute('stroke-width', '2');
    pin.setAttribute('id', 'temp-sim-pin');
    document.getElementById('map-simulations-layer').appendChild(pin);
    this.simulationMarker = pin;

    // Draw projected pollution zone contours (Plume plume)
    const plume = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
    plume.setAttribute('cx', x + 50); // Wind offsets it
    plume.setAttribute('cy', y - 10);
    plume.setAttribute('rx', simScale * 25);
    plume.setAttribute('ry', simScale * 12);
    plume.setAttribute('transform', `rotate(-15, ${x}, ${y})`);
    plume.setAttribute('class', 'sim-overlay-plume');
    plume.setAttribute('fill', 'url(#sim-gradient)');
    plume.setAttribute('stroke', 'var(--color-dangerous)');
    plume.setAttribute('id', 'temp-sim-plume');
    document.getElementById('map-simulations-layer').appendChild(plume);
    this.simulationPlume = plume;

    // Update form/results panel
    if (window.dashboardLogic) {
      window.dashboardLogic.updateSimulationResults(simType, simScale, x, y);
    }
  }

  clearSimulation() {
    if (this.simulationMarker) {
      this.simulationMarker.remove();
      this.simulationMarker = null;
    }
    if (this.simulationPlume) {
      this.simulationPlume.remove();
      this.simulationPlume = null;
    }
    
    const resultsBox = document.getElementById('prediction-results-card');
    if (resultsBox) resultsBox.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.gisMap = new GISMap();
});
