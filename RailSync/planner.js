const form=document.querySelector('#plan-form'),heading=document.querySelector('.result-heading h2'),caption=document.querySelector('#plan-caption'),result=document.querySelector('#plan-result'),detail=document.querySelector('#plan-detail'),blocks=document.querySelector('#block-list'),deferred=document.querySelector('#deferred-list');const esc=value=>String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));const dt=value=>new Date(value).toLocaleString();
const candidatePanel = document.createElement('section');
candidatePanel.className = 'candidate-section';
candidatePanel.innerHTML = `
  <div class="section-heading compact-heading">
    <div>
      <p class="eyebrow"><span></span> ELIGIBILITY POOL &amp; TICKET SELECTION</p>
      <h2>Tasks considered by the optimizer</h2>
    </div>
    <div class="candidate-header-actions">
      <span id="candidate-selected-count" class="candidate-badge">0 of 0 eligible selected</span>
      <button class="outline-button" id="select-all-btn" type="button">Select all</button>
      <button class="outline-button" id="deselect-all-btn" type="button">Deselect all</button>
      <button class="outline-button" id="refresh-candidates" type="button">Refresh</button>
    </div>
  </div>
  <p class="candidate-intro">
    Choose which eligible maintenance tickets to include in this proposed block plan using the checkboxes below. Ineligible tickets require completed F-02 feasibility and F-03 priority before selection.
  </p>
  <div class="candidate-table-wrap">
    <table class="candidate-table">
      <thead>
        <tr>
          <th class="th-cb"><input type="checkbox" id="master-candidate-cb" title="Select / deselect all eligible tickets" aria-label="Select all eligible tickets"></th>
          <th>Task</th>
          <th>Department</th>
          <th>Section</th>
          <th>F-03 score</th>
          <th>Eligibility</th>
          <th>Required COA start</th>
        </tr>
      </thead>
      <tbody id="candidate-body">
        <tr><td colspan="7" class="empty-table">Loading recorded tasks…</td></tr>
      </tbody>
    </table>
  </div>
`;
document.querySelector('.planner-layout').before(candidatePanel);

const candidateBody = document.querySelector('#candidate-body');
const masterCb = document.querySelector('#master-candidate-cb');
const selectedBadge = document.querySelector('#candidate-selected-count');
const selectAllBtn = document.querySelector('#select-all-btn');
const deselectAllBtn = document.querySelector('#deselect-all-btn');

function updateCandidateSelectionState() {
  const eligibleCbs = Array.from(document.querySelectorAll('.candidate-cb:not(:disabled)'));
  const checkedCbs = eligibleCbs.filter(cb => cb.checked);

  if (selectedBadge) {
    selectedBadge.textContent = `${checkedCbs.length} of ${eligibleCbs.length} eligible selected`;
    if (checkedCbs.length === 0 && eligibleCbs.length > 0) {
      selectedBadge.classList.add('none-selected');
    } else {
      selectedBadge.classList.remove('none-selected');
    }
  }

  if (masterCb) {
    if (eligibleCbs.length === 0) {
      masterCb.checked = false;
      masterCb.indeterminate = false;
      masterCb.disabled = true;
    } else {
      masterCb.disabled = false;
      if (checkedCbs.length === eligibleCbs.length) {
        masterCb.checked = true;
        masterCb.indeterminate = false;
      } else if (checkedCbs.length === 0) {
        masterCb.checked = false;
        masterCb.indeterminate = false;
      } else {
        masterCb.checked = false;
        masterCb.indeterminate = true;
      }
    }
  }
}

