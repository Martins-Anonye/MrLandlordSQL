// sectionC.js - Documents section (Terms, Lawyer, Tenancy)

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const saveDocsBtn = document.getElementById('saveDocsBtn');

  // Documents: Save handler (stores metadata to backend). We store summaries + filenames.
  if (saveDocsBtn) {
    saveDocsBtn.addEventListener('click', async () => {
      // Check if house is selected from dropdown OR use lastHouseId as fallback
      const houseSelectC = document.getElementById('houseSelectC');
      let houseId = houseSelectC && houseSelectC.value ? houseSelectC.value : localStorage.getItem('lastHouseId');
      
      if (!houseId) return alert('Please select a house or upload the house first; documents are linked to a house.');

      const form = new FormData();
      form.append('houseId', houseId);
      // append summaries
      form.append('terms_text', document.getElementById('terms_text').value || '');
      form.append('lawyer_text', document.getElementById('lawyer_text').value || '');
      form.append('tenancy_text', document.getElementById('tenancy_text').value || '');
      // append files if present
      const tf = document.getElementById('terms_file').files[0];
      if (tf) form.append('terms_file', tf);
      const lf = document.getElementById('lawyer_file').files[0];
      if (lf) form.append('lawyer_file', lf);
      const tf2 = document.getElementById('tenancy_file').files[0];
      if (tf2) form.append('tenancy_file', tf2);

      try {
        const res = await fetch('/api/houses/documents', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: form
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.message || res.statusText);
        alert('Documents saved');
      } catch (err) {
        console.error('Failed to save documents', err);
        alert('Failed to save documents: ' + err.message);
      }
    });
  }
});
