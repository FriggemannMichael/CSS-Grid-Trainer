export default function setupVisualizer(app) {
  document.addEventListener("cssUpdate", () => updateVisualization(app));

  updateVisualization(app);
}

function updateVisualization(app) {
  const gridContainer = document.getElementById("grid-container");
  const vis = document.getElementById("visualizer");
  vis.innerHTML = "";

  const rows = gridContainer.style.gridTemplateRows.split(" ").filter(Boolean);
  const cols = gridContainer.style.gridTemplateColumns
    .split(" ")
    .filter(Boolean);

  if (rows.length === 0 || cols.length === 0) return;

  const svgNS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNS, "svg");
  svg.setAttribute("width", "100%");
  svg.setAttribute("height", "100%");
  svg.setAttribute("viewBox", `0 0 ${cols.length * 100} ${rows.length * 100}`);

  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < cols.length; c++) {
      const rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("x", c * 100);
      rect.setAttribute("y", r * 100);
      rect.setAttribute("width", 100);
      rect.setAttribute("height", 100);
      rect.setAttribute("fill", "none");
      rect.setAttribute("stroke", "#999");
      rect.setAttribute("stroke-width", 1);
      svg.appendChild(rect);
    }
  }

  vis.appendChild(svg);
  updateGridStats(gridContainer);
}

function updateGridStats(container) {
  const stats = document.getElementById("grid-stats");
  stats.innerHTML = "";

  const rowCount = container.style.gridTemplateRows
    .split(" ")
    .filter(Boolean).length;
  const colCount = container.style.gridTemplateColumns
    .split(" ")
    .filter(Boolean).length;
  const items = container.children.length;

  stats.innerHTML = `
    <p>Spalten: ${colCount}</p>
    <p>Reihen: ${rowCount}</p>
    <p>Items: ${items}</p>
  `;
}
