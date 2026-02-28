
// ========================================
// State
// ========================================
let testCases = TEST_CASES_DATA;
let hasUnsavedChanges = false;
let state = {
  runs: [],       // { id, date, tester, build, notes, results: { tcId: { status, comment } } }
  bugs: [],       // { id, title, tc, state, priority, description, date }
  activeRunId: null,
  nextBugId: 1
};

// ========================================
// Initialization
// ========================================
function init() {
  // Load state from localStorage (temporary working memory)
  const saved = localStorage.getItem('wna-regression-state');
  if (saved) {
    try {
      state = JSON.parse(saved);
      hasUnsavedChanges = true; // If there's data in localStorage, remind to export
    } catch (e) {
      console.error('Failed to parse saved state:', e);
    }
  }

  // Warn before closing if there's data
  window.addEventListener('beforeunload', function(e) {
    if (hasUnsavedChanges && (state.runs.length > 0 || state.bugs.length > 0)) {
      e.preventDefault();
      e.returnValue = 'You have unsaved data! Click "EXPORT DATA NOW" before closing.';
      return e.returnValue;
    }
  });

  // Populate filter dropdowns
  populateFilterOptions();

  // Render
  renderRunSelector();
  renderCurrentRun();
  renderBugs();
}

function save() {
  localStorage.setItem('wna-regression-state', JSON.stringify(state));
  hasUnsavedChanges = true;
}

function notify(message, type = 'success') {
  const el = document.createElement('div');
  el.className = 'notification notification-' + type;
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ========================================
// Filter Options
// ========================================
function populateFilterOptions() {
  const sections = [...new Set(testCases.map(t => t.section))].sort((a, b) => {
    const na = parseInt(a);
    const nb = parseInt(b);
    return na - nb;
  });
  const areas = [...new Set(testCases.map(t => t.area))].sort();

  // Run filters
  populateSelect('filter-section', sections);
  populateSelect('filter-area', areas);

  // Catalog filters
  populateSelect('catalog-section', sections);
}

function populateSelect(id, options) {
  const sel = document.getElementById(id);
  const current = sel.value;
  // Keep the first option (All ...)
  while (sel.options.length > 1) sel.remove(1);
  for (const opt of options) {
    const o = document.createElement('option');
    o.value = opt;
    o.textContent = opt;
    sel.appendChild(o);
  }
  sel.value = current;
}

// ========================================
// Tab Switching
// ========================================
function switchTab(tabId) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.tab[data-tab="${tabId}"]`).classList.add('active');
  document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
  document.getElementById('tab-' + tabId).classList.remove('hidden');

  if (tabId === 'catalog') renderCatalog();
  if (tabId === 'bugs') renderBugs();
  if (tabId === 'summary') renderSummaryTab();
}

// ========================================
// Modal helpers
// ========================================
function closeModal(id) {
  document.getElementById(id).classList.add('hidden');
}

function showNewRunModal() {
  document.getElementById('new-run-tester').value = '';
  document.getElementById('new-run-build').value = '';
  document.getElementById('new-run-notes').value = '';
  document.getElementById('new-run-modal').classList.remove('hidden');
  document.getElementById('new-run-tester').focus();
}

function showDataModal() {
  document.getElementById('data-modal').classList.remove('hidden');
}

// ========================================
// Test Run Management
// ========================================
function createRun() {
  const tester = document.getElementById('new-run-tester').value.trim();
  const build = document.getElementById('new-run-build').value.trim();
  const notes = document.getElementById('new-run-notes').value.trim();

  if (!tester) {
    notify('Please enter a tester name', 'error');
    return;
  }

  const run = {
    id: 'run-' + Date.now(),
    number: state.runs.length + 1,
    date: new Date().toISOString().split('T')[0],
    tester,
    build,
    notes,
    results: {}
  };

  state.runs.push(run);
  state.activeRunId = run.id;
  save();

  closeModal('new-run-modal');
  renderRunSelector();
  renderCurrentRun();
  notify('Test run #' + run.number + ' created');
}

function deleteCurrentRun() {
  if (!state.activeRunId) return;
  const run = getActiveRun();
  if (!confirm('Delete Run #' + run.number + '? This cannot be undone.')) return;

  state.runs = state.runs.filter(r => r.id !== state.activeRunId);
  // Renumber
  state.runs.forEach((r, i) => r.number = i + 1);
  state.activeRunId = state.runs.length > 0 ? state.runs[state.runs.length - 1].id : null;
  save();

  renderRunSelector();
  renderCurrentRun();
  notify('Run deleted');
}

function selectRun(id) {
  state.activeRunId = id;
  save();
  renderCurrentRun();
}

function getActiveRun() {
  return state.runs.find(r => r.id === state.activeRunId);
}

function renderRunSelector() {
  const sel = document.getElementById('run-select');
  sel.innerHTML = '';
  for (const run of state.runs) {
    const o = document.createElement('option');
    o.value = run.id;
    o.textContent = `Run #${run.number} — ${run.date} (${run.tester})`;
    sel.appendChild(o);
  }
  if (state.activeRunId) sel.value = state.activeRunId;

  const hasRuns = state.runs.length > 0;
  document.getElementById('no-runs').classList.toggle('hidden', hasRuns);
  document.getElementById('run-content').classList.toggle('hidden', !hasRuns);
}

