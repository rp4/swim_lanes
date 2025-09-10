class SwimLaneApp {
    constructor() {
        this.svg = document.getElementById('diagramSvg');
        this.parser = new ProcessParser();
        this.renderer = new SwimLaneRenderer(this.svg);
        this.exporter = new ProcessExporter();
        this.editor = new DiagramEditor(this.renderer);
        this.controls = new DiagramControls(this.renderer, this.editor, this.parser, this.exporter);
        
        this.init();
    }

    init() {
        this.checkUrlParams();
        this.setupKeyboardShortcuts();
        console.log('🏊 Swim Lane Diagram Visualizer initialized!');
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const data = urlParams.get('data');
        
        if (data) {
            try {
                const jsonString = decodeURIComponent(atob(data));
                const jsonData = JSON.parse(jsonString);
                const processData = this.parser.parseProcess(jsonData);
                this.controls.displayDiagram(processData);
            } catch (error) {
                console.error('Failed to load shared diagram:', error);
            }
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            if (e.ctrlKey || e.metaKey) {
                switch(e.key.toLowerCase()) {
                    case 'o':
                        e.preventDefault();
                        document.getElementById('fileInput').click();
                        break;
                    case 's':
                        e.preventDefault();
                        this.controls.downloadJSON();
                        break;
                    case 'e':
                        e.preventDefault();
                        this.controls.downloadImage();
                        break;
                    case 'l':
                        e.preventDefault();
                        this.controls.addNewLane();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.controls.addNewNode();
                        break;
                    case '+':
                    case '=':
                        e.preventDefault();
                        this.renderer.zoom(1.2);
                        break;
                    case '-':
                    case '_':
                        e.preventDefault();
                        this.renderer.zoom(0.8);
                        break;
                    case '0':
                        e.preventDefault();
                        this.renderer.fitToScreen();
                        break;
                }
            } else {
                switch(e.key.toLowerCase()) {
                    case 'c':
                        if (!e.target.closest('input, textarea')) {
                            this.controls.toggleConnectMode();
                        }
                        break;
                    case 'h':
                        this.showHelp();
                        break;
                    case 'escape':
                        this.editor.cancelConnection();
                        if (this.controls.connectMode) {
                            this.controls.toggleConnectMode();
                        }
                        break;
                }
            }
        });
    }

    showHelp() {
        const helpText = `
🏊 Swim Lane Diagram - Keyboard Shortcuts

File Operations:
• Ctrl+O: Open file
• Ctrl+S: Save as JSON
• Ctrl+E: Export as image

Editing:
• Ctrl+L: Add new lane
• Ctrl+N: Add new node
• C: Toggle connection mode
• Delete: Delete selected node
• Ctrl+Z: Undo
• Ctrl+Y: Redo

View:
• Ctrl+Plus: Zoom in
• Ctrl+Minus: Zoom out
• Ctrl+0: Fit to screen

Other:
• H: Show this help
• Escape: Cancel current operation
• Double-click node: Edit node
• Double-click lane: Edit lane
• Drag nodes to move them
        `;
        
        alert(helpText);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new SwimLaneApp();
    window.swimLaneApp = app;
});