// sectionA.js - Upload Form / House Details section

let nigerianLGAs = {}; // Global to store LGA data

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');

  // Load Nigerian LGAs JSON file
  fetch('/data/nigerian-lgas.json')
    .then(res => res.json())
    .then(data => {
      nigerianLGAs = data;
      // after JSON loads, fill the state dropdown including capitals
      const stateSelect = document.getElementById('state');
      if (stateSelect) {
        stateSelect.innerHTML = '<option value="">Select State</option>';
        Object.keys(nigerianLGAs.capitals || {}).forEach(state => {
          const capitalName = nigerianLGAs.capitals[state];
          const stOpt = document.createElement('option');
          stOpt.value = state;
          stOpt.textContent = state;
          stateSelect.appendChild(stOpt);
          const capOpt = document.createElement('option');
          capOpt.value = state + '||capital';
          capOpt.textContent = '  ' + capitalName + ' (capital)';
          capOpt.dataset.capital = capitalName;
          stateSelect.appendChild(capOpt);
        });
      }
    })
    .catch(err => console.error('Error loading LGAs:', err));

  // upload button triggers form submit
  document.getElementById('uploadButton').addEventListener('click', () => {
    const form = document.getElementById('uploadForm');
    if (form) form.requestSubmit();
  });

  // Handle state change to populate areas
  const stateSelect = document.getElementById('state');
  const areaSelect = document.getElementById('area');
  if (stateSelect && areaSelect) {
    stateSelect.addEventListener('change', (e) => {
      const raw = e.target.value;
      areaSelect.innerHTML = '<option value="">-- Select Area --</option>';
      if (raw) {
        if (raw.includes('||capital')) {
          const state = raw.split('||')[0];
          const capName = nigerianLGAs.capitals[state];
          // when capital selected, show popular streets instead of LGAs
          const list = (nigerianLGAs.capitalStreets && nigerianLGAs.capitalStreets[capName]) ? nigerianLGAs.capitalStreets[capName] : [];
          list.forEach(lga => {
            const option = document.createElement('option');
            option.value = lga;
            option.textContent = lga;
            areaSelect.appendChild(option);
          });
        } else {
          const list = nigerianLGAs[raw] || [];
          list.forEach(lga => {
            const option = document.createElement('option');
            option.value = lga;
            option.textContent = lga;
            areaSelect.appendChild(option);
          });
        }
      }
    });
  }

  // Load available slots
  function loadSlots() {
    fetch('/api/houses/landlord/purchased-house-slots', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          console.error(`Failed to load slots: HTTP ${res.status}`);
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(slots => {
        console.log('Loaded slots:', slots);
        const select = document.getElementById('slotSelect');
        select.innerHTML = '<option value="">Select Slot</option>';
        if (Array.isArray(slots) && slots.length > 0) {
          slots.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.purchased_slot_id;
            // include purchase date, expiry date, and remaining capacity
            const purchaseDate = new Date(slot.date_purchased).toLocaleDateString();
            const expiryDate = new Date(slot.expires_at).toLocaleDateString();
            option.textContent = `${slot.slot_title || slot.type} (Purchased: ${purchaseDate}, Expires: ${expiryDate}, ${slot.remaining_capacity} left)`;
            select.appendChild(option);
          });
        } else {
          const option = document.createElement('option');
          option.textContent = 'No slots with sufficient capacity';
          option.disabled = true;
          select.appendChild(option);
        }
      })
      .catch(err => {
        console.error('Error loading slots:', err);
        const select = document.getElementById('slotSelect');
        select.innerHTML = '<option value="">Error loading slots</option>';
      });
  }

  // Load landlord's houses for Sections B/C/D house selection
  function loadHouses(slotId) {
    // slotId is optional; if not provided, fetch all houses
    let url = '/api/houses/my-houses';
    if (slotId) {
      url += `?slot_id=${encodeURIComponent(slotId)}`;
    }
    
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          console.error(`Failed to load houses: HTTP ${res.status}`);
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(houses => {
        console.log('Loaded houses for slot:', slotId, houses);
        // Populate houseSelectB, houseSelectC, houseSelectD
        ['houseSelectB', 'houseSelectC', 'houseSelectD'].forEach(selectId => {
          const select = document.getElementById(selectId);
          if (select) {
            select.innerHTML = '<option value="">-- Select House --</option>';
            if (Array.isArray(houses) && houses.length > 0) {
              houses.forEach(house => {
                const option = document.createElement('option');
                option.value = house.id;
                option.textContent = `${house.title} (${house.state}${house.area ? ', ' + house.area : ''})`;
                select.appendChild(option);
              });
            } else if (slotId) {
              // If slot is selected but no houses found, show a message
              const option = document.createElement('option');
              option.disabled = true;
              option.textContent = 'No houses for this slot';
              select.appendChild(option);
            }
          }
        });
      })
      .catch(err => {
        console.error('Error loading houses:', err);
      });
  }

  // Load room sizes from backend
  function loadRoomSizes() {
    fetch('/api/houses/room-sizes')
      .then(res => {
        if (!res.ok) {
          console.error(`Failed to load room sizes: HTTP ${res.status}`);
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(sizes => {
        if (!Array.isArray(sizes) || sizes.length === 0) {
          console.warn('No room sizes returned');
          return;
        }
        const selects = document.querySelectorAll('select[data-room-size]');
        selects.forEach(select => {
          select.innerHTML = '<option value="">Select Size</option>';
          sizes.forEach(size => {
            const option = document.createElement('option');
            option.value = size.id;
            option.textContent = `${size.name} - ${size.size_text}`;
            select.appendChild(option);
          });
        });
      })
      .catch(err => console.error('Error loading room sizes:', err));
  }

  // Load tenant categories from backend
  function loadTenantCategories() {
    fetch('/api/houses/tenant-categories')
      .then(res => {
        if (!res.ok) {
          console.error(`Failed to load tenant categories: HTTP ${res.status}`);
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(categories => {
        if (!Array.isArray(categories) || categories.length === 0) {
          console.warn('No tenant categories available');
          const container = document.getElementById('tenantCategoryCheckboxes');
          if (container) container.innerHTML = '<p style="color: #999;">No tenant categories available</p>';
          return;
        }
        const container = document.getElementById('tenantCategoryCheckboxes');
        if (!container) return;
        container.innerHTML = '';
        let currentCard = null;
        categories.forEach((cat, idx) => {
          // create a new card for every 5 items
          if (idx % 5 === 0) {
            currentCard = document.createElement('div');
            // no background color as requested; keep subtle border and spacing
            currentCard.style.cssText = 'border:1px solid #e8e8e8; border-radius:8px; padding:0.75rem; min-width:260px; flex: 0 1 320px; display:flex; flex-direction:column; gap:0.5rem;';
            container.appendChild(currentCard);
          }

          const item = document.createElement('label');
          item.style.cssText = 'display:flex; align-items:center; gap:0.5rem; cursor:pointer; padding:0.4rem; border-radius:6px; transition: background 0.12s;';
          // use theme brand color for text
          item.innerHTML = `<input type="checkbox" value="${cat.id}" class="tenant-category-checkbox" data-name="${cat.name}"> <span style="flex:1;color:white">${cat.name}</span>`;
          item.onmouseenter = () => { item.style.background = 'rgba(74,144,226,0.04)'; };
          item.onmouseleave = () => { item.style.background = 'transparent'; };
          item.addEventListener('click', (e) => {
            if (e.target.tagName !== 'INPUT') {
              const cb = item.querySelector('input[type="checkbox"]');
              cb.checked = !cb.checked;
            }
          });

          if (currentCard) currentCard.appendChild(item);
        });
      })
      .catch(err => console.error('Error loading tenant categories:', err));
  }

  // Area type info button logic
  const infoBtn = document.getElementById('areaTypeInfoBtn');
  if (infoBtn) {
    infoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const areaTypeInfo = {
        'Urban': 'City or town areas with high population density, developed infrastructure, commercial establishments, and multiple services.',
        'Rural': 'Agricultural or countryside areas with low population density, farming activities, limited services, and natural surroundings.',
        'Suburban': 'Residential zones near cities, typically well-developed with homes, shops, and services (e.g., Lagos\' Lekki suburb). Suburban areas feel more established and organized with clear infrastructure planning.',
        'Peri-Urban': 'Transition zones between city and countryside, often less developed with a mix of agriculture, new houses and  new urban projects (e.g., fringes of Ibadan). These areas face both urban and rural challenges, with semi-developed land and ongoing development. They feel more in-between compared to established suburban areas.',
        'Remote': 'Isolated or far-flung areas with very low population density, limited access to services, and minimal infrastructure development.'
      };
      let message = 'Area Type Explanations:\n\n';
      for (const [type, description] of Object.entries(areaTypeInfo)) {
        message += `${type}:\n${description}\n\n`;
      }
      alert(message);
    });
  }

  // fetch bedroom options from slot services for houses (slot_id =1)
  const bedroomSelect = document.getElementById('numBedrooms');
  let houseServices = [];
  if (bedroomSelect) {
    fetch('/api/slot-services/landlord/slot/1', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) {
          console.error(`Failed to load house services: HTTP ${res.status}`);
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(services => {
        houseServices = services || [];
        // collect distinct number_of_rooms values
        const nums = [...new Set(houseServices.map(s => s.number_of_rooms).filter(n => n != null))];
        bedroomSelect.innerHTML = '<option value="">Select Bedrooms</option>';
        if (nums.length > 0) {
          nums.forEach(n => {
            const opt = document.createElement('option');
            opt.value = n;
            opt.textContent = n;
            bedroomSelect.appendChild(opt);
          });
        } else {
          const opt = document.createElement('option');
          opt.textContent = 'No options available';
          opt.disabled = true;
          bedroomSelect.appendChild(opt);
        }
        // recalc fee in case selections were already made
        updateTax();
        // render bedroom inputs when options loaded
        bedroomSelect.dispatchEvent(new Event('change'));
      })
      .catch(err => {
        console.error('Failed to load house services', err);
        bedroomSelect.innerHTML = '<option value="">Select Bedrooms</option>';
      });

    // update tax fee when bedroom or areaType changes
    bedroomSelect.addEventListener('change', () => {
      updateTax();
      filterAreaOptions();
      renderBedrooms(parseInt(bedroomSelect.value) || 0);
    });
    document.getElementById('areaType').addEventListener('change', updateTax);

    function updateTax() {
      const bedVal = bedroomSelect.value;
      const areaVal = document.getElementById('areaType').value;
      let fee = '';
      if (bedVal && areaVal) {
        const matching = houseServices.find(s => String(s.number_of_rooms) === bedVal && s.area_type === areaVal);
        fee = matching ? matching.tax : '';
      }
      const feeInput = document.getElementById('taxFee');
      const reloadBtn = document.getElementById('reloadFeeBtn');
      // always show reload button (it will simply re-run updateTax)
      if (reloadBtn) reloadBtn.style.display = 'inline-block';
      if (fee !== '') {
        feeInput.value = fee;
        feeInput.style.display = 'block';
      } else {
        feeInput.value = '';
        feeInput.style.display = 'none';
      }
    }

    // disable area type options that don't match selected bedroom count
    function filterAreaOptions() {
      const bedVal = bedroomSelect.value;
      const areaSelect = document.getElementById('areaType');
      Array.from(areaSelect.options).forEach(opt => {
        if (!opt.value) return; // keep placeholder
        if (bedVal) {
          const exists = houseServices.some(s => String(s.number_of_rooms) === bedVal && s.area_type === opt.value);
          opt.disabled = !exists;
        } else {
          opt.disabled = false;
        }
      });
    }

    // dynamically render bedroom groups
    function renderBedrooms(count) {
      const container = document.getElementById('bedroomsContainer');
      container.innerHTML = '';
      for (let i = 1; i <= count; i++) {
        const div = document.createElement('div');
        div.className = 'form-group';
        div.innerHTML = `
          <label><input type="checkbox" id="bedroom_${i}_available" checked> <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12v5h10v-5H7zm0-7v5h10V5H7z"/></svg>Bedroom ${i}</label>
              <label><input type="checkbox" id="bedroom_${i}_sitting"> <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 13c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2v4H4v-4zm2-6h12v3H6V7z"/></svg>stand as Sitting room (parlor)</label>
              <div>
                <label><input type="radio" name="bedroom_${i}_type" value="select" checked> Select size</label>
                <label><input type="radio" name="bedroom_${i}_type" value="custom"> Custom size</label>
              </div>
          <select id="bedroom_${i}_size" data-room-size style="display:block;"></select>
          <input type="text" id="bedroom_${i}_custom" placeholder="e.g. 200 sq ft" style="display:none;">
        `;
        container.appendChild(div);
        document.getElementById(`bedroom_${i}_available`).addEventListener('change', (e) => toggleSize(`bedroom_${i}_size`, e.target));
        // radio change for bedroom size type
        const radios = document.querySelectorAll(`input[name="bedroom_${i}_type"]`);
        radios.forEach(r => {
          r.addEventListener('change', (e) => {
            toggleType(e.target, `bedroom_${i}`);
          });
        });
      }
      loadRoomSizes();
    }
    // reload button handler
    const reloadBtn = document.getElementById('reloadFeeBtn');
    if (reloadBtn) {
      reloadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        updateTax();
      });
    }

    // dedicated payment account toggle
    const useDedEl = document.getElementById('useDedicatedAccount');
    const dedFields = document.getElementById('dedicatedAccountFields');
    if (useDedEl && dedFields) {
      useDedEl.addEventListener('change', (e) => {
        dedFields.style.display = e.target.checked ? 'block' : 'none';
      });
    }

    // lawyer in charge checkbox logic
    const lawyerChk = document.getElementById('lawyerInCharge');
    const lawyerFields = document.getElementById('lawyerContactFields');
    if (lawyerChk && lawyerFields) {
      lawyerChk.addEventListener('change', (e) => {
        lawyerFields.style.display = e.target.checked ? 'block' : 'none';
      });
    }
  }

    // agent in charge checkbox logic
    const agentChk = document.getElementById('agentInCharge');
    const agentFields = document.getElementById('agentContactFields');
    if (agentChk && agentFields) {
      agentChk.addEventListener('change', (e) => {
        agentFields.style.display = e.target.checked ? 'block' : 'none';
      });
    }

  // Room size and type toggles
  function toggleSize(selectId, checkbox) {
    const select = document.getElementById(selectId);
    const custom = document.getElementById(selectId.replace('_size', '_custom'));
    const radios = document.querySelectorAll(`input[name="${selectId.replace('_size', '_type')}"]`);
    select.disabled = !checkbox.checked;
    custom.disabled = !checkbox.checked;
    // also toggle sitting room checkbox if present
    const sitting = document.getElementById(selectId.replace('_size', '_sitting'));
    if (sitting) sitting.disabled = !checkbox.checked;
    if (!checkbox.checked) {
      select.style.display = 'none';
      custom.style.display = 'none';
      radios.forEach(r => r.disabled = true);
    } else {
      radios.forEach(r => r.disabled = false);
      const checkedRadio = document.querySelector(`input[name="${selectId.replace('_size', '_type')}"]:checked`);
      if (checkedRadio.value === 'select') {
        select.style.display = 'block';
        custom.style.display = 'none';
      } else {
        select.style.display = 'none';
        custom.style.display = 'block';
      }
    }
  }

  function toggleType(radio, room) {
    const select = document.getElementById(`${room}_size`);
    const custom = document.getElementById(`${room}_custom`);
    if (radio.value === 'select') {
      select.style.display = 'block';
      custom.style.display = 'none';
    } else {
      select.style.display = 'none';
      custom.style.display = 'block';
    }
  }

  // Living room removed; only wire kitchen and bathroom
  const kitchenAvail = document.getElementById('kitchen_available');
  if (kitchenAvail) kitchenAvail.addEventListener('change', (e) => toggleSize('kitchen_size', e.target));
  const bathroomAvail = document.getElementById('bathroom_available');
  if (bathroomAvail) bathroomAvail.addEventListener('change', (e) => toggleSize('bathroom_size', e.target));

  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      const room = e.target.name.replace('_type', '');
      toggleType(e.target, room);
    });
  });

  // Form submission handler
  document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const slotId = document.getElementById('slotSelect').value;
    if (!slotId) return alert('Select a slot');
    const formData = new FormData();
    formData.append('slot_id', slotId);
    formData.append('title', document.getElementById('title').value);
    formData.append('description', document.getElementById('description').value);
    formData.append('price', document.getElementById('price').value);
    formData.append('rent_period', document.getElementById('rentPeriod').value);
    // state dropdown may include capital entries encoded as "State||capital"; strip suffix
    let stateVal = document.getElementById('state').value;
    if (stateVal && stateVal.includes('||capital')) {
      stateVal = stateVal.split('||')[0];
    }
    formData.append('state', stateVal);
    formData.append('area', document.getElementById('area').value);
    formData.append('location', document.getElementById('location').value);
    // include new tax description fields from slot service
    formData.append('num_bedrooms', document.getElementById('numBedrooms').value);
    formData.append('area_type', document.getElementById('areaType').value);
    formData.append('tax_fee', document.getElementById('taxFee').value);
    const rooms = {};
    // collect bedrooms sizes
    const bedroomCount = parseInt(document.getElementById('numBedrooms').value) || 0;
    if (bedroomCount > 0) {
      rooms.bedrooms = [];
      for (let i = 1; i <= bedroomCount; i++) {
        const avail = document.getElementById(`bedroom_${i}_available`);
        if (avail && avail.checked) {
          const typeEl = document.querySelector(`input[name="bedroom_${i}_type"]:checked`);
          const type = typeEl ? typeEl.value : 'select';
          let sizeVal = '';
          if (type === 'select') {
            const sizeEl = document.getElementById(`bedroom_${i}_size`);
            sizeVal = sizeEl ? sizeEl.value : '';
          } else {
            const customEl = document.getElementById(`bedroom_${i}_custom`);
            sizeVal = customEl ? customEl.value : '';
          }
          const sitting = !!document.getElementById(`bedroom_${i}_sitting`)?.checked;
          rooms.bedrooms.push({ size: sizeVal, sitting });
        }
      }
    }
    // other fixed rooms (living room removed)
    const fixedRooms = ['kitchen'];
    fixedRooms.forEach(room => {
      const availEl = document.getElementById(`${room}_available`);
      if (!availEl) return;
      if (availEl.checked) {
        const typeEl = document.querySelector(`input[name="${room}_type"]:checked`);
        const type = typeEl ? typeEl.value : 'select';
        if (type === 'select') {
          const sizeEl = document.getElementById(`${room}_size`);
          rooms[room] = sizeEl ? sizeEl.value : '';
        } else {
          const customEl = document.getElementById(`${room}_custom`);
          rooms[room] = customEl ? customEl.value : '';
        }
      }
    });
    formData.append('rooms', JSON.stringify(rooms));
    formData.append('electricity', document.getElementById('electricity')?.value || '');
    formData.append('alternative_electricity', document.getElementById('alternative_electricity')?.value || '');
    formData.append('tenant_restrictions', document.getElementById('tenant_restrictions')?.value || '');
    
    // Collect selected tenant categories
    const tenantCategoryCheckboxes = document.querySelectorAll('.tenant-category-checkbox:checked');
    const selectedCategories = Array.from(tenantCategoryCheckboxes).map(cb => cb.getAttribute('data-name'));
    formData.append('tenant_categories', selectedCategories.length > 0 ? selectedCategories.join(',') : '');
    
    formData.append('additional_tenant_description', document.getElementById('additional_tenant_description')?.value || '');
    // handle dedicated payment account data
    const useDedicated = document.getElementById('useDedicatedAccount')?.checked;
    formData.append('use_dedicated_payment_account', useDedicated ? '1' : '0');
    if (useDedicated) {
      const dedInfo = {
        bank_name: document.getElementById('ded_bank_name')?.value || '',
        account_number: document.getElementById('ded_account_number')?.value || '',
        account_name: document.getElementById('ded_account_name')?.value || ''
      };
      formData.append('dedicated_payment_info', JSON.stringify(dedInfo));
    }
    // lawyer info: check if lawyer is in charge, then include contact details
    if (document.getElementById('lawyerInCharge')?.checked) {
      formData.append('lawyer_in_charge', '1');
      formData.append('lawyer_name', document.getElementById('lawyerName')?.value || '');
      formData.append('lawyer_phone', document.getElementById('lawyerPhone')?.value || '');
      formData.append('lawyer_email', document.getElementById('lawyerEmail')?.value || '');
    } else {
      formData.append('lawyer_in_charge', '0');
    }
    // agent info: check if agent is in charge, then include contact details and fee
    if (document.getElementById('agentInCharge')?.checked) {
      formData.append('agent_in_charge', '1');
      formData.append('agent_name', document.getElementById('agentName')?.value || '');
      formData.append('agent_phone', document.getElementById('agentPhone')?.value || '');
      formData.append('agent_email', document.getElementById('agentEmail')?.value || '');
      formData.append('agent_fee', document.getElementById('agentFee')?.value || '0');
      formData.append('pay_agent_by_cash', document.getElementById('payAgentByCash')?.checked ? '1' : '0');
      formData.append('agent_additional_info', document.getElementById('agentAdditionalInfo')?.value || '');
    } else {
      formData.append('agent_in_charge', '0');
      formData.append('agent_fee', '0');
    }
    formData.append('interior_quality', document.getElementById('interior_quality').value);
    formData.append('exterior_quality', document.getElementById('exterior_quality').value);
    const images = document.getElementById('images').files;
    for (let i = 0; i < images.length; i++) formData.append('images', images[i]);
    const videos = document.getElementById('videos').files;
    for (let i = 0; i < videos.length; i++) formData.append('videos', videos[i]);

    // append optional map coordinates if provided
    const latVal = document.getElementById('map_latitude')?.value;
    const lngVal = document.getElementById('map_longitude')?.value;
    if (latVal) formData.append('map_latitude', latVal);
    if (lngVal) formData.append('map_longitude', lngVal);

    const res = await fetch('/api/houses/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      localStorage.setItem('lastHouseId', data.houseId);
      // stay on current form and reveal amenities section for next step
      const saveResBtn = document.getElementById('saveResourcesBtn');
      const amenitiesPanel = document.querySelector('details:nth-of-type(2)');
      if (amenitiesPanel) {
        amenitiesPanel.open = true;
        updateTimeline();
        amenitiesPanel.scrollIntoView({ behavior: 'smooth' });
      }
      if (saveResBtn) {
        saveResBtn.disabled = false;
        saveResBtn.title = '';
      }
      // refresh slot list in case the capacity changed or the just-used slot
      loadSlots();
    } else {
      alert(data.error || data.message);
    }
  });

  loadSlots();
  loadHouses();
  loadRoomSizes();
  loadTenantCategories();
  loadGeneralPaymentInfo();

  // Listen for slot changes and reload house dropdowns
  const slotSelect = document.getElementById('slotSelect');
  if (slotSelect) {
    slotSelect.addEventListener('change', (e) => {
      const selectedSlotId = e.target.value;
      loadHouses(selectedSlotId);
    });
  }
});

// load landlord general payment info for display
function loadGeneralPaymentInfo() {
  fetch('/api/landlord/payment-info', { headers: { 'Authorization': `Bearer ${token}` } })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then(info => {
      const container = document.getElementById('dedicatedAccountFields');
      const heading = document.createElement('p');
      heading.style.fontSize = '0.9rem';
      heading.style.color = 'white';
      if (info && info.bank_name && info.account_number) {
        heading.textContent = `General account: ${info.bank_name} ${info.account_number} (${info.account_name || ''})`;
      } else {
        heading.textContent = 'No general payment account on file. You can set one in your dashboard.';
      }
      container.parentNode.insertBefore(heading, container);
    })
    .catch(err => console.error('Error loading landlord general payment info:', err));
}
