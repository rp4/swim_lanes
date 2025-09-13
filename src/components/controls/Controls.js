export class DiagramControls {
    constructor(renderer, editor, parser, exporter) {
        this.renderer = renderer;
        this.editor = editor;
        this.parser = parser;
        this.exporter = exporter;
        this.connectMode = false;
        
        this.setupControls();
        this.setupDragAndDrop();
    }

    setupControls() {
        document.getElementById('uploadBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });

        document.getElementById('loadSampleBtn').addEventListener('click', () => {
            this.loadSampleData();
        });

        document.getElementById('addLaneBtn').addEventListener('click', () => {
            this.addNewLane();
        });

        document.getElementById('addNodeBtn').addEventListener('click', () => {
            this.addNewNode();
        });

        document.getElementById('connectBtn').addEventListener('click', () => {
            this.toggleConnectMode();
        });

        document.getElementById('zoomInBtn').addEventListener('click', () => {
            this.renderer.zoom(1.2);
        });

        document.getElementById('zoomOutBtn').addEventListener('click', () => {
            this.renderer.zoom(0.8);
        });

        document.getElementById('fitBtn').addEventListener('click', () => {
            this.renderer.fitToScreen();
        });

        document.getElementById('undoBtn').addEventListener('click', () => {
            this.editor.undo();
        });

        document.getElementById('redoBtn').addEventListener('click', () => {
            this.editor.redo();
        });

        document.getElementById('downloadJsonBtn').addEventListener('click', () => {
            this.downloadJSON();
        });

        document.getElementById('downloadImageBtn').addEventListener('click', () => {
            this.downloadImage();
        });

        document.addEventListener('save', (e) => {
            this.exporter.downloadJSON(e.detail);
        });
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        const swimlaneCanvas = document.getElementById('swimlaneCanvas');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.add('drag-over');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => {
                dropZone.classList.remove('drag-over');
            }, false);
        });

        dropZone.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        }, false);

        dropZone.addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async handleFileUpload(file) {
        if (!file || !file.name.endsWith('.json')) {
            alert('Please upload a valid JSON file');
            return;
        }

        try {
            const processData = await this.parser.loadFromFile(file);
            this.displayDiagram(processData);
            this.showNotification('Process loaded successfully!');
        } catch (error) {
            alert('Error loading file: ' + error.message);
        }
    }

    loadSampleData() {
        const sampleData = this.parser.generateSampleProcess();
        this.displayDiagram(sampleData);
        this.showNotification('Sample process loaded!');
    }

    displayDiagram(processData) {
        document.getElementById('dropZone').style.display = 'none';
        document.getElementById('swimlaneCanvas').style.display = 'block';
        
        this.renderer.render(processData);
        this.editor.saveState();
    }

    addNewLane() {
        const name = prompt('Enter lane name:');
        if (name) {
            this.editor.saveState();
            const lane = this.renderer.addLane(name);
            this.showNotification(`Lane "${name}" added!`);
        }
    }

    addNewNode() {
        if (!this.renderer.processData || this.renderer.processData.lanes.length === 0) {
            alert('Please add a lane first or load a process');
            return;
        }

        const lanes = this.renderer.processData.lanes;
        const laneOptions = lanes.map(l => `${l.name}`).join('\n');
        const laneIndex = prompt(`Select lane (enter number):\n${lanes.map((l, i) => `${i + 1}. ${l.name}`).join('\n')}`);
        
        if (laneIndex && !isNaN(laneIndex)) {
            const selectedLane = lanes[parseInt(laneIndex) - 1];
            if (selectedLane) {
                const nodeText = prompt('Enter node text:') || 'New Node';
                const nodeType = prompt('Enter node type (process/risk/control):') || 'process';
                
                this.editor.saveState();
                const node = this.renderer.addNode(selectedLane.id, nodeType, nodeText);
                this.showNotification('Node added!');
            }
        }
    }

    toggleConnectMode() {
        this.connectMode = !this.connectMode;
        const connectBtn = document.getElementById('connectBtn');
        
        if (this.connectMode) {
            connectBtn.style.background = 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)';
            this.showNotification('Connection mode ON - Click nodes to connect them');
            this.setupConnectionMode();
        } else {
            connectBtn.style.background = '';
            this.showNotification('Connection mode OFF');
            this.teardownConnectionMode();
        }
    }

    setupConnectionMode() {
        this.connectionHandler = (e) => {
            const nodeElement = e.target.closest('.process-node');
            if (nodeElement) {
                const nodeId = nodeElement.getAttribute('data-node-id');
                
                if (!this.editor.connectionStart) {
                    this.editor.startConnecting(nodeId);
                    this.showNotification('Select target node');
                } else {
                    this.editor.completeConnection(nodeId);
                    this.toggleConnectMode();
                }
            }
        };
        
        this.renderer.svg.addEventListener('click', this.connectionHandler);
    }

    teardownConnectionMode() {
        if (this.connectionHandler) {
            this.renderer.svg.removeEventListener('click', this.connectionHandler);
            this.connectionHandler = null;
        }
        this.editor.cancelConnection();
    }

    downloadJSON() {
        const processData = this.renderer.getProcessData();
        if (processData) {
            const filename = prompt('Enter filename:', 'swimlane-process.json') || 'swimlane-process.json';
            this.exporter.downloadJSON(processData, filename);
            this.showNotification('JSON downloaded!');
        } else {
            alert('No diagram to export');
        }
    }

    downloadImage() {
        const processData = this.renderer.getProcessData();
        if (!processData) {
            alert('No diagram to export');
            return;
        }

        const format = prompt('Enter format (png/svg):', 'png') || 'png';
        const filename = prompt('Enter filename:', 'swimlane-diagram') || 'swimlane-diagram';
        
        this.exporter.exportToImage(this.renderer.svg, format, filename);
        this.showNotification(`${format.toUpperCase()} downloaded!`);
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? 'linear-gradient(135deg, #4caf50, #45a049)' : 'linear-gradient(135deg, #f44336, #da190b)'};
            color: white;
            border-radius: 25px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            animation: notificationSlide 0.3s ease;
            font-weight: 500;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'notificationFade 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes notificationSlide {
        from {
            transform: translateY(100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    @keyframes notificationFade {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyle);

window.DiagramControls = DiagramControls;