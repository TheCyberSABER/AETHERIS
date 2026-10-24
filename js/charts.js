/* ==========================================================================
   AETHERIS // CHARTS & VISUALIZATION ENGINE (INDIAN TEAM NAMES & ISHAN HIGHLIGHT)
   SVG Radar Spider Chart, Stacked Contribution Bars, Circular Progress
   ========================================================================== */

const ChartEngine = {
  // Generate Multi-Axis Radar / Spider Chart
  renderRadarChart(containerId, members) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const size = 380;
    const center = size / 2;
    const radius = 135;
    const axes = [
      { name: 'Verified Deliverables', angle: -Math.PI / 2 },
      { name: 'Task Complexity', angle: 0 },
      { name: 'Collaboration & Review', angle: Math.PI / 2 },
      { name: 'Milestone Discipline', angle: Math.PI }
    ];

    // Background concentric polygon webs (levels 25%, 50%, 75%, 100%)
    let websSvg = '';
    const levels = [0.25, 0.5, 0.75, 1.0];
    levels.forEach(lvl => {
      const pts = axes.map(axis => {
        const x = center + Math.cos(axis.angle) * radius * lvl;
        const y = center + Math.sin(axis.angle) * radius * lvl;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(' ');

      websSvg += `
        <polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" />
        <text x="${center + 4}" y="${center - (radius * lvl) + 12}" fill="rgba(255,255,255,0.25)" font-family="'Space Mono', monospace" font-size="9">${Math.round(lvl * 100)}%</text>
      `;
    });

    // Axis lines & labels
    let axisLinesSvg = '';
    axes.forEach(axis => {
      const endX = center + Math.cos(axis.angle) * radius;
      const endY = center + Math.sin(axis.angle) * radius;
      
      const labelX = center + Math.cos(axis.angle) * (radius + 24);
      const labelY = center + Math.sin(axis.angle) * (radius + 24);

      let textAnchor = 'middle';
      if (Math.abs(Math.cos(axis.angle)) > 0.3) {
        textAnchor = Math.cos(axis.angle) > 0 ? 'start' : 'end';
      }

      axisLinesSvg += `
        <line x1="${center}" y1="${center}" x2="${endX}" y2="${endY}" stroke="rgba(255,255,255,0.12)" stroke-dasharray="3,3" />
        <text x="${labelX}" y="${labelY + 4}" fill="#94a3b8" font-family="'Space Mono', monospace" font-size="10" font-weight="600" text-anchor="${textAnchor}">
          ${axis.name}
        </text>
      `;
    });

    // Member color map
    const memberColorMap = {
      'Arjun': { stroke: '#00f2ff', fill: 'rgba(0, 242, 255, 0.22)' },
      'Karan': { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.18)' },
      'Aditya': { stroke: '#8b5cf6', fill: 'rgba(139, 92, 246, 0.2)' },
      'Jeet': { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.25)' },
      'Ishan': { stroke: '#f43f5e', fill: 'rgba(244, 63, 94, 0.32)' } // Visibly lowest performance polygon
    };

    let memberPolygonsSvg = '';
    const activeMembers = members.filter(m => m.role === 'member' || m.role === 'pm');

    activeMembers.forEach(m => {
      const colors = memberColorMap[m.name] || { stroke: '#ffffff', fill: 'rgba(255,255,255,0.1)' };
      
      // Calculate normalized scores (0.05 to 1.0)
      const values = [
        Math.max(0.1, Math.min(1, (m.verifiedDeliverables / 10) * 1.05)), // Deliverables
        Math.max(0.1, Math.min(1, (m.complexityPoints / 20))),            // Complexity
        Math.max(0.1, Math.min(1, (m.collaborationRate / 100))),          // Collaboration
        Math.max(0.1, Math.min(1, (m.onTimeDeliveryRate / 100)))          // Deadlines
      ];

      const polygonPoints = axes.map((axis, i) => {
        const val = values[i];
        const px = center + Math.cos(axis.angle) * radius * val;
        const py = center + Math.sin(axis.angle) * radius * val;
        return `${px.toFixed(1)},${py.toFixed(1)}`;
      }).join(' ');

      const strokeWidth = m.name === 'Ishan' ? '2.5' : '2';

      memberPolygonsSvg += `
        <g class="radar-member-group" data-member="${m.name}">
          <polygon points="${polygonPoints}" fill="${colors.fill}" stroke="${colors.stroke}" stroke-width="${strokeWidth}" stroke-dasharray="${m.name === 'Ishan' ? '4,3' : 'none'}" style="transition: all 0.3s ease;">
            <title>${m.name}: Fair Score ${m.score}% ${m.name === 'Ishan' ? '(LOWEST PERFORMANCE)' : ''}</title>
          </polygon>
          ${axes.map((axis, i) => {
            const val = values[i];
            const px = center + Math.cos(axis.angle) * radius * val;
            const py = center + Math.sin(axis.angle) * radius * val;
            return `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${m.name === 'Ishan' ? '4' : '3.5'}" fill="${colors.stroke}" />`;
          }).join('')}
        </g>
      `;
    });

    container.innerHTML = `
      <svg viewBox="0 0 ${size} ${size}" width="100%" height="100%" style="overflow: visible;">
        ${websSvg}
        ${axisLinesSvg}
        ${memberPolygonsSvg}
      </svg>
      <div class="radar-legend" style="display: flex; gap: 14px; margin-top: 18px; flex-wrap: wrap; justify-content: center;">
        ${activeMembers.map(m => {
          const colors = memberColorMap[m.name] || { stroke: '#fff' };
          const isIshan = m.name === 'Ishan';
          return `
            <div style="display: flex; align-items: center; gap: 6px; font-size: 0.8rem; font-family: 'Space Mono', monospace; ${isIshan ? 'background: rgba(244,63,94,0.12); padding: 2px 8px; border-radius: 4px; border: 1px solid rgba(244,63,94,0.3);' : ''}">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: ${colors.stroke};"></span>
              <span style="${isIshan ? 'color: var(--accent-rose); font-weight: 700;' : ''}">${m.name} (${m.score}%) ${isIshan ? '▼ Lowest' : ''}</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  // Generate Stacked Contribution Bars
  renderContributionBars(containerId, members) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const activeMembers = members.filter(m => m.role === 'member' || m.role === 'pm');
    const totalPoints = activeMembers.reduce((sum, m) => sum + m.complexityPoints, 0) || 1;

    const memberColors = {
      'Arjun': '#00f2ff',
      'Karan': '#10b981',
      'Aditya': '#8b5cf6',
      'Jeet': '#f59e0b',
      'Ishan': '#f43f5e'
    };

    let barsHtml = `
      <div style="margin-bottom: 12px; display: flex; justify-content: space-between; font-family: 'Space Mono', monospace; font-size: 0.8rem;">
        <span style="color: var(--text-muted)">TOTAL SPRINT COMPLEXITY: <strong>${totalPoints.toFixed(1)} PTS</strong></span>
        <span style="color: var(--accent-cyan)">FAIR TARGET: ~20% / MEMBER</span>
      </div>
      <div style="height: 18px; width: 100%; border-radius: 9999px; overflow: hidden; display: flex; background: rgba(255,255,255,0.06); margin-bottom: 24px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);">
    `;

    activeMembers.forEach(m => {
      const pct = ((m.complexityPoints / totalPoints) * 100).toFixed(1);
      const color = memberColors[m.name] || '#94a3b8';
      barsHtml += `
        <div style="width: ${pct}%; background: ${color}; height: 100%;" title="${m.name}: ${m.complexityPoints} pts (${pct}%)"></div>
      `;
    });

    barsHtml += `</div><div style="display: flex; flex-direction: column; gap: 14px;">`;

    activeMembers.forEach(m => {
      const pct = ((m.complexityPoints / totalPoints) * 100).toFixed(1);
      const color = memberColors[m.name] || '#94a3b8';
      const isIshan = m.name === 'Ishan';
      const isSkewedHigh = pct > 45;

      barsHtml += `
        <div style="background: ${isIshan ? 'rgba(244, 63, 94, 0.05)' : 'rgba(255,255,255,0.02)'}; border: 1px solid ${isIshan ? 'rgba(244, 63, 94, 0.3)' : 'var(--border-subtle)'}; border-radius: 8px; padding: 12px 16px; display: flex; align-items: center; justify-content: space-between;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="width: 12px; height: 12px; border-radius: 3px; background: ${color};"></span>
            <div>
              <div style="font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 8px;">
                ${m.name}
                ${isIshan ? `<span class="badge badge-rose" style="font-size: 0.65rem;">LOWEST PERFORMANCE (42.5%)</span>` : ''}
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); font-family: 'Space Mono', monospace;">
                ${m.verifiedDeliverables} verified PRs • ${m.complexityPoints} pts • ${m.collaborationRate}% Collab
              </div>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="font-family: 'Space Mono', monospace; font-weight: 800; font-size: 1.1rem; color: ${color};">
              ${pct}%
            </div>
            ${isIshan ? `<span style="font-size: 0.68rem; color: var(--accent-rose); font-weight: 700;">Critical Deficit</span>` : isSkewedHigh ? `<span style="font-size: 0.68rem; color: var(--accent-amber); font-weight: 600;">Overloaded</span>` : `<span style="font-size: 0.68rem; color: var(--accent-emerald);">Balanced</span>`}
          </div>
        </div>
      `;
    });

    barsHtml += `</div>`;
    container.innerHTML = barsHtml;
  },

  // Circular Progress Ring SVG
  renderCircularProgress(percentage, strokeColor = '#00f2ff', size = 80) {
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="${strokeWidth}" />
        <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" 
          stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" stroke-linecap="round"
          style="transition: stroke-dashoffset 0.8s ease; transform: rotate(-90deg); transform-origin: 50% 50%;" />
        <text x="50%" y="50%" dy="0.35em" text-anchor="middle" fill="#ffffff" font-family="'Syne', sans-serif" font-weight="800" font-size="${size * 0.22}">
          ${percentage}%
        </text>
      </svg>
    `;
  }
};
