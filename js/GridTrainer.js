import setupNavigation from './navigation.js';
import setupPlayground from './playground.js';
import setupChallenges from './challenges.js';
import setupReference from './reference.js';
import setupVisualizer from './visualizer.js';

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
    setupNavigation(this);
    setupPlayground(this);
    setupChallenges(this);
    setupReference(this);
    setupVisualizer(this);
  }
}

export default GridTrainer;