// ========================================
// Render Current Run
// ========================================
function renderCurrentRun() {
  const run = getActiveRun();
  if (!run) return;

  renderRunStats(run);
  renderTestCaseTable(run);
}

function renderRunStats(run) {
  const counts = getStatusCounts(run);
  const total = testCases.length;
  const tested = counts.P + counts.F + counts.S + counts.B;
  const passRate = tested > 0 ? ((counts.P / tested) * 100).toFixed(1) : '0.0';

  document.getElementById('run-stats').innerHTML = `
    <div class="stat-card stat-total"><div class="stat-value">${total}</div><div class="stat-label">Total</div></div>
    <div class="stat-card stat-pass"><div class="stat-value">${counts.P}</div><div class="stat-label">Passed</div></div>
    <div class="stat-card stat-fail"><div class="stat-value">${counts.F}</div><div class="stat-label">Failed</div></div>
    <div class="stat-card stat-skip"><div class="stat-value">${counts.S}</div><div class="stat-label">Skipped</div></div>
    <div class="stat-card stat-blocked"><div class="stat-value">${counts.B}</div><div class="stat-label">Blocked</div></div>
    <div class="stat-card stat-rate"><div class="stat-value">${passRate}%</div><div class="stat-label">Pass Rate</div></div>
  `;

  // Progress bar
  const progress = total > 0 ? ((tested / total) * 100).toFixed(1) : 0;
  document.getElementById('progress-bar').style.width = progress + '%';
  document.getElementById('progress-text').textContent = `${tested} / ${total} tested (${progress}%)`;
}

function getStatusCounts(run, tcList) {
  const list = tcList || testCases;
  const counts = { P: 0, F: 0, S: 0, B: 0, N: 0 };
  for (const tc of list) {
    const r = run.results[tc.id];
    const status = r ? r.status : '';
    if (status && counts.hasOwnProperty(status)) {
      counts[status]++;
    } else {
      counts.N++;
    }
  }
  return counts;
}

function getFilteredTestCases() {
  const idFilter = document.getElementById('filter-id').value.trim().toUpperCase();
  const sectionFilter = document.getElementById('filter-section').value;
  const areaFilter = document.getElementById('filter-area').value;
  const priorityFilter = document.getElementById('filter-priority').value;
  const statusFilter = document.getElementById('filter-status').value;
  const run = getActiveRun();

  return testCases.filter(tc => {
    if (idFilter && !tc.id.toUpperCase().includes(idFilter) && !tc.name.toUpperCase().includes(idFilter)) return false;
    if (sectionFilter && tc.section !== sectionFilter) return false;
    if (areaFilter && tc.area !== areaFilter) return false;
    if (priorityFilter && tc.priority !== priorityFilter) return false;
    if (statusFilter && run) {
      const r = run.results[tc.id];
      const st = r ? r.status : '';
      if (statusFilter === 'N' && st !== '') return false;
      if (statusFilter !== 'N' && st !== statusFilter) return false;
    }
    return true;
  });
}

