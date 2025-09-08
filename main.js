// Grid Trainer Main JavaScript
class GridBuilder {
    constructor() {
        this.gridCols = 4;
        this.gridRows = 4;
        this.gridGap = 10;
        this.cellSize = 120;
        this.currentTool = 'drag';
        this.placedElements = [];
        this.selectedElement = null;
        this.draggedElement = null;
        this.elementCounter = 0;
        
        this.init();
    }

    init() {
        this.setupGrid();
        this.setupDragAndDrop();
        this.setupTools();
        this.setupControls();
        this.setupOutputTabs();
        this.updateCellOccupancy();
        this.updateOutput();
    }

    setupGrid() {
        const gridBuilder = document.getElementById('grid-builder');
        gridBuilder.innerHTML = '';
        
        gridBuilder.style.gridTemplateColumns = `repeat(${this.gridCols}, ${this.cellSize}px)`;
        gridBuilder.style.gridTemplateRows = `repeat(${this.gridRows}, ${this.cellSize}px)`;
        gridBuilder.style.gap = `${this.gridGap}px`;
        
        // Create grid cells
        for (let row = 1; row <= this.gridRows; row++) {
            for (let col = 1; col <= this.gridCols; col++) {
                const cell = document.createElement('div');
                cell.className = 'grid-cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                gridBuilder.appendChild(cell);
            }
        }
    }

    setupDragAndDrop() {
        // Draggable elements from palette
        const draggables = document.querySelectorAll('.draggable-element');
        draggables.forEach(element => {
            element.addEventListener('dragstart', (e) => this.handleDragStart(e));
            element.addEventListener('dragend', (e) => this.handleDragEnd(e));
            
            // Touch support
            element.addEventListener('touchstart', (e) => this.handleTouchStart(e), {passive: false});
            element.addEventListener('touchmove', (e) => this.handleTouchMove(e), {passive: false});
            element.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        });

        // Grid cells as drop zones
        const gridBuilder = document.getElementById('grid-builder');
        gridBuilder.addEventListener('dragover', (e) => this.handleDragOver(e));
        gridBuilder.addEventListener('drop', (e) => this.handleDrop(e));
        gridBuilder.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    }

