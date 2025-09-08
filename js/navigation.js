export default function setupNavigation(app) {
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', e => {
      const section = e.target.dataset.section;
      switchSection(app, section);
    });
  });
}

function switchSection(app, section) {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-section="${section}"]`).classList.add('active');

  document.querySelectorAll('.section').forEach(sec => {
    sec.classList.remove('active');
  });
  document.getElementById(section).classList.add('active');

  app.currentSection = section;
}
