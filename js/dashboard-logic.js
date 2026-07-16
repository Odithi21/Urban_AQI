// --- operational command logic controller ---
class DashboardLogic {
  constructor() {
    this.initPriorityResponse();
    this.initCitizenReporting();
  }

  // AI Simulation Projections
  updateSimulationResults(type, scale, x, y) {
    const card = document.getElementById('prediction-results-card');
    if (!card) return;

    // Simulate different metrics based on inputs
    const baseAqiRise = Math.round(scale * (type === 'factory' ? 45 : type === 'highway' ? 30 : 20));
    const targetAqi = 145 + baseAqiRise;
    
    let riskText = 'MODERATE';
    let riskColor = 'var(--color-moderate)';
    if (targetAqi > 250) {
      riskText = 'EXTREME ENVIRONMENTAL RISK';
      riskColor = 'var(--color-dangerous)';
    } else if (targetAqi > 180) {
      riskText = 'HIGH RISK';
      riskColor = 'var(--color-unhealthy)';
    }

    const popExposed = Math.round(scale * 12500);
    
    // Infrastructure counts based on location grid bounds
    const hospitals = x > 400 ? 2 : 0;
    const schools = y < 300 ? 3 : 1;
    const waterBodies = x < 300 ? 'Yes (Central Lake Basin)' : 'None';

    document.getElementById('sim-future-aqi').textContent = `${targetAqi} AQI`;
    
    const riskBadge = document.getElementById('sim-risk-badge');
    riskBadge.textContent = riskText;
    riskBadge.style.color = '#FFFFFF';
    riskBadge.style.backgroundColor = riskColor;

    document.getElementById('sim-pop-exposed').textContent = popExposed.toLocaleString();
    document.getElementById('sim-infra-hospitals').textContent = hospitals;
    document.getElementById('sim-infra-schools').textContent = schools;
    document.getElementById('sim-infra-water').textContent = waterBodies;

    // Explainable AI Reasoning Log
    let rationale = '';
    if (type === 'factory') {
      rationale = `Proposal coordinates place emissions within 500m of Residential blocks. Prevailing winds from the North-West will transport ${scale * 2.5} tons/day of sulfur oxide gas towards local school clinics. Stack filters are mandatory to limit this vector.`;
    } else if (type === 'highway') {
      rationale = `Opening a multi-lane highway corridor increases traffic volume by ~40%. Nitrogen oxides will accumulate along the Sector Road junction, resulting in localized AQI hikes of ${baseAqiRise} points.`;
    } else {
      rationale = `Mitigation works (diversions/water sprinkling) will successfully reduce dust accumulation by 25% within 4 hours. No significant long-term environmental hazards detected.`;
    }
    
    document.getElementById('sim-ai-reasoning').textContent = rationale;
    card.style.display = 'block';
  }

  // Priority response dispatcher
  initPriorityResponse() {
    const listContainer = document.getElementById('priority-response-list');
    if (!listContainer) return;

    listContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.dispatch-team-btn');
      if (!btn) return;

      const card = btn.closest('.priority-card');
      const statusLabel = card.querySelector('.priority-status');
      
      // Update label to Team Dispatched
      statusLabel.textContent = 'TEAM DISPATCHED';
      statusLabel.className = 'priority-status status-badge status-safe';
      
      btn.textContent = '⚡ In Progress';
      btn.disabled = true;
      btn.style.opacity = '0.7';
      btn.style.cursor = 'default';

      // Reduce total active hotspot counter slightly as simulation
      const countEl = document.getElementById('dash-hotspots-count');
      if (countEl) {
        let current = parseInt(countEl.textContent);
        if (current > 0) countEl.textContent = current - 1;
      }
    });
  }

  // Citizen Complaint submit triggers
  initCitizenReporting() {
    const form = document.getElementById('citizen-complaint-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const cat = document.getElementById('citizen-cat').value;
      const desc = document.getElementById('citizen-desc').value;
      
      if (!desc.trim()) {
        alert("Please write a short description of the pollution source.");
        return;
      }

      // Generate a mock complaint ID
      const compId = `AQI-REP-${Math.floor(100000 + Math.random() * 900000)}`;

      // Render new pin randomly in the city center area (Mock mapping coordinate selection)
      const randomX = Math.round(200 + Math.random() * 400);
      const randomY = Math.round(150 + Math.random() * 200);

      // Add to GIS map pins database
      if (window.gisMap) {
        window.gisMap.citizenComplaints.unshift({
          id: compId,
          cat: cat,
          x: randomX,
          y: randomY,
          desc: desc
        });
        window.gisMap.renderCitizenPins();
      }

      // Append to the UI list
      const feed = document.getElementById('citizen-reports-feed');
      const reportCard = document.createElement('div');
      reportCard.className = 'citizen-report-card';
      reportCard.innerHTML = `
        <div class="citizen-report-header">
          <h4>${cat}</h4>
          <span class="status-badge status-unhealthy">Under Review</span>
        </div>
        <p class="citizen-report-desc">${desc}</p>
        <div class="citizen-report-meta">
          <span>ID: ${compId}</span> | <span>Location Pin: (${randomX}, ${randomY})</span> | <span>Time: Just Now</span>
        </div>
      `;
      feed.insertBefore(reportCard, feed.firstChild);

      // Clear input fields
      form.reset();
      
      // Update Active citizen report counter card
      const countEl = document.getElementById('dash-reports-count');
      if (countEl) {
        let current = parseInt(countEl.textContent);
        countEl.textContent = current + 1;
      }

      alert(`Report Submitted Successfully.\nComplaint ID: ${compId} has been logged in the system. An inspector is being scheduled for verification.`);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.dashboardLogic = new DashboardLogic();
});