function renderTestCaseTable(run) {
  const filtered = getFilteredTestCases();
  document.getElementById('tc-count').textContent = `(${filtered.length} of ${testCases.length})`;

  const tbody = document.getElementById('tc-tbody');
  tbody.innerHTML = '';

  for (const tc of filtered) {
    const result = run.results[tc.id] || { status: '', comment: '' };
    const tr = document.createElement('tr');

    const prioClass = 'priority-' + tc.priority.toLowerCase();
    const statusClass = result.status ? 'status-' + result.status : '';

    // Check for linked bugs
    const linkedBugs = state.bugs.filter(b => b.tc === tc.id);
    let bugCell;
    if (linkedBugs.length > 0) {
      bugCell = linkedBugs.map(b => `<span class="bug-link" onclick="editBug('${b.id}')">${b.id}</span>`).join(' ');
    } else {
      bugCell = `<button class="btn-bug" onclick="quickCreateBug('${tc.id}')">+ Bug</button>`;
    }

    tr.innerHTML = `
      <td class="tc-id" onclick="showTcDetail('${tc.id}')">${tc.id}</td>
      <td class="tc-name">${escapeHtml(tc.name)}</td>
      <td><span class="${prioClass}">${tc.priority}</span></td>
      <td>${escapeHtml(tc.area)}</td>
      <td>
        <select class="status-select ${statusClass}" data-tc="${tc.id}" onchange="updateStatus('${tc.id}', this.value)">
          <option value="">—</option>
          <option value="P" ${result.status === 'P' ? 'selected' : ''}>Pass</option>
          <option value="F" ${result.status === 'F' ? 'selected' : ''}>Fail</option>
          <option value="S" ${result.status === 'S' ? 'selected' : ''}>Skip</option>
          <option value="B" ${result.status === 'B' ? 'selected' : ''}>Blocked</option>
        </select>
      </td>
      <td>
        <input type="text" class="comment-input" data-tc="${tc.id}" value="${escapeHtml(result.comment || '')}"
          placeholder="Add comment..."
          onchange="updateComment('${tc.id}', this.value)">
      </td>
      <td>${bugCell}</td>
    `;

    tbody.appendChild(tr);
  }
}

function applyFilters() {
  const run = getActiveRun();
  if (run) {
    renderTestCaseTable(run);
  }
}

function clearFilters() {
  document.getElementById('filter-id').value = '';
  document.getElementById('filter-section').value = '';
  document.getElementById('filter-area').value = '';
  document.getElementById('filter-priority').value = '';
  document.getElementById('filter-status').value = '';
  applyFilters();
}

function updateStatus(tcId, status) {
  const run = getActiveRun();
  if (!run) return;

  if (!run.results[tcId]) run.results[tcId] = { status: '', comment: '' };
  run.results[tcId].status = status;
  save();

  // Update select styling
  const sel = document.querySelector(`select[data-tc="${tcId}"]`);
  if (sel) {
    sel.className = 'status-select' + (status ? ' status-' + status : '');
  }

  renderRunStats(run);
  renderTestCaseTable(run);
}

function updateComment(tcId, comment) {
  const run = getActiveRun();
  if (!run) return;
  if (!run.results[tcId]) run.results[tcId] = { status: '', comment: '' };
  run.results[tcId].comment = comment;
  save();
}

function markAllFiltered(status) {
  const run = getActiveRun();
  if (!run) return;
  const filtered = getFilteredTestCases();
  const label = status === 'P' ? 'Pass' : status === 'S' ? 'Skip' : 'Reset';
  if (!confirm(`Mark ${filtered.length} filtered test cases as "${label}"?`)) return;

  for (const tc of filtered) {
    if (!run.results[tc.id]) run.results[tc.id] = { status: '', comment: '' };
    run.results[tc.id].status = status;
  }
  save();
  renderCurrentRun();
  notify(`Marked ${filtered.length} test cases as ${label}`);
}

// ========================================
// TC Detail
// ========================================
function showTcDetail(tcId) {
  const tc = testCases.find(t => t.id === tcId);
  if (!tc) return;

  const stepsHtml = tc.steps.map(s => `<li>${escapeHtml(s)}</li>`).join('');
  const expectedHtml = tc.expected.split('\n').map(l => `<p style="margin-bottom:4px">${escapeHtml(l)}</p>`).join('');

  document.getElementById('tc-detail-content').innerHTML = `
    <h2 style="color:var(--primary)">${tc.id}: ${escapeHtml(tc.name)}</h2>
    <div style="display:flex;gap:16px;margin:12px 0;flex-wrap:wrap">
      <span class="${'priority-' + tc.priority.toLowerCase()}">${tc.priority}</span>
      <span style="color:var(--text-muted)">Area: ${escapeHtml(tc.area)}</span>
      <span style="color:var(--text-muted)">Section: ${escapeHtml(tc.section)}</span>
    </div>
    <div class="tc-detail">
      <div class="detail-field">
        <div class="detail-label">Preconditions</div>
        <div class="detail-value">${escapeHtml(tc.preconditions)}</div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Steps</div>
        <div class="detail-value"><ol>${stepsHtml}</ol></div>
      </div>
      <div class="detail-field">
        <div class="detail-label">Expected Result</div>
        <div class="detail-value">${expectedHtml}</div>
      </div>
    </div>
  `;

  document.getElementById('tc-detail-modal').classList.remove('hidden');
}

