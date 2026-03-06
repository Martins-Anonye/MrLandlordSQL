// sectionB.js - Amenities/Special Resources section

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const saveResBtn = document.getElementById('saveResourcesBtn');

  // disable resource save button until a house is created
  if (saveResBtn && !localStorage.getItem('lastHouseId')) {
    saveResBtn.disabled = true;
    saveResBtn.title = 'Upload the house first';
  }

  // Load amenity categories and render checkboxes
  async function loadResources() {
    try {
      const res = await fetch('/api/houses/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const categories = await res.json();
      const list = document.getElementById('resourcesList');
      list.innerHTML = '';
      if (!Array.isArray(categories) || categories.length === 0) {
        list.textContent = 'No special resources available at the moment.';
        return;
      }
      categories.forEach(cat => {
        const catDiv = document.createElement('div');
        catDiv.className = 'amenity-category';
        
        const title = document.createElement('h4');
        title.textContent = cat.name;
        catDiv.appendChild(title);
        
        const itemsDiv = document.createElement('div');
        itemsDiv.className = 'amenity-items';
        
        if (cat.items && cat.items.length > 0) {
          cat.items.forEach(item => {
            const label = document.createElement('label');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = item.id;
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(item.name));
            itemsDiv.appendChild(label);
          });
        }
        catDiv.appendChild(itemsDiv);
        list.appendChild(catDiv);
      });
    } catch (err) {
      console.error('Error loading resources:', err);
      const list = document.getElementById('resourcesList');
      if (list) list.textContent = 'Error loading resources: ' + err.message;
    }
  }

  // Save selected amenities to backend
  if (saveResBtn) {
    saveResBtn.addEventListener('click', async () => {
      // Check if house is selected from dropdown OR use lastHouseId as fallback
      const houseSelectB = document.getElementById('houseSelectB');
      let houseId = houseSelectB && houseSelectB.value ? houseSelectB.value : localStorage.getItem('lastHouseId');
      
      if (!houseId) return alert('Please select a house or upload the house first; amenities can be added after the house is created.');
      const selected = Array.from(document.querySelectorAll('#resourcesList input:checked')).map(cb => cb.value);
      try {
        const res = await fetch('/api/houses/resources', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ houseId: houseId, resources: selected })
        });
        const data = await res.json();
        alert(data.message || 'Resources saved');
        if (res.ok) {
          // optionally clear lastHouseId or navigate
        }
      } catch (err) {
        console.error('Failed to save resources', err);
        alert('Failed to save resources: ' + err.message);
      }
    });
  }

  // Load amenity list immediately (user may open panel later)
  loadResources();

  // when amenities panel is opened after initial load, ensure resources are populated
  const amenitiesPanel = document.querySelector('details:nth-of-type(2)');
  if (amenitiesPanel) {
    amenitiesPanel.addEventListener('toggle', (e) => {
      if (e.target.open) {
        const list = document.getElementById('resourcesList');
        if (list && list.children.length === 0) loadResources();
      }
    });
  }
});
