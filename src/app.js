import { ProcessParser } from './core/utils/parser.js';
import { SwimLaneRenderer } from './components/diagram/SwimLane.js';
import { ProcessExporter } from './lib/export/exporter.js';
import { DiagramEditor } from './components/editor/Editor.js';
import { DiagramControls } from './components/controls/Controls.js';
import { KeyboardManager } from './core/services/KeyboardManager.js';
import { UrlParamsHandler } from './core/services/UrlParamsHandler.js';
import { ErrorHandler } from './core/services/ErrorHandler.js';
import './styles/base/main.css';

class SwimLaneApp {
  constructor() {
    this.svg = document.getElementById('diagramSvg');
    this.parser = new ProcessParser();
    this.renderer = new SwimLaneRenderer(this.svg);
    this.exporter = new ProcessExporter();
    this.editor = new DiagramEditor(this.renderer);
    this.controls = new DiagramControls(this.renderer, this.editor, this.parser, this.exporter);

    this.keyboardManager = new KeyboardManager(this);
    this.urlParamsHandler = new UrlParamsHandler(this);

    this.init();
  }

  init() {
    // Initialize global error handling
    ErrorHandler.initialize();

    this.urlParamsHandler.checkUrlParams();
    this.keyboardManager.setupKeyboardShortcuts();
    console.log('🏊 Swim Lane Diagram Visualizer initialized!');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new SwimLaneApp();
  window.swimLaneApp = app;
});

export default SwimLaneApp;
