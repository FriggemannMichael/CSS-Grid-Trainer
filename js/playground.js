export default function setupPlayground(app) {
  const gridContainer = document.getElementById('grid-container');

  // Container controls
  bindValueChange('display-type', v => gridContainer.style.display = v);
  bindValueChange('grid-columns', v => gridContainer.style.gridTemplateColumns = v);
  bindValueChange('grid-rows', v => gridContainer.style.gridTemplateRows = v);
  bindValueChange('grid-gap', v => gridContainer.style.gap = v);
  bindValueChange('justify-items', v => gridContainer.style.justifyItems = v);
  bindValueChange('align-items', v => gridContainer.style.alignItems = v);
  bindValueChange('justify-content', v => gridContainer.style.justifyContent = v);
  bindValueChange('align-content', v => gridContainer.style.alignContent = v);
  bindValueChange('auto-flow', v => gridContainer.style.gridAutoFlow = v);
  bindValueChange('auto-columns', v => gridContainer.style.gridAutoColumns = v);
  bindValueChange('auto-rows', v => gridContainer.style.gridAutoRows = v);

  // Item controls
  document.getElementById('item-selector').addEventListener('change', e => {
    app.selectedItem = parseInt(e.target.value);
    highlightSelectedItem(app);
  });

  bindItemChange(app, 'item-column', 'gridColumn');
  bindItemChange(app, 'item-row', 'gridRow');
  bindItemChange(app, 'justify-self', 'justifySelf');
  bindItemChange(app, 'align-self', 'alignSelf');

  document.getElementById('add-item').addEventListener('click', () => addGridItem(app));
  document.getElementById('remove-item').addEventListener('click', () => removeGridItem(app));
  document.getElementById('reset-grid').addEventListener('click', () => resetGrid(app));

  gridContainer.addEventListener('click', e => {
    if (e.target.classList.contains('grid-item')) {
      const itemNum = parseInt(e.target.dataset.item);
      document.getElementById('item-selector').value = itemNum;
      app.selectedItem = itemNum;
      highlightSelectedItem(app);
    }
  });

  resetGrid(app);
  updateCSSOutput(app);
  document.dispatchEvent(new CustomEvent('cssUpdate'));
}

function bindValueChange(id, applyFn) {
  document.getElementById(id).addEventListener('input', e => {
    applyFn(e.target.value);
    document.dispatchEvent(new CustomEvent('cssUpdate'));
  });
  document.getElementById(id).addEventListener('change', e => {
    applyFn(e.target.value);
    document.dispatchEvent(new CustomEvent('cssUpdate'));
  });
}

function bindItemChange(app, id, styleProp) {
  document.getElementById(id).addEventListener('input', e => {
    const item = document.querySelector(`[data-item="${app.selectedItem}"]`);
    if (item) {
      item.style[styleProp] = e.target.value;
      app.itemStyles[app.selectedItem] = {
        ...app.itemStyles[app.selectedItem],
        [styleProp]: e.target.value
      };
      updateCSSOutput(app);
    }
  });
}

export function highlightSelectedItem(app) {
  document.querySelectorAll('.grid-item').forEach(item => {
    item.classList.remove('selected');
  });
  const selected = document.querySelector(`[data-item="${app.selectedItem}"]`);
  if (selected) selected.classList.add('selected');
}

export function addGridItem(app) {
  app.itemCount++;
  const gridContainer = document.getElementById('grid-container');
  const newItem = document.createElement('div');
  newItem.className = 'grid-item';
  newItem.dataset.item = app.itemCount;
  newItem.textContent = app.itemCount;
  gridContainer.appendChild(newItem);

  const selector = document.getElementById('item-selector');
  const option = document.createElement('option');
  option.value = app.itemCount;
  option.textContent = `Item ${app.itemCount}`;
  selector.appendChild(option);
}

export function removeGridItem(app) {
  if (app.itemCount > 1) {
    const gridContainer = document.getElementById('grid-container');
    gridContainer.removeChild(gridContainer.lastElementChild);

    const selector = document.getElementById('item-selector');
    selector.removeChild(selector.lastElementChild);

    delete app.itemStyles[app.itemCount];
    app.itemCount--;

    if (app.selectedItem > app.itemCount) {
      app.selectedItem = app.itemCount;
      selector.value = app.selectedItem;
    }
  }
}

