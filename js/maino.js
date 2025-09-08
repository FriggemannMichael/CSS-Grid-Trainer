// maino.js – zentraler Einstiegspunkt für alle Module
import GridTrainer from "./GridTrainer.js";

// Initialisierung nach DOM-Load
document.addEventListener("DOMContentLoaded", () => {
  window.gridTrainer = new GridTrainer();
});
