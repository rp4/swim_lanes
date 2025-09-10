class DiagramEditor {
    constructor(renderer) {
        this.renderer = renderer;
        this.svg = renderer.svg;
        this.isDragging = false;
        this.draggedNode = null;
        this.dragOffset = { x: 0, y: 0 };
        this.isConnecting = false;
        this.connectionStart = null;
        this.connectionPreview = null;
        this.history = [];
        this.historyIndex = -1;
        this.maxHistory = 50;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.svg.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.svg.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.svg.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.svg.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    getSVGPoint(e) {
        const rect = this.svg.getBoundingClientRect();
        const viewBox = this.svg.getAttribute('viewBox');
        
        if (viewBox) {
            const [vx, vy, vw, vh] = viewBox.split(' ').map(Number);
            const scaleX = vw / rect.width;
            const scaleY = vh / rect.height;
            
            return {
                x: vx + (e.clientX - rect.left) * scaleX,
                y: vy + (e.clientY - rect.top) * scaleY
            };
        } else {
            const point = this.svg.createSVGPoint();
            point.x = e.clientX - rect.left;
            point.y = e.clientY - rect.top;
            const svgPoint = point.matrixTransform(this.svg.getScreenCTM().inverse());
            return { x: svgPoint.x, y: svgPoint.y };
        }
    }

    handleMouseDown(e) {
        const target = e.target.closest('.process-node');
        if (target && !this.isConnecting) {
            this.startDragging(e, target);
        } else if (target && this.isConnecting) {
            this.completeConnection(target.getAttribute('data-node-id'));
        }
        
        const resizeHandle = e.target.closest('.resize-handle');
        if (resizeHandle) {
            this.startResizing(e, resizeHandle);
        }
    }

    handleMouseMove(e) {
        if (this.isDragging && this.draggedNode) {
            this.dragNode(e);
        } else if (this.isConnecting && this.connectionPreview) {
            this.updateConnectionPreview(e);
        } else if (this.isResizing) {
            this.resizeLane(e);
        }
    }

    handleMouseUp(e) {
        if (this.isDragging) {
            this.stopDragging();
        } else if (this.isResizing) {
            this.stopResizing();
        }
    }

    handleDoubleClick(e) {
        const nodeElement = e.target.closest('.process-node');
        if (nodeElement) {
            const nodeId = nodeElement.getAttribute('data-node-id');
            this.editNode(nodeId);
        }
        
        const laneElement = e.target.closest('.swimlane');
        if (laneElement && !nodeElement) {
            const laneId = laneElement.parentElement.getAttribute('data-lane-id');
            this.editLane(laneId);
        }
    }

    handleKeyDown(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'z':
                    e.preventDefault();
                    this.undo();
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 's':
                    e.preventDefault();
                    this.save();
                    break;
            }
        }
        
        if (e.key === 'Delete' && this.renderer.selectedNode) {
            this.deleteSelectedNode();
        }
    }

    startDragging(e, nodeElement) {
        this.saveState();
        this.isDragging = true;
        this.draggedNode = nodeElement;
        const nodeId = nodeElement.getAttribute('data-node-id');
        const node = this.renderer.findNode(nodeId);
        
        const svgPoint = this.getSVGPoint(e);
        
        this.dragOffset = {
            x: svgPoint.x - node.position.x,
            y: svgPoint.y - node.position.y
        };
        
        nodeElement.classList.add('node-dragging');
    }

    dragNode(e) {
        if (!this.draggedNode) return;
        
        const nodeId = this.draggedNode.getAttribute('data-node-id');
        const node = this.renderer.findNode(nodeId);
        
        const svgPoint = this.getSVGPoint(e);
        
        node.position.x = svgPoint.x - this.dragOffset.x;
        node.position.y = svgPoint.y - this.dragOffset.y;
        
        const laneId = this.getLaneAtPosition(node.position.y);
        if (laneId && laneId !== this.draggedNode.getAttribute('data-lane-id')) {
            this.moveNodeToLane(nodeId, laneId);
        }
        
        this.renderer.render(this.renderer.processData);
        
        const newDraggedNode = this.svg.querySelector(`[data-node-id="${nodeId}"]`);
        if (newDraggedNode) {
            newDraggedNode.classList.add('node-dragging');
            this.draggedNode = newDraggedNode;
        }
    }

    stopDragging() {
        if (this.draggedNode) {
            this.draggedNode.classList.remove('node-dragging');
        }
        this.isDragging = false;
        this.draggedNode = null;
        this.dragOffset = { x: 0, y: 0 };
    }

    getLaneAtPosition(y) {
        for (const lane of this.renderer.processData.lanes) {
            if (y >= lane.y && y <= lane.y + (lane.height || 140)) {
                return lane.id;
            }
        }
        return null;
    }

    moveNodeToLane(nodeId, newLaneId) {
        const processData = this.renderer.processData;
        let node = null;
        let oldLaneId = null;
        
        for (const lane of processData.lanes) {
            const nodeIndex = lane.nodes.findIndex(n => n.id === nodeId);
            if (nodeIndex !== -1) {
                node = lane.nodes[nodeIndex];
                oldLaneId = lane.id;
                lane.nodes.splice(nodeIndex, 1);
                break;
            }
        }
        
        if (node) {
            const newLane = processData.lanes.find(l => l.id === newLaneId);
            if (newLane) {
                newLane.nodes.push(node);
            }
        }
    }

    startConnecting(fromNodeId) {
        this.isConnecting = true;
        this.connectionStart = fromNodeId;
        
        const fromNode = this.renderer.findNode(fromNodeId);
        if (fromNode) {
            this.connectionPreview = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            this.connectionPreview.classList.add('connection-preview');
            this.connectionPreview.setAttribute('x1', fromNode.position.x);
            this.connectionPreview.setAttribute('y1', fromNode.position.y);
            this.connectionPreview.setAttribute('x2', fromNode.position.x);
            this.connectionPreview.setAttribute('y2', fromNode.position.y);
            this.renderer.connectionsGroup.appendChild(this.connectionPreview);
        }
    }

    updateConnectionPreview(e) {
        if (!this.connectionPreview) return;
        
        const rect = this.svg.getBoundingClientRect();
        const viewBox = this.svg.getAttribute('viewBox');
        
        if (viewBox) {
            const [vx, vy, vw, vh] = viewBox.split(' ').map(Number);
            const scaleX = vw / rect.width;
            const scaleY = vh / rect.height;
            
            const x = vx + (e.clientX - rect.left) * scaleX;
            const y = vy + (e.clientY - rect.top) * scaleY;
            
            this.connectionPreview.setAttribute('x2', x);
            this.connectionPreview.setAttribute('y2', y);
        } else {
            const point = this.svg.createSVGPoint();
            point.x = e.clientX - rect.left;
            point.y = e.clientY - rect.top;
            
            const svgPoint = point.matrixTransform(this.svg.getScreenCTM().inverse());
            
            this.connectionPreview.setAttribute('x2', svgPoint.x);
            this.connectionPreview.setAttribute('y2', svgPoint.y);
        }
    }

    completeConnection(toNodeId) {
        if (this.connectionStart && toNodeId && this.connectionStart !== toNodeId) {
            this.saveState();
            const label = prompt('Enter connection label (optional):');
            this.renderer.addConnection(this.connectionStart, toNodeId, label || '');
        }
        
        this.cancelConnection();
    }

    cancelConnection() {
        this.isConnecting = false;
        this.connectionStart = null;
        if (this.connectionPreview) {
            this.connectionPreview.remove();
            this.connectionPreview = null;
        }
    }

    editNode(nodeId) {
        const node = this.renderer.findNode(nodeId);
        if (!node) return;
        
        const modal = document.getElementById('nodeModal');
        const nodeText = document.getElementById('nodeText');
        const nodeType = document.getElementById('nodeType');
        const nodeColor = document.getElementById('nodeColor');
        
        nodeText.value = node.text;
        nodeType.value = node.type;
        nodeColor.value = node.color || this.renderer.getNodeColor(node.type);
        
        modal.style.display = 'flex';
        this.renderer.selectedNode = nodeId;
        
        const saveBtn = document.getElementById('saveNodeBtn');
        const deleteBtn = document.getElementById('deleteNodeBtn');
        const cancelBtn = document.getElementById('cancelNodeBtn');
        const closeBtn = modal.querySelector('.close-btn');
        
        const saveHandler = () => {
            this.saveState();
            this.renderer.updateNode(nodeId, {
                text: nodeText.value,
                type: nodeType.value,
                color: nodeColor.value,
                icon: this.renderer.getNodeIcon(nodeType.value)
            });
            modal.style.display = 'none';
            this.cleanup();
        };
        
        const deleteHandler = () => {
            if (confirm('Are you sure you want to delete this node?')) {
                this.saveState();
                this.renderer.deleteNode(nodeId);
                modal.style.display = 'none';
                this.cleanup();
            }
        };
        
        const cancelHandler = () => {
            modal.style.display = 'none';
            this.cleanup();
        };
        
        const cleanup = () => {
            saveBtn.removeEventListener('click', saveHandler);
            deleteBtn.removeEventListener('click', deleteHandler);
            cancelBtn.removeEventListener('click', cancelHandler);
            closeBtn.removeEventListener('click', cancelHandler);
            this.renderer.selectedNode = null;
        };
        
        this.cleanup = cleanup;
        
        saveBtn.addEventListener('click', saveHandler);
        deleteBtn.addEventListener('click', deleteHandler);
        cancelBtn.addEventListener('click', cancelHandler);
        closeBtn.addEventListener('click', cancelHandler);
    }

    editLane(laneId) {
        const lane = this.renderer.findLane(laneId);
        if (!lane) return;
        
        const modal = document.getElementById('laneModal');
        const laneName = document.getElementById('laneName');
        const laneColor = document.getElementById('laneColor');
        
        laneName.value = lane.name;
        laneColor.value = lane.color;
        
        modal.style.display = 'flex';
        this.renderer.selectedLane = laneId;
        
        const saveBtn = document.getElementById('saveLaneBtn');
        const deleteBtn = document.getElementById('deleteLaneBtn');
        const cancelBtn = document.getElementById('cancelLaneBtn');
        const closeBtn = modal.querySelector('.close-btn');
        
        const saveHandler = () => {
            this.saveState();
            lane.name = laneName.value;
            lane.color = laneColor.value;
            this.renderer.render(this.renderer.processData);
            modal.style.display = 'none';
            this.cleanup();
        };
        
        const deleteHandler = () => {
            if (confirm('Are you sure you want to delete this lane and all its nodes?')) {
                this.saveState();
                this.renderer.deleteLane(laneId);
                modal.style.display = 'none';
                this.cleanup();
            }
        };
        
        const cancelHandler = () => {
            modal.style.display = 'none';
            this.cleanup();
        };
        
        const cleanup = () => {
            saveBtn.removeEventListener('click', saveHandler);
            deleteBtn.removeEventListener('click', deleteHandler);
            cancelBtn.removeEventListener('click', cancelHandler);
            closeBtn.removeEventListener('click', cancelHandler);
            this.renderer.selectedLane = null;
        };
        
        this.cleanup = cleanup;
        
        saveBtn.addEventListener('click', saveHandler);
        deleteBtn.addEventListener('click', deleteHandler);
        cancelBtn.addEventListener('click', cancelHandler);
        closeBtn.addEventListener('click', cancelHandler);
    }

    startResizing(e, handle) {
        this.isResizing = true;
        this.resizingLane = handle.getAttribute('data-lane-id');
        this.resizeStartX = e.clientX;
        this.resizeStartHeight = this.renderer.findLane(this.resizingLane).height || 140;
    }

    resizeLane(e) {
        if (!this.isResizing) return;
        
        const lane = this.renderer.findLane(this.resizingLane);
        if (lane) {
            const diff = e.clientX - this.resizeStartX;
            lane.height = Math.max(100, this.resizeStartHeight + diff);
            this.renderer.render(this.renderer.processData);
        }
    }

    stopResizing() {
        this.isResizing = false;
        this.resizingLane = null;
    }

    saveState() {
        const state = JSON.stringify(this.renderer.processData);
        
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        this.history.push(state);
        
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const state = JSON.parse(this.history[this.historyIndex]);
            this.renderer.render(state);
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const state = JSON.parse(this.history[this.historyIndex]);
            this.renderer.render(state);
        }
    }

    save() {
        const event = new CustomEvent('save', { detail: this.renderer.processData });
        document.dispatchEvent(event);
    }

    deleteSelectedNode() {
        if (this.renderer.selectedNode) {
            this.saveState();
            this.renderer.deleteNode(this.renderer.selectedNode);
            this.renderer.selectedNode = null;
        }
    }
}

window.DiagramEditor = DiagramEditor;