export function resetGrid(app) {
  const gridContainer = document.getElementById('grid-container');
  gridContainer.style = '';
  gridContainer.style.display = 'grid';
  gridContainer.style.gridTemplateColumns = '1fr 1fr 1fr';
  gridContainer.style.gridTemplateRows = '100px 100px';
  gridContainer.style.gap = '10px';

  gridContainer.innerHTML = '';
  for (let i = 1; i <= 6; i++) {
    const item = document.createElement('div');
    item.className = 'grid-item';
    item.dataset.item = i;
    item.textContent = i;
    gridContainer.appendChild(item);
  }

  // Reset controls
  document.getElementById('display-type').value = 'grid';
  document.getElementById('grid-columns').value = '1fr 1fr 1fr';
  document.getElementById('grid-rows').value = '100px 100px';
  document.getElementById('grid-gap').value = '10px';
  document.getElementById('justify-items').value = 'stretch';
  document.getElementById('align-items').value = 'stretch';
  document.getElementById('justify-content').value = 'start';
  document.getElementById('align-content').value = 'start';
  document.getElementById('auto-flow').value = 'row';
  document.getElementById('auto-columns').value = '';
  document.getElementById('auto-rows').value = '';

  document.getElementById('item-column').value = '';
  document.getElementById('item-row').value = '';
  document.getElementById('justify-self').value = '';
  document.getElementById('align-self').value = '';

  app.itemStyles = {};
  app.itemCount = 6;
  app.selectedItem = 1;

  const selector = document.getElementById('item-selector');
  selector.innerHTML = '';
  for (let i = 1; i <= 6; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `Item ${i}`;
    selector.appendChild(option);
  }

  updateCSSOutput(app);
}

export function updateCSSOutput(app) {
  const gridContainer = document.getElementById('grid-container');
  const output = document.getElementById('css-output');

  let css = '.container {\n';
  css += `  display: ${gridContainer.style.display || 'grid'};\n`;

  if (gridContainer.style.gridTemplateColumns)
    css += `  grid-template-columns: ${gridContainer.style.gridTemplateColumns};\n`;
  if (gridContainer.style.gridTemplateRows)
    css += `  grid-template-rows: ${gridContainer.style.gridTemplateRows};\n`;
  if (gridContainer.style.gap) css += `  gap: ${gridContainer.style.gap};\n`;
  if (gridContainer.style.justifyItems && gridContainer.style.justifyItems !== 'stretch')
    css += `  justify-items: ${gridContainer.style.justifyItems};\n`;
  if (gridContainer.style.alignItems && gridContainer.style.alignItems !== 'stretch')
    css += `  align-items: ${gridContainer.style.alignItems};\n`;
  if (gridContainer.style.justifyContent && gridContainer.style.justifyContent !== 'start')
    css += `  justify-content: ${gridContainer.style.justifyContent};\n`;
  if (gridContainer.style.alignContent && gridContainer.style.alignContent !== 'start')
    css += `  align-content: ${gridContainer.style.alignContent};\n`;
  if (gridContainer.style.gridAutoFlow && gridContainer.style.gridAutoFlow !== 'row')
    css += `  grid-auto-flow: ${gridContainer.style.gridAutoFlow};\n`;
  if (gridContainer.style.gridAutoColumns)
    css += `  grid-auto-columns: ${gridContainer.style.gridAutoColumns};\n`;
  if (gridContainer.style.gridAutoRows)
    css += `  grid-auto-rows: ${gridContainer.style.gridAutoRows};\n`;

  css += '}\n';

  for (const [itemNum, styles] of Object.entries(app.itemStyles)) {
    if (Object.keys(styles).length > 0) {
      css += `\n.item-${itemNum} {\n`;
      for (const [prop, value] of Object.entries(styles)) {
        if (value) {
          const cssProp = prop.replace(/([A-Z])/g, '-$1').toLowerCase();
          css += `  ${cssProp}: ${value};\n`;
        }
      }
      css += '}\n';
    }
  }

  output.textContent = css;
  document.dispatchEvent(new CustomEvent('cssUpdate'));
}
