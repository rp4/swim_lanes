import { ProcessParser } from './core/utils/parser.js';
import { SwimLaneRenderer } from './components/diagram/SwimLane.js';
import { ProcessExporter } from './lib/export/exporter.js';
import { DiagramEditor } from './components/editor/Editor.js';
import { DiagramControls } from './components/controls/Controls.js';
import { KeyboardManager } from './core/services/KeyboardManager.js';
import { UrlParamsHandler } from './core/services/UrlParamsHandler.js';
import { ErrorHandler } from './core/services/ErrorHandler.js';
import { LandingPage } from './components/landing/LandingPage.js';
import './styles/base/main.css';

class SwimLaneApp {
  constructor() {
    this.initialized = false;
    this.landingPage = null;
    this.svg = null;
    this.parser = null;
    this.renderer = null;
    this.exporter = null;
    this.editor = null;
    this.controls = null;
    this.keyboardManager = null;
    this.urlParamsHandler = null;

    this.init();
  }

  initializeDiagram() {
    if (this.initialized) return;

    this.svg = document.getElementById('diagramSvg');
    this.parser = new ProcessParser();
    this.renderer = new SwimLaneRenderer(this.svg);
    this.exporter = new ProcessExporter();
    this.editor = new DiagramEditor(this.renderer);
    this.controls = new DiagramControls(this.renderer, this.editor, this.parser, this.exporter);

    this.keyboardManager = new KeyboardManager(this);
    this.urlParamsHandler = new UrlParamsHandler(this);

    this.keyboardManager.setupKeyboardShortcuts();
    this.initialized = true;
    console.log('🏊 Swim Lane Diagram Visualizer initialized!');
  }

  showLandingPage() {
    if (!this.landingPage) {
      const fileInput = document.getElementById('fileInput');

      // Set up the hidden file input handler
      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const jsonData = JSON.parse(evt.target.result);
              this.loadDiagram(jsonData);
              if (this.landingPage) {
                this.landingPage.remove();
              }
              document.querySelector('#dropZone').style.display = 'none';
              document.querySelector('#swimlaneCanvas').style.display = 'block';
              if (this.controls) {
                this.controls.showToolbarButtons();
              }
            } catch (error) {
              console.error('Error parsing JSON:', error);
              alert('Invalid JSON file: ' + error.message);
            }
          };
          reader.readAsText(file);
          // Reset the input so the same file can be selected again
          e.target.value = '';
        }
      });

      this.landingPage = new LandingPage({
        icon: '🏊',
        title: 'Swim Lane Diagram',
        subtitle: 'Visualize and edit your process flows with complete privacy',
        showInfoButton: true,
        infoPopup: {
          title: 'Privacy & Data Storage Notice',
          icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>`,
          sections: [
            {
              icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
                <ellipse cx="12" cy="5" rx="9" ry="3"/>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
              </svg>`,
              title: 'Browser-Based Storage',
              content: 'This application stores all schedule data locally in your browser\'s localStorage. No data is ever sent to any server.'
            },
            {
              icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>`,
              title: 'What This Means',
              bullets: [
                'Your data stays on this device only',
                'Clearing browser data will delete your schedules',
                'Different browsers/devices won\'t share data',
                'We cannot recover lost data'
              ]
            }
          ]
        },
        fileUpload: {
          accept: '.json',
          onFileSelect: (file) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              try {
                const jsonData = JSON.parse(e.target.result);
                this.loadDiagram(jsonData);
                this.landingPage.remove();
                document.querySelector('#dropZone').style.display = 'none';
                document.querySelector('#swimlaneCanvas').style.display = 'block';
              } catch (error) {
                alert('Invalid JSON file');
              }
            };
            reader.readAsText(file);
          },
          dragDropEnabled: true
        },
        actions: [
          {
            label: 'Choose JSON File',
            icon: '',
            variant: 'primary',
            onClick: () => {
              fileInput.click();
            }
          },
          {
            label: 'Load Sample Process',
            variant: 'secondary',
            onClick: () => {
              this.initializeDiagram();
              const sampleData = this.parser.generateSampleProcess();
              this.renderer.render(sampleData);
              this.controls.showToolbarButtons();
              this.landingPage.remove();
              document.querySelector('#dropZone').style.display = 'none';
              document.querySelector('#swimlaneCanvas').style.display = 'block';
            }
          }
        ],
        footerLinks: [
          {
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>`,
            href: 'https://github.com/rp4/SwimLanes',
            title: 'GitHub Repository',
            target: '_blank'
          },
          {
            icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
            </svg>`,
            href: 'https://openai.com',
            title: 'OpenAI',
            target: '_blank'
          },
          {
            icon: '🏆',
            href: 'https://scoreboard.audittoolbox.com',
            title: 'Achievements',
            target: '_blank'
          },
          {
            icon: '🧰',
            href: 'https://audittoolbox.com',
            title: 'Tools',
            target: '_blank'
          }
        ]
      });

      document.body.appendChild(this.landingPage.render());
    }
    this.landingPage.show();
  }

  startNewDiagram() {
    this.initializeDiagram();
    // Load empty diagram or default template
    if (this.renderer) {
      this.renderer.clear();
    }
  }

  loadDiagram(jsonData) {
    this.initializeDiagram();
    if (this.parser && this.renderer) {
      const processData = this.parser.parse(jsonData);
      this.renderer.render(processData);
      if (this.controls) {
        this.controls.showToolbarButtons();
      }
    }
  }

  init() {
    // Initialize global error handling
    ErrorHandler.initialize();

    // Check if there are URL params to load a diagram directly
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('data') || urlParams.has('url')) {
      this.initializeDiagram();
      this.urlParamsHandler.checkUrlParams();
    } else {
      // Show landing page
      this.showLandingPage();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const app = new SwimLaneApp();
  window.swimLaneApp = app;
});

export default SwimLaneApp;
