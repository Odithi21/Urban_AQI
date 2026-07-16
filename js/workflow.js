document.addEventListener('DOMContentLoaded', () => {
  // Workflow Interactive Elements
  const layers = document.querySelectorAll('.workflow-layer');
  const agents = document.querySelectorAll('.agent-node');

  const detailsPanel = document.getElementById('details-panel');
  const detailsHeaderNum = document.getElementById('details-layer-num');
  const detailsTitle = document.getElementById('details-title');
  const detailsDesc = document.getElementById('details-desc');
  const detailsTechContainer = document.getElementById('details-tech-container');

  // Interactive Content Map
  const workflowData = {
    'layer-1': {
      num: 'Layer 1: Ingestion Sources',
      title: 'Data Sources & Sensors',
      desc: 'Connects to a heterogeneous network of global, national, and local data sensors. Ingests high-fidelity real-time air quality, meteorological profiles, spatial features, and population demographics dynamically.',
      tech: ['OpenAQ', 'CPCB Sensors', 'IMD / Open-Meteo', 'Sentinel-5P', 'OpenStreetMap', 'WorldPop', 'GHSL']
    },
    'layer-2': {
      num: 'Layer 2: Ingestion & Storage',
      title: 'Python Pipeline & PostGIS',
      desc: 'Cleans, normalizes, and matches unstructured data arrays using high-performance Python pipelines. Geospatial indices are calculated and mapped, then committed to PostgreSQL database nodes equipped with PostGIS.',
      tech: ['Python Data Pipeline', 'PostgreSQL', 'PostGIS', 'Cleaning & Quality Filters', 'Feature Engineering']
    },
    'layer-3': {
      num: 'Layer 3: Knowledge Store',
      title: 'RAG & Regulatory Vector Store',
      desc: 'Ingests policy guidelines, national ambient air quality standards (NAAQS), CPCB regulations, and legacy mitigation case studies. Vectorizes documents into local embeddings stores to support context-aware agent queries.',
      tech: ['RAG System', 'Chroma DB', 'FAISS', 'CPCB Guidelines', 'NAAQS Thresholds', 'Historical Case Studies']
    },
    'layer-4': {
      num: 'Layer 4: AI Orchestration',
      title: 'Multi-Agent LangGraph System',
      desc: 'A central orchestrator distributes intelligence targets to 5 autonomous agents. Click any individual agent node below to inspect its specialized objective and model properties.',
      tech: ['LangGraph', 'CrewAI', 'Orchestration Kernel', 'Agent Handshakes', 'Execution Graphs']
    },
    'layer-5': {
      num: 'Layer 5: Decision Support',
      title: 'Decision Support Engine',
      desc: 'Aggregates multi-agent suggestions, resolves conflicts, triggers urgent alert dispatches, and converts raw intelligence into localized administrative directives.',
      tech: ['Insight Aggregator', 'Action Engine', 'Alert Dispatches', 'Policy Recommendations']
    },
    'layer-6': {
      num: 'Layer 6: Applications',
      title: 'Visual Delivery Interfaces',
      desc: 'Publishes real-time findings to administrative control boards, citizen portal frameworks, and third-party developer networks through developer APIs.',
      tech: ['Admin Dashboard', 'Citizen Advisory App', 'Open REST APIs', 'Mapbox GL', 'React']
    },

    // Agent Nodes Content
    'agent-forecast': {
      num: 'AI Agent 1 / Layer 4',
      title: 'Forecasting Agent',
      desc: 'Predicts hyperlocal (ward-level) Air Quality Index values 24 to 72 hours in advance using spatial-temporal neural networks. Flags upcoming critical air states before they arise.',
      tech: ['Ward AQI Forecast', 'Spatio-Temporal GNN', 'Meteo Fusion', 'Confidence Scores']
    },
    'agent-attribution': {
      num: 'AI Agent 2 / Layer 4',
      title: 'Attribution Agent',
      desc: 'Identifies probable emission causes in real-time. Quantifies the percentage contribution of variables like traffic congestion, construction activities, and meteorological factors like wind speed.',
      tech: ['Source Attribution', 'Shapley Values', 'Traffic Density Analysis', 'Construction Footprints']
    },
    'agent-health': {
      num: 'AI Agent 3 / Layer 4',
      title: 'Health Risk Agent',
      desc: 'Performs exposure risk calculation for public groups. Analyzes local population density to estimate immediate health hazards, providing alerts and mask warnings.',
      tech: ['Exposure Analysis', 'Citizen Health Indices', 'Vulnerable Group Alerting']
    },
    'agent-enforcement': {
      num: 'AI Agent 4 / Layer 4',
      title: 'Enforcement Agent',
      desc: 'Ranks construction zones, industries, and road corridors to prioritize official inspections. Highlights zones where mitigation rules are likely violated.',
      tech: ['Inspection Optimization', 'Targeted Alerts', 'Resource Allocation Guides']
    },
    'agent-advisory': {
      num: 'AI Agent 5 / Layer 4',
      title: 'Advisory / XAI Agent',
      desc: 'Generates context-aware administrative recommendations and clear public warnings using natural language. Explains the logic behind every recommended action.',
      tech: ['Explainable AI (XAI)', 'Natural Language Advisory', 'Public Alerts Engine']
    }
  };

  // Update Detail Panel function
  function updateDetails(key) {
    const data = workflowData[key];
    if (!data) return;

    // Toggle styling depending on whether it is an AI node
    if (key.startsWith('agent') || key === 'layer-4') {
      detailsPanel.classList.add('panel-ai');
    } else {
      detailsPanel.classList.remove('panel-ai');
    }

    // Update text
    detailsHeaderNum.textContent = data.num;
    detailsTitle.textContent = data.title;
    detailsDesc.textContent = data.desc;

    // Update tech badges
    detailsTechContainer.innerHTML = '';
    data.tech.forEach(techName => {
      const badge = document.createElement('span');
      badge.className = 'details-tech-badge';
      badge.textContent = techName;
      detailsTechContainer.appendChild(badge);
    });
  }

  // Handle Layer clicks
  layers.forEach(layer => {
    layer.addEventListener('click', (e) => {
      // If we clicked on an agent node inside Layer 4, let that handler deal with it
      if (e.target.closest('.agent-node') || e.target.closest('.orchestrator-circle')) {
        return;
      }
      
      layers.forEach(l => l.classList.remove('active'));
      agents.forEach(a => a.classList.remove('active'));
      
      layer.classList.add('active');
      const layerId = layer.dataset.layerId;
      updateDetails(layerId);
    });
  });

  // Handle Agent clicks
  agents.forEach(agent => {
    agent.addEventListener('click', (e) => {
      e.stopPropagation(); // Avoid triggering Layer 4 click
      
      layers.forEach(l => l.classList.remove('active'));
      agents.forEach(a => a.classList.remove('active'));
      
      // Keep Layer 4 visual active
      const layer4 = document.querySelector('[data-layer-id="layer-4"]');
      if (layer4) layer4.classList.add('active');
      
      agent.classList.add('active');
      const agentId = agent.dataset.agentId;
      updateDetails(agentId);
    });
  });

  // Highlight Layer 1 on Load
  updateDetails('layer-1');
});
