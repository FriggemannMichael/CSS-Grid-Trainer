export default function setupReference(app) {
  const list = document.getElementById("reference-list");
  list.innerHTML = "";

  examples.forEach((ex) => {
    const card = document.createElement("div");
    card.className = "reference-card";

    const title = document.createElement("h4");
    title.textContent = ex.title;

    const code = document.createElement("pre");
    code.textContent = ex.code;

    const demo = document.createElement("div");
    demo.className = "reference-demo";
    demo.style.display = "grid";
    Object.assign(demo.style, ex.css);

    for (let i = 1; i <= 6; i++) {
      const item = document.createElement("div");
      item.className = "grid-item";
      item.textContent = i;
      demo.appendChild(item);
    }

    card.appendChild(title);
    card.appendChild(code);
    card.appendChild(demo);
    list.appendChild(card);
  });
}

const examples = [
  {
    title: "Basis Grid",
    code: `display: grid;
grid-template-columns: 1fr 1fr 1fr;`,
    css: { gridTemplateColumns: "1fr 1fr 1fr" },
  },
  {
    title: "Gap hinzufügen",
    code: `display: grid;
grid-template-columns: 1fr 1fr 1fr;
gap: 20px;`,
    css: { gridTemplateColumns: "1fr 1fr 1fr", gap: "20px" },
  },
  {
    title: "Zentrierung",
    code: `display: grid;
place-items: center;`,
    css: { placeItems: "center" },
  },
];
