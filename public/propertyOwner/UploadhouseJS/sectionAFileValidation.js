// sectionAFileValidation.js
// Validation for image and video inputs in upload-house.html
(function(){
  const MAX_IMAGE_BYTES = 1 * 1024 * 1024; // 1MB
  const MAX_VIDEO_BYTES = 6 * 1024 * 1024; // 6MB

  function showMsg(id, text){
    const el = document.getElementById(id);
    if (!el) return;
    if (!text) { el.style.display = 'none'; el.textContent = ''; }
    else { el.style.display = 'block'; el.textContent = text; }
  }

  function validateImageInput(inputId, msgId){
    const inp = document.getElementById(inputId);
    const files = inp && inp.files && inp.files[0] ? inp.files : null;
    if (!files) {
      // if this is the first image field, require a file
      if (inputId === 'image1') {
        showMsg(msgId, 'Image 1 is required');
        return false;
      }
      showMsg(msgId, '');
      return true;
    }
    const file = files[0];
    if (!file.type.startsWith('image/')) { showMsg(msgId, 'Selected file is not an image'); return false; }
    if (file.size > MAX_IMAGE_BYTES) { showMsg(msgId, 'Image must be smaller than 1MB'); return false; }
    showMsg(msgId, '');
    // create preview
    createImagePreview(inputId, file);
    return true;
  }

  function validateVideoInput(){
    const inp = document.getElementById('video');
    if (!inp) return true;
    const file = inp.files && inp.files[0] ? inp.files[0] : null;
    if (!file) { showMsg('video_msg',''); return true; }
    if (!file.type.startsWith('video/')) { showMsg('video_msg','Selected file is not a video'); return false; }
    if (file.size > MAX_VIDEO_BYTES) { showMsg('video_msg','Video must be smaller than 6MB'); return false; }
    showMsg('video_msg','');
    return true;
  }

  function attachListeners(){
    ['image1','image2','image3'].forEach(id => {
      const inp = document.getElementById(id);
      if (!inp) return;
      inp.addEventListener('change', () => validateImageInput(id, id+'_msg'));
    });
    const vid = document.getElementById('video');
    if (vid) vid.addEventListener('change', validateVideoInput);

    const form = document.getElementById('uploadForm');
    if (form){
        form.addEventListener('submit', function(e){
        let ok1 = validateImageInput('image1','image1_msg');
        const ok2 = validateImageInput('image2','image2_msg');
        const ok3 = validateImageInput('image3','image3_msg');
          // image1 is required; validation above already warns but double-check
          if (!document.getElementById('image1').files.length) ok1 = false;
        const okv = validateVideoInput();
        if (!(ok1 && ok2 && ok3 && okv)) {
          e.preventDefault();
          e.stopPropagation();
          alert('Please fix the file size/type issues before submitting.');
          return false;
        }
        return true;
      });
    }
  }

  // Preview helpers
  function createImagePreview(inputId, file){
    const previewId = inputId + '_preview';
    const previewEl = document.getElementById(previewId);
    if (!previewEl) return;
    // clear previous
    previewEl.innerHTML = '';
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.style.cssText = 'max-width:120px; max-height:90px; object-fit:cover; border-radius:6px; border:1px solid rgba(0,0,0,0.06);';
    const info = document.createElement('div');
    info.style.cssText = 'display:flex; flex-direction:column; gap:6px; margin-left:8px;';
    const size = document.createElement('small');
    size.style.color = '#999';
    size.textContent = `${Math.round(file.size/1024)} KB`;
    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex; gap:6px;';
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = 'Remove';
    delBtn.style.cssText = 'background:#f44336;color:#fff;border:none;border-radius:4px;padding:4px 8px;cursor:pointer;';
    delBtn.addEventListener('click', () => removeImage(inputId));
    btnRow.appendChild(delBtn);
    info.appendChild(size);
    info.appendChild(btnRow);
    previewEl.style.display = 'flex';
    previewEl.appendChild(img);
    previewEl.appendChild(info);
  }

  function removeImage(inputId){
    const inp = document.getElementById(inputId);
    if (!inp) return;
    try { inp.value = ''; } catch(e){ /* some browsers */ }
    // revoke object URLs by clearing preview
    const previewEl = document.getElementById(inputId + '_preview');
    if (previewEl) { previewEl.innerHTML = ''; previewEl.style.display = 'none'; }
    // clear message
    showMsg(inputId + '_msg', '');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attachListeners);
  } else {
    attachListeners();
  }
})();