// ========================================
// Run Summary
// ========================================
function renderSummaryTab() {
  const run = getActiveRun();
  const hasRun = run && state.runs.length > 0;
  document.getElementById('no-summary').classList.toggle('hidden', hasRun);
  document.getElementById('summary-content').classList.toggle('hidden', !hasRun);
  if (hasRun) renderRunSummary(run);
}

function renderRunSummary(run) {
  const counts = getStatusCounts(run);
  const tested = counts.P + counts.F + counts.S + counts.B;
  const passRate = tested > 0 ? ((counts.P / tested) * 100).toFixed(1) : '0.0';

  // By priority
  const priorities = ['High', 'Medium', 'Low'];
  let prioRows = '';
  for (const prio of priorities) {
    const tcsByPrio = testCases.filter(t => t.priority === prio);
    const c = getStatusCounts(run, tcsByPrio);
    prioRows += `<tr><td><span class="priority-${prio.toLowerCase()}">${prio}</span></td>
      <td>${c.P}</td><td>${c.F}</td><td>${c.S}</td><td>${c.B}</td></tr>`;
  }

  // By area
  const areas = [...new Set(testCases.map(t => t.area))].sort();
  let areaRows = '';
  for (const area of areas) {
    const tcsByArea = testCases.filter(t => t.area === area);
    const c = getStatusCounts(run, tcsByArea);
    areaRows += `<tr><td>${escapeHtml(area)}</td>
      <td>${c.P}</td><td>${c.F}</td><td>${c.S}</td><td>${c.B}</td></tr>`;
  }

  // Failed TCs
  const failed = testCases.filter(tc => {
    const r = run.results[tc.id];
    return r && r.status === 'F';
  });
  let failedRows = '';
  for (const tc of failed) {
    const r = run.results[tc.id];
    const relatedBugs = state.bugs.filter(b => b.tc === tc.id).map(b => b.id).join(', ');
    failedRows += `<tr><td class="tc-id" onclick="showTcDetail('${tc.id}')">${tc.id}</td>
      <td>${escapeHtml(tc.name)}</td>
      <td><span class="priority-${tc.priority.toLowerCase()}">${tc.priority}</span></td>
      <td>${escapeHtml(tc.area)}</td>
      <td>${escapeHtml(r.comment || '')}${relatedBugs ? ' [' + relatedBugs + ']' : ''}</td></tr>`;
  }

  document.getElementById('run-summary').innerHTML = `
    <p style="margin-bottom:16px;color:var(--text-muted)">
      <strong>Tester:</strong> ${escapeHtml(run.tester)} |
      <strong>Build:</strong> ${escapeHtml(run.build || 'N/A')} |
      <strong>Date:</strong> ${run.date}
    </p>

    <h4 style="margin-bottom:8px">By Priority</h4>
    <table class="breakdown-table">
      <thead><tr><th>Priority</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Blocked</th></tr></thead>
      <tbody>${prioRows}</tbody>
    </table>

    <h4 style="margin-bottom:8px">By Area</h4>
    <table class="breakdown-table">
      <thead><tr><th>Area</th><th>Passed</th><th>Failed</th><th>Skipped</th><th>Blocked</th></tr></thead>
      <tbody>${areaRows}</tbody>
    </table>

    ${failed.length > 0 ? `
    <h4 style="margin-bottom:8px;color:var(--danger)">Failed Test Cases (${failed.length})</h4>
    <table class="breakdown-table">
      <thead><tr><th>TC ID</th><th>Name</th><th>Priority</th><th>Area</th><th>Comment</th></tr></thead>
      <tbody>${failedRows}</tbody>
    </table>
    ` : '<p style="color:var(--success);margin-top:8px">No failed test cases!</p>'}
  `;
}

// ========================================
// Bug Tracker
// ========================================
function showNewBugModal() {
  document.getElementById('bug-modal-title').textContent = 'New Bug';
  document.getElementById('bug-edit-id').value = '';
  document.getElementById('new-bug-title').value = '';
  document.getElementById('new-bug-tc').value = '';
  document.getElementById('new-bug-priority').value = 'High';
  document.getElementById('new-bug-desc').value = '';
  document.getElementById('new-bug-modal').classList.remove('hidden');
  document.getElementById('new-bug-title').focus();
}

