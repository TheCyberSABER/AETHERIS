/* ==========================================================================
   AETHERIS // APERIOS-STYLE MAGNETIC CURSOR
   Smooth trailing spring physics & element hover magnetism
   ========================================================================== */

(function () {
  let mouseX = -100;
  let mouseY = -100;
  let ringX = -100;
  let ringY = -100;
  let isHovered = false;

  const dot = document.createElement('div');
  dot.className = 'custom-cursor-dot';

  const ring = document.createElement('div');
  ring.className = 'custom-cursor-ring';

  // Only append cursor on pointer-capable devices
  if (window.matchMedia('(pointer: fine)').matches) {
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    });

    // Lerp animation loop for smooth trailing ring
    function render() {
      ringX += (mouseX - ringX) * 0.16;
      ringY += (mouseY - ringY) * 0.16;

      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    // Dynamic hover detection for interactive elements
    document.addEventListener('mouseover', (e) => {
      const target = e.target.closest('button, a, input, select, textarea, .task-card, .showcase-card, .role-select-card, .sidebar-nav-link, .stat-card, .ai-risk-card');
      if (target) {
        document.body.classList.add('cursor-hover');
      }
    });

    document.addEventListener('mouseout', (e) => {
      const target = e.target.closest('button, a, input, select, textarea, .task-card, .showcase-card, .role-select-card, .sidebar-nav-link, .stat-card, .ai-risk-card');
      if (target) {
        document.body.classList.remove('cursor-hover');
      }
    });
  }
})();
