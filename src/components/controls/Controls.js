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
        // Upload button in initial screen
        const uploadInitialBtn = document.getElementById('uploadInitialBtn');
        if (uploadInitialBtn) {
            uploadInitialBtn.addEventListener('click', () => {
                document.getElementById('fileInput').click();
            });
        }

        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileUpload(e.target.files[0]);
        });

        document.getElementById('loadSampleBtn').addEventListener('click', () => {
            this.loadSampleData();
        });

        document.getElementById('addLaneBtn').addEventListener('click', () => {
            this.addNewLane();
        });

        // Remove addNodeBtn listener since we're using drag and drop instead
        // Remove connectBtn listener since we're using anchor-based connections

        // Canvas interaction setup
        this.setupCanvasInteractions();

        document.getElementById('downloadJsonBtn').addEventListener('click', () => {
            this.downloadJSON();
        });

        document.addEventListener('save', (e) => {
            this.exporter.downloadJSON(e.detail);
        });
    }

    setupCanvasInteractions() {
        const canvas = document.getElementById('swimlaneCanvas');
        const svg = document.getElementById('diagramSvg');

        // Mouse wheel zoom
        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();

            // Get mouse position relative to SVG
            const rect = svg.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            // Calculate zoom factor
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

            // Zoom centered on mouse position
            this.renderer.zoomAtPoint(zoomFactor, mouseX, mouseY);
        });

        // Drag to pan
        let isPanning = false;
        let startX, startY;

        svg.addEventListener('mousedown', (e) => {
            // Only start panning with left mouse button and if not clicking on interactive elements
            if (e.button === 0 && !e.target.closest('.process-node, .resize-handle')) {
                isPanning = true;
                startX = e.clientX;
                startY = e.clientY;
                svg.style.cursor = 'grabbing';
                e.preventDefault();
            }
        });

        svg.addEventListener('mousemove', (e) => {
            if (isPanning) {
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;

                this.renderer.pan(dx, dy);

                startX = e.clientX;
                startY = e.clientY;
            }
        });

        svg.addEventListener('mouseup', () => {
            if (isPanning) {
                isPanning = false;
                svg.style.cursor = 'grab';
            }
        });

        svg.addEventListener('mouseleave', () => {
            if (isPanning) {
                isPanning = false;
                svg.style.cursor = 'grab';
            }
        });

        // Set initial cursor
        svg.style.cursor = 'grab';
    }

    setupDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        const swimlaneCanvas = document.getElementById('swimlaneCanvas');

        // Original file drop zone setup
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

        dropZone.addEventListener('click', (e) => {
            // Only trigger file input if not clicking on buttons
            if (!e.target.closest('button')) {
                document.getElementById('fileInput').click();
            }
        });

        // Setup draggable nodes from palette
        this.setupNodePaletteDragAndDrop();
    }

    setupNodePaletteDragAndDrop() {
        const draggableNodes = document.querySelectorAll('.draggable-node');
        const svg = document.getElementById('diagramSvg');
        const swimlanes = document.getElementById('swimlanes');

        draggableNodes.forEach(node => {
            node.addEventListener('dragstart', (e) => {
                const nodeType = node.getAttribute('data-node-type');
                e.dataTransfer.effectAllowed = 'copy';
                e.dataTransfer.setData('node-type', nodeType);
                node.classList.add('dragging');
            });

            node.addEventListener('dragend', (e) => {
                node.classList.remove('dragging');
            });
        });

        // Allow dropping on swim lanes
        svg.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';

            // Highlight the lane being hovered over
            const point = svg.createSVGPoint();
            point.x = e.clientX;
            point.y = e.clientY;
            const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());

            const laneGroups = swimlanes.querySelectorAll('.lane-group');
            laneGroups.forEach(laneGroup => {
                const rect = laneGroup.querySelector('.swimlane');
                if (rect) {
                    const y = parseFloat(rect.getAttribute('y'));
                    const height = parseFloat(rect.getAttribute('height'));

                    if (svgPoint.y >= y && svgPoint.y <= y + height) {
                        rect.classList.add('drop-target');
                    } else {
                        rect.classList.remove('drop-target');
                    }
                }
            });
        });

        svg.addEventListener('dragleave', (e) => {
            // Remove all drop target highlights
            const swimlanes = document.querySelectorAll('.swimlane');
            swimlanes.forEach(lane => lane.classList.remove('drop-target'));
        });

        svg.addEventListener('drop', (e) => {
            e.preventDefault();

            const nodeType = e.dataTransfer.getData('node-type');
            if (!nodeType) return;

            // Get drop position in SVG coordinates
            const point = svg.createSVGPoint();
            point.x = e.clientX;
            point.y = e.clientY;
            const svgPoint = point.matrixTransform(svg.getScreenCTM().inverse());

            // Find which lane was dropped on
            const laneGroups = swimlanes.querySelectorAll('.lane-group');
            let targetLaneId = null;

            laneGroups.forEach(laneGroup => {
                const rect = laneGroup.querySelector('.swimlane');
                if (rect) {
                    const y = parseFloat(rect.getAttribute('y'));
                    const height = parseFloat(rect.getAttribute('height'));

                    if (svgPoint.y >= y && svgPoint.y <= y + height) {
                        targetLaneId = laneGroup.getAttribute('data-lane-id');
                    }
                }
                // Remove drop-target class from the swimlane rect
                const swimlane = laneGroup.querySelector('.swimlane');
                if (swimlane) swimlane.classList.remove('drop-target');
            });

            if (targetLaneId && this.renderer.processData) {
                const laneId = targetLaneId;

                // Create the node at the drop position
                const nodeText = this.getDefaultNodeText(nodeType);
                this.editor.saveState();

                // Add node with x position only (y is determined by the lane)
                const node = this.renderer.addNode(laneId, nodeType, nodeText, svgPoint.x);
                this.showNotification(`${nodeType} node added to lane!`);
            }
        });
    }

    getDefaultNodeText(nodeType) {
        switch(nodeType) {
            case 'risk': return 'New Risk';
            case 'control': return 'New Control';
            default: return 'New Step';
        }
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