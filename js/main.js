document.addEventListener('DOMContentLoaded', () => {
  // Navigation elements
  const navItems = document.querySelectorAll('.sidebar-nav-item');
  const panels = document.querySelectorAll('.ops-panel');
  const hotspotPanel = document.getElementById('selected-hotspot-panel');
  const closePanelBtn = document.getElementById('close-hotspot-panel');

  // Handle Tab Switch routing
  navItems.forEach(item => {
    const btn = item.querySelector('button');
    btn.addEventListener('click', () => {
      const targetPanelId = item.dataset.tab;
      
      // Update active nav item
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Update active operations panel
      panels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === `${targetPanelId}-panel`) {
          panel.classList.add('active');
        }
      });

      // Clear or adjust map focus depending on target panel
      if (window.gisMap) {
        window.gisMap.handleTabSwitch(targetPanelId);
      }

      // Close hotspot details slide-out on tab switch unless we are on Live AQI
      if (targetPanelId !== 'aqi' && targetPanelId !== 'solutions') {
        hotspotPanel.classList.remove('active');
      }
    });
  });

  // Hotspot Details Panel Close button
  if (closePanelBtn && hotspotPanel) {
    closePanelBtn.addEventListener('click', () => {
      hotspotPanel.classList.remove('active');
    });
  }
});
