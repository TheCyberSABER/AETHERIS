/* ==========================================================================
   AETHERIS // APPLICATION CONTROLLER & UI RENDERER
   Configured with Indian Standard Time (IST) & Indian Team Roster:
   Karan (PM), Arjun (Lead Eng), Aditya, Ketan Kumar, Ketan Verma (Admin),
   Jeet, and Ishan (Lowest Performance 42.5%)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const store = window.store;

  // Initialize Indian Timeline Clock (IST)
  initLiveClock();

  // Subscribe to store updates
  store.subscribe((state) => {
    renderApp(state);
  });

  // Initial render
  renderApp(store.state);

  // Setup Global Event Listeners
  setupGlobalEvents();
});

// Live Indian Timeline Clock Pill (IST)
function initLiveClock() {
  function updateClock() {
    const clockElements = document.querySelectorAll('.live-time-display');
    const now = new Date();
    try {
      const formatter = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const timeStr = `NEW DELHI ${formatter.format(now)} IST`;
      clockElements.forEach(el => el.textContent = timeStr);
    } catch (e) {
      // Fallback calculation for UTC+5:30
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istDate = new Date(utc + (3600000 * 5.5));
      const hours = String(istDate.getHours()).padStart(2, '0');
      const mins = String(istDate.getMinutes()).padStart(2, '0');
      const secs = String(istDate.getSeconds()).padStart(2, '0');
      const timeStr = `NEW DELHI ${hours}:${mins}:${secs} IST`;
      clockElements.forEach(el => el.textContent = timeStr);
    }
  }
  updateClock();
  setInterval(updateClock, 1000);
}

// Master Render Function
function renderApp(state) {
  const landingView = document.getElementById('landing-view');
  const appView = document.getElementById('app-view');

  if (!state.isLoggedIn) {
    landingView.style.display = 'block';
    appView.style.display = 'none';
    return;
  }

  landingView.style.display = 'none';
  appView.style.display = 'flex';

  // Render Topbar & Sidebar states
  renderTopbar(state);
  renderSidebar(state);

  // Render Active Screen
  renderActiveView(state);
}

// --- TOPBAR RENDERING ---
function renderTopbar(state) {
  const projectSelect = document.getElementById('topbar-project-select');
  if (projectSelect) {
    projectSelect.innerHTML = state.projects.map(p => `
      <option value="${p.id}" ${p.id === state.activeProjectId ? 'selected' : ''}>${p.name}</option>
    `).join('');
  }

  // User Profile
  const userNameEl = document.getElementById('topbar-user-name');
  const userRoleEl = document.getElementById('topbar-user-role');
  const userAvatarEl = document.getElementById('topbar-user-avatar');
  if (userNameEl) userNameEl.textContent = state.currentUser.persona;
  if (userRoleEl) userRoleEl.textContent = state.currentUser.name;
  if (userAvatarEl) userAvatarEl.textContent = state.currentUser.avatar;

  // Notification Badge
  const notifCountEl = document.getElementById('topbar-notif-count');
  const unreadNotifs = state.notifications.filter(n => n.unread).length;
  if (notifCountEl) {
    notifCountEl.textContent = unreadNotifs;
    notifCountEl.style.display = unreadNotifs > 0 ? 'flex' : 'none';
  }

  // Notification List Dropdown
  const notifListEl = document.getElementById('topbar-notif-list');
  if (notifListEl) {
    notifListEl.innerHTML = state.notifications.map(n => `
      <div class="notif-item ${n.unread ? 'unread' : ''}">
        <span class="pulse-dot ${n.type === 'critical' ? 'rose' : n.type === 'warning' ? 'amber' : 'cyan'}"></span>
        <div>
          <div style="font-weight: 700; color: #fff;">${n.title}</div>
          <div style="color: var(--text-secondary); margin-top: 2px;">${n.desc}</div>
          <div style="font-family: var(--font-mono); font-size: 0.68rem; color: var(--text-dim); margin-top: 4px;">${n.time}</div>
        </div>
      </div>
    `).join('');
  }
}

// --- SIDEBAR RENDERING ---
function renderSidebar(state) {
  const navLinks = document.querySelectorAll('.sidebar-nav-link');
  navLinks.forEach(link => {
    const view = link.getAttribute('data-view');
    if (view === state.activeView) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  const pendingCount = state.submissions.filter(s => s.status === 'pending').length;
  const subBadge = document.getElementById('sidebar-submissions-badge');
  if (subBadge) subBadge.textContent = pendingCount;

  const criticalRisksCount = state.aiRisks.filter(r => r.severity === 'critical' || r.severity === 'warning').length;
  const riskBadge = document.getElementById('sidebar-risks-badge');
  if (riskBadge) riskBadge.textContent = criticalRisksCount;
}

// --- VIEW ROUTER ---
function renderActiveView(state) {
  const container = document.getElementById('main-content-view');
  if (!container) return;

  switch (state.activeView) {
    case 'dashboard':
      renderDashboardView(container, state);
      break;
    case 'kanban':
      renderKanbanView(container, state);
      break;
    case 'analytics':
      renderAnalyticsView(container, state);
      break;
    case 'submissions':
      renderSubmissionsView(container, state);
      break;
    case 'ai-insights':
      renderAiInsightsView(container, state);
      break;
    case 'rbac':
      renderRbacView(container, state);
      break;
    case 'reports':
      renderReportsView(container, state);
      break;
    case 'audit-logs':
      renderAuditLogsView(container, state);
      break;
    default:
      renderDashboardView(container, state);
  }
}

// ==========================================================================
// SCREEN 2: ROLE-BASED DASHBOARD
// ==========================================================================
function renderDashboardView(container, state) {
  const role = state.currentRole;
  const project = state.projects.find(p => p.id === state.activeProjectId) || state.projects[0];
  const pendingSubmissions = state.submissions.filter(s => s.status === 'pending');
  const myTasks = state.tasks.filter(t => t.assigneeId === 'usr-01' || t.assigneeName.includes('Arjun'));

  let roleSpecificContent = '';

  // 1. ADMIN DASHBOARD (Ketan Verma)
  if (role === 'admin') {
    roleSpecificContent = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-label">Platform Health Index</span>
            <div class="stat-icon-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg></div>
          </div>
          <div class="stat-value" style="color: var(--accent-emerald);">99.8%</div>
          <div class="stat-footer"><span class="trend-up">▲ 0.4%</span> Zero critical vulnerabilities</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-label">Active Platform Projects</span>
            <div class="stat-icon-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg></div>
          </div>
          <div class="stat-value">${state.projects.length}</div>
          <div class="stat-footer"><span class="trend-up">+1 active</span> ${state.members.length} team engineers</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-label">Cryptographic Audit Nodes</span>
            <div class="stat-icon-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div>
          </div>
          <div class="stat-value" style="color: var(--accent-cyan);">${state.auditLogs.length}</div>
          <div class="stat-footer">Immutable SHA-256 state chain intact</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-label">RBAC Governance Level</span>
            <div class="stat-icon-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
          </div>
          <div class="stat-value" style="color: var(--accent-violet);">Strict</div>
          <div class="stat-footer">Role isolation enforced on 12 gates</div>
        </div>
      </div>

      <div class="analytics-grid-two-col">
        <div class="glass-panel" style="padding: 24px;">
          <h3 style="margin-bottom: 16px; font-size: 1.15rem;">Admin Quick Controls (Ketan Verma)</h3>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button class="btn btn-outline btn-sm" onclick="store.setActiveView('rbac')">Manage RBAC Users</button>
            <button class="btn btn-outline btn-sm" onclick="store.executeAiRebalance()">Run AI Diagnostic Audit</button>
            <button class="btn btn-outline btn-sm" onclick="store.setActiveView('audit-logs')">Inspect Full Audit Trail</button>
            <button class="btn btn-primary btn-sm" onclick="openCreateProjectModal()">+ Register New Project</button>
          </div>
        </div>
        <div class="glass-panel" style="padding: 24px;">
          <h3 style="margin-bottom: 16px; font-size: 1.15rem;">Platform Activity Telemetry (Indian IST)</h3>
          <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 8px;">
            ${state.auditLogs.slice(0, 3).map(l => `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 6px;">
                <span>[${l.action}] ${l.target}</span>
                <span style="color: var(--accent-cyan);">${l.hash.slice(0, 8)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }
  // 2. PROJECT MANAGER DASHBOARD (Karan)
  else if (role === 'pm') {
    roleSpecificContent = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-label">Active Sprint 4 Progress</span>
            <div class="stat-icon-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          </div>
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div class="stat-value" style="color: var(--accent-cyan);">${project.progress}%</div>
            <div>${ChartEngine.renderCircularProgress(project.progress, '#00f2ff', 64)}</div>
          </div>
          <div class="stat-footer">Target demo: <strong>Nov 20, 2026</strong> (4 days remaining)</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-label">Submissions Needing Review</span>
            <div class="stat-icon-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>
          </div>
          <div class="stat-value" style="color: var(--accent-amber);">${pendingSubmissions.length}</div>
          <div class="stat-footer"><span class="trend-down">Bottleneck Risk</span> 2 waiting > 36h</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-label">Workload Gini Index &amp; Ishan Deficit</span>
            <div class="stat-icon-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg></div>
          </div>
          <div class="stat-value" style="color: var(--accent-rose);">0.72</div>
          <div class="stat-footer"><span class="trend-down">Severe Skew</span> Ishan lowest: 42.5%</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-label">Total Verified Points</span>
            <div class="stat-icon-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
          </div>
          <div class="stat-value" style="color: var(--accent-emerald);">${project.completedComplexity} <span style="font-size: 1rem; color: var(--text-muted);">/ ${project.totalComplexity}</span></div>
          <div class="stat-footer">69.7% milestone velocity achieved</div>
        </div>
      </div>

      <!-- Quick Action: Pending Submissions review banner -->
      ${pendingSubmissions.length > 0 ? `
        <div class="glass-panel" style="padding: 22px 26px; margin-bottom: 28px; border-left: 4px solid var(--accent-amber); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="pulse-dot amber"></span>
              <h3 style="font-size: 1.1rem;">Review Submissions Queue (${pendingSubmissions.length} Awaiting Verification)</h3>
            </div>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 4px;">
              Deliverables submitted by <strong>Arjun</strong> and <strong>Aditya</strong> require Karan's verification to unblock sprint velocity.
            </p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-primary btn-sm" onclick="store.setActiveView('submissions')">Open Verification Queue →</button>
            <button class="btn btn-outline btn-sm" onclick="store.approveSubmission('${pendingSubmissions[0].id}')">1-Click Approve First</button>
          </div>
        </div>
      ` : ''}
    `;
  }
  // 3. TEAM MEMBER (EMPLOYEE) DASHBOARD (Arjun)
  else if (role === 'member') {
    roleSpecificContent = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-label">My Fair Contribution Score</span>
            <div class="stat-icon-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>
          </div>
          <div class="stat-value" style="color: var(--accent-cyan);">94.8 <span style="font-size: 1rem; color: var(--text-muted);">/ 100</span></div>
          <div class="stat-footer"><span class="trend-up">Top Contributor</span> Anti-free-riding status: Exemplary</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-label">Verified Deliverables</span>
            <div class="stat-icon-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg></div>
          </div>
          <div class="stat-value" style="color: var(--accent-emerald);">8 PRs</div>
          <div class="stat-footer">19.5 total complexity points earned</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-label">Active Tasks in Flight</span>
            <div class="stat-icon-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg></div>
          </div>
          <div class="stat-value">${myTasks.filter(t => t.status !== 'completed').length}</div>
          <div class="stat-footer">1 in review, 1 in progress</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-label">Next Deliverable Deadline</span>
            <div class="stat-icon-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
          </div>
          <div class="stat-value" style="font-size: 1.6rem; color: var(--accent-amber);">Oct 28</div>
          <div class="stat-footer">TSK-101 (IMU Sensor Fusion) due in 3 days</div>
        </div>
      </div>

      <!-- Member Quick Actions & My Tasks Queue -->
      <div class="glass-panel" style="padding: 24px; margin-bottom: 28px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;">
          <h3 style="font-size: 1.15rem;">My Active Assignment Queue (Arjun)</h3>
          <button class="btn btn-primary btn-sm" onclick="store.setActiveView('submissions')">Submit Work Deliverable →</button>
        </div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${myTasks.map(t => `
            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
              <div>
                <div style="display: flex; align-items: center; gap: 10px;">
                  <span class="badge ${t.priority === 'critical' ? 'badge-rose' : 'badge-cyan'}">${t.priority}</span>
                  <span class="font-mono" style="font-size: 0.75rem; color: var(--text-muted);">${t.id}</span>
                  <strong>${t.title}</strong>
                </div>
                <div style="font-size: 0.78rem; color: var(--text-secondary); margin-top: 4px;">
                  Weight: ${t.complexityWeight}x • Due: ${t.dueDate} • Status: <span style="color: var(--accent-cyan); text-transform: uppercase;">${t.status.replace('_', ' ')}</span>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <select class="task-quick-move-select" onchange="store.moveTaskStatus('${t.id}', this.value)">
                  <option value="todo" ${t.status === 'todo' ? 'selected' : ''}>To Do</option>
                  <option value="in_progress" ${t.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
                  <option value="in_review" ${t.status === 'in_review' ? 'selected' : ''}>In Review</option>
                  <option value="completed" ${t.status === 'completed' ? 'selected' : ''}>Completed</option>
                </select>
                <button class="btn btn-outline btn-sm" onclick="openSubmitModalForTask('${t.id}')">Submit Proof</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
  // 4. FACULTY / EVALUATOR DASHBOARD (Prof. Ketan Kumar)
  else if (role === 'faculty') {
    roleSpecificContent = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-label">Capstone Cohort Progress</span>
            <div class="stat-icon-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg></div>
          </div>
          <div class="stat-value">1 / 3</div>
          <div class="stat-footer">1 project formally certified & graded</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-label">Cohort Equity Gini Index</span>
            <div class="stat-icon-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          </div>
          <div class="stat-value" style="color: var(--accent-amber);">0.38</div>
          <div class="stat-footer"><span class="trend-down">Ishan Deficit</span> Needs remediation</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-label">Pending Faculty Sign-Off</span>
            <div class="stat-icon-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
          </div>
          <div class="stat-value" style="color: var(--accent-amber);">2</div>
          <div class="stat-footer">Aether-OS & NeuroPulse awaiting review</div>
        </div>

        <div class="stat-card">
          <div class="stat-card-top">
            <span class="stat-label">Average Cohort Grade</span>
            <div class="stat-icon-wrapper"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg></div>
          </div>
          <div class="stat-value" style="color: var(--accent-cyan);">9.2 <span style="font-size: 1rem; color: var(--text-muted);">/ 10</span></div>
          <div class="stat-footer">High technical depth across senior leads</div>
        </div>
      </div>

      <div class="glass-panel" style="padding: 24px; margin-bottom: 28px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px;">
          <div>
            <h3 style="font-size: 1.15rem;">Academic Evaluation Portal (Prof. Ketan Kumar)</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
              Review multi-dimensional contribution scores, verify GitHub cryptographic proofs, examine Ishan's lowest-performer flag, and sign official rubrics.
            </p>
          </div>
          <div style="display: flex; gap: 10px;">
            <button class="btn btn-outline btn-sm" onclick="store.setActiveView('analytics')">Inspect Team Radar</button>
            <button class="btn btn-primary btn-sm" onclick="store.setActiveView('reports')">Open Evaluation Rubric →</button>
          </div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 10px;">
          <h1>${state.currentUser.name} Portal (${state.currentUser.persona})</h1>
          <span class="badge badge-${state.currentUser.badgeColor}">${state.currentRole.toUpperCase()}</span>
        </div>
        <p class="view-subtitle">${project.name} (${project.code}) • Lead: ${project.lead}</p>
      </div>
      <div class="view-actions-group">
        <button class="btn btn-outline btn-sm" onclick="store.setActiveView('kanban')">Open Kanban Board</button>
        <button class="btn btn-primary btn-sm" onclick="openCreateTaskModal()">+ New Task</button>
      </div>
    </div>

    ${roleSpecificContent}

    <!-- Shared Bottom Section: Live Velocity & Contribution Snapshot -->
    <div class="analytics-grid-two-col">
      <div class="glass-panel" style="padding: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;">
          <h3 style="font-size: 1.1rem;">Team Fair Contribution Matrix</h3>
          <button class="btn btn-ghost btn-sm" onclick="store.setActiveView('analytics')">View Radar →</button>
        </div>
        <div id="dashboard-contribution-bars"></div>
      </div>

      <div class="glass-panel" style="padding: 24px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;">
          <h3 style="font-size: 1.1rem;">Autonomous AI Diagnostics</h3>
          <span class="pulse-dot cyan"></span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 14px;">
          ${state.aiRisks.slice(0, 2).map(r => `
            <div style="background: rgba(255,255,255,0.02); border-left: 3px solid ${r.severity === 'critical' ? 'var(--accent-rose)' : 'var(--accent-amber)'}; padding: 12px 14px; border-radius: 4px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong style="font-size: 0.88rem;">${r.title}</strong>
                <span class="badge ${r.severity === 'critical' ? 'badge-rose' : 'badge-amber'}">${r.category}</span>
              </div>
              <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 6px 0;">${r.impact}</p>
              <button class="btn btn-outline btn-sm" style="font-size: 0.72rem; padding: 4px 8px; margin-top: 4px;" onclick="handleAiAction('${r.actionType}')">
                ${r.actionLabel}
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  ChartEngine.renderContributionBars('dashboard-contribution-bars', state.members);
}

// ==========================================================================
// SCREEN 3: PROJECTS & TASK MANAGEMENT (KANBAN BOARD)
// ==========================================================================
function renderKanbanView(container, state) {
  const project = state.projects.find(p => p.id === state.activeProjectId) || state.projects[0];
  const filter = state.taskFilter;

  // Filter tasks
  let filteredTasks = state.tasks.filter(t => t.projectId === project.id);
  if (filter.assignee !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.assigneeId === filter.assignee);
  }
  if (filter.priority !== 'all') {
    filteredTasks = filteredTasks.filter(t => t.priority === filter.priority);
  }
  if (filter.search.trim()) {
    const q = filter.search.toLowerCase();
    filteredTasks = filteredTasks.filter(t => t.title.toLowerCase().includes(q) || t.id.toLowerCase().includes(q));
  }

  const columns = [
    { id: 'todo', name: 'To Do', badge: 'neutral' },
    { id: 'in_progress', name: 'In Progress', badge: 'cyan' },
    { id: 'in_review', name: 'In Review', badge: 'amber' },
    { id: 'completed', name: 'Completed', badge: 'emerald' }
  ];

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>Project &amp; Task Management (Kanban)</h1>
        <p class="view-subtitle">${project.name} • ${project.status} (${project.completedComplexity}/${project.totalComplexity} Complexity Pts)</p>
      </div>
      <div class="view-actions-group">
        <button class="btn btn-outline btn-sm" onclick="openCreateProjectModal()">+ New Project</button>
        <button class="btn btn-primary btn-sm" onclick="openCreateTaskModal()">+ Create Task</button>
      </div>
    </div>

    <!-- Kanban Filters Toolbar -->
    <div class="kanban-toolbar">
      <div class="kanban-filters">
        <select style="width: auto; height: 36px; padding: 4px 12px;" onchange="store.setTaskFilter({ assignee: this.value })">
          <option value="all">All Assignees (Karan, Arjun, Aditya...)</option>
          ${state.members.map(m => `
            <option value="${m.id}" ${filter.assignee === m.id ? 'selected' : ''}>${m.name} ${m.name === 'Ishan' ? '(Lowest)' : ''}</option>
          `).join('')}
        </select>

        <select style="width: auto; height: 36px; padding: 4px 12px;" onchange="store.setTaskFilter({ priority: this.value })">
          <option value="all">All Priorities</option>
          <option value="critical" ${filter.priority === 'critical' ? 'selected' : ''}>Critical</option>
          <option value="high" ${filter.priority === 'high' ? 'selected' : ''}>High</option>
          <option value="medium" ${filter.priority === 'medium' ? 'selected' : ''}>Medium</option>
          <option value="low" ${filter.priority === 'low' ? 'selected' : ''}>Low</option>
        </select>

        <input type="text" placeholder="Filter tasks by keyword..." value="${filter.search}" style="width: 220px; height: 36px;" oninput="store.setTaskFilter({ search: this.value })" />
      </div>

      <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">
        Showing <strong>${filteredTasks.length}</strong> tasks across 4 workflow lanes
      </div>
    </div>

    <!-- 4 Kanban Columns -->
    <div class="kanban-board-container">
      ${columns.map(col => {
        const colTasks = filteredTasks.filter(t => t.status === col.id);
        return `
          <div class="kanban-column" data-status="${col.id}" ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, '${col.id}')">
            <div class="kanban-column-header">
              <div class="column-title-group">
                <span class="column-name">${col.name}</span>
                <span class="column-count-badge">${colTasks.length}</span>
              </div>
              <button class="btn btn-ghost btn-sm" style="padding: 2px 6px;" onclick="openCreateTaskModal('${col.id}')">+</button>
            </div>

            <div class="kanban-task-list">
              ${colTasks.map(task => renderTaskCard(task)).join('')}
              ${colTasks.length === 0 ? `
                <div style="padding: 40px 10px; text-align: center; color: var(--text-dim); font-size: 0.8rem; border: 1px dashed var(--border-subtle); border-radius: 8px;">
                  No tasks in this lane
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// Single Kanban Task Card
function renderTaskCard(task) {
  const priorityColor = task.priority === 'critical' ? 'badge-rose' : task.priority === 'high' ? 'badge-amber' : task.priority === 'medium' ? 'badge-cyan' : 'badge-emerald';
  const isIshan = task.assigneeName === 'Ishan';

  return `
    <div class="task-card" draggable="true" id="task-${task.id}" ondragstart="handleDragStart(event, '${task.id}')" style="${isIshan ? 'border-left: 3px solid var(--accent-rose);' : ''}">
      <div class="task-card-top">
        <span class="task-id">${task.id}</span>
        <div style="display: flex; gap: 6px;">
          <span class="badge ${priorityColor}">${task.priority}</span>
          <span class="badge badge-neutral">${task.complexityWeight}x</span>
        </div>
      </div>

      <div class="task-title">${task.title}</div>
      <div class="task-desc">${task.description}</div>

      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 0.72rem; color: var(--text-muted); font-family: var(--font-mono);">
        <span>Subtasks: ${task.subtasksDone}/${task.subtasksTotal}</span>
        ${task.hasEvidence ? `<span style="color: var(--accent-emerald);">✔ Deliverable Proof</span>` : ''}
        ${isIshan ? `<span style="color: var(--accent-rose); font-weight: 700;">⚠ Overdue/At Risk</span>` : ''}
      </div>

      <div class="task-progress-bar">
        <div class="task-progress-fill" style="width: ${(task.subtasksDone / task.subtasksTotal) * 100}%"></div>
      </div>

      <div class="task-card-footer">
        <div class="task-assignee">
          <div class="assignee-avatar-sm" style="${isIshan ? 'background: #991b1b; color: #fff;' : ''}">${task.assigneeName.slice(0, 2).toUpperCase()}</div>
          <span style="${isIshan ? 'color: var(--accent-rose); font-weight: 600;' : ''}">${task.assigneeName}</span>
        </div>

        <!-- Quick 1-Click Status Mover -->
        <select class="task-quick-move-select" onchange="store.moveTaskStatus('${task.id}', this.value)">
          <option value="todo" ${task.status === 'todo' ? 'selected' : ''}>To Do</option>
          <option value="in_progress" ${task.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
          <option value="in_review" ${task.status === 'in_review' ? 'selected' : ''}>In Review</option>
          <option value="completed" ${task.status === 'completed' ? 'selected' : ''}>Completed</option>
        </select>
      </div>
    </div>
  `;
}

// Drag & Drop Handlers
window.handleDragStart = function(event, taskId) {
  event.dataTransfer.setData('text/plain', taskId);
  event.dataTransfer.effectAllowed = 'move';
  const el = document.getElementById(`task-${taskId}`);
  if (el) el.classList.add('dragging');
};

window.handleDragOver = function(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  const column = event.currentTarget;
  column.classList.add('drag-over');
};

window.handleDragLeave = function(event) {
  event.currentTarget.classList.remove('drag-over');
};

window.handleDrop = function(event, newStatus) {
  event.preventDefault();
  event.currentTarget.classList.remove('drag-over');
  const taskId = event.dataTransfer.getData('text/plain');
  if (taskId) {
    const el = document.getElementById(`task-${taskId}`);
    if (el) el.classList.remove('dragging');
    store.moveTaskStatus(taskId, newStatus);
  }
};

// ==========================================================================
// SCREEN 4: TEAM CONTRIBUTION ANALYTICS (EXPLAINABLE FAIR SCORING)
// ==========================================================================
function renderAnalyticsView(container, state) {
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>Team Contribution Analytics</h1>
        <p class="view-subtitle">Explainable Contribution Score (ECS) • Anti-Free-Riding Protocol (IST Timeline)</p>
      </div>
      <div class="view-actions-group">
        <button class="btn btn-outline btn-sm" onclick="store.executeAiRebalance()">Run Bias Audit</button>
        <button class="btn btn-primary btn-sm" onclick="store.setActiveView('reports')">Export Audit Report →</button>
      </div>
    </div>

    <!-- Explainable Formula Banner -->
    <div class="analytics-formula-banner">
      <div>
        <div style="font-weight: 700; font-size: 1.05rem; margin-bottom: 4px;">Fair Attribution Engine Formulation</div>
        <p style="color: var(--text-secondary); font-size: 0.85rem;">
          To prevent superficial commit-spamming, scores are weighted by verified deliverable proofs, task difficulty multipliers, and peer collaboration.
        </p>
      </div>
      <div class="formula-text">
        Score = (0.40 × Deliverables) + (0.25 × Complexity) + (0.20 × Collaboration) + (0.15 × Deadlines)
      </div>
    </div>

    <!-- 2 Column Visuals: Radar Chart + Stacked Bars -->
    <div class="analytics-grid-two-col">
      <div class="radar-chart-card">
        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%; margin-bottom: 12px;">
          <h3 style="font-size: 1.15rem;">Multi-Axis Contribution Radar</h3>
          <span class="badge badge-rose" style="font-size: 0.7rem;">Ishan: Lowest Polygon</span>
        </div>
        <div id="radar-chart-svg" class="radar-svg-container"></div>
      </div>

      <div class="glass-panel" style="padding: 28px;">
        <h3 style="margin-bottom: 16px; font-size: 1.15rem;">Sprint Complexity Points Distribution</h3>
        <div id="analytics-contribution-bars"></div>
      </div>
    </div>

    <!-- Fair Attribution Details Table -->
    <div class="data-table-container">
      <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
        <h3 style="font-size: 1.15rem;">Verified Contributor Breakdown (Anti-Free-Riding Ledger)</h3>
        <span class="badge badge-cyan">Zero Free-Riding Audit Active</span>
      </div>
      <table class="custom-table">
        <thead>
          <tr>
            <th>Member</th>
            <th>Role</th>
            <th>Verified Deliverables</th>
            <th>Complexity Points</th>
            <th>Peer Review %</th>
            <th>On-Time Rate</th>
            <th>Overall Fair Score</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${state.members.filter(m => m.role === 'member' || m.role === 'pm').map(m => {
            const isIshan = m.name === 'Ishan';
            return `
              <tr style="${isIshan ? 'background: rgba(244, 63, 94, 0.06);' : ''}">
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="assignee-avatar-sm" style="${isIshan ? 'background: #991b1b; color: #fff;' : ''}">${m.avatar}</div>
                    <div>
                      <strong style="${isIshan ? 'color: var(--accent-rose);' : ''}">${m.name}</strong>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${m.email}</div>
                    </div>
                  </div>
                </td>
                <td><span class="badge badge-neutral">${m.roleTitle}</span></td>
                <td><strong>${m.verifiedDeliverables}</strong> approved PRs</td>
                <td><strong style="color: ${isIshan ? 'var(--accent-rose)' : 'var(--accent-cyan)'};">${m.complexityPoints} pts</strong></td>
                <td>${m.collaborationRate}%</td>
                <td>${m.onTimeDeliveryRate}%</td>
                <td>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <span class="font-mono" style="font-weight: 800; font-size: 1.05rem; color: ${m.score >= 85 ? 'var(--accent-emerald)' : m.score >= 70 ? 'var(--accent-amber)' : 'var(--accent-rose)'};">
                      ${m.score}%
                    </span>
                    ${isIshan ? `<span class="badge badge-rose">LOWEST (Flagged)</span>` : ''}
                  </div>
                </td>
                <td>
                  <button class="btn btn-outline btn-sm" onclick="openMemberProofModal('${m.name}')">Inspect Proofs</button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;

  setTimeout(() => {
    ChartEngine.renderRadarChart('radar-chart-svg', state.members);
    ChartEngine.renderContributionBars('analytics-contribution-bars', state.members);
  }, 50);
}

// ==========================================================================
// SCREEN 5: TASK SUBMISSION AND REVIEW WORKFLOW
// ==========================================================================
function renderSubmissionsView(container, state) {
  const pendingSubs = state.submissions.filter(s => s.status === 'pending');

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>Task Deliverable Submission &amp; Verification</h1>
        <p class="view-subtitle">End-to-End Cryptographic Evidence Proofs &amp; Code Review Queue (IST)</p>
      </div>
      <div class="view-actions-group">
        <span class="badge badge-amber">${pendingSubs.length} Submissions Awaiting Approval</span>
      </div>
    </div>

    <div class="submission-layout">
      <!-- Left: Submit Work Form (Member perspective) -->
      <div class="submission-form-card">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h3 style="font-size: 1.15rem;">Submit Task Deliverable</h3>
          <span class="badge badge-cyan">Contributor Portal (${state.currentUser.persona})</span>
        </div>
        <p style="font-size: 0.85rem; color: var(--text-secondary);">
          Provide verifiable evidence (Git commit, test logs, demo URL) for automated complexity credit attribution.
        </p>

        <form id="deliverable-submission-form" onsubmit="handleFormDeliverableSubmit(event)">
          <div class="form-group" style="margin-bottom: 14px;">
            <label class="form-label">Select Active Task</label>
            <select id="sub-task-select" required>
              ${state.tasks.filter(t => t.status !== 'completed').map(t => `
                <option value="${t.id}">${t.id} - ${t.title} (${t.assigneeName} • ${t.complexityWeight}x Weight)</option>
              `).join('')}
            </select>
          </div>

          <div class="form-group" style="margin-bottom: 14px;">
            <label class="form-label">
              <span>Git Repository / Commit Hash</span>
              <button type="button" class="btn btn-ghost btn-sm" style="font-size: 0.72rem; padding: 2px 6px;" onclick="autoFillCommitHash()">Autofill Hash</button>
            </label>
            <input type="text" id="sub-commit-hash" placeholder="e.g. 7f9d8a2bc41" value="7b8d11ca9f021e8" required />
          </div>

          <div class="form-group" style="margin-bottom: 14px;">
            <label class="form-label">Live Demo / Artifact Deployment URL</label>
            <input type="url" id="sub-demo-url" placeholder="https://platform.aetheris.dev/analytics" value="https://telemetry.aetheris.dev/radar-sim" />
          </div>

          <div class="form-group" style="margin-bottom: 14px;">
            <label class="form-label">Execution Logs &amp; Technical Proof Summary</label>
            <textarea id="sub-notes" rows="3" placeholder="Summarize execution logs, passing tests, and performance results..." required>All 48 unit and integration test cases passed. Zero memory leaks detected under high concurrency stress load.</textarea>
          </div>

          <div class="file-dropzone" onclick="simulateFileUpload()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color: var(--accent-cyan); margin: 0 auto 8px; display: block;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <div style="font-weight: 600; font-size: 0.85rem;" id="dropzone-label">Drop benchmark logs, test outputs, or specs here</div>
            <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">Attached: <strong>flight_benchmarks_v3.log (420 KB)</strong></div>
          </div>

          <button type="submit" class="btn btn-primary" style="width: 100%; margin-top: 20px;">
            Submit Deliverable for Verification →
          </button>
        </form>
      </div>

      <!-- Right: Pending Review Queue (Manager perspective) -->
      <div style="display: flex; flex-direction: column; gap: 20px;">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <h3 style="font-size: 1.15rem;">Review &amp; Verification Queue</h3>
          <span class="badge badge-amber">${pendingSubs.length} Pending</span>
        </div>

        <div class="review-cards-list">
          ${pendingSubs.map(sub => `
            <div class="review-card ${sub.complexityPoints >= 4.0 ? 'urgent' : ''}">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div style="display: flex; align-items: center; gap: 10px;">
                  <div class="assignee-avatar-sm">${sub.memberAvatar}</div>
                  <div>
                    <strong>${sub.memberName}</strong>
                    <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${sub.submittedAt}</div>
                  </div>
                </div>
                <span class="badge badge-cyan">${sub.complexityPoints}x Weight</span>
              </div>

              <div>
                <strong style="font-size: 1rem; color: #fff;">${sub.taskTitle}</strong>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 6px;">${sub.notes}</p>
              </div>

              <div class="proof-snippet-box">
                <div style="color: var(--text-muted); margin-bottom: 4px;">// Git Commit Delta Snippet (${sub.commitHash.slice(0, 10)})</div>
                <pre style="margin: 0; font-family: inherit;">${sub.diffPreview || '@@ -1,4 +1,7 @@\n+ Verified reproducible deliverable'}</pre>
              </div>

              <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 10px; border-top: 1px solid var(--border-subtle);">
                <a href="${sub.demoUrl}" target="_blank" class="font-mono" style="font-size: 0.75rem; color: var(--accent-cyan); text-decoration: underline;">
                  Launch Live Demo ↗
                </a>
                <div style="display: flex; gap: 8px;">
                  <button class="btn btn-outline btn-sm" onclick="handleRejectSubmission('${sub.id}')">Request Revisions</button>
                  <button class="btn btn-primary btn-sm" onclick="handleApproveSubmission('${sub.id}')">Approve Deliverable ✔</button>
                </div>
              </div>
            </div>
          `).join('')}

          ${pendingSubs.length === 0 ? `
            <div class="glass-panel" style="padding: 40px; text-align: center; color: var(--text-muted);">
              All deliverables verified! No pending reviews in queue.
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

// Submission Form Handler
window.handleFormDeliverableSubmit = function(event) {
  event.preventDefault();
  const taskId = document.getElementById('sub-task-select').value;
  const commitHash = document.getElementById('sub-commit-hash').value;
  const demoUrl = document.getElementById('sub-demo-url').value;
  const notes = document.getElementById('sub-notes').value;

  store.submitDeliverable({
    taskId,
    commitHash,
    demoUrl,
    notes,
    files: ['benchmarks_verified.log', 'telemetry_dump.json']
  });
};

window.autoFillCommitHash = function() {
  const hash = Math.random().toString(16).slice(2, 12);
  const input = document.getElementById('sub-commit-hash');
  if (input) input.value = hash;
  store.showToast('Autofilled Hash', `Simulated Git commit SHA: ${hash.slice(0, 7)}`, 'info');
};

window.simulateFileUpload = function() {
  const lbl = document.getElementById('dropzone-label');
  if (lbl) {
    lbl.textContent = '✔ File attached: hardware_hil_oscilloscope.csv (2.1 MB)';
    lbl.style.color = 'var(--accent-emerald)';
  }
  store.showToast('Artifact Attached', 'hardware_hil_oscilloscope.csv verified and ready for submission', 'success');
};

window.handleApproveSubmission = function(subId) {
  store.approveSubmission(subId, 'Rigorous algorithmic implementation verified by Karan. All criteria met.');
};

window.handleRejectSubmission = function(subId) {
  const reason = prompt('Specify revisions requested for contributor:', 'Please include edge-case benchmark plots under 25 m/s gust conditions.');
  if (reason) {
    store.rejectSubmission(subId, reason);
  }
};

// ==========================================================================
// SCREEN 6: AI INSIGHTS AND RISK DETECTION ("AETHERIS CORE")
// ==========================================================================
function renderAiInsightsView(container, state) {
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <div style="display: flex; align-items: center; gap: 10px;">
          <h1>Aetheris Autonomous AI Diagnostics</h1>
          <span class="badge badge-violet">Continuous Monitoring Active</span>
        </div>
        <p class="view-subtitle">Predictive Sprint Risk Detection • Workload Imbalance • Anti-Free-Riding Anomaly Shield</p>
      </div>
      <div class="view-actions-group">
        <button class="btn btn-primary btn-sm" onclick="store.executeAiRebalance()">⚡ Auto-Rebalance Workload</button>
      </div>
    </div>

    <!-- AI Hero Banner -->
    <div class="ai-insights-hero">
      <div>
        <div style="font-weight: 800; font-size: 1.25rem; font-family: var(--font-display); margin-bottom: 6px;">
          Autonomous Telemetry Scanner: 4 Optimization Opportunities
        </div>
        <p style="color: var(--text-secondary); font-size: 0.9rem; max-width: 780px;">
          Aetheris Core continuously models sprint velocity, review wait times, individual workload stress, and deliverable cryptographic proofs to preempt milestone slippage.
        </p>
      </div>
      <div style="text-align: right; font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-cyan);">
        LOCATION: NEW DELHI, INDIA<br/>
        INFERENCE LATENCY: 14ms
      </div>
    </div>

    <!-- 4 AI Risk Cards Grid -->
    <div class="ai-risk-grid">
      ${state.aiRisks.map(risk => `
        <div class="ai-risk-card severity-${risk.severity}">
          <div>
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
              <span class="badge ${risk.severity === 'critical' ? 'badge-rose' : risk.severity === 'warning' ? 'badge-amber' : 'badge-cyan'}">
                ${risk.severity.toUpperCase()}
              </span>
              <span class="font-mono" style="font-size: 0.72rem; color: var(--text-muted);">${risk.category}</span>
            </div>
            <h3 style="font-size: 1.2rem; margin-bottom: 8px;">${risk.title}</h3>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 14px;">
              ${risk.explanation}
            </p>
            <div class="ai-prompt-box">
              <strong style="color: #fff;">Impact:</strong> ${risk.impact}
            </div>
          </div>

          <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
            <span style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-dim);">${risk.affectedTask}</span>
            <button class="btn btn-outline btn-sm" onclick="handleAiAction('${risk.actionType}')">
              ${risk.actionLabel}
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

window.handleAiAction = function(actionType) {
  if (actionType === 'rebalance_workload') {
    store.executeAiRebalance();
  } else if (actionType === 'approve_fast_track') {
    store.showToast('Escalated Reviewer', 'Ketan Verma designated as secondary reviewer for TSK-104', 'info');
  } else if (actionType === 'dispatch_mentor_checkin') {
    alert(`[AETHERIS MENTORSHIP INTERVENTION: ISHAN]\n\n• Lowest Performance Score: 42.5%\n• Completed Tasks: 1/3 (TSK-108 overdue by 9 days)\n• Action Taken: Dispatched 1-on-1 pairing session with Karan (PM).\n• Academic Status: Placed on Capstone Remediation Watch.`);
    store.showToast('Mentorship Notice Dispatched', 'Automated check-in notice sent to Ishan and Karan', 'warning');
  } else if (actionType === 'generate_catchup_plan') {
    alert(`[AETHERIS AI MITIGATION PLAN]\n\n1. Parallelize WebRTC streaming integration with sensor calibration (+1.4 days gain).\n2. Offload stress benchmark scripts to Jeet.\n3. Fast-track automated CI verification on Aditya's CAN-bus.\n\nPredicted outcome: Sprint 4 finishes on time on Nov 20!`);
  } else {
    store.showToast('Action Dispatched', 'Automated check-in dispatched to assigned engineer', 'info');
  }
};

// ==========================================================================
// SCREEN 7: USER AND PERMISSION MANAGEMENT (RBAC)
// ==========================================================================
function renderRbacView(container, state) {
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>User &amp; Role-Based Access Control (RBAC)</h1>
        <p class="view-subtitle">Fine-Grained Permission Enforcement Across Team Members in India</p>
      </div>
      <div class="view-actions-group">
        <button class="btn btn-primary btn-sm" onclick="openInviteUserModal()">+ Invite Member</button>
      </div>
    </div>

    <!-- RBAC Matrix Card -->
    <div class="data-table-container" style="margin-bottom: 32px;">
      <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
        <h3 style="font-size: 1.15rem;">Authority Governance Matrix</h3>
        <span class="badge badge-violet">12 Security Gates Active</span>
      </div>
      <table class="custom-table rbac-matrix-table">
        <thead>
          <tr>
            <th style="width: 40%;">Platform Capability / Permission Gate</th>
            <th>Admin (Ketan Verma)</th>
            <th>Project Lead (Karan)</th>
            <th>Team Member (Arjun)</th>
            <th>Faculty (Prof. Ketan Kumar)</th>
          </tr>
        </thead>
        <tbody>
          ${state.rbacMatrix.map(row => `
            <tr>
              <td><strong>${row.permission}</strong></td>
              <td>${row.admin ? '<span class="permission-check">✔</span>' : '<span class="permission-cross">✘</span>'}</td>
              <td>${row.pm ? '<span class="permission-check">✔</span>' : '<span class="permission-cross">✘</span>'}</td>
              <td>${row.member ? '<span class="permission-check">✔</span>' : '<span class="permission-cross">✘</span>'}</td>
              <td>${row.faculty ? '<span class="permission-check">✔</span>' : '<span class="permission-cross">✘</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <!-- Active User Directory -->
    <div class="data-table-container">
      <div style="padding: 20px 24px; border-bottom: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
        <h3 style="font-size: 1.15rem;">Active Platform Users &amp; Directory</h3>
        <span class="font-mono" style="font-size: 0.8rem; color: var(--text-muted);">${state.members.length} Total Users</span>
      </div>
      <table class="custom-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Assigned Role</th>
            <th>Department / Title</th>
            <th>Contribution Index</th>
            <th>Status</th>
            <th>Change Role</th>
          </tr>
        </thead>
        <tbody>
          ${state.members.map(m => {
            const isIshan = m.name === 'Ishan';
            return `
              <tr style="${isIshan ? 'background: rgba(244,63,94,0.06);' : ''}">
                <td>
                  <div style="display: flex; align-items: center; gap: 10px;">
                    <div class="assignee-avatar-sm" style="${isIshan ? 'background: #991b1b; color: #fff;' : ''}">${m.avatar}</div>
                    <div>
                      <strong style="${isIshan ? 'color: var(--accent-rose);' : ''}">${m.name}</strong>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">${m.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="badge badge-${m.role === 'admin' ? 'violet' : m.role === 'pm' ? 'cyan' : m.role === 'faculty' ? 'amber' : 'emerald'}">
                    ${m.role.toUpperCase()}
                  </span>
                </td>
                <td>${m.roleTitle}</td>
                <td>
                  <strong style="color: ${isIshan ? 'var(--accent-rose)' : 'var(--accent-cyan)'}; font-family: var(--font-mono);">
                    ${m.score}%
                  </strong>
                </td>
                <td>
                  <span class="badge ${isIshan ? 'badge-rose' : 'badge-emerald'}">
                    ${m.status}
                  </span>
                </td>
                <td>
                  <select class="task-quick-move-select" onchange="handleUserRoleChange('${m.id}', this.value)">
                    <option value="admin" ${m.role === 'admin' ? 'selected' : ''}>Admin</option>
                    <option value="pm" ${m.role === 'pm' ? 'selected' : ''}>Project Manager</option>
                    <option value="member" ${m.role === 'member' ? 'selected' : ''}>Team Member</option>
                    <option value="faculty" ${m.role === 'faculty' ? 'selected' : ''}>Faculty Evaluator</option>
                  </select>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

window.handleUserRoleChange = function(memberId, newRole) {
  const member = store.state.members.find(m => m.id === memberId);
  if (member) {
    member.role = newRole;
    store.addAuditLog('USER_ROLE_CHANGED', `Changed ${member.name}'s role to ${newRole.toUpperCase()}`);
    store.showToast('Role Updated', `${member.name} assigned to ${newRole.toUpperCase()}`, 'success');
    store.saveState();
  }
};

// ==========================================================================
// SCREEN 8: REPORTS AND EVALUATION (FACULTY & STAKEHOLDER PORTAL)
// ==========================================================================
function renderReportsView(container, state) {
  const rubric = state.evaluationRubric;
  const totalScore = rubric.criteria.reduce((sum, c) => sum + c.current, 0);
  const maxPossible = rubric.criteria.length * 10;
  const percentage = ((totalScore / maxPossible) * 100).toFixed(1);

  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>Reports &amp; Faculty Evaluation Portal</h1>
        <p class="view-subtitle">Capstone Defense Rubrics • Cryptographic Contribution Audit Export</p>
      </div>
      <div class="view-actions-group">
        <button class="btn btn-outline btn-sm" onclick="window.print()">Print Page</button>
        <button class="btn btn-primary btn-sm" onclick="openOfficialReportModal()">Download Cryptographic PDF Audit →</button>
      </div>
    </div>

    <!-- Official Evaluation Rubric Card -->
    <div class="evaluation-rubric-card">
      <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 18px; margin-bottom: 20px;">
        <div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <h3 style="font-size: 1.3rem;">${rubric.projectName}</h3>
            <span class="badge ${rubric.status === 'Certified & Evaluated' ? 'badge-emerald' : 'badge-amber'}">${rubric.status}</span>
          </div>
          <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px;">
            Lead Evaluator: <strong>${rubric.evaluator}</strong> (${rubric.evaluatorTitle})
          </div>
        </div>

        <div style="text-align: right;">
          <div style="font-family: var(--font-display); font-size: 2.2rem; font-weight: 800; color: var(--accent-cyan); line-height: 1;">
            ${totalScore.toFixed(1)} <span style="font-size: 1.2rem; color: var(--text-muted);">/ ${maxPossible}</span>
          </div>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--accent-emerald);">Overall Grade: ${percentage}% (Grade: A)</div>
        </div>
      </div>

      <!-- Rubric Sliders Grid -->
      <div class="rubric-slider-group">
        ${rubric.criteria.map(c => `
          <div class="rubric-item">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <strong style="font-size: 0.95rem;">${c.name}</strong>
              <span class="rubric-score-display" id="score-display-${c.id}">${c.current} / 10</span>
            </div>
            <p style="font-size: 0.78rem; color: var(--text-secondary);">${c.desc}</p>
            <div class="rubric-slider-row">
              <input type="range" min="1" max="10" step="0.5" value="${c.current}" oninput="handleRubricSliderChange('${c.id}', this.value)" />
            </div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top: 20px;">
        <label class="form-label" style="margin-bottom: 8px;">Faculty Qualitative Defense Assessment (Prof. Ketan Kumar)</label>
        <textarea id="faculty-feedback-text" rows="4">${rubric.qualitativeFeedback}</textarea>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px; padding-top: 18px; border-top: 1px solid var(--border-subtle);">
        <div style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);">
          Cryptographic Hash: <span style="color: var(--accent-cyan);">${rubric.verifiedHash.slice(0, 18)}...</span>
        </div>
        <button class="btn btn-primary" onclick="handleSaveOfficialEvaluation()">
          Certify &amp; Submit Official Grade ✔
        </button>
      </div>
    </div>
  `;
}

window.handleRubricSliderChange = function(criterionId, value) {
  const disp = document.getElementById(`score-display-${criterionId}`);
  if (disp) disp.textContent = `${parseFloat(value).toFixed(1)} / 10`;
  store.updateRubricScore(criterionId, value);
};

window.handleSaveOfficialEvaluation = function() {
  const text = document.getElementById('faculty-feedback-text').value;
  store.submitEvaluation(text);
};

// ==========================================================================
// SCREEN 9: SYSTEM AUDIT TRAIL
// ==========================================================================
function renderAuditLogsView(container, state) {
  container.innerHTML = `
    <div class="view-header">
      <div class="view-title-group">
        <h1>Cryptographic Platform Audit Trail (IST)</h1>
        <p class="view-subtitle">Tamper-Proof Chronological Action Ledger with SHA-256 State Signatures</p>
      </div>
      <div class="view-actions-group">
        <span class="badge badge-emerald">SHA-256 Ledger Verified</span>
      </div>
    </div>

    <div class="data-table-container">
      <table class="custom-table font-mono">
        <thead>
          <tr>
            <th>Log ID</th>
            <th>Timestamp (IST)</th>
            <th>Actor</th>
            <th>Action Code</th>
            <th>Target Resource</th>
            <th>Session IP</th>
            <th>State Hash</th>
          </tr>
        </thead>
        <tbody>
          ${state.auditLogs.map(log => `
            <tr>
              <td style="color: var(--text-muted);">${log.id}</td>
              <td style="font-size: 0.78rem;">${log.timestamp}</td>
              <td><strong>${log.actor}</strong></td>
              <td>
                <span class="badge ${log.action.includes('SUBMIT') ? 'badge-cyan' : log.action.includes('APPROVE') ? 'badge-emerald' : log.action.includes('ANOMALY') ? 'badge-rose' : 'badge-neutral'}">
                  ${log.action}
                </span>
              </td>
              <td>${log.target}</td>
              <td style="color: var(--text-dim); font-size: 0.75rem;">${log.ip}</td>
              <td style="color: var(--accent-cyan);">${log.hash}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ==========================================================================
// MODALS MANAGEMENT
// ==========================================================================

// 1. Official Cryptographic PDF Audit Modal
window.openOfficialReportModal = function() {
  const state = store.state;
  const project = state.projects.find(p => p.id === state.activeProjectId) || state.projects[0];
  const rubric = state.evaluationRubric;

  const modal = document.getElementById('report-modal');
  const container = document.getElementById('report-modal-content');
  if (!modal || !container) return;

  const istNow = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

  container.innerHTML = `
    <div class="report-document">
      <div class="report-watermark">OFFICIAL AUDIT</div>
      
      <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #ffffff; padding-bottom: 20px; margin-bottom: 24px;">
        <div>
          <div style="font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.1em; color: var(--accent-cyan);">AETHERIS PLATFORM // CAPSTONE DEFENSE VERIFICATION</div>
          <h2 style="font-size: 1.8rem; font-family: var(--font-display); margin-top: 4px;">${project.name}</h2>
          <div style="font-size: 0.85rem; color: #94a3b8;">Code: ${project.code} • Lead: ${project.lead}</div>
        </div>
        <div style="text-align: right; font-family: var(--font-mono); font-size: 0.78rem;">
          <div>DATE: ${istNow}</div>
          <div>STATUS: CERTIFIED GRADE: A (92.0%)</div>
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <h4 style="margin-bottom: 12px; font-size: 1rem; color: var(--accent-cyan);">1. Executive Team Contribution Summary</h4>
        <div style="display: flex; flex-direction: column; gap: 8px;">
          ${state.members.filter(m => m.role === 'member' || m.role === 'pm').map(m => {
            const isIshan = m.name === 'Ishan';
            return `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid var(--border-subtle); padding-bottom: 4px; font-size: 0.85rem; ${isIshan ? 'color: var(--accent-rose); font-weight: 700;' : ''}">
                <span>${m.name} (${m.roleTitle}) ${isIshan ? '[LOWEST PERFORMANCE FLAGGED]' : ''}</span>
                <span class="font-mono" style="font-weight: 700;">${m.verifiedDeliverables} PRs • ${m.complexityPoints} pts • <strong>${m.score}% Score</strong></span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <h4 style="margin-bottom: 12px; font-size: 1rem; color: var(--accent-cyan);">2. Faculty Evaluation Rubric Details</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          ${rubric.criteria.map(c => `
            <div style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 6px;">
              <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 0.85rem;">
                <span>${c.name}</span>
                <span class="font-mono" style="color: var(--accent-cyan);">${c.current}/10</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <h4 style="margin-bottom: 8px; font-size: 1rem; color: var(--accent-cyan);">3. Faculty Committee Assessment</h4>
        <p style="font-size: 0.85rem; line-height: 1.5; color: #cbd5e1; font-style: italic;">
          "${rubric.qualitativeFeedback}"
        </p>
      </div>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid var(--border-medium); display: flex; justify-content: space-between; align-items: flex-end;">
        <div>
          <div style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted); margin-bottom: 4px;">CRYPTOGRAPHIC PROOF CERTIFICATE</div>
          <div class="report-hash-badge">${rubric.verifiedHash}</div>
        </div>
        <div style="text-align: right; font-family: var(--font-mono); font-size: 0.8rem;">
          <div style="font-weight: 700;">Prof. Ketan Kumar</div>
          <div style="color: var(--text-muted); font-size: 0.7rem;">Academic Capstone Director Signature Verified</div>
        </div>
      </div>
    </div>
  `;

  modal.classList.add('active');
};

// 2. Create Task Modal
window.openCreateTaskModal = function(defaultStatus = 'todo') {
  const modal = document.getElementById('create-task-modal');
  if (modal) modal.classList.add('active');
};

// 3. Create Project Modal
window.openCreateProjectModal = function() {
  const modal = document.getElementById('create-project-modal');
  if (modal) modal.classList.add('active');
};

// 4. Invite User Modal
window.openInviteUserModal = function() {
  const modal = document.getElementById('invite-user-modal');
  if (modal) modal.classList.add('active');
};

// 5. Member Proof Modal
window.openMemberProofModal = function(memberName) {
  const member = store.state.members.find(m => m.name === memberName);
  if (!member) return;
  const isIshan = member.name === 'Ishan';
  alert(`[CRYPTOGRAPHIC PROOF CHAIN FOR ${member.name.toUpperCase()}]\n\n• Verified Deliverables: ${member.verifiedDeliverables} PRs approved\n• Total Task Complexity: ${member.complexityPoints} points\n• Peer Review Rate: ${member.collaborationRate}%\n• Milestone Discipline: ${member.onTimeDeliveryRate}%\n• Explainable Score: ${member.score}%\n\nStatus: ${isIshan ? 'CRITICAL DEFICIT: Lowest performance in team. Anti-Free-Riding Flagged.' : 'PASSED with zero anomalies detected.'}`);
};

// 6. Task Specific Proof Submission
window.openSubmitModalForTask = function(taskId) {
  store.setActiveView('submissions');
  setTimeout(() => {
    const sel = document.getElementById('sub-task-select');
    if (sel) sel.value = taskId;
  }, 100);
};

// Close all modals
window.closeAllModals = function() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
};

// Setup Global Event Handlers
function setupGlobalEvents() {
  document.querySelectorAll('.sidebar-nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const view = link.getAttribute('data-view');
      if (view) store.setActiveView(view);
    });
  });

  const prjSelect = document.getElementById('topbar-project-select');
  if (prjSelect) {
    prjSelect.addEventListener('change', (e) => {
      store.setActiveProject(e.target.value);
    });
  }

  window.toggleSidebar = function() {
    const sidebar = document.querySelector('.app-sidebar');
    const toggleBtn = document.getElementById('sidebar-toggle-btn');
    if (sidebar) {
      sidebar.classList.toggle('collapsed');
      if (toggleBtn) {
        toggleBtn.classList.toggle('active', sidebar.classList.contains('collapsed'));
      }
    }
  };

  const sidebarToggle = document.getElementById('sidebar-toggle-btn');
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', (e) => {
      e.preventDefault();
      window.toggleSidebar();
    });
  }

  const notifBtn = document.getElementById('topbar-notif-btn');
  const notifDropdown = document.getElementById('topbar-notif-dropdown');
  if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      notifDropdown.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!notifDropdown.contains(e.target)) {
        notifDropdown.classList.remove('active');
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const searchInput = document.getElementById('topbar-search-input');
      if (searchInput) searchInput.focus();
    }
  });

  const createTaskForm = document.getElementById('create-task-form');
  if (createTaskForm) {
    createTaskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = document.getElementById('task-title-input').value;
      const desc = document.getElementById('task-desc-input').value;
      const assigneeId = document.getElementById('task-assignee-input').value;
      const priority = document.getElementById('task-priority-input').value;
      const weight = document.getElementById('task-weight-input').value;
      const dueDate = document.getElementById('task-due-input').value;

      const member = store.state.members.find(m => m.id === assigneeId);

      store.createTask({
        title,
        description: desc,
        assigneeId,
        assigneeName: member ? member.name : 'Arjun',
        priority,
        complexityWeight: weight,
        dueDate
      });

      closeAllModals();
      createTaskForm.reset();
    });
  }

  const createProjectForm = document.getElementById('create-project-form');
  if (createProjectForm) {
    createProjectForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('proj-name-input').value;
      const code = document.getElementById('proj-code-input').value;
      const desc = document.getElementById('proj-desc-input').value;
      const complexity = document.getElementById('proj-complexity-input').value;
      const deadline = document.getElementById('proj-deadline-input').value;

      store.createProject({
        name,
        code,
        description: desc,
        totalComplexity: complexity,
        deadline
      });

      closeAllModals();
      createProjectForm.reset();
    });
  }
}