function showNewBugModalForTC(tc) {
  document.getElementById('bug-modal-title').textContent = 'New Bug';
  document.getElementById('bug-edit-id').value = '';
  document.getElementById('new-bug-title').value = tc.name;
  document.getElementById('new-bug-tc').value = tc.id;
  document.getElementById('new-bug-priority').value = tc.priority;
  document.getElementById('new-bug-desc').value = `Test case: ${tc.id} - ${tc.name}`;
  document.getElementById('new-bug-modal').classList.remove('hidden');
  document.getElementById('new-bug-title').focus();
}

function quickCreateBug(tcId) {
  const tc = testCases.find(t => t.id === tcId);
  if (!tc) return;

  const bugId = 'BUG-' + String(state.nextBugId).padStart(3, '0');
  state.nextBugId++;

  state.bugs.push({
    id: bugId,
    title: '',
    tc: tc.id,
    state: 'todo',
    priority: tc.priority,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  save();

  // Re-render the table row to show the bug link, then open for editing
  const run = getActiveRun();
  if (run) renderTestCaseTable(run);

  editBug(bugId);
  notify(bugId + ' created for ' + tc.id);
}

function editBug(bugId) {
  const bug = state.bugs.find(b => b.id === bugId);
  if (!bug) return;
  document.getElementById('bug-modal-title').textContent = 'Edit Bug';
  document.getElementById('bug-edit-id').value = bug.id;
  document.getElementById('new-bug-title').value = bug.title;
  document.getElementById('new-bug-tc').value = bug.tc || '';
  document.getElementById('new-bug-priority').value = bug.priority || 'High';
  document.getElementById('new-bug-desc').value = bug.description || '';
  document.getElementById('new-bug-modal').classList.remove('hidden');
}

function saveBug() {
  const editId = document.getElementById('bug-edit-id').value;
  const title = document.getElementById('new-bug-title').value.trim();
  const tc = document.getElementById('new-bug-tc').value.trim();
  const priority = document.getElementById('new-bug-priority').value;
  const description = document.getElementById('new-bug-desc').value.trim();

  if (!title) {
    notify('Please enter a bug title', 'error');
    return;
  }

  if (editId) {
    // Update existing
    const bug = state.bugs.find(b => b.id === editId);
    if (bug) {
      bug.title = title;
      bug.tc = tc;
      bug.priority = priority;
      bug.description = description;
    }
    notify('Bug updated');
  } else {
    // Create new
    const bugId = 'BUG-' + String(state.nextBugId).padStart(3, '0');
    state.nextBugId++;

    state.bugs.push({
      id: bugId,
      title,
      tc,
      state: 'todo',
      priority,
      description,
      date: new Date().toISOString().split('T')[0]
    });
    notify('Bug ' + bugId + ' created');
  }

  save();
  closeModal('new-bug-modal');
  renderBugs();
}

function updateBugState(bugId, newState) {
  const bug = state.bugs.find(b => b.id === bugId);
  if (bug) {
    bug.state = newState;
    save();
    renderBugs();
  }
}

function deleteBug(bugId) {
  if (!confirm('Delete bug ' + bugId + '?')) return;
  state.bugs = state.bugs.filter(b => b.id !== bugId);
  save();
  renderBugs();
  notify('Bug deleted');
}

function copyBugInfo(bugId) {
  const bug = state.bugs.find(b => b.id === bugId);
  if (!bug) return;
  const lines = [
    'ID: ' + bug.id,
    'Title: ' + bug.title,
    'Priority: ' + (bug.priority || '—'),
    'State: ' + bug.state,
    'Date: ' + bug.date,
    'Test Case: ' + (bug.tc || '—'),
    'Description: ' + (bug.description || '—'),
  ];
  navigator.clipboard.writeText(lines.join('\n')).then(() => {
    notify('Copied ' + bug.id + ' to clipboard');
  });
}

// ========================================
// Multi-select dropdown helpers
// ========================================
function toggleMultiSelect(id) {
  const el = document.getElementById(id);
  const dropdown = el.querySelector('.multi-select-dropdown');
  const toggle = el.querySelector('.multi-select-toggle');
  const isOpen = dropdown.classList.contains('show');

  // Close all other open multi-selects
  document.querySelectorAll('.multi-select-dropdown.show').forEach(d => {
    d.classList.remove('show');
    d.closest('.multi-select').querySelector('.multi-select-toggle').classList.remove('open');
  });

  if (!isOpen) {
    dropdown.classList.add('show');
    toggle.classList.add('open');
  }
}

function getMultiSelectValues(id) {
  const el = document.getElementById(id);
  const checked = el.querySelectorAll('input[type="checkbox"]:checked');
  return Array.from(checked).map(cb => cb.value);
}

function updateMultiSelectLabel(id, allLabel) {
  const el = document.getElementById(id);
  const toggle = el.querySelector('.multi-select-toggle');
  const values = getMultiSelectValues(id);
  if (values.length === 0) {
    toggle.textContent = allLabel;
  } else {
    const labels = Array.from(el.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.parentElement.textContent.trim());
    toggle.textContent = labels.join(', ');
  }
}

function onMultiSelectChange(id) {
  const allLabels = { 'bug-filter-state-ms': 'All States', 'bug-filter-priority-ms': 'All Priorities' };
  updateMultiSelectLabel(id, allLabels[id] || 'All');
  renderBugs();
}

function clearMultiSelect(id, allLabel) {
  const el = document.getElementById(id);
  el.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
  el.querySelector('.multi-select-toggle').textContent = allLabel;
}

// Close multi-select dropdowns when clicking outside
document.addEventListener('click', function(e) {
  if (!e.target.closest('.multi-select')) {
    document.querySelectorAll('.multi-select-dropdown.show').forEach(d => {
      d.classList.remove('show');
      d.closest('.multi-select').querySelector('.multi-select-toggle').classList.remove('open');
    });
  }
});

function renderBugs() {
  // Bug state stats
  const total = state.bugs.length;
  const todo = state.bugs.filter(b => b.state === 'todo').length;
  const inProgress = state.bugs.filter(b => b.state === 'in-progress').length;
  const fixed = state.bugs.filter(b => b.state === 'fixed').length;
  const rejected = state.bugs.filter(b => b.state === 'rejected').length;

  const statsEl = document.getElementById('bug-stats');
  if (total > 0) {
    statsEl.innerHTML = `
      <div class="stat-card stat-total"><div class="stat-value">${total}</div><div class="stat-label">Total</div></div>
      <div class="stat-card"><div class="stat-value" style="color:var(--info)">${todo}</div><div class="stat-label">Todo</div></div>
      <div class="stat-card"><div class="stat-value" style="color:var(--warning)">${inProgress}</div><div class="stat-label">In Progress</div></div>
      <div class="stat-card stat-pass"><div class="stat-value">${fixed}</div><div class="stat-label">Fixed</div></div>
      <div class="stat-card stat-skip"><div class="stat-value">${rejected}</div><div class="stat-label">Rejected</div></div>
    `;
  } else {
    statsEl.innerHTML = '';
  }

  const stateFilters = getMultiSelectValues('bug-filter-state-ms');
  const priorityFilters = getMultiSelectValues('bug-filter-priority-ms');
  const searchFilter = document.getElementById('bug-filter-search').value.trim().toLowerCase();

  let filtered = state.bugs;
  if (stateFilters.length) filtered = filtered.filter(b => stateFilters.includes(b.state));
  if (priorityFilters.length) filtered = filtered.filter(b => priorityFilters.includes(b.priority));
  if (searchFilter) filtered = filtered.filter(b =>
    b.id.toLowerCase().includes(searchFilter) ||
    b.title.toLowerCase().includes(searchFilter) ||
    (b.tc || '').toLowerCase().includes(searchFilter)
  );

  const isEmpty = filtered.length === 0;
  document.getElementById('bugs-empty').classList.toggle('hidden', !isEmpty);
  document.getElementById('bug-table').classList.toggle('hidden', isEmpty);

  const tbody = document.getElementById('bug-tbody');
  tbody.innerHTML = '';

  for (const bug of filtered) {
    const tr = document.createElement('tr');
    const badgeClass = 'badge-' + bug.state;

    const prioClass = bug.priority ? 'priority-' + bug.priority.toLowerCase() : '';
    tr.innerHTML = `
      <td><strong>${bug.id}</strong></td>
      <td style="cursor:pointer" onclick="editBug('${bug.id}')">${escapeHtml(bug.title)}</td>
      <td>${bug.tc ? `<span class="tc-id" onclick="showTcDetail('${bug.tc}')">${bug.tc}</span>` : '—'}</td>
      <td><span class="${prioClass}">${bug.priority || '—'}</span></td>
      <td>
        <select class="btn btn-sm" style="font-size:12px" onchange="updateBugState('${bug.id}', this.value)">
          <option value="todo" ${bug.state === 'todo' ? 'selected' : ''}>Todo</option>
          <option value="in-progress" ${bug.state === 'in-progress' ? 'selected' : ''}>In Progress</option>
          <option value="fixed" ${bug.state === 'fixed' ? 'selected' : ''}>Fixed</option>
          <option value="rejected" ${bug.state === 'rejected' ? 'selected' : ''}>Rejected</option>
        </select>
      </td>
      <td>${bug.date}</td>
      <td>
        <button class="btn btn-sm" onclick="copyBugInfo('${bug.id}')" title="Copy bug info">Copy</button>
        <button class="btn btn-sm" onclick="editBug('${bug.id}')">Edit</button>
        <button class="btn btn-sm btn-danger" onclick="deleteBug('${bug.id}')">Del</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

// ========================================
// Test Catalog
// ========================================
function renderCatalog() {
  const search = document.getElementById('catalog-search').value.trim().toLowerCase();
  const section = document.getElementById('catalog-section').value;
  const priority = document.getElementById('catalog-priority').value;

  let filtered = testCases;
  if (search) filtered = filtered.filter(t =>
    t.id.toLowerCase().includes(search) || t.name.toLowerCase().includes(search)
  );
  if (section) filtered = filtered.filter(t => t.section === section);
  if (priority) filtered = filtered.filter(t => t.priority === priority);

  document.getElementById('catalog-count').textContent = `(${filtered.length} of ${testCases.length})`;

  const container = document.getElementById('catalog-list');
  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No test cases match your filters.</p></div>';
    return;
  }

  // Group by section
  const grouped = {};
  for (const tc of filtered) {
    if (!grouped[tc.section]) grouped[tc.section] = [];
    grouped[tc.section].push(tc);
  }

  let html = '';
  for (const [sec, tcs] of Object.entries(grouped)) {
    html += `<div style="margin-bottom:20px">`;
    html += `<h3 style="font-size:15px;margin-bottom:10px;color:var(--primary)">Section ${escapeHtml(sec)} (${tcs.length})</h3>`;
    for (const tc of tcs) {
      const prioClass = 'priority-' + tc.priority.toLowerCase();
      html += `
        <div style="padding:10px 16px;border:1px solid var(--border);border-radius:var(--radius);margin-bottom:6px;cursor:pointer;transition:border-color 0.15s"
          onclick="showTcDetail('${tc.id}')"
          onmouseover="this.style.borderColor='var(--primary)'"
          onmouseout="this.style.borderColor='var(--border)'">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px">
            <div>
              <span style="color:var(--primary);font-weight:600">${tc.id}</span>
              <span style="margin-left:8px">${escapeHtml(tc.name)}</span>
            </div>
            <div style="display:flex;gap:12px;flex-shrink:0">
              <span class="${prioClass}" style="font-size:12px">${tc.priority}</span>
              <span style="font-size:12px;color:var(--text-muted)">${escapeHtml(tc.area)}</span>
            </div>
          </div>
        </div>`;
    }
    html += `</div>`;
  }

  container.innerHTML = html;
}

// ========================================
// Downloads
// ========================================
function generateSummaryMd() {
  let md = '# Test Run Summaries\n\n';

  for (const run of state.runs) {
    const counts = getStatusCounts(run);
    const tested = counts.P + counts.F + counts.S + counts.B;
    const passRate = tested > 0 ? ((counts.P / tested) * 100).toFixed(1) : '0.0';

    md += `## Run #${run.number} — ${run.date}\n`;
    md += `- **Tester:** ${run.tester}\n`;
    md += `- **Build:** ${run.build || 'N/A'}\n`;
    if (run.notes) md += `- **Notes:** ${run.notes}\n`;
    md += `- **Total:** ${testCases.length} | **Passed:** ${counts.P} | **Failed:** ${counts.F} | **Skipped:** ${counts.S} | **Blocked:** ${counts.B}\n`;
    md += `- **Pass Rate:** ${passRate}%\n\n`;

    // By priority
    md += '### By Priority\n';
    md += '| Priority | Passed | Failed | Skipped | Blocked |\n';
    md += '|----------|--------|--------|---------|--------|\n';
    for (const prio of ['High', 'Medium', 'Low']) {
      const tcsByPrio = testCases.filter(t => t.priority === prio);
      const c = getStatusCounts(run, tcsByPrio);
      md += `| ${prio} | ${c.P} | ${c.F} | ${c.S} | ${c.B} |\n`;
    }
    md += '\n';

    // By area
    md += '### By Area\n';
    md += '| Area | Passed | Failed | Skipped | Blocked |\n';
    md += '|------|--------|--------|---------|--------|\n';
    const areas = [...new Set(testCases.map(t => t.area))].sort();
    for (const area of areas) {
      const tcsByArea = testCases.filter(t => t.area === area);
      const c = getStatusCounts(run, tcsByArea);
      md += `| ${area} | ${c.P} | ${c.F} | ${c.S} | ${c.B} |\n`;
    }
    md += '\n';

    // By section
    md += '### By Section\n';
    md += '| Section | Passed | Failed | Skipped | Blocked |\n';
    md += '|---------|--------|--------|---------|--------|\n';
    const sections = [...new Set(testCases.map(t => t.section))].sort((a, b) => parseInt(a) - parseInt(b));
    for (const sec of sections) {
      const tcsBySec = testCases.filter(t => t.section === sec);
      const c = getStatusCounts(run, tcsBySec);
      md += `| ${sec} | ${c.P} | ${c.F} | ${c.S} | ${c.B} |\n`;
    }
    md += '\n';

    // Failed
    const failed = testCases.filter(tc => {
      const r = run.results[tc.id];
      return r && r.status === 'F';
    });

    if (failed.length > 0) {
      md += '### Failed Test Cases\n';
      md += '| TC ID | Name | Priority | Area | Comment |\n';
      md += '|-------|------|----------|------|---------|\n';
      for (const tc of failed) {
        const r = run.results[tc.id];
        const relatedBugs = state.bugs.filter(b => b.tc === tc.id).map(b => b.id).join(', ');
        const comment = (r.comment || '') + (relatedBugs ? ' [' + relatedBugs + ']' : '');
        md += `| ${tc.id} | ${tc.name} | ${tc.priority} | ${tc.area} | ${comment} |\n`;
      }
      md += '\n';
    }

    md += '---\n\n';
  }

  return md;
}

function generateBugsMd() {
  let md = '# Bug Tracker\n\n';

  const groups = {
    'Open Bugs': state.bugs.filter(b => b.state === 'todo' || b.state === 'in-progress'),
    'Fixed Bugs': state.bugs.filter(b => b.state === 'fixed'),
    'Rejected Bugs': state.bugs.filter(b => b.state === 'rejected')
  };

  for (const [title, bugs] of Object.entries(groups)) {
    if (bugs.length === 0) continue;
    md += `## ${title}\n\n`;
    for (const bug of bugs) {
      md += `### ${bug.id}: ${bug.title}\n`;
      md += `- **State:** ${bug.state}\n`;
      if (bug.tc) md += `- **Related TC:** ${bug.tc}\n`;
      md += `- **Priority:** ${bug.priority}\n`;
      md += `- **Date Created:** ${bug.date}\n`;
      if (bug.description) md += `- **Description:** ${bug.description}\n`;
      md += '\n';
    }
  }

  if (state.bugs.length === 0) {
    md += '*No bugs tracked yet.*\n';
  }

  return md;
}

function downloadSummary() {
  if (state.runs.length === 0) {
    notify('No test runs to summarize', 'error');
    return;
  }
  downloadFile('summaries.md', generateSummaryMd());
  notify('Summary downloaded');
}

function downloadBugs() {
  downloadFile('bugs.md', generateBugsMd());
  notify('Bugs file downloaded');
}

function downloadFile(filename, content) {
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ========================================
// Data Management
// ========================================
function exportAll() {
  const data = {
    version: 1,
    exportDate: new Date().toISOString(),
    state
  };
  downloadFile('wna-regression-data.json', JSON.stringify(data, null, 2));
  hasUnsavedChanges = false;
  notify('Data exported — safe to close the page');
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      if (data.state) {
        state = data.state;
        save();
        renderRunSelector();
        renderCurrentRun();
        renderBugs();
        notify('Data imported successfully');
      } else {
        notify('Invalid data file format', 'error');
      }
    } catch (err) {
      notify('Failed to parse import file', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

function clearAllData() {
  if (!confirm('This will delete ALL test runs, results, and bugs. This cannot be undone. Continue?')) return;
  state = { runs: [], bugs: [], activeRunId: null, nextBugId: 1 };
  save();
  renderRunSelector();
  renderBugs();
  closeModal('data-modal');
  notify('All data cleared');
}

// ========================================
// Utilities
// ========================================
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ========================================
// Init
// ========================================
init();
