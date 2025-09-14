import { NotificationService } from '../../core/services/NotificationService.js';

export class DiagramEditor {
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

    // Add click listener for connection anchors
    this.svg.addEventListener('click', this.handleAnchorClick.bind(this));

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
        y: vy + (e.clientY - rect.top) * scaleY,
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
    // Don't start dragging if clicking on an anchor
    if (e.target.classList.contains('connection-anchor')) {
      return;
    }

    const target = e.target.closest('.process-node');
    if (target && !this.isConnecting) {
      this.startDragging(e, target);
    }

    // Resize handle removed - no longer needed
  }

  handleAnchorClick(e) {
    if (!e.target.classList.contains('connection-anchor')) {
      return;
    }

    e.stopPropagation();
    const anchor = e.target;
    const nodeId = anchor.getAttribute('data-node-id');

    if (!this.isConnecting) {
      // Start connection
      this.startConnecting(nodeId);
      this.connectionStartAnchor = anchor;

      // Create connection preview line
      this.connectionPreview = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      this.connectionPreview.setAttribute('stroke', '#2196f3');
      this.connectionPreview.setAttribute('stroke-width', '2');
      this.connectionPreview.setAttribute('stroke-dasharray', '5,5');
      this.connectionPreview.setAttribute('x1', anchor.getAttribute('cx'));
      this.connectionPreview.setAttribute('y1', anchor.getAttribute('cy'));
      this.connectionPreview.setAttribute('x2', anchor.getAttribute('cx'));
      this.connectionPreview.setAttribute('y2', anchor.getAttribute('cy'));
      this.connectionPreview.style.pointerEvents = 'none';

      this.renderer.connectionsGroup.appendChild(this.connectionPreview);

      // Visual feedback
      anchor.style.fill = '#1976d2';
      NotificationService.info('Click on another anchor to complete the connection');
    } else {
      // Complete connection if different node
      const startNodeId = this.connectionStart;
      if (nodeId !== startNodeId) {
        this.completeConnection(nodeId);

        // Reset anchor styles
        if (this.connectionStartAnchor) {
          this.connectionStartAnchor.style.fill = '#2196f3';
        }
      } else {
        // Cancel if same node
        this.cancelConnection();
      }
    }
  }

  // showNotification method removed - using NotificationService instead

  handleMouseMove(e) {
    if (this.isDragging && this.draggedNode) {
      this.dragNode(e);
    } else if (this.isConnecting && this.connectionPreview) {
      this.updateConnectionPreview(e);
    }
  }

  updateConnectionPreview(e) {
    if (!this.connectionPreview) {
      return;
    }

    const point = this.getSVGPoint(e);
    this.connectionPreview.setAttribute('x2', point.x);
    this.connectionPreview.setAttribute('y2', point.y);
  }

  handleMouseUp(e) {
    if (this.isDragging) {
      this.stopDragging();
    }
  }

  handleDoubleClick(e) {
    const nodeElement = e.target.closest('.process-node');
    if (nodeElement) {
      const nodeId = nodeElement.getAttribute('data-node-id');
      this.editNode(nodeId);
      return;
    }

    const edgeElement = e.target.closest('.connection-line');
    if (edgeElement) {
      const fromId = edgeElement.getAttribute('data-from');
      const toId = edgeElement.getAttribute('data-to');
      this.editEdge(fromId, toId);
      return;
    }

    const labelElement = e.target.closest('.connection-label');
    if (labelElement) {
      const fromId = labelElement.getAttribute('data-from');
      const toId = labelElement.getAttribute('data-to');
      this.editEdge(fromId, toId);
      return;
    }

    const laneElement = e.target.closest('.swimlane');
    if (laneElement && !nodeElement) {
      const laneId = laneElement.parentElement.getAttribute('data-lane-id');
      this.editLane(laneId);
      return;
    }

    const phaseElement = e.target.closest('.phase-label, .phase-divider-group');
    if (phaseElement) {
      const phaseGroup = phaseElement.closest('.phase-divider-group') || phaseElement;
      const phaseId = phaseGroup.getAttribute('data-phase-id');
      this.editPhase(phaseId);
      return;
    }
  }

  handleKeyDown(e) {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
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
      y: svgPoint.y - node.position.y,
    };

    nodeElement.classList.add('node-dragging');
  }

  dragNode(e) {
    if (!this.draggedNode) {
      return;
    }

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
      const nodeIndex = lane.nodes.findIndex((n) => n.id === nodeId);
      if (nodeIndex !== -1) {
        node = lane.nodes[nodeIndex];
        oldLaneId = lane.id;
        lane.nodes.splice(nodeIndex, 1);
        break;
      }
    }

    if (node) {
      const newLane = processData.lanes.find((l) => l.id === newLaneId);
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
    if (this.connectionStartAnchor) {
      this.connectionStartAnchor.style.fill = '#2196f3';
      this.connectionStartAnchor = null;
    }
  }

  editNode(nodeId) {
    const node = this.renderer.findNode(nodeId);
    if (!node) {
      return;
    }

    const modal = document.getElementById('nodeModal');
    const nodeText = document.getElementById('nodeText');
    const nodeDescription = document.getElementById('nodeDescription');
    const nodeType = document.getElementById('nodeType');
    const nodeColor = document.getElementById('nodeColor');

    nodeText.value = node.text;
    nodeDescription.value = node.description || '';
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
        description: nodeDescription.value,
        type: nodeType.value,
        color: nodeColor.value,
        icon: this.renderer.getNodeIcon(nodeType.value),
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
    if (!lane) {
      return;
    }

    const modal = document.getElementById('laneModal');
    const laneName = document.getElementById('laneName');
    const laneNumber = document.getElementById('laneNumber');

    laneName.value = lane.name;

    // Set the current lane position (1-based for user)
    const lanes = this.renderer.processData.lanes;
    const currentPosition = lanes.findIndex(l => l.id === laneId) + 1;
    laneNumber.value = currentPosition;
    laneNumber.max = lanes.length;

    modal.style.display = 'flex';
    this.renderer.selectedLane = laneId;

    const saveBtn = document.getElementById('saveLaneBtn');
    const deleteBtn = document.getElementById('deleteLaneBtn');
    const cancelBtn = document.getElementById('cancelLaneBtn');
    const closeBtn = modal.querySelector('.close-btn');

    const saveHandler = () => {
      this.saveState();
      lane.name = laneName.value;
      // Lane color is now automatically assigned, not user-editable

      // Handle lane reordering
      const newPosition = parseInt(laneNumber.value) - 1; // Convert to 0-based index
      const currentPosition = lanes.findIndex(l => l.id === laneId);

      if (newPosition !== currentPosition && newPosition >= 0 && newPosition < lanes.length) {
        // Remove lane from current position
        const [movedLane] = lanes.splice(currentPosition, 1);
        // Insert at new position
        lanes.splice(newPosition, 0, movedLane);
        NotificationService.success(`Lane moved to position ${newPosition + 1}`);
      }

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

  editPhase(phaseId) {
    const phase = this.renderer.findPhase(phaseId);
    if (!phase) {
      return;
    }

    const modal = document.getElementById('phaseModal');
    const phaseName = document.getElementById('phaseName');
    const phaseLength = document.getElementById('phaseLength');
    const phasePosition = document.getElementById('phasePosition'); // Hidden field

    phaseName.value = phase.name;

    // Calculate the phase length in circles based on its position and the previous phase
    const phases = this.renderer.processData?.phases || [];
    const sortedPhases = [...phases].sort((a, b) => a.position - b.position);
    const phaseIndex = sortedPhases.findIndex(p => p.id === phaseId);

    let phaseStart = 20; // Default start
    if (phaseIndex > 0) {
      phaseStart = sortedPhases[phaseIndex - 1].position;
    }

    const phaseLengthPixels = phase.position - phaseStart;
    const numCircles = Math.max(3, Math.round(phaseLengthPixels / 40));

    phaseLength.value = numCircles;
    phasePosition.value = phase.position; // Store actual position

    modal.style.display = 'flex';
    this.renderer.selectedPhase = phaseId;

    const saveBtn = document.getElementById('savePhaseBtn');
    const deleteBtn = document.getElementById('deletePhaseBtn');
    const cancelBtn = document.getElementById('cancelPhaseBtn');
    const closeBtn = modal.querySelector('.close-btn');

    const saveHandler = () => {
      this.saveState();

      // Calculate new position based on phase length
      const newNumCircles = parseInt(phaseLength.value);
      const phaseStart = phaseIndex > 0 ? sortedPhases[phaseIndex - 1].position : 20;
      const newPosition = phaseStart + (newNumCircles * 40);

      this.renderer.updatePhase(phaseId, {
        name: phaseName.value,
        position: newPosition,
      });
      modal.style.display = 'none';
      this.cleanup();
      NotificationService.success('Phase updated!');
    };

    const deleteHandler = () => {
      if (confirm('Are you sure you want to delete this phase?')) {
        this.saveState();
        this.renderer.deletePhase(phaseId);
        modal.style.display = 'none';
        this.cleanup();
        NotificationService.success('Phase deleted!');
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
      this.renderer.selectedPhase = null;
    };

    this.cleanup = cleanup;

    saveBtn.addEventListener('click', saveHandler);
    deleteBtn.addEventListener('click', deleteHandler);
    cancelBtn.addEventListener('click', cancelHandler);
    closeBtn.addEventListener('click', cancelHandler);
  }

  editEdge(fromId, toId) {
    const connection = this.renderer.findConnection(fromId, toId);
    if (!connection) {
      return;
    }

    const modal = document.getElementById('edgeModal');
    const edgeLabel = document.getElementById('edgeLabel');

    edgeLabel.value = connection.label || '';

    modal.style.display = 'flex';
    this.currentEdge = { fromId, toId };

    const saveBtn = document.getElementById('saveEdgeBtn');
    const deleteBtn = document.getElementById('deleteEdgeBtn');
    const cancelBtn = document.getElementById('cancelEdgeBtn');
    const closeBtn = modal.querySelector('.close-btn');

    const saveHandler = () => {
      this.saveState();
      this.renderer.updateConnection(fromId, toId, edgeLabel.value);
      modal.style.display = 'none';
      this.cleanup();
    };

    const deleteHandler = () => {
      if (confirm('Are you sure you want to delete this connection?')) {
        this.saveState();
        this.renderer.deleteConnection(fromId, toId);
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
      this.currentEdge = null;
    };

    this.cleanup = cleanup;

    saveBtn.addEventListener('click', saveHandler);
    deleteBtn.addEventListener('click', deleteHandler);
    cancelBtn.addEventListener('click', cancelHandler);
    closeBtn.addEventListener('click', cancelHandler);
  }

  // Lane reorder menu methods removed - now handled through Lane Number field in edit form

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