async function loadCandidates() {
  try {
    const response = await fetch('/api/v1/block-plans/eligibility');
    const items = await response.json();
    if (!items.length) {
      candidateBody.innerHTML = '<tr><td colspan="7" class="empty-table">No complete F-01 tasks found.</td></tr>';
      updateCandidateSelectionState();
      return;
    }

    candidateBody.innerHTML = items.map(item => {
      const isEligible = !!item.eligible;
      const cb = isEligible
        ? `<input type="checkbox" class="candidate-cb" value="${esc(item.task_id)}" checked title="Include ${esc(item.task_id)} in block plan" aria-label="Select task ${esc(item.task_id)}">`
        : `<input type="checkbox" class="candidate-cb" disabled title="Ineligible: complete F-02 and F-03 first" aria-label="Task ${esc(item.task_id)} is ineligible">`;

      return `
        <tr class="${isEligible ? 'candidate-row-eligible' : 'candidate-row-ineligible'}">
          <td class="td-cb">${cb}</td>
          <td><strong>${esc(item.task_id)}</strong><span class="candidate-reason">${esc(item.duration_minutes)} min</span></td>
          <td>${esc(item.department)}</td>
          <td>${esc(item.section_id)}</td>
          <td>${item.priority_score === null ? '—' : esc(item.priority_score)}</td>
          <td class="${isEligible ? 'eligible-text' : 'ineligible-text'}">
            ${isEligible ? 'ELIGIBLE' : 'NOT READY'}
            ${item.missing_requirements && item.missing_requirements.length ? `<span class="candidate-reason">${item.missing_requirements.map(esc).join(' ')}</span>` : ''}
          </td>
          <td>${item.required_coa_start_hour ? esc(dt(item.required_coa_start_hour)) : '—'}</td>
        </tr>
      `;
    }).join('');

    updateCandidateSelectionState();
  } catch {
    candidateBody.innerHTML = '<tr><td colspan="7" class="empty-table">Could not load task eligibility.</td></tr>';
    updateCandidateSelectionState();
  }
}

candidateBody.addEventListener('change', ev => {
  if (ev.target && ev.target.classList.contains('candidate-cb')) {
    updateCandidateSelectionState();
  }
});

candidateBody.addEventListener('click', ev => {
  const row = ev.target.closest('tr.candidate-row-eligible');
  if (row && ev.target.tagName !== 'INPUT' && ev.target.tagName !== 'A' && ev.target.tagName !== 'BUTTON') {
    const cb = row.querySelector('.candidate-cb:not(:disabled)');
    if (cb) {
      cb.checked = !cb.checked;
      updateCandidateSelectionState();
    }
  }
});

masterCb.addEventListener('change', () => {
  const eligibleCbs = document.querySelectorAll('.candidate-cb:not(:disabled)');
  eligibleCbs.forEach(cb => { cb.checked = masterCb.checked; });
  updateCandidateSelectionState();
});

selectAllBtn.addEventListener('click', () => {
  const eligibleCbs = document.querySelectorAll('.candidate-cb:not(:disabled)');
  eligibleCbs.forEach(cb => { cb.checked = true; });
  updateCandidateSelectionState();
});

deselectAllBtn.addEventListener('click', () => {
  const eligibleCbs = document.querySelectorAll('.candidate-cb:not(:disabled)');
  eligibleCbs.forEach(cb => { cb.checked = false; });
  updateCandidateSelectionState();
});

document.querySelector('#refresh-candidates').addEventListener('click', loadCandidates);
loadCandidates();

function isolation(task) {
  const labels = [];
  if (task.requires_traffic_block) labels.push('Traffic block');
  if (task.requires_traction_disconnection) labels.push('Traction disconnection');
  return labels.join(' + ') || 'None';
}

