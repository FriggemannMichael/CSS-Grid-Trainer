import { resetGrid, updateCSSOutput } from './playground.js';

export default function setupChallenges(app) {
  const challengeList = document.getElementById('challenge-list');
  const checkBtn = document.getElementById('check-solution');

  challengeList.innerHTML = '';
  challenges.forEach((ch, i) => {
    const btn = document.createElement('button');
    btn.textContent = ch.title;
    btn.addEventListener('click', () => loadChallenge(app, i));
    challengeList.appendChild(btn);
  });

  checkBtn.addEventListener('click', () => checkChallengeSolution(app));
  // Initialisiere erste Challenge falls vorhanden
  if (challenges.length > 0) {
    loadChallenge(app, 0);
  }
}

function loadChallenge(app, index) {
  app.currentChallenge = challenges[index];
  resetGrid(app);

  const desc = document.getElementById('challenge-description');
  if (desc) desc.textContent = app.currentChallenge.instructions;

  const preview = document.getElementById('challenge-preview');
  preview.innerHTML = '';
  const previewContainer = document.createElement('div');
  previewContainer.className = 'challenge-container';
  previewContainer.style.display = 'grid';
  previewContainer.style.gridTemplateColumns = '1fr 1fr 1fr';
  previewContainer.style.gridTemplateRows = '100px 100px';
  previewContainer.style.gap = '10px';

  for (let i = 1; i <= 6; i++) {
    const item = document.createElement('div');
    item.className = 'grid-item';
    item.textContent = i;
    previewContainer.appendChild(item);
  }
  preview.appendChild(previewContainer);

  applyChallengeCss(previewContainer, app.currentChallenge.targetCss);
}

function applyChallengeCss(container, cssObj) {
  for (const [prop, val] of Object.entries(cssObj.container)) {
    container.style[prop] = val;
  }
  Object.entries(cssObj.items).forEach(([i, styles]) => {
    const item = container.children[i - 1];
    Object.assign(item.style, styles);
  });
}

function checkChallengeSolution(app) {
  const gridContainer = document.getElementById('grid-container');
  const css = {
    container: {},
    items: {}
  };

  const props = [
    'display',
    'gridTemplateColumns',
    'gridTemplateRows',
    'gap',
    'justifyItems',
    'alignItems',
    'justifyContent',
    'alignContent',
    'gridAutoFlow',
    'gridAutoColumns',
    'gridAutoRows'
  ];

  props.forEach(p => {
    if (gridContainer.style[p]) css.container[p] = gridContainer.style[p];
  });

  Array.from(gridContainer.children).forEach(item => {
    const num = item.dataset.item;
    css.items[num] = {};
    ['gridColumn', 'gridRow', 'justifySelf', 'alignSelf'].forEach(p => {
      if (item.style[p]) css.items[num][p] = item.style[p];
    });
  });

  const result = compareCss(css, app.currentChallenge.targetCss);
  const resultDiv = document.getElementById('challenge-result');
  resultDiv.textContent = result
    ? '✅ Richtig gelöst!'
    : '❌ Nicht korrekt. Versuch es erneut.';
}

function compareCss(userCss, targetCss) {
  for (const [prop, val] of Object.entries(targetCss.container)) {
    if (userCss.container[prop] !== val) return false;
  }
  for (const [i, styles] of Object.entries(targetCss.items)) {
    for (const [prop, val] of Object.entries(styles)) {
      if (!userCss.items[i] || userCss.items[i][prop] !== val) return false;
    }
  }
  return true;
}

// Beispiel-Challenges
const challenges = [
  {
    title: 'Drei Spalten Layout',
    instructions: 'Erstelle ein Layout mit drei gleich breiten Spalten.',
    targetCss: {
      container: { gridTemplateColumns: '1fr 1fr 1fr' },
      items: {}
    }
  },
  {
    title: 'Zwei Reihen Layout',
    instructions: 'Erstelle zwei Reihen mit je 150px Höhe.',
    targetCss: {
      container: { gridTemplateRows: '150px 150px' },
      items: {}
    }
  },
  {
    title: 'Item verschieben',
    instructions: 'Platziere Item 1 in Spalte 2 und Reihe 2.',
    targetCss: {
      container: {},
      items: {
        1: { gridColumn: '2', gridRow: '2' }
      }
    }
  }
];
