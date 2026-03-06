// sectionD.js - Map Location section with Google Maps integration

document.addEventListener('DOMContentLoaded', () => {
  // Google Maps interactive picker
  // NOTE: Replace YOUR_GOOGLE_MAPS_API_KEY with a valid API key
  let _map, _marker;

  function initMap() {
    const defaultCenter = { lat: 6.5244, lng: 3.3792 }; // Lagos default
    const latInput = document.getElementById('map_latitude');
    const lngInput = document.getElementById('map_longitude');
    const mapContainer = document.getElementById('mapContainer');
    if (!mapContainer) return;
    const lat = parseFloat(latInput?.value) || defaultCenter.lat;
    const lng = parseFloat(lngInput?.value) || defaultCenter.lng;
    _map = new google.maps.Map(mapContainer, {
      center: { lat, lng },
      zoom: 16,
      disableDefaultUI: false
    });
    _marker = new google.maps.Marker({
      position: { lat, lng },
      map: _map,
      draggable: true
    });

    // clicking on map sets marker and updates inputs
    _map.addListener('click', (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      _marker.setPosition({ lat, lng });
      if (latInput) latInput.value = lat.toFixed(6);
      if (lngInput) lngInput.value = lng.toFixed(6);
    });

    // dragging marker updates inputs
    _marker.addListener('dragend', (e) => {
      const pos = _marker.getPosition();
      if (!pos) return;
      const lat = pos.lat();
      const lng = pos.lng();
      if (latInput) latInput.value = lat.toFixed(6);
      if (lngInput) lngInput.value = lng.toFixed(6);
    });
  }

  function loadGoogleMaps() {
    if (window.google && window.google.maps) return initMap();
    const script = document.createElement('script');
    script.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&callback=initMap';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }

  // Map preview handler (button click to update map)
  const updateMapBtn = document.getElementById('updateMapBtn');
  if (updateMapBtn) {
    updateMapBtn.addEventListener('click', () => {
      const lat = parseFloat(document.getElementById('map_latitude')?.value);
      const lng = parseFloat(document.getElementById('map_longitude')?.value);
      if (isNaN(lat) || isNaN(lng)) {
        alert('Please enter valid latitude and longitude values');
        return;
      }
      if (window.google && window.google.maps && _map) {
        const pos = { lat, lng };
        _map.setCenter(pos);
        _marker.setPosition(pos);
      } else {
        // fallback: show embedded iframe
        const mapContainer = document.getElementById('mapContainer');
        const mapUrl = `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=18&amp;output=embed`;
        mapContainer.innerHTML = `<iframe width="100%" height="100%" style="border:none;border-radius:8px;" src="${mapUrl}"></iframe>`;
      }
    });
  }

  // Save map location handler
  const saveMapBtn = document.getElementById('saveMapBtn');
  if (saveMapBtn) {
    saveMapBtn.addEventListener('click', async () => {
      // Check if house is selected from dropdown OR use lastHouseId as fallback
      const houseSelectD = document.getElementById('houseSelectD');
      let houseId = houseSelectD && houseSelectD.value ? houseSelectD.value : localStorage.getItem('lastHouseId');
      
      if (!houseId) return alert('Please select a house or upload the house first; map location can be added after the house is created.');
      
      const lat = parseFloat(document.getElementById('map_latitude')?.value);
      const lng = parseFloat(document.getElementById('map_longitude')?.value);
      
      if (isNaN(lat) || isNaN(lng)) {
        alert('Please enter valid latitude and longitude values');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/houses/map-location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            houseId: houseId, 
            map_latitude: lat, 
            map_longitude: lng 
          })
        });
        const data = await res.json();
        alert(data.message || 'Map location saved');
        if (res.ok) {
          // optionally clear lastHouseId or navigate
        }
      } catch (err) {
        console.error('Failed to save map location', err);
        alert('Failed to save map location: ' + err.message);
      }
    });
  }

  // load Google Maps when section D is revealed
  const mapPanel = document.querySelector('details:nth-of-type(4)');
  if (mapPanel) {
    mapPanel.addEventListener('toggle', (e) => {
      if (e.target.open) {
        loadGoogleMaps();
      }
    });
  }
});