    // Touch support methods
    handleTouchStart(e) {
        const touch = e.touches[0];
        const element = e.target.closest('.draggable-element') || e.target.closest('.placed-item');
        if (!element) return;
        
        this.touchOffset = {
            x: touch.clientX - element.getBoundingClientRect().left,
            y: touch.clientY - element.getBoundingClientRect().top
        };
        
        const isPlacedItem = element.classList.contains('placed-item');
        
        // Clean text by removing emojis and icons
        let text = element.textContent;
        if (!isPlacedItem) {
            text = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
            text = text.replace(/[📰🧭📑📄📝🎴🖼️📊⋮]/g, '');
        }
        text = text.replace(/\s+/g, ' ').trim();
        
        this.draggedElement = {
            type: element.dataset.type || this.getElementType(element),
            color: element.dataset.color || element.style.background,
            text: text,
            isNew: !isPlacedItem,
            id: isPlacedItem ? element.dataset.elementId : null
        };
        
        // Create ghost element for touch drag
        const ghost = element.cloneNode(true);
        ghost.className = 'grid-ghost';
        ghost.style.width = element.offsetWidth + 'px';
        ghost.style.height = element.offsetHeight + 'px';
        document.body.appendChild(ghost);
        this.ghostElement = ghost;
        
        element.classList.add('dragging');
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        
        if (this.ghostElement) {
            this.ghostElement.style.left = (touch.clientX - this.touchOffset.x) + 'px';
            this.ghostElement.style.top = (touch.clientY - this.touchOffset.y) + 'px';
            
            // Find element under touch point
            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            const cell = elementBelow?.closest('.grid-cell');
            
            document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('drag-over'));
            if (cell && !cell.classList.contains('occupied')) {
                cell.classList.add('drag-over');
            }
        }
    }

    handleTouchEnd(e) {
        if (!this.ghostElement || !this.draggedElement) return;
        
        const touch = e.changedTouches[0];
        
        // Hide ghost to find element below
        this.ghostElement.style.display = 'none';
        
        // Find drop target
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        let cell = elementBelow?.closest('.grid-cell');
        
        // If dropped on a placed item, find the cell underneath
        if (!cell && elementBelow?.closest('.placed-item')) {
            const item = elementBelow.closest('.placed-item');
            const rect = item.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            item.style.pointerEvents = 'none';
            const below = document.elementFromPoint(x, y);
            item.style.pointerEvents = '';
            
            cell = below?.closest('.grid-cell');
        }
        
        // Restore ghost display
        if (this.ghostElement) {
            this.ghostElement.style.display = '';
        }
        
        if (cell && this.draggedElement) {
            if (this.draggedElement.isNew) {
                this.placeNewElement(cell);
            } else {
                this.moveElement(cell);
            }
        }
        
        // Cleanup
        if (this.ghostElement) {
            this.ghostElement.remove();
            this.ghostElement = null;
        }
        
        document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
        document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('drag-over'));
        this.draggedElement = null;
    }

    handleDragStart(e) {
        const element = e.target.closest('.draggable-element') || e.target.closest('.placed-item');
        if (!element) return;
        
        element.classList.add('dragging');
        
        // Check if it's a new element from palette or existing placed item
        const isPlacedItem = element.classList.contains('placed-item');
        
        // Clean text by removing emojis and icons
        let text = element.textContent;
        if (!isPlacedItem) {
            // Remove emojis and icons from palette elements
            text = text.replace(/[\u{1F300}-\u{1F9FF}]/gu, '');
            text = text.replace(/[📰🧭📑📄📝🎴🖼️📊⋮]/g, '');
        }
        text = text.replace(/\s+/g, ' ').trim();
        
        this.draggedElement = {
            type: element.dataset.type || this.getElementType(element),
            color: element.dataset.color || element.style.background,
            text: text,
            isNew: !isPlacedItem,
            id: isPlacedItem ? element.dataset.elementId : null
        };
        
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', ''); // Required for Firefox
    }
    
    getElementType(element) {
        // Extract type from existing placed element
        const el = this.placedElements.find(e => e.id === element.dataset.elementId);
        return el ? el.type : 'item';
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('drag-over');
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        let cell = e.target.closest('.grid-cell');
        
        // If hovering over a placed item, find the cell underneath
        if (!cell && e.target.closest('.placed-item')) {
            const item = e.target.closest('.placed-item');
            const rect = e.getBoundingClientRect();
            const x = e.clientX;
            const y = e.clientY;
            
            // Find all cells and check which one the cursor is over
            const cells = document.querySelectorAll('.grid-cell');
            for (let c of cells) {
                const cellRect = c.getBoundingClientRect();
                if (x >= cellRect.left && x <= cellRect.right && 
                    y >= cellRect.top && y <= cellRect.bottom) {
                    cell = c;
                    break;
                }
            }
        }
        
        // Clear previous highlights
        document.querySelectorAll('.grid-cell').forEach(c => {
            c.classList.remove('drag-over');
        });
        
        if (cell) {
            cell.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        const cell = e.target.closest('.grid-cell');
        if (cell) {
            cell.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        
        let cell = e.target.closest('.grid-cell');
        
        // If we dropped on a placed item, find the cell underneath
        if (!cell && e.target.closest('.placed-item')) {
            const item = e.target.closest('.placed-item');
            const rect = item.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            
            // Temporarily hide the item to find cell underneath
            item.style.pointerEvents = 'none';
            const elementBelow = document.elementFromPoint(x, y);
            item.style.pointerEvents = '';
            
            cell = elementBelow?.closest('.grid-cell');
        }
        
        if (!cell || !this.draggedElement) return;
        
        cell.classList.remove('drag-over');
        document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('drag-over'));
        
        if (this.draggedElement.isNew) {
            this.placeNewElement(cell);
        } else {
            this.moveElement(cell);
        }
        
        this.draggedElement = null;
    }

    placeNewElement(cell) {
        const startCol = parseInt(cell.dataset.col);
        const startRow = parseInt(cell.dataset.row);
        
        // Check if position is already occupied
        const isOccupied = this.isPositionOccupied(startCol, startRow, startCol + 1, startRow + 1);
        if (isOccupied) {
            // Try to find nearby empty cell
            const emptyCell = this.findNearbyEmptyCell(startCol, startRow);
            if (emptyCell) {
                this.placeNewElement(emptyCell);
                return;
            }
            return; // No empty cell found
        }
        
        // Clean text: remove emoji icons and extra whitespace
        let cleanText = this.draggedElement.text;
        cleanText = cleanText.replace(/[\u{1F300}-\u{1F9FF}]/gu, ''); // Remove emojis
        cleanText = cleanText.replace(/[📰🧭📑📄📝🎴🖼️📊⋮]/g, ''); // Remove specific icons
        cleanText = cleanText.replace(/\s+/g, ' ').trim(); // Clean whitespace
        
        const elementId = `element-${++this.elementCounter}`;
        const element = {
            id: elementId,
            type: this.draggedElement.type,
            color: this.draggedElement.color,
            text: cleanText,
            startCol: startCol,
            startRow: startRow,
            endCol: startCol + 1,
            endRow: startRow + 1
        };
        
        this.placedElements.push(element);
        this.renderPlacedElement(element);
        this.updateCellOccupancy();
        this.updateElementsList();
        this.updateOutput();
    }

    isPositionOccupied(startCol, startRow, endCol, endRow, excludeId = null) {
        return this.placedElements.some(el => {
            if (excludeId && el.id === excludeId) return false;
            
            return !(endCol <= el.startCol || 
                    startCol >= el.endCol || 
                    endRow <= el.startRow || 
                    startRow >= el.endRow);
        });
    }

    findNearbyEmptyCell(col, row) {
        // Search in expanding circles for empty cell
        for (let distance = 1; distance <= Math.max(this.gridCols, this.gridRows); distance++) {
            for (let dc = -distance; dc <= distance; dc++) {
                for (let dr = -distance; dr <= distance; dr++) {
                    if (Math.abs(dc) !== distance && Math.abs(dr) !== distance) continue;
                    
                    const newCol = col + dc;
                    const newRow = row + dr;
                    
                    if (newCol >= 1 && newCol <= this.gridCols && 
                        newRow >= 1 && newRow <= this.gridRows) {
                        if (!this.isPositionOccupied(newCol, newRow, newCol + 1, newRow + 1)) {
                            const cell = document.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
                            if (cell) return cell;
                        }
                    }
                }
            }
        }
        return null;
    }

    updateCellOccupancy() {
        // Clear all occupied markers
        document.querySelectorAll('.grid-cell').forEach(cell => {
            cell.classList.remove('occupied');
        });
        
        // Mark occupied cells
        this.placedElements.forEach(element => {
            for (let row = element.startRow; row < element.endRow; row++) {
                for (let col = element.startCol; col < element.endCol; col++) {
                    const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                    if (cell) {
                        cell.classList.add('occupied');
                    }
                }
            }
        });
    }

    renderPlacedElement(element) {
        const gridBuilder = document.getElementById('grid-builder');
        
        // Remove existing element if it exists
        const existing = document.querySelector(`[data-element-id="${element.id}"]`);
        if (existing) {
            existing.remove();
        }
        
        const placedItem = document.createElement('div');
        placedItem.className = 'placed-item';
        placedItem.dataset.elementId = element.id;
        placedItem.dataset.type = element.type;
        placedItem.dataset.color = element.color;
        placedItem.style.background = element.color;
        placedItem.style.gridColumn = `${element.startCol} / ${element.endCol}`;
        placedItem.style.gridRow = `${element.startRow} / ${element.endRow}`;
        placedItem.innerHTML = `<span>${element.text}</span>`;
        placedItem.draggable = true;
        
        // Apply current tool mode
        if (this.currentTool === 'resize') {
            placedItem.classList.add('resize-mode');
        } else if (this.currentTool === 'delete') {
            placedItem.classList.add('delete-mode');
        }
        
        // Make it draggable for repositioning
        placedItem.addEventListener('dragstart', (e) => this.handleDragStart(e));
        placedItem.addEventListener('dragend', (e) => this.handleDragEnd(e));
        placedItem.addEventListener('click', (e) => this.handleElementClick(e));
        
        // Add touch support for mobile
        placedItem.addEventListener('touchstart', (e) => this.handleTouchStart(e), {passive: false});
        placedItem.addEventListener('touchmove', (e) => this.handleTouchMove(e), {passive: false});
        placedItem.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        gridBuilder.appendChild(placedItem);
    }

    handleElementClick(e) {
        const element = e.target;
        
        if (this.currentTool === 'delete') {
            this.deleteElement(element.dataset.elementId);
        } else if (this.currentTool === 'resize') {
            this.selectElementForResize(element);
        } else {
            this.selectElement(element);
        }
    }

    selectElement(element) {
        document.querySelectorAll('.placed-item').forEach(item => {
            item.classList.remove('selected');
        });
        element.classList.add('selected');
        this.selectedElement = element.dataset.elementId;
    }

    selectElementForResize(element) {
        this.selectElement(element);
        
        // Show resize handles
        const handles = document.querySelector('.resize-handles');
        const rect = element.getBoundingClientRect();
        const workspace = document.querySelector('.builder-workspace');
        const workspaceRect = workspace.getBoundingClientRect();
        
        handles.style.display = 'block';
        handles.style.left = `${rect.left - workspaceRect.left + workspace.scrollLeft}px`;
        handles.style.top = `${rect.top - workspaceRect.top + workspace.scrollTop}px`;
        handles.style.width = `${rect.width}px`;
        handles.style.height = `${rect.height}px`;
        
        // Setup resize handle events
        this.setupResizeHandles(element.dataset.elementId);
    }

    setupResizeHandles(elementId) {
        const handles = document.querySelectorAll('.resize-handle');
        handles.forEach(handle => {
            handle.onmousedown = (e) => this.startResize(e, elementId, handle.dataset.direction);
        });
    }

    startResize(e, elementId, direction) {
        e.preventDefault();
        
        const element = this.placedElements.find(el => el.id === elementId);
        if (!element) return;
        
        const startX = e.clientX;
        const startY = e.clientY;
        const startEndCol = element.endCol;
        const startEndRow = element.endRow;
        
        const handleMouseMove = (e) => {
            const deltaX = Math.round((e.clientX - startX) / (this.cellSize + this.gridGap));
            const deltaY = Math.round((e.clientY - startY) / (this.cellSize + this.gridGap));
            
            if (direction === 'right' || direction === 'corner') {
                element.endCol = Math.max(element.startCol + 1, Math.min(this.gridCols + 1, startEndCol + deltaX));
            }
            if (direction === 'bottom' || direction === 'corner') {
                element.endRow = Math.max(element.startRow + 1, Math.min(this.gridRows + 1, startEndRow + deltaY));
            }
            
            this.renderPlacedElement(element);
            this.updateOutput();
        };
        
        const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.querySelector('.resize-handles').style.display = 'none';
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }

    deleteElement(elementId) {
        this.placedElements = this.placedElements.filter(el => el.id !== elementId);
        document.querySelector(`[data-element-id="${elementId}"]`).remove();
        this.updateElementsList();
        this.updateOutput();
    }

    moveElement(cell) {
        const elementId = this.draggedElement.id;
        const element = this.placedElements.find(el => el.id === elementId);
        
        if (element) {
            const newCol = parseInt(cell.dataset.col);
            const newRow = parseInt(cell.dataset.row);
            const colSpan = element.endCol - element.startCol;
            const rowSpan = element.endRow - element.startRow;
            
            element.startCol = newCol;
            element.startRow = newRow;
            element.endCol = newCol + colSpan;
            element.endRow = newRow + rowSpan;
            
            this.renderPlacedElement(element);
            this.updateOutput();
        }
    }

    setupTools() {
        const toolButtons = document.querySelectorAll('.tool-btn');
        toolButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentTool = btn.dataset.tool;
                toolButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Update cursor and mode display
                const modeText = {
                    'drag': 'Drag & Drop',
                    'resize': 'Resize Elements',
                    'delete': 'Delete Elements'
                };
                document.getElementById('current-mode').textContent = `Modus: ${modeText[this.currentTool]}`;
                
                // Update placed items cursor
                document.querySelectorAll('.placed-item').forEach(item => {
                    item.className = 'placed-item';
                    if (this.currentTool === 'resize') {
                        item.classList.add('resize-mode');
                    } else if (this.currentTool === 'delete') {
                        item.classList.add('delete-mode');
                    }
                });
                
                // Hide resize handles when switching tools
                if (this.currentTool !== 'resize') {
                    document.querySelector('.resize-handles').style.display = 'none';
                }
            });
        });
    }

    setupControls() {
        document.getElementById('apply-grid-settings').addEventListener('click', () => {
            this.gridCols = parseInt(document.getElementById('builder-cols').value);
            this.gridRows = parseInt(document.getElementById('builder-rows').value);
            this.gridGap = parseInt(document.getElementById('builder-gap').value);
            this.cellSize = parseInt(document.getElementById('builder-cell-size').value);
            
            this.setupGrid();
            
            // Re-render all placed elements
            this.placedElements.forEach(element => {
                // Check if element still fits in new grid
                if (element.endCol > this.gridCols + 1) {
                    element.endCol = this.gridCols + 1;
                }
                if (element.endRow > this.gridRows + 1) {
                    element.endRow = this.gridRows + 1;
                }
                if (element.startCol > this.gridCols) {
                    element.startCol = this.gridCols;
                    element.endCol = this.gridCols + 1;
                }
                if (element.startRow > this.gridRows) {
                    element.startRow = this.gridRows;
                    element.endRow = this.gridRows + 1;
                }
                this.renderPlacedElement(element);
            });
            
            this.updateCellOccupancy();
            this.updateOutput();
        });

        document.getElementById('clear-builder').addEventListener('click', () => {
            if (confirm('Möchtest du das Grid wirklich leeren?')) {
                this.placedElements = [];
                document.querySelectorAll('.placed-item').forEach(item => item.remove());
                this.updateCellOccupancy();
                this.updateElementsList();
                this.updateOutput();
            }
        });

        document.getElementById('auto-arrange').addEventListener('click', () => {
            this.autoArrangeElements();
        });

        document.getElementById('copy-builder-code').addEventListener('click', () => {
            const activeTab = document.querySelector('.output-tab.active').dataset.output;
            const outputPanel = document.getElementById(`builder-${activeTab}-output`);
            const text = outputPanel.textContent;
            
            navigator.clipboard.writeText(text).then(() => {
                const btn = document.getElementById('copy-builder-code');
                const originalText = btn.innerHTML;
                btn.innerHTML = '✅ Kopiert!';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                }, 2000);
            }).catch(err => {
                alert('Kopieren fehlgeschlagen. Bitte manuell kopieren.');
            });
        });
    }

    setupOutputTabs() {
        const tabs = document.querySelectorAll('.output-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.output-panel').forEach(panel => {
                    panel.classList.remove('active');
                });
                document.getElementById(`builder-${tab.dataset.output}-output`).classList.add('active');
            });
        });
    }

    autoArrangeElements() {
        let currentRow = 1;
        let currentCol = 1;
        
        // Sort elements by size (larger first) for better packing
        this.placedElements.sort((a, b) => {
            const aSize = (a.endCol - a.startCol) * (a.endRow - a.startRow);
            const bSize = (b.endCol - b.startCol) * (b.endRow - b.startRow);
            return bSize - aSize;
        });
        
        this.placedElements.forEach(element => {
            const width = element.endCol - element.startCol;
            const height = element.endRow - element.startRow;
            
            // Find next available position
            let placed = false;
            for (let row = 1; row <= this.gridRows; row++) {
                for (let col = 1; col <= this.gridCols; col++) {
                    if (col + width - 1 <= this.gridCols && 
                        row + height - 1 <= this.gridRows) {
                        // Check if this position is free
                        const isFree = !this.isPositionOccupied(
                            col, row, col + width, row + height, element.id
                        );
                        
                        if (isFree) {
                            element.startCol = col;
                            element.startRow = row;
                            element.endCol = col + width;
                            element.endRow = row + height;
                            placed = true;
                            break;
                        }
                    }
                }
                if (placed) break;
            }
            
            // If not placed, shrink to 1x1 and try again
            if (!placed) {
                element.endCol = element.startCol + 1;
                element.endRow = element.startRow + 1;
                
                for (let row = 1; row <= this.gridRows; row++) {
                    for (let col = 1; col <= this.gridCols; col++) {
                        const isFree = !this.isPositionOccupied(
                            col, row, col + 1, row + 1, element.id
                        );
                        
                        if (isFree) {
                            element.startCol = col;
                            element.startRow = row;
                            element.endCol = col + 1;
                            element.endRow = row + 1;
                            placed = true;
                            break;
                        }
                    }
                    if (placed) break;
                }
            }
            
            this.renderPlacedElement(element);
        });
        
        this.updateCellOccupancy();
        this.updateOutput();
    }

    updateElementsList() {
        const list = document.getElementById('elements-list');
        list.innerHTML = '';
        
        this.placedElements.forEach(element => {
            const item = document.createElement('div');
            item.className = 'element-list-item';
            item.innerHTML = `
                <span>${element.type} (${element.startCol},${element.startRow})</span>
                <button onclick="gridBuilder.deleteElement('${element.id}')">×</button>
            `;
            list.appendChild(item);
        });
    }

    updateOutput() {
        this.updateCSSOutput();
        this.updateHTMLOutput();
        this.updateAreasOutput();
    }

    updateCSSOutput() {
        const output = document.getElementById('builder-css-output');
        
        let css = `.container {\n`;
        css += `  display: grid;\n`;
        css += `  grid-template-columns: repeat(${this.gridCols}, 1fr);\n`;
        css += `  grid-template-rows: repeat(${this.gridRows}, minmax(100px, auto));\n`;
        css += `  gap: ${this.gridGap}px;\n`;
        css += `}\n\n`;
        
        this.placedElements.forEach(element => {
            css += `.${element.type} {\n`;
            css += `  grid-column: ${element.startCol} / ${element.endCol};\n`;
            css += `  grid-row: ${element.startRow} / ${element.endRow};\n`;
            css += `  background: ${element.color};\n`;
            css += `}\n\n`;
        });
        
        output.textContent = css;
    }

    updateHTMLOutput() {
        const output = document.getElementById('builder-html-output');
        
        let html = `<div class="container">\n`;
        this.placedElements.forEach(element => {
            html += `  <div class="${element.type}">${element.text}</div>\n`;
        });
        html += `</div>`;
        
        output.textContent = html;
    }

    updateAreasOutput() {
        const output = document.getElementById('builder-areas-output');
        
        // Create a grid areas representation
        const grid = Array(this.gridRows).fill().map(() => Array(this.gridCols).fill('.'));
        
        this.placedElements.forEach(element => {
            for (let row = element.startRow - 1; row < element.endRow - 1; row++) {
                for (let col = element.startCol - 1; col < element.endCol - 1; col++) {
                    if (row < this.gridRows && col < this.gridCols) {
                        grid[row][col] = element.type;
                    }
                }
            }
        });
        
        let areas = `.container {\n`;
        areas += `  display: grid;\n`;
        areas += `  grid-template-areas:\n`;
        grid.forEach(row => {
            areas += `    "${row.join(' ')}"\n`;
        });
        areas += `;\n}\n\n`;
        
        this.placedElements.forEach(element => {
            areas += `.${element.type} { grid-area: ${element.type}; }\n`;
        });
        
        output.textContent = areas;
    }
}

