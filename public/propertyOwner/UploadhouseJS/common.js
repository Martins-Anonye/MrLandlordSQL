// common.js - Shared utilities, authentication, and timeline management

const token = localStorage.getItem('token');
if (!token) window.location.href = '/login';

// Timeline / progress indicator across Sections A/B/C/D
function initTimeline() {
  const timeline = document.createElement('div');
  timeline.id = 'progressTimeline';
  timeline.style.display = 'flex';
  timeline.style.gap = '8px';
  timeline.style.margin = '1rem 0';
  const sectionLabels = ['Upload Form', 'Amenities', 'Documents', 'Map Location'];
  ['A','B','C','D'].forEach((s,i) => {
    const step = document.createElement('div');
    step.className = 'timeline-step';
    step.dataset.step = String(i+1);
    step.textContent = `Step ${i+1}`;
    step.style.padding = '0.4rem 0.8rem';
    step.style.borderRadius = '20px';
    step.style.background = i===0 ? '#4a90e2' : '#e9edf3';
    step.style.color = i===0 ? '#fff' : '#333';
    step.style.cursor = 'pointer';
    step.title = sectionLabels[i]; // tooltip on hover
    // clicking a timeline step opens its corresponding details panel and closes others
    step.addEventListener('click', () => {
      const details = Array.from(document.querySelectorAll('details'));
      // close all except the target
      details.forEach((d, idx) => {
        d.open = (idx === i);
      });
      // scroll to the opened panel for better UX
      try { details[i].scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { /* ignore in old browsers */ }
      updateTimeline();
    });
    timeline.appendChild(step);
  });
  // insert timeline at top of container
  const containerEl = document.querySelector('.container');
  containerEl.insertBefore(timeline, containerEl.children[1]);
}

function updateTimeline() {
  const details = Array.from(document.querySelectorAll('details'));
  details.forEach((d, idx) => {
    const stepEl = document.querySelector(`.timeline-step[data-step="${idx+1}"]`);
    if (!stepEl) return;
    if (d.open) {
      stepEl.style.background = '#4a90e2';
      stepEl.style.color = '#fff';
    } else {
      stepEl.style.background = '#e9edf3';
      stepEl.style.color = '#333';
    }
  });
}

// listen for details toggle to refresh timeline
function attachTimelineListeners() {
  document.querySelectorAll('details').forEach(d => d.addEventListener('toggle', updateTimeline));
}

// Initialize timeline on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initTimeline();
    attachTimelineListeners();
    updateTimeline();
  });
} else {
  initTimeline();
  attachTimelineListeners();
  updateTimeline();
}