function renderPlan(plan) {
  const m = plan.metrics;
  heading.textContent = `${m.scheduled_task_count} tasks · ${m.distinct_corridor_disruptions} blocks`;
  caption.textContent = `${plan.horizon} proposed plan · ${m.total_priority_score_scheduled} priority points scheduled · ${m.shared_block_count} shared blocks.`;
  result.className = 'result-data';
  result.innerHTML = `
    <span class="result-status complete">PROPOSED</span>
    <dl>
      <div><dt>Block hours used</dt><dd>${esc(m.total_block_hours_used)} h</dd></div>
      <div><dt>Unscheduled tasks</dt><dd>${esc(m.unscheduled_task_count)}</dd></div>
      <div><dt>Passenger trains affected</dt><dd>${esc(m.passenger_trains_affected)}</dd></div>
      <div><dt>Goods trains affected</dt><dd>${esc(m.goods_trains_affected)}</dd></div>
    </dl>
    <div class="review-list">
      ${plan.notes.map(esc).join('<br/>')}
      ${m.search_timed_out ? '<br/>Search time limit reached; review this proposed result before relying on it.' : ''}
    </div>
  `;
  detail.hidden = false;
  blocks.innerHTML = plan.scheduled_blocks.length ? plan.scheduled_blocks.map(block => `
    <article class="block-card">
      <div class="block-header">
        <div>
          <strong>${esc(block.corridor_id)} · ${esc(block.section_id)}</strong>
          <p>${esc(dt(block.window_start))} — ${esc(dt(block.window_end))}</p>
        </div>
        <span class="block-tag">${esc(block.assigned_tasks.length)} task${block.assigned_tasks.length === 1 ? '' : 's'} · ${esc(block.consolidated_departments.join(', '))}</span>
      </div>
      <div class="block-meta">
        <span>Timetable: ${esc(block.timetable_reference)}</span>
        <span>Goods forecast: ${esc(block.goods_forecast_reference)}</span>
        <span>Used: ${esc(block.used_minutes)} / ${esc(block.available_minutes)} min</span>
      </div>
      <table class="assignment-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Department</th>
            <th>Priority</th>
            <th>Scheduled interval</th>
            <th>Isolation</th>
          </tr>
        </thead>
        <tbody>
          ${block.assigned_tasks.map(task => `
            <tr>
              <td><strong>${esc(task.task_id)}</strong></td>
              <td><i class="dept-dot"></i>${esc(task.department)}</td>
              <td>${esc(task.priority_score)}</td>
              <td>${esc(dt(task.scheduled_start))} – ${esc(dt(task.scheduled_end))}</td>
              <td>${esc(isolation(task))}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </article>
  `).join('') : '<p class="empty-table">No eligible task could be placed in the submitted COA windows.</p>';

  deferred.innerHTML = plan.unscheduled_tasks.length ? plan.unscheduled_tasks.map(item => `
    <article class="deferred-item">
      <strong>${esc(item.task_id)}</strong>
      <p>${esc(item.reason)}</p>
    </article>
  `).join('') : '<div class="deferred-item">No tasks were deferred.</div>';
}

form.addEventListener('submit', async ev => {
  ev.preventDefault();
  const d = new FormData(form);
  let windows;
  try {
    windows = JSON.parse(d.get('coa_windows'));
    if (!Array.isArray(windows)) throw Error('COA windows must be a JSON array.');
  } catch (err) {
    heading.textContent = 'Input needs correction';
    caption.textContent = err.message;
    return;
  }

  const eligibleCbs = document.querySelectorAll('.candidate-cb:not(:disabled)');
  const checkedCbs = document.querySelectorAll('.candidate-cb:not(:disabled):checked');

  if (eligibleCbs.length > 0 && checkedCbs.length === 0) {
    heading.textContent = 'Ticket selection required';
    caption.textContent = 'Please select at least one eligible ticket from the eligibility pool.';
    result.className = 'empty-result';
    result.innerHTML = '<p>No tickets selected. Check at least one eligible ticket in the pool above to generate a block plan.</p>';
    detail.hidden = true;
    return;
  }

  const selectedTaskIds = Array.from(checkedCbs).map(cb => cb.value);

  const payload = {
    horizon: d.get('horizon'),
    horizon_start: d.get('horizon_start'),
    horizon_end: d.get('horizon_end'),
    coa_windows: windows,
    selected_task_ids: selectedTaskIds
  };

  try {
    const r = await fetch('/api/v1/block-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const x = await r.json();
    if (!r.ok) {
      throw Error(Array.isArray(x.detail) ? x.detail.map(v => v.msg).join('; ') : x.detail || 'Could not generate plan.');
    }
    renderPlan(x);
  } catch (err) {
    heading.textContent = 'Input needs correction';
    caption.textContent = err.message;
    result.className = 'empty-result';
    result.innerHTML = '<p>No proposed plan was created.</p>';
    detail.hidden = true;
  }
});
