/* ==========================================================================
   AETHERIS // STATE MANAGEMENT STORE (INDIAN TIMELINE & TEAM MEMBERS)
   Reactive state, persistence in localStorage, audit logging & event triggers
   ========================================================================== */

class AppStore {
  constructor() {
    this.storageKey = 'AETHERIS_PLATFORM_STATE_V3'; // Bumped for new Indian team dataset
    this.subscribers = [];
    this.loadState();
  }

  loadState() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.state = {
          ...INITIAL_DATA,
          ...parsed
        };
      } catch (e) {
        console.warn('Failed to parse cached state, restoring fresh data', e);
        this.resetState();
      }
    } else {
      this.resetState();
    }
  }

  resetState() {
    this.state = {
      isLoggedIn: false,
      currentRole: 'pm', // default preview role is Karan (Project Lead)
      currentUser: INITIAL_DATA.roles.pm,
      activeView: 'dashboard',
      activeProjectId: 'PRJ-01',
      taskFilter: {
        assignee: 'all',
        priority: 'all',
        search: ''
      },
      projects: JSON.parse(JSON.stringify(INITIAL_DATA.projects)),
      members: JSON.parse(JSON.stringify(INITIAL_DATA.members)),
      tasks: JSON.parse(JSON.stringify(INITIAL_DATA.tasks)),
      submissions: JSON.parse(JSON.stringify(INITIAL_DATA.submissions)),
      aiRisks: JSON.parse(JSON.stringify(INITIAL_DATA.aiRisks)),
      rbacMatrix: JSON.parse(JSON.stringify(INITIAL_DATA.rbacMatrix)),
      evaluationRubric: JSON.parse(JSON.stringify(INITIAL_DATA.evaluationRubric)),
      auditLogs: JSON.parse(JSON.stringify(INITIAL_DATA.auditLogs)),
      notifications: JSON.parse(JSON.stringify(INITIAL_DATA.notifications))
    };
    this.saveState();
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.error('Error saving state', e);
    }
    this.notifySubscribers();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  notifySubscribers() {
    this.subscribers.forEach(cb => {
      try {
        cb(this.state);
      } catch (err) {
        console.error('Subscriber error', err);
      }
    });
  }

  // --- Actions ---

  login(roleId = 'pm') {
    const roleInfo = INITIAL_DATA.roles[roleId] || INITIAL_DATA.roles.pm;
    this.state.isLoggedIn = true;
    this.state.currentRole = roleId;
    this.state.currentUser = roleInfo;
    this.state.activeView = 'dashboard';

    this.addAuditLog('USER_AUTHENTICATED', `Logged in as ${roleInfo.name} (${roleInfo.persona})`);
    this.showToast('Authentication Successful', `Welcome, ${roleInfo.persona} [${roleInfo.name}]`, 'success');
    this.saveState();
  }

  logout() {
    this.addAuditLog('USER_LOGOUT', `Session terminated for ${this.state.currentUser.persona}`);
    this.state.isLoggedIn = false;
    this.showToast('Session Ended', 'Logged out to introduction portal', 'info');
    this.saveState();
  }

  switchRole(newRoleId) {
    if (!INITIAL_DATA.roles[newRoleId]) return;
    const oldRole = this.state.currentUser.name;
    const newRole = INITIAL_DATA.roles[newRoleId];
    this.state.currentRole = newRoleId;
    this.state.currentUser = newRole;

    this.addAuditLog('ROLE_SWITCHED', `Switched active RBAC context from ${oldRole} to ${newRole.name}`);
    this.showToast('RBAC Role Switched', `Active authority is now: ${newRole.name} (${newRole.persona})`, 'info');
    this.saveState();
  }

  setActiveView(viewId) {
    this.state.activeView = viewId;
    this.saveState();
  }

  setActiveProject(projectId) {
    this.state.activeProjectId = projectId;
    const project = this.state.projects.find(p => p.id === projectId);
    if (project) {
      this.showToast('Project Switched', `Active workspace: ${project.name}`, 'info');
    }
    this.saveState();
  }

  setTaskFilter(filters) {
    this.state.taskFilter = {
      ...this.state.taskFilter,
      ...filters
    };
    this.saveState();
  }

  // Task Transitions
  moveTaskStatus(taskId, newStatus) {
    const task = this.state.tasks.find(t => t.id === taskId);
    if (!task) return;

    const oldStatus = task.status;
    task.status = newStatus;

    if (newStatus === 'completed') {
      task.subtasksDone = task.subtasksTotal;
      // Increment assignee verified metrics
      const assignee = this.state.members.find(m => m.id === task.assigneeId);
      if (assignee) {
        assignee.verifiedDeliverables += 1;
        assignee.complexityPoints += task.complexityWeight;
        assignee.score = Math.min(99.5, parseFloat((assignee.score + 0.8).toFixed(1)));
      }
      this.recalculateProjectProgress(task.projectId);
    }

    this.addAuditLog('TASK_STATUS_UPDATED', `${task.id} (${task.title.slice(0, 24)}...) transitioned ${oldStatus} → ${newStatus}`);
    this.showToast('Task Transitioned', `${task.id} is now ${newStatus.replace('_', ' ').toUpperCase()}`, 'success');
    this.saveState();
  }

  createTask(taskData) {
    const newId = `TSK-${110 + this.state.tasks.length + 1}`;
    const newTask = {
      id: newId,
      projectId: this.state.activeProjectId,
      title: taskData.title || 'Untitled Mission Task',
      description: taskData.description || 'Verified deliverable assignment.',
      assigneeId: taskData.assigneeId || 'usr-01',
      assigneeName: taskData.assigneeName || 'Arjun',
      status: 'todo',
      priority: taskData.priority || 'medium',
      complexityWeight: parseFloat(taskData.complexityWeight) || 3.0,
      dueDate: taskData.dueDate || '2026-11-15',
      subtasksDone: 0,
      subtasksTotal: parseInt(taskData.subtasksTotal) || 3,
      hasEvidence: false
    };

    this.state.tasks.unshift(newTask);
    this.addAuditLog('TASK_CREATED', `Created ${newId}: ${newTask.title.slice(0, 30)} (Weight: ${newTask.complexityWeight}x)`);
    this.showToast('Task Dispatched', `${newId} assigned to ${newTask.assigneeName}`, 'success');
    this.saveState();
  }

  createProject(projectData) {
    const newId = `PRJ-0${this.state.projects.length + 1}`;
    const newProject = {
      id: newId,
      name: projectData.name || 'New AI Initiative',
      code: projectData.code || 'INITIATIVE',
      description: projectData.description || 'Platform autonomous project.',
      lead: this.state.currentUser.persona,
      status: 'Sprint 1 Initializing',
      progress: 0,
      startDate: new Date().toISOString().split('T')[0],
      deadline: projectData.deadline || '2026-12-31',
      totalComplexity: parseFloat(projectData.totalComplexity) || 25.0,
      completedComplexity: 0,
      activeMembersCount: 4,
      gitRepo: projectData.gitRepo || 'github.com/aetheris-core/initiative'
    };

    this.state.projects.unshift(newProject);
    this.state.activeProjectId = newId;
    this.addAuditLog('PROJECT_CREATED', `Registered ${newId}: ${newProject.name}`);
    this.showToast('Project Created', `${newProject.name} is now active workspace`, 'success');
    this.saveState();
  }

  // Deliverables & Submissions
  submitDeliverable(data) {
    const subId = `SUB-${200 + this.state.submissions.length + 1}`;
    const task = this.state.tasks.find(t => t.id === data.taskId);
    
    // Get Indian formatted time
    const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';

    const newSubmission = {
      id: subId,
      taskId: data.taskId,
      taskTitle: task ? task.title : 'Task Deliverable',
      memberId: this.state.currentUser.id === 'member' ? 'usr-01' : 'usr-03',
      memberName: this.state.currentUser.persona,
      memberAvatar: this.state.currentUser.avatar,
      submittedAt: istTime,
      status: 'pending',
      repoUrl: data.repoUrl || 'github.com/aetheris-core/platform',
      commitHash: data.commitHash || Math.random().toString(16).slice(2, 10),
      demoUrl: data.demoUrl || 'https://aetheris-preview.dev',
      files: data.files && data.files.length ? data.files : ['verification_benchmark.log', 'deliverable_artifact.pdf'],
      notes: data.notes || 'Execution traces and unit tests verified.',
      complexityPoints: task ? task.complexityWeight : 3.5,
      diffPreview: '@@ -14,6 +14,14 @@ // Verified deliverable delta\n+    bool isVerified = runComprehensiveTestbench();\n+    assert(isVerified == true);\n+    return telemetryDispatchSuccess;'
    };

    this.state.submissions.unshift(newSubmission);
    if (task) {
      task.status = 'in_review';
      task.hasEvidence = true;
      task.commitHash = `git:${newSubmission.commitHash.slice(0, 7)}`;
    }

    this.addAuditLog('DELIVERABLE_SUBMITTED', `Submission ${subId} filed for ${data.taskId} (${newSubmission.commitHash.slice(0, 7)})`);
    this.showToast('Deliverable Submitted', `${subId} sent to Review Queue for PM verification`, 'success');
    this.saveState();
  }

  approveSubmission(subId, feedbackNotes = 'Outstanding technical rigor.') {
    const sub = this.state.submissions.find(s => s.id === subId);
    if (!sub) return;

    const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';

    sub.status = 'approved';
    sub.reviewerName = this.state.currentUser.persona;
    sub.reviewedAt = istTime;
    sub.reviewerNotes = feedbackNotes;

    // Transition associated task
    const task = this.state.tasks.find(t => t.id === sub.taskId);
    if (task) {
      task.status = 'completed';
      task.subtasksDone = task.subtasksTotal;
      this.recalculateProjectProgress(task.projectId);
    }

    // Award contribution credits
    const member = this.state.members.find(m => m.name === sub.memberName || m.id === sub.memberId);
    if (member) {
      member.verifiedDeliverables += 1;
      member.score = Math.min(99.8, parseFloat((member.score + 1.2).toFixed(1)));
    }

    this.addAuditLog('SUBMISSION_APPROVED', `Approved ${subId} by ${this.state.currentUser.persona}. Granted full contribution credits.`);
    this.showToast('Submission Approved', `Merit score updated for ${sub.memberName}`, 'success');
    this.saveState();
  }

  rejectSubmission(subId, revisionNotes = 'Please provide reproducible benchmark logs.') {
    const sub = this.state.submissions.find(s => s.id === subId);
    if (!sub) return;

    const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';

    sub.status = 'revisions_requested';
    sub.reviewerName = this.state.currentUser.persona;
    sub.reviewedAt = istTime;
    sub.reviewerNotes = revisionNotes;

    // Send task back to in_progress
    const task = this.state.tasks.find(t => t.id === sub.taskId);
    if (task) {
      task.status = 'in_progress';
    }

    this.addAuditLog('SUBMISSION_REVISED', `Revisions requested on ${subId}. Feedback: ${revisionNotes}`);
    this.showToast('Revisions Requested', `${sub.taskId} returned to In-Progress status`, 'warning');
    this.saveState();
  }

  // Autonomous AI Rebalance
  executeAiRebalance() {
    // Rebalance an overloaded task from Arjun to Jeet
    const heavyTask = this.state.tasks.find(t => t.id === 'TSK-109' || (t.assigneeName === 'Arjun' && t.status === 'todo'));
    if (heavyTask) {
      const oldAssignee = heavyTask.assigneeName;
      heavyTask.assigneeId = 'usr-04';
      heavyTask.assigneeName = 'Jeet';

      // Adjust member stats
      const arjun = this.state.members.find(m => m.id === 'usr-01');
      const jeet = this.state.members.find(m => m.id === 'usr-04');
      if (arjun && jeet) {
        arjun.complexityPoints -= heavyTask.complexityWeight;
        jeet.complexityPoints += heavyTask.complexityWeight;
        jeet.score = Math.min(95, parseFloat((jeet.score + 5.2).toFixed(1)));
      }

      // Mark the AI risk as resolved or updated
      const risk = this.state.aiRisks.find(r => r.id === 'RISK-02');
      if (risk) {
        risk.severity = 'info';
        risk.explanation = 'Autonomous rebalance successfully executed. Workload Gini index normalized to 0.35.';
        risk.actionLabel = 'Rebalance Applied (Optimal)';
      }

      this.addAuditLog('AI_AUTONOMOUS_REBALANCE', `Aetheris Core reallocated ${heavyTask.id} (${heavyTask.complexityWeight} pts) from ${oldAssignee} to Jeet`);
      this.showToast('AI Workload Rebalance Applied', `Reallocated ${heavyTask.id} to Jeet. Team workload normalized!`, 'success');
      this.saveState();
    } else {
      this.showToast('Workload Already Optimal', 'No pending tasks require immediate redistribution', 'info');
    }
  }

  recalculateProjectProgress(projectId) {
    const prj = this.state.projects.find(p => p.id === projectId);
    if (!prj) return;
    const projectTasks = this.state.tasks.filter(t => t.projectId === projectId);
    if (projectTasks.length === 0) return;
    const completedTasks = projectTasks.filter(t => t.status === 'completed');
    prj.progress = Math.round((completedTasks.length / projectTasks.length) * 100);
  }

  updateRubricScore(criterionId, newScore) {
    const criterion = this.state.evaluationRubric.criteria.find(c => c.id === criterionId);
    if (criterion) {
      criterion.current = parseFloat(newScore);
      this.saveState();
    }
  }

  submitEvaluation(feedbackText) {
    this.state.evaluationRubric.qualitativeFeedback = feedbackText;
    this.state.evaluationRubric.status = 'Certified & Evaluated';
    this.state.evaluationRubric.verifiedHash = '0x' + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
    
    this.addAuditLog('FACULTY_EVALUATION_CERTIFIED', `Official Capstone grade certified by Prof. Ketan Kumar. Hash: ${this.state.evaluationRubric.verifiedHash.slice(0, 12)}...`);
    this.showToast('Evaluation Certified', 'Official capstone grades saved to immutable audit trail', 'success');
    this.saveState();
  }

  addAuditLog(action, target, actorOverride = null) {
    const actor = actorOverride || `${this.state.currentUser.persona} (${this.state.currentUser.avatar})`;
    const role = this.state.currentRole;
    
    // Indian IST timestamp
    const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST';
    const logId = `LOG-${880 + this.state.auditLogs.length + 1}`;
    const hash = '0x' + Math.random().toString(16).slice(2, 6) + '...' + Math.random().toString(16).slice(2, 5);

    const newLog = {
      id: logId,
      timestamp: istTime,
      actor: actor,
      role: role,
      action: action,
      target: target,
      ip: '192.168.1.' + Math.floor(Math.random() * 200 + 10),
      hash: hash
    };

    this.state.auditLogs.unshift(newLog);
  }

  showToast(title, desc, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-desc">${desc}</div>
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Global store instance
window.store = new AppStore();