class GridTrainer {
    constructor() {
        this.currentSection = 'playground';
        this.itemCount = 6;
        this.selectedItem = 1;
        this.currentChallenge = null;
        this.itemStyles = {};
        
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupPlayground();
        this.setupChallenges();
        this.setupReference();
        this.setupVisualizer();
        this.updateCSSOutput();
    }

    // Navigation
    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.target.dataset.section;
                this.switchSection(section);
            });
        });
    }

    // Setup Grid Builder
    setupBuilder() {
        // Only initialize when the builder section is first activated
        if (!window.gridBuilder && document.getElementById('grid-builder')) {
            window.gridBuilder = new GridBuilder();
        }
    }

    switchSection(section) {
        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Update sections
        document.querySelectorAll('.section').forEach(sec => {
            sec.classList.remove('active');
        });
        document.getElementById(section).classList.add('active');

        this.currentSection = section;
        
        // Initialize Grid Builder when its section is first activated
        if (section === 'builder' && !window.gridBuilder) {
            window.gridBuilder = new GridBuilder();
        }
    }

    // Playground Section
    setupPlayground() {
        const gridContainer = document.getElementById('grid-container');
        
        // Container controls
        document.getElementById('display-type').addEventListener('change', (e) => {
            gridContainer.style.display = e.target.value;
            this.updateCSSOutput();
        });

        document.getElementById('grid-columns').addEventListener('input', (e) => {
            gridContainer.style.gridTemplateColumns = e.target.value;
            this.updateCSSOutput();
        });

        document.getElementById('grid-rows').addEventListener('input', (e) => {
            gridContainer.style.gridTemplateRows = e.target.value;
            this.updateCSSOutput();
        });

        document.getElementById('grid-gap').addEventListener('input', (e) => {
            gridContainer.style.gap = e.target.value;
            this.updateCSSOutput();
        });

        document.getElementById('justify-items').addEventListener('change', (e) => {
            gridContainer.style.justifyItems = e.target.value;
            this.updateCSSOutput();
        });

        document.getElementById('align-items').addEventListener('change', (e) => {
            gridContainer.style.alignItems = e.target.value;
            this.updateCSSOutput();
        });

        document.getElementById('justify-content').addEventListener('change', (e) => {
            gridContainer.style.justifyContent = e.target.value;
            this.updateCSSOutput();
        });

        document.getElementById('align-content').addEventListener('change', (e) => {
            gridContainer.style.alignContent = e.target.value;
            this.updateCSSOutput();
        });

        document.getElementById('auto-flow').addEventListener('change', (e) => {
            gridContainer.style.gridAutoFlow = e.target.value;
            this.updateCSSOutput();
        });

        document.getElementById('auto-columns').addEventListener('input', (e) => {
            gridContainer.style.gridAutoColumns = e.target.value;
            this.updateCSSOutput();
        });

        document.getElementById('auto-rows').addEventListener('input', (e) => {
            gridContainer.style.gridAutoRows = e.target.value;
            this.updateCSSOutput();
        });

        // Item controls
        document.getElementById('item-selector').addEventListener('change', (e) => {
            this.selectedItem = parseInt(e.target.value);
            this.highlightSelectedItem();
        });

        document.getElementById('item-column').addEventListener('input', (e) => {
            const item = document.querySelector(`[data-item="${this.selectedItem}"]`);
            if (item) {
                item.style.gridColumn = e.target.value;
                this.itemStyles[this.selectedItem] = {
                    ...this.itemStyles[this.selectedItem],
                    gridColumn: e.target.value
                };
                this.updateCSSOutput();
            }
        });

        document.getElementById('item-row').addEventListener('input', (e) => {
            const item = document.querySelector(`[data-item="${this.selectedItem}"]`);
            if (item) {
                item.style.gridRow = e.target.value;
                this.itemStyles[this.selectedItem] = {
                    ...this.itemStyles[this.selectedItem],
                    gridRow: e.target.value
                };
                this.updateCSSOutput();
            }
        });

        document.getElementById('justify-self').addEventListener('change', (e) => {
            const item = document.querySelector(`[data-item="${this.selectedItem}"]`);
            if (item) {
                item.style.justifySelf = e.target.value;
                this.itemStyles[this.selectedItem] = {
                    ...this.itemStyles[this.selectedItem],
                    justifySelf: e.target.value
                };
                this.updateCSSOutput();
            }
        });

        document.getElementById('align-self').addEventListener('change', (e) => {
            const item = document.querySelector(`[data-item="${this.selectedItem}"]`);
            if (item) {
                item.style.alignSelf = e.target.value;
                this.itemStyles[this.selectedItem] = {
                    ...this.itemStyles[this.selectedItem],
                    alignSelf: e.target.value
                };
                this.updateCSSOutput();
            }
        });

        // Add/Remove items
        document.getElementById('add-item').addEventListener('click', () => {
            this.addGridItem();
        });

        document.getElementById('remove-item').addEventListener('click', () => {
            this.removeGridItem();
        });

        document.getElementById('reset-grid').addEventListener('click', () => {
            this.resetGrid();
        });

        // Click on items to select
        gridContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('grid-item')) {
                const itemNum = parseInt(e.target.dataset.item);
                document.getElementById('item-selector').value = itemNum;
                this.selectedItem = itemNum;
                this.highlightSelectedItem();
            }
        });

        // Initialize grid
        this.resetGrid();
    }

    highlightSelectedItem() {
        document.querySelectorAll('.grid-item').forEach(item => {
            item.classList.remove('selected');
        });
        const selected = document.querySelector(`[data-item="${this.selectedItem}"]`);
        if (selected) {
            selected.classList.add('selected');
        }
    }

    addGridItem() {
        this.itemCount++;
        const gridContainer = document.getElementById('grid-container');
        const newItem = document.createElement('div');
        newItem.className = 'grid-item';
        newItem.dataset.item = this.itemCount;
        newItem.textContent = this.itemCount;
        gridContainer.appendChild(newItem);

        // Update selector
        const selector = document.getElementById('item-selector');
        const option = document.createElement('option');
        option.value = this.itemCount;
        option.textContent = `Item ${this.itemCount}`;
        selector.appendChild(option);
    }

    removeGridItem() {
        if (this.itemCount > 1) {
            const gridContainer = document.getElementById('grid-container');
            const lastItem = gridContainer.lastElementChild;
            if (lastItem) {
                gridContainer.removeChild(lastItem);
                
                // Update selector
                const selector = document.getElementById('item-selector');
                selector.removeChild(selector.lastElementChild);
                
                delete this.itemStyles[this.itemCount];
                this.itemCount--;
                
                if (this.selectedItem > this.itemCount) {
                    this.selectedItem = this.itemCount;
                    selector.value = this.selectedItem;
                }
            }
        }
    }

    resetGrid() {
        const gridContainer = document.getElementById('grid-container');
        
        // Reset container styles
        gridContainer.style = '';
        gridContainer.style.display = 'grid';
        gridContainer.style.gridTemplateColumns = '1fr 1fr 1fr';
        gridContainer.style.gridTemplateRows = '100px 100px';
        gridContainer.style.gap = '10px';
        
        // Reset items
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
        
        // Reset item controls
        document.getElementById('item-column').value = '';
        document.getElementById('item-row').value = '';
        document.getElementById('justify-self').value = '';
        document.getElementById('align-self').value = '';
        
        this.itemStyles = {};
        this.itemCount = 6;
        this.selectedItem = 1;
        
        // Update selector
        const selector = document.getElementById('item-selector');
        selector.innerHTML = '';
        for (let i = 1; i <= 6; i++) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `Item ${i}`;
            selector.appendChild(option);
        }
        
        this.updateCSSOutput();
    }

    updateCSSOutput() {
        const gridContainer = document.getElementById('grid-container');
        const output = document.getElementById('css-output');
        
        let css = '.container {\n';
        css += `  display: ${gridContainer.style.display || 'grid'};\n`;
        
        if (gridContainer.style.gridTemplateColumns) {
            css += `  grid-template-columns: ${gridContainer.style.gridTemplateColumns};\n`;
        }
        if (gridContainer.style.gridTemplateRows) {
            css += `  grid-template-rows: ${gridContainer.style.gridTemplateRows};\n`;
        }
        if (gridContainer.style.gap) {
            css += `  gap: ${gridContainer.style.gap};\n`;
        }
        if (gridContainer.style.justifyItems && gridContainer.style.justifyItems !== 'stretch') {
            css += `  justify-items: ${gridContainer.style.justifyItems};\n`;
        }
        if (gridContainer.style.alignItems && gridContainer.style.alignItems !== 'stretch') {
            css += `  align-items: ${gridContainer.style.alignItems};\n`;
        }
        if (gridContainer.style.justifyContent && gridContainer.style.justifyContent !== 'start') {
            css += `  justify-content: ${gridContainer.style.justifyContent};\n`;
        }
        if (gridContainer.style.alignContent && gridContainer.style.alignContent !== 'start') {
            css += `  align-content: ${gridContainer.style.alignContent};\n`;
        }
        if (gridContainer.style.gridAutoFlow && gridContainer.style.gridAutoFlow !== 'row') {
            css += `  grid-auto-flow: ${gridContainer.style.gridAutoFlow};\n`;
        }
        if (gridContainer.style.gridAutoColumns) {
            css += `  grid-auto-columns: ${gridContainer.style.gridAutoColumns};\n`;
        }
        if (gridContainer.style.gridAutoRows) {
            css += `  grid-auto-rows: ${gridContainer.style.gridAutoRows};\n`;
        }
        
        css += '}\n';
        
        // Add item styles
        for (const [itemNum, styles] of Object.entries(this.itemStyles)) {
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
    }

    // Challenges Section
    setupChallenges() {
        this.challenges = {
            1: {
                title: 'Challenge 1: Basis Grid',
                description: 'Erstelle ein 3x3 Grid mit gleichmäßigen Spalten und Zeilen. Jede Zelle sollte 100px groß sein mit 10px Abstand.',
                target: `
                    <div style="display: grid; grid-template-columns: 100px 100px 100px; grid-template-rows: 100px 100px 100px; gap: 10px;">
                        <div style="background: #667eea; border-radius: 4px;"></div>
                        <div style="background: #667eea; border-radius: 4px;"></div>
                        <div style="background: #667eea; border-radius: 4px;"></div>
                        <div style="background: #667eea; border-radius: 4px;"></div>
                        <div style="background: #667eea; border-radius: 4px;"></div>
                        <div style="background: #667eea; border-radius: 4px;"></div>
                        <div style="background: #667eea; border-radius: 4px;"></div>
                        <div style="background: #667eea; border-radius: 4px;"></div>
                        <div style="background: #667eea; border-radius: 4px;"></div>
                    </div>
                `,
                solution: `display: grid;
grid-template-columns: 100px 100px 100px;
grid-template-rows: 100px 100px 100px;
gap: 10px;`,
                hint: 'Verwende grid-template-columns und grid-template-rows mit festen Pixelwerten.'
            },
            2: {
                title: 'Challenge 2: Responsive Layout',
                description: 'Erstelle ein responsives Grid mit 3 gleich breiten Spalten die sich automatisch anpassen. Verwende fr-Einheiten!',
                target: `
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                        <div style="background: #764ba2; padding: 20px; border-radius: 4px;">1fr</div>
                        <div style="background: #764ba2; padding: 20px; border-radius: 4px;">1fr</div>
                        <div style="background: #764ba2; padding: 20px; border-radius: 4px;">1fr</div>
                    </div>
                `,
                solution: `display: grid;
grid-template-columns: 1fr 1fr 1fr;
gap: 15px;`,
                hint: 'Die fr-Einheit teilt den verfügbaren Platz gleichmäßig auf. Nutze "1fr 1fr 1fr" für drei gleiche Spalten.'
            },
            3: {
                title: 'Challenge 3: Grid Areas',
                description: 'Erstelle ein Layout mit Header (volle Breite), Sidebar (links) und Main Content (rechts).',
                target: `
                    <div style="display: grid; grid-template-columns: 200px 1fr; grid-template-rows: 80px 1fr; gap: 10px; height: 300px;">
                        <div style="background: #48bb78; grid-column: 1 / -1; border-radius: 4px; display: flex; align-items: center; justify-content: center;">Header</div>
                        <div style="background: #f6ad55; border-radius: 4px; display: flex; align-items: center; justify-content: center;">Sidebar</div>
                        <div style="background: #4299e1; border-radius: 4px; display: flex; align-items: center; justify-content: center;">Main</div>
                    </div>
                `,
                solution: `display: grid;
grid-template-columns: 200px 1fr;
grid-template-rows: 80px 1fr;
gap: 10px;

/* Für Header-Item: */
grid-column: 1 / -1;`,
                hint: 'Nutze grid-column: 1 / -1 für den Header, um die volle Breite zu überspannen.'
            },
            4: {
                title: 'Challenge 4: Auto-Placement',
                description: 'Erstelle ein Grid das automatisch so viele 150px breite Spalten wie möglich erstellt.',
                target: `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px;">
                        <div style="background: #fc8181; padding: 20px; border-radius: 4px;">Auto</div>
                        <div style="background: #fc8181; padding: 20px; border-radius: 4px;">Auto</div>
                        <div style="background: #fc8181; padding: 20px; border-radius: 4px;">Auto</div>
                        <div style="background: #fc8181; padding: 20px; border-radius: 4px;">Auto</div>
                    </div>
                `,
                solution: `display: grid;
grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
gap: 10px;`,
                hint: 'Verwende repeat() mit auto-fit und minmax() für responsive Spalten.'
            },
            5: {
                title: 'Challenge 5: Nested Grids',
                description: 'Erstelle ein 2x2 Grid, wobei jede Zelle selbst ein 2x2 Grid enthält.',
                target: `
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; background: #2d3748; padding: 10px; border-radius: 4px;">
                            <div style="background: #667eea; border-radius: 2px;"></div>
                            <div style="background: #667eea; border-radius: 2px;"></div>
                            <div style="background: #667eea; border-radius: 2px;"></div>
                            <div style="background: #667eea; border-radius: 2px;"></div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 5px; background: #2d3748; padding: 10px; border-radius: 4px;">
                            <div style="background: #667eea; border-radius: 2px;"></div>
                            <div style="background: #667eea; border-radius: 2px;"></div>
                            <div style="background: #667eea; border-radius: 2px;"></div>
                            <div style="background: #667eea; border-radius: 2px;"></div>
                        </div>
                    </div>
                `,
                solution: `.outer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.inner-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
}`,
                hint: 'Du kannst Grid-Container ineinander verschachteln. Jeder Container kann seine eigenen Grid-Eigenschaften haben.'
            }
        };

        const challengeButtons = document.querySelectorAll('.challenge-btn');
        challengeButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const challengeNum = parseInt(e.target.dataset.challenge);
                this.loadChallenge(challengeNum, this.challenges[challengeNum]);
                
                // Update active button
                challengeButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        document.getElementById('check-solution').addEventListener('click', () => {
            this.checkChallengeSolution();
        });

        document.getElementById('show-hint').addEventListener('click', () => {
            if (this.currentChallenge) {
                const result = document.getElementById('challenge-result');
                result.style.display = 'block';
                result.className = 'hint';
                result.innerHTML = `💡 <strong>Hinweis:</strong> ${this.currentChallenge.hint}`;
            }
        });

        document.getElementById('challenge-css').addEventListener('input', (e) => {
            this.applyChallengeCss(e.target.value);
        });
    }

    loadChallenge(num, challenge) {
        this.currentChallenge = challenge;
        this.currentChallengeNum = num;
        
        document.getElementById('challenge-title').textContent = challenge.title;
        document.getElementById('challenge-description').textContent = challenge.description;
        document.getElementById('challenge-target').innerHTML = challenge.target;
        document.getElementById('challenge-css').value = '';
        document.getElementById('challenge-result').style.display = 'none';
        document.getElementById('challenge-result').className = '';
        
        // Create preview structure
        const preview = document.getElementById('challenge-preview');
        preview.innerHTML = '';
        preview.style = '';
        
        // Add items based on challenge
        const itemCount = num === 5 ? 2 : (num === 1 ? 9 : num === 3 ? 3 : 4);
        for (let i = 0; i < itemCount; i++) {
            const item = document.createElement('div');
            item.className = 'challenge-item';
            item.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
            item.style.borderRadius = '4px';
            item.style.display = 'flex';
            item.style.alignItems = 'center';
            item.style.justifyContent = 'center';
            item.style.color = 'white';
            item.style.padding = '20px';
            
            if (num === 5) {
                // Nested grid challenge
                item.style.padding = '10px';
                item.style.background = '#2d3748';
                const innerGrid = document.createElement('div');
                innerGrid.className = 'inner-grid';
                for (let j = 0; j < 4; j++) {
                    const innerItem = document.createElement('div');
                    innerItem.style.background = '#667eea';
                    innerItem.style.borderRadius = '2px';
                    innerItem.style.minHeight = '30px';
                    innerGrid.appendChild(innerItem);
                }
                item.appendChild(innerGrid);
            } else if (num === 3) {
                // Grid areas challenge
                item.textContent = i === 0 ? 'Header' : i === 1 ? 'Sidebar' : 'Main';
                item.classList.add(`item-${i}`);
            } else {
                item.textContent = num === 2 ? '1fr' : (i + 1);
            }
            
            preview.appendChild(item);
        }
    }

    applyChallengeCss(css) {
        const preview = document.getElementById('challenge-preview');
        const currentNum = this.currentChallengeNum;
        
        try {
            // Reset styles
            preview.style = '';
            
            // Parse and apply CSS
            const lines = css.split('\n');
            lines.forEach(line => {
                const match = line.match(/([^:]+):\s*([^;]+)/);
                if (match) {
                    const prop = match[1].trim();
                    const value = match[2].trim();
                    
                    // Convert CSS property to camelCase
                    const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                    
                    if (prop.includes('grid') || prop === 'display' || prop === 'gap') {
                        preview.style[camelProp] = value;
                    }
                }
            });
            
            // Apply special rules for challenge 3 (Grid Areas)
            if (currentNum === 3 && css.includes('grid-column')) {
                const item0 = preview.querySelector('.item-0');
                if (item0 && css.includes('1 / -1')) {
                    item0.style.gridColumn = '1 / -1';
                }
            }
            
            // Apply special rules for nested grids (Challenge 5)
            if (currentNum === 5 && css.includes('.inner-grid')) {
                const innerGrids = preview.querySelectorAll('.inner-grid');
                innerGrids.forEach(grid => {
                    const innerCss = css.match(/\.inner-grid\s*{([^}]+)}/);
                    if (innerCss) {
                        const innerLines = innerCss[1].split('\n');
                        innerLines.forEach(line => {
                            const match = line.match(/([^:]+):\s*([^;]+)/);
                            if (match) {
                                const prop = match[1].trim();
                                const value = match[2].trim();
                                const camelProp = prop.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
                                grid.style[camelProp] = value;
                            }
                        });
                    }
                });
            }
        } catch (e) {
            console.error('CSS parsing error:', e);
        }
    }

    checkChallengeSolution() {
        if (!this.currentChallenge) return;
        
        const userCss = document.getElementById('challenge-css').value.toLowerCase().replace(/\s+/g, '');
        const result = document.getElementById('challenge-result');
        result.style.display = 'block';
        
        // Check if user's solution contains key properties
        const requiredChecks = {
            1: ['display:grid', 'grid-template-columns:', 'grid-template-rows:', 'gap:'],
            2: ['display:grid', 'grid-template-columns:', '1fr', 'gap:'],
            3: ['display:grid', 'grid-template-columns:', 'grid-template-rows:', 'grid-column:1/-1'],
            4: ['display:grid', 'repeat(', 'auto-fit', 'minmax('],
            5: ['display:grid', 'grid-template-columns:', 'gap:']
        };
        
        const checks = requiredChecks[this.currentChallengeNum];
        let isCorrect = true;
        
        checks.forEach(check => {
            if (!userCss.includes(check.replace(/\s+/g, ''))) {
                isCorrect = false;
            }
        });
        
        if (isCorrect) {
            result.className = 'success';
            result.innerHTML = '✅ <strong>Großartig!</strong> Du hast die Challenge gemeistert! Weiter zur nächsten Challenge!';
        } else {
            result.className = 'error';
            result.innerHTML = '❌ <strong>Noch nicht ganz richtig.</strong> Überprüfe deine CSS-Eigenschaften. Klicke auf "Hinweis" für Hilfe.';
        }
    }

    // Reference Section
    setupReference() {
        const examples = {
            basic: `/* Basic Grid Layout */
.container {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
  gap: 20px;
  height: 100vh;
}

.header {
  grid-column: 1 / -1;
}

.sidebar-left {
  grid-row: 2;
}

.main {
  grid-row: 2;
  grid-column: 2;
}

.sidebar-right {
  grid-row: 2;
  grid-column: 3;
}

.footer {
  grid-column: 1 / -1;
}`,
            responsive: `/* Responsive Grid with auto-fit */
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px;
}

/* Media Query für kleinere Bildschirme */
@media (max-width: 768px) {
  .gallery {
    grid-template-columns: 1fr;
    gap: 10px;
  }
}

/* Responsive mit CSS Grid und Flexbox kombiniert */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
}

.card {
  display: flex;
  flex-direction: column;
  height: 100%;
}`,
            areas: `/* Grid Template Areas */
.app-layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "nav main aside"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: 80px 1fr 60px;
  gap: 10px;
  height: 100vh;
}

.header {
  grid-area: header;
  background: #667eea;
}

.nav {
  grid-area: nav;
  background: #764ba2;
}

.main {
  grid-area: main;
  background: #f7fafc;
}

.aside {
  grid-area: aside;
  background: #48bb78;
}

.footer {
  grid-area: footer;
  background: #2d3748;
}`,
            auto: `/* Auto-placement und Grid Flow */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: minmax(100px, auto);
  grid-auto-flow: dense;
  gap: 15px;
}

/* Große Items */
.item-large {
  grid-column: span 2;
  grid-row: span 2;
}

/* Mittlere Items */
.item-medium {
  grid-column: span 2;
}

/* Kleine Items füllen Lücken */
.item-small {
  /* Wird automatisch platziert */
}

/* Implicit Grid */
.dynamic-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: 100px;
  grid-auto-columns: 100px;
}`
        };

        const exampleTabs = document.querySelectorAll('.example-tab');
        const exampleCode = document.querySelector('#example-code pre');

        exampleTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const example = e.target.dataset.example;
                
                // Update active tab
                exampleTabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                // Show example code
                exampleCode.textContent = examples[example];
            });
        });

        // Show initial example
        exampleCode.textContent = examples.basic;
    }

    // Visualizer Section
    setupVisualizer() {
        document.getElementById('generate-viz').addEventListener('click', () => {
            this.generateGridVisualization();
        });

        document.getElementById('show-lines').addEventListener('change', () => {
            this.updateVisualization();
        });

        document.getElementById('show-numbers').addEventListener('change', () => {
            this.updateVisualization();
        });

        document.getElementById('viz-template').addEventListener('change', () => {
            this.updateVisualization();
        });

        // Setup layout buttons
        const layoutButtons = document.querySelectorAll('.layout-btn');
        layoutButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const layout = e.target.dataset.layout;
                this.generateStandardLayout(layout);
                
                // Update active button
                layoutButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // Initial visualization
        this.generateGridVisualization();
    }

    generateStandardLayout(layoutType) {
        const visualizer = document.getElementById('grid-visualizer');
        const layoutCss = document.getElementById('layout-css');
        visualizer.innerHTML = '';
        
        const layouts = {
            'business-left': {
                template: {
                    columns: '250px 1fr',
                    rows: '60px 1fr 40px',
                    areas: '"sidebar header" "sidebar main" "sidebar footer"',
                    gap: '0'
                },
                items: [
                    { name: 'Header', area: 'header', bg: '#2d3748', color: '#e2e8f0' },
                    { name: 'Sidebar', area: 'sidebar', bg: '#1a202c', color: '#a0aec0' },
                    { name: 'Main Content', area: 'main', bg: '#4a5568', color: '#e2e8f0' },
                    { name: 'Footer', area: 'footer', bg: '#2d3748', color: '#a0aec0' }
                ],
                css: `.container {
  display: grid;
  grid-template-columns: 250px 1fr;
  grid-template-rows: 60px 1fr 40px;
  grid-template-areas:
    "sidebar header"
    "sidebar main"
    "sidebar footer";
  height: 100vh;
}

.sidebar { grid-area: sidebar; }
.header { grid-area: header; }
.main { grid-area: main; }
.footer { grid-area: footer; }`
            },
            'business-right': {
                template: {
                    columns: '1fr 250px',
                    rows: '60px 1fr 40px',
                    areas: '"header sidebar" "main sidebar" "footer sidebar"',
                    gap: '0'
                },
                items: [
                    { name: 'Header', area: 'header', bg: '#2d3748', color: '#e2e8f0' },
                    { name: 'Main Content', area: 'main', bg: '#4a5568', color: '#e2e8f0' },
                    { name: 'Sidebar', area: 'sidebar', bg: '#1a202c', color: '#a0aec0' },
                    { name: 'Footer', area: 'footer', bg: '#2d3748', color: '#a0aec0' }
                ],
                css: `.container {
  display: grid;
  grid-template-columns: 1fr 250px;
  grid-template-rows: 60px 1fr 40px;
  grid-template-areas:
    "header sidebar"
    "main sidebar"
    "footer sidebar";
  height: 100vh;
}`
            },
            'website-classic': {
                template: {
                    columns: '1fr',
                    rows: '80px 50px 1fr 200px',
                    areas: '"header" "nav" "main" "footer"',
                    gap: '0'
                },
                items: [
                    { name: 'Header', area: 'header', bg: '#667eea', color: 'white' },
                    { name: 'Navigation', area: 'nav', bg: '#764ba2', color: 'white' },
                    { name: 'Main Content', area: 'main', bg: '#f7fafc', color: '#2d3748' },
                    { name: 'Footer', area: 'footer', bg: '#2d3748', color: '#a0aec0' }
                ],
                css: `.container {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 80px 50px 1fr 200px;
  grid-template-areas:
    "header"
    "nav"
    "main"
    "footer";
  min-height: 100vh;
}`
            },
            'dashboard': {
                template: {
                    columns: '200px 1fr 300px',
                    rows: '60px 100px 1fr 1fr',
                    areas: '"nav header header" "nav stats stats" "nav chart1 activity" "nav chart2 activity"',
                    gap: '20px'
                },
                items: [
                    { name: 'Nav', area: 'nav', bg: '#1a202c', color: '#a0aec0' },
                    { name: 'Header', area: 'header', bg: '#2d3748', color: '#e2e8f0' },
                    { name: 'Stats', area: 'stats', bg: '#4a5568', color: '#e2e8f0' },
                    { name: 'Chart 1', area: 'chart1', bg: '#667eea', color: 'white' },
                    { name: 'Chart 2', area: 'chart2', bg: '#764ba2', color: 'white' },
                    { name: 'Activity', area: 'activity', bg: '#48bb78', color: 'white' }
                ],
                css: `.dashboard {
  display: grid;
  grid-template-columns: 200px 1fr 300px;
  grid-template-rows: 60px 100px 1fr 1fr;
  grid-template-areas:
    "nav header header"
    "nav stats stats"
    "nav chart1 activity"
    "nav chart2 activity";
  gap: 20px;
  height: 100vh;
  padding: 20px;
}`
            },
            'blog': {
                template: {
                    columns: '1fr 300px',
                    rows: '80px 1fr 100px',
                    areas: '"header header" "content sidebar" "footer footer"',
                    gap: '20px'
                },
                items: [
                    { name: 'Header', area: 'header', bg: '#2d3748', color: '#e2e8f0' },
                    { name: 'Content', area: 'content', bg: '#f7fafc', color: '#2d3748' },
                    { name: 'Sidebar', area: 'sidebar', bg: '#e2e8f0', color: '#2d3748' },
                    { name: 'Footer', area: 'footer', bg: '#2d3748', color: '#a0aec0' }
                ],
                css: `.blog-layout {
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-template-rows: 80px 1fr 100px;
  grid-template-areas:
    "header header"
    "content sidebar"
    "footer footer";
  gap: 20px;
  min-height: 100vh;
}`
            },
            'ecommerce': {
                template: {
                    columns: '200px repeat(3, 1fr)',
                    rows: '60px 80px 1fr 1fr',
                    areas: '"header header header header" "filters banner banner banner" "filters product1 product2 product3" "filters product4 product5 product6"',
                    gap: '15px'
                },
                items: [
                    { name: 'Header', area: 'header', bg: '#1a202c', color: '#e2e8f0' },
                    { name: 'Filters', area: 'filters', bg: '#2d3748', color: '#a0aec0' },
                    { name: 'Banner', area: 'banner', bg: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white' },
                    { name: 'Product 1', area: 'product1', bg: '#f7fafc', color: '#2d3748' },
                    { name: 'Product 2', area: 'product2', bg: '#f7fafc', color: '#2d3748' },
                    { name: 'Product 3', area: 'product3', bg: '#f7fafc', color: '#2d3748' },
                    { name: 'Product 4', area: 'product4', bg: '#f7fafc', color: '#2d3748' },
                    { name: 'Product 5', area: 'product5', bg: '#f7fafc', color: '#2d3748' },
                    { name: 'Product 6', area: 'product6', bg: '#f7fafc', color: '#2d3748' }
                ],
                css: `.shop {
  display: grid;
  grid-template-columns: 200px repeat(3, 1fr);
  grid-template-rows: 60px 80px 1fr 1fr;
  grid-template-areas:
    "header header header header"
    "filters banner banner banner"
    "filters product1 product2 product3"
    "filters product4 product5 product6";
  gap: 15px;
  padding: 15px;
}`
            },
            'portfolio': {
                template: {
                    columns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    rows: '80px repeat(3, 200px)',
                    gap: '20px'
                },
                items: [
                    { name: 'Header', span: 'full', bg: '#1a202c', color: '#e2e8f0' },
                    { name: 'Project 1', bg: '#667eea', color: 'white' },
                    { name: 'Project 2', bg: '#764ba2', color: 'white' },
                    { name: 'Project 3', bg: '#48bb78', color: 'white' },
                    { name: 'Project 4', bg: '#f6ad55', color: 'white' },
                    { name: 'Project 5', bg: '#fc8181', color: 'white' },
                    { name: 'Project 6', bg: '#4299e1', color: 'white' }
                ],
                css: `.portfolio {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  padding: 20px;
}

.header {
  grid-column: 1 / -1;
  height: 80px;
}`
            },
            'magazine': {
                template: {
                    columns: 'repeat(4, 1fr)',
                    rows: '80px 300px 200px 200px',
                    areas: '"header header header header" "featured featured sidebar sidebar" "article1 article2 article3 sidebar" "article4 article5 article6 ad"',
                    gap: '15px'
                },
                items: [
                    { name: 'Header', area: 'header', bg: '#1a202c', color: '#e2e8f0' },
                    { name: 'Featured', area: 'featured', bg: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white' },
                    { name: 'Sidebar', area: 'sidebar', bg: '#2d3748', color: '#a0aec0' },
                    { name: 'Article 1', area: 'article1', bg: '#4a5568', color: '#e2e8f0' },
                    { name: 'Article 2', area: 'article2', bg: '#4a5568', color: '#e2e8f0' },
                    { name: 'Article 3', area: 'article3', bg: '#4a5568', color: '#e2e8f0' },
                    { name: 'Article 4', area: 'article4', bg: '#4a5568', color: '#e2e8f0' },
                    { name: 'Article 5', area: 'article5', bg: '#4a5568', color: '#e2e8f0' },
                    { name: 'Article 6', area: 'article6', bg: '#4a5568', color: '#e2e8f0' },
                    { name: 'Ad', area: 'ad', bg: '#f6ad55', color: 'white' }
                ],
                css: `.magazine {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: 80px 300px 200px 200px;
  grid-template-areas:
    "header header header header"
    "featured featured sidebar sidebar"
    "article1 article2 article3 sidebar"
    "article4 article5 article6 ad";
  gap: 15px;
}`
            },
            
            // NEUE FLEXBOX LAYOUTS
            'magazine-flex': {
                isFlexbox: true,
                template: {
                    direction: 'column',
                    gap: '20px'
                },
                items: [
                    { name: 'Header', bg: '#1a202c', color: '#e2e8f0', height: '80px' },
                    { name: 'Hero Banner', bg: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', height: '300px' },
                    { name: 'Articles Section', bg: '#f7fafc', color: '#2d3748', flex: '1', isContainer: true }
                ],
                css: `.magazine-flex {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  gap: 20px;
}

.header {
  height: 80px;
  background: #1a202c;
  color: #e2e8f0;
}

.hero-banner {
  height: 300px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.articles-section {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding: 20px;
}

.article {
  flex: 1 1 300px;
  min-height: 200px;
  background: #4a5568;
  color: #e2e8f0;
  border-radius: 8px;
}`
            },
            'ecommerce-flex': {
                isFlexbox: true,
                template: {
                    direction: 'column',
                    gap: '0'
                },
                items: [
                    { name: 'Header', bg: '#1a202c', color: '#e2e8f0', height: '60px' },
                    { name: 'Main Content', bg: '#f7fafc', color: '#2d3748', flex: '1', isContainer: true }
                ],
                css: `.ecommerce-flex {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  height: 60px;
  background: #1a202c;
  color: #e2e8f0;
}

.main-content {
  flex: 1;
  display: flex;
  gap: 20px;
  padding: 20px;
}

.filters {
  width: 200px;
  background: #2d3748;
  color: #a0aec0;
  border-radius: 8px;
}

.products {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.product-card {
  flex: 1 1 250px;
  min-height: 300px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}`
            },
            'gallery-flex': {
                isFlexbox: true,
                template: {
                    direction: 'column',
                    gap: '20px'
                },
                items: [
                    { name: 'Header', bg: '#1a202c', color: '#e2e8f0', height: '80px' },
                    { name: 'Gallery Grid', bg: '#f7fafc', color: '#2d3748', flex: '1', isContainer: true }
                ],
                css: `.gallery-flex {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  gap: 20px;
}

.header {
  height: 80px;
  background: #1a202c;
  color: #e2e8f0;
}

.gallery-grid {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  padding: 20px;
}

.gallery-item {
  flex: 1 1 250px;
  height: 200px;
  background: #667eea;
  color: white;
  border-radius: 8px;
  min-width: 250px;
  max-width: 350px;
}

/* Adaptive masonry effect */
.gallery-item:nth-child(3n) {
  height: 250px;
}

.gallery-item:nth-child(5n) {
  height: 180px;
}`
            },
            'landing-flex': {
                isFlexbox: true,
                template: {
                    direction: 'column',
                    gap: '0'
                },
                items: [
                    { name: 'Hero Section', bg: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', height: '100vh', isContainer: true },
                    { name: 'Features', bg: '#f7fafc', color: '#2d3748', padding: '80px 0', isContainer: true },
                    { name: 'Testimonials', bg: '#2d3748', color: '#e2e8f0', padding: '80px 0' },
                    { name: 'Footer', bg: '#1a202c', color: '#a0aec0', height: '200px' }
                ],
                css: `.landing-flex {
  display: flex;
  flex-direction: column;
}

.hero-section {
  height: 100vh;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.features {
  padding: 80px 0;
  background: #f7fafc;
  color: #2d3748;
}

.features-container {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.feature-card {
  flex: 1 1 300px;
  text-align: center;
  padding: 40px 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.testimonials {
  padding: 80px 0;
  background: #2d3748;
  color: #e2e8f0;
}

.footer {
  height: 200px;
  background: #1a202c;
  color: #a0aec0;
}`
            },
            'team-flex': {
                isFlexbox: true,
                template: {
                    direction: 'column',
                    gap: '40px'
                },
                items: [
                    { name: 'Header', bg: '#1a202c', color: '#e2e8f0', height: '80px' },
                    { name: 'Team Grid', bg: '#f7fafc', color: '#2d3748', flex: '1', isContainer: true }
                ],
                css: `.team-flex {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  gap: 40px;
}

.header {
  height: 80px;
  background: #1a202c;
  color: #e2e8f0;
}

.team-grid {
  flex: 1;
  padding: 40px 20px;
  background: #f7fafc;
}

.team-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.team-member {
  flex: 0 1 280px;
  background: white;
  border-radius: 12px;
  padding: 30px 20px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.team-member:hover {
  transform: translateY(-5px);
}

.member-photo {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: #667eea;
  margin: 0 auto 20px;
}

.member-name {
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 5px;
  color: #2d3748;
}

.member-role {
  color: #667eea;
  margin-bottom: 15px;
}`
            },
            
            // ZUSÄTZLICHE MODERNE LAYOUTS
            'card-grid': {
                template: {
                    columns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    rows: 'auto',
                    gap: '20px'
                },
                items: [
                    { name: 'Card 1', bg: '#667eea', color: 'white' },
                    { name: 'Card 2', bg: '#764ba2', color: 'white' },
                    { name: 'Card 3', bg: '#48bb78', color: 'white' },
                    { name: 'Card 4', bg: '#f6ad55', color: 'white' },
                    { name: 'Card 5', bg: '#fc8181', color: 'white' },
                    { name: 'Card 6', bg: '#4299e1', color: 'white' }
                ],
                css: `.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.card {
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
}`
            },
            'masonry-grid': {
                template: {
                    columns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    rows: 'masonry',
                    gap: '20px'
                },
                items: [
                    { name: 'Item 1', bg: '#667eea', color: 'white', height: '200px' },
                    { name: 'Item 2', bg: '#764ba2', color: 'white', height: '150px' },
                    { name: 'Item 3', bg: '#48bb78', color: 'white', height: '250px' },
                    { name: 'Item 4', bg: '#f6ad55', color: 'white', height: '180px' },
                    { name: 'Item 5', bg: '#fc8181', color: 'white', height: '220px' },
                    { name: 'Item 6', bg: '#4299e1', color: 'white', height: '160px' }
                ],
                css: `.masonry-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  grid-template-rows: masonry; /* Future CSS feature */
  gap: 20px;
  padding: 20px;
}

/* Fallback for browsers without masonry support */
@supports not (grid-template-rows: masonry) {
  .masonry-grid {
    display: flex;
    flex-wrap: wrap;
  }
  
  .masonry-item {
    flex: 1 1 250px;
    margin: 10px;
  }
}`
            }
        };

        const layout = layouts[layoutType];
        if (!layout) return;

        if (layout.isFlexbox) {
            // Flexbox Layout
            visualizer.style.display = 'flex';
            visualizer.style.flexDirection = layout.template.direction;
            visualizer.style.gap = layout.template.gap;
            visualizer.style.minHeight = '500px';
            
            // Create flexbox items
            layout.items.forEach((item, index) => {
                const element = document.createElement('div');
                element.className = 'layout-item';
                element.textContent = item.name;
                element.style.background = item.bg || '#667eea';
                element.style.color = item.color || 'white';
                element.style.padding = '20px';
                element.style.borderRadius = '8px';
                
                if (item.height) {
                    element.style.height = item.height;
                }
                if (item.flex) {
                    element.style.flex = item.flex;
                }
                if (item.isContainer) {
                    element.style.display = 'flex';
                    element.style.alignItems = 'center';
                    element.style.justifyContent = 'center';
                    element.style.position = 'relative';
                    
                    // Add visual indication for nested containers
                    if (layoutType === 'gallery-flex' || layoutType === 'ecommerce-flex' || layoutType === 'team-flex') {
                        element.innerHTML = `<span style="opacity: 0.7;">${item.name} Container</span>`;
                        const subItems = document.createElement('div');
                        subItems.style.position = 'absolute';
                        subItems.style.top = '10px';
                        subItems.style.right = '10px';
                        subItems.style.fontSize = '0.8rem';
                        subItems.style.opacity = '0.6';
                        subItems.textContent = 'Flex Container';
                        element.appendChild(subItems);
                    }
                }
                
                visualizer.appendChild(element);
            });
        } else {
            // Grid Layout (existing code)
            visualizer.style.display = 'grid';
            visualizer.style.gridTemplateColumns = layout.template.columns;
            visualizer.style.gridTemplateRows = layout.template.rows;
            visualizer.style.gap = layout.template.gap;
            
            if (layout.template.areas) {
                visualizer.style.gridTemplateAreas = layout.template.areas;
            }

            // Create items
            layout.items.forEach(item => {
                const element = document.createElement('div');
                element.className = 'layout-item';
                element.textContent = item.name;
                element.style.background = item.bg || '#667eea';
                element.style.color = item.color || 'white';
                
                if (item.area) {
                    element.style.gridArea = item.area;
                }
                
                if (item.span === 'full') {
                    element.style.gridColumn = '1 / -1';
                }
                
                if (item.height) {
                    element.style.height = item.height;
                }
                
                visualizer.appendChild(element);
            });
        }

        // Show CSS
        layoutCss.textContent = layout.css;
        
        // Update stats
        const stats = document.getElementById('grid-stats');
        const layoutInfo = layout.isFlexbox ? 
            `Layout: ${layoutType} (Flexbox)
Direction: ${layout.template.direction}
Gap: ${layout.template.gap}
Items: ${layout.items.length}
Type: One-dimensional layout` :
            `Layout: ${layoutType} (CSS Grid)
Template: ${layout.template.columns}
Rows: ${layout.template.rows}
Gap: ${layout.template.gap}
Items: ${layout.items.length}
Type: Two-dimensional layout`;
        
        stats.textContent = layoutInfo;
    }

    generateGridVisualization() {
        const cols = parseInt(document.getElementById('viz-cols').value);
        const rows = parseInt(document.getElementById('viz-rows').value);
        const visualizer = document.getElementById('grid-visualizer');
        const template = document.getElementById('viz-template').value;
        
        visualizer.innerHTML = '';
        visualizer.style.display = 'grid';
        
        // Set template based on selection
        switch(template) {
            case 'equal':
                visualizer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
                visualizer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
                break;
            case 'responsive':
                visualizer.style.gridTemplateColumns = `repeat(auto-fit, minmax(100px, 1fr))`;
                visualizer.style.gridTemplateRows = `repeat(${rows}, 100px)`;
                break;
            case 'asymmetric':
                const colTemplate = [];
                for (let i = 0; i < cols; i++) {
                    colTemplate.push(i % 2 === 0 ? '2fr' : '1fr');
                }
                visualizer.style.gridTemplateColumns = colTemplate.join(' ');
                visualizer.style.gridTemplateRows = `repeat(${rows}, 100px)`;
                break;
            case 'custom':
                visualizer.style.gridTemplateColumns = '200px 1fr 150px';
                visualizer.style.gridTemplateRows = '80px 1fr 60px';
                break;
        }
        
        visualizer.style.gap = '10px';
        visualizer.style.padding = '20px';
        visualizer.style.position = 'relative';
        
        // Create cells
        const cellCount = template === 'custom' ? 9 : cols * rows;
        for (let i = 0; i < cellCount; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.style.background = `rgba(102, 126, 234, ${0.1 + (i % 3) * 0.1})`;
            cell.style.border = '1px solid rgba(102, 126, 234, 0.3)';
            cell.style.display = 'flex';
            cell.style.alignItems = 'center';
            cell.style.justifyContent = 'center';
            cell.style.color = '#a0aec0';
            cell.style.fontSize = '0.9rem';
            cell.textContent = `Cell ${i + 1}`;
            visualizer.appendChild(cell);
        }
        
        this.updateVisualization();
        this.updateGridStats(cols, rows, template);
    }

    updateVisualization() {
        const showLines = document.getElementById('show-lines').checked;
        const showNumbers = document.getElementById('show-numbers').checked;
        const visualizer = document.getElementById('grid-visualizer');
        
        // Remove existing lines and numbers
        document.querySelectorAll('.grid-line, .grid-number').forEach(el => el.remove());
        
        if (showLines || showNumbers) {
            const cols = parseInt(document.getElementById('viz-cols').value);
            const rows = parseInt(document.getElementById('viz-rows').value);
            const rect = visualizer.getBoundingClientRect();
            const cellWidth = rect.width / cols;
            const cellHeight = rect.height / rows;
            
            if (showLines) {
                // Add horizontal lines
                for (let i = 0; i <= rows; i++) {
                    const line = document.createElement('div');
                    line.className = 'grid-line horizontal';
                    line.style.top = `${i * cellHeight}px`;
                    line.style.left = '0';
                    visualizer.appendChild(line);
                }
                
                // Add vertical lines
                for (let i = 0; i <= cols; i++) {
                    const line = document.createElement('div');
                    line.className = 'grid-line vertical';
                    line.style.left = `${i * cellWidth}px`;
                    line.style.top = '0';
                    visualizer.appendChild(line);
                }
            }
            
            if (showNumbers) {
                // Add row numbers
                for (let i = 1; i <= rows + 1; i++) {
                    const num = document.createElement('div');
                    num.className = 'grid-number';
                    num.textContent = i;
                    num.style.top = `${(i - 1) * cellHeight - 10}px`;
                    num.style.left = '-20px';
                    visualizer.appendChild(num);
                }
                
                // Add column numbers
                for (let i = 1; i <= cols + 1; i++) {
                    const num = document.createElement('div');
                    num.className = 'grid-number';
                    num.textContent = i;
                    num.style.left = `${(i - 1) * cellWidth - 5}px`;
                    num.style.top = '-20px';
                    visualizer.appendChild(num);
                }
            }
        }
    }

    updateGridStats(cols, rows, template) {
        const stats = document.getElementById('grid-stats');
        let output = '';
        
        if (typeof cols === 'string') {
            // For standard layouts
            output = cols;
        } else {
            // For regular grid visualization
            output = `Spalten: ${cols}
Zeilen: ${rows}
Zellen: ${cols * rows}
Template: ${template}
Grid Lines: ${(cols + 1) * (rows + 1)}`;
        }
        
        stats.innerHTML = output;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.gridTrainer = new GridTrainer();
});