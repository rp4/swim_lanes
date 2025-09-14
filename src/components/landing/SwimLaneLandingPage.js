import React from 'react';
import ReactDOM from 'react-dom/client';
import { LandingPage } from '/LandingPage.tsx';
import { Upload, Github, FileText, Shield, Lock, Database } from 'lucide-react';
import '../../styles/landing.css';

export class SwimLaneLandingPage {
  constructor(onStart, onFileLoad) {
    this.onStart = onStart;
    this.onFileLoad = onFileLoad;
    this.container = null;
    this.root = null;
  }

  show() {
    this.container = document.createElement('div');
    this.container.id = 'landing-page-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1000;
      background: url('/pool.png') center/cover no-repeat;
      backdrop-filter: blur(2px);
    `;

    document.body.appendChild(this.container);

    this.root = ReactDOM.createRoot(this.container);
    this.root.render(React.createElement(LandingPageWrapper, {
      onStart: this.handleStart.bind(this),
      onFileSelect: this.handleFileSelect.bind(this)
    }));
  }

  hide() {
    if (this.root) {
      this.root.unmount();
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
    this.container = null;
    this.root = null;
  }

  handleStart() {
    this.hide();
    if (this.onStart) {
      this.onStart();
    }
  }

  handleFileSelect(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        this.hide();
        if (this.onFileLoad) {
          this.onFileLoad(jsonData);
        }
      } catch (error) {
        alert('Invalid JSON file. Please select a valid swim lane diagram file.');
      }
    };
    reader.readAsText(file);
  }
}

function LandingPageWrapper({ onStart, onFileSelect }) {
  const config = {
    icon: '🏊',
    title: 'SwimLanes',
    subtitle: 'Interactive Process Diagram Visualizer',

    showInfoButton: true,
    infoPopup: {
      title: 'Your Privacy Matters',
      icon: React.createElement(Shield, { className: 'w-6 h-6 text-blue-600' }),
      sections: [
        {
          icon: React.createElement(Lock, { className: 'w-5 h-5 text-gray-600' }),
          title: 'Local Processing Only',
          content: 'All processing happens in your browser. Your diagrams never leave your device unless you explicitly export them.'
        },
        {
          icon: React.createElement(Database, { className: 'w-5 h-5 text-gray-600' }),
          title: 'No Data Collection',
          bullets: [
            'No tracking or analytics',
            'No cookies or local storage',
            'No server uploads',
            'Complete privacy'
          ]
        }
      ]
    },

    actions: [
      {
        label: 'Start New Diagram',
        onClick: onStart,
        variant: 'primary',
        icon: React.createElement(FileText, { className: 'w-5 h-5' })
      },
      {
        label: 'Load from File',
        variant: 'secondary',
        icon: React.createElement(Upload, { className: 'w-5 h-5' })
      }
    ],

    fileUpload: {
      accept: '.json',
      onFileSelect: onFileSelect,
      dragDropEnabled: true
    },

    footerLinks: [
      {
        icon: React.createElement(Github, { className: 'w-6 h-6' }),
        href: 'https://github.com/yourusername/swimlanes',
        title: 'View on GitHub'
      }
    ],

    containerClassName: 'bg-white/90 backdrop-blur-md'
  };

  return React.createElement(LandingPage, config);
}