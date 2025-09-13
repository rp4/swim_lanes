import { Theme } from '../../core/config/theme.js';

export class SwimLaneRenderer {
  constructor(svgElement) {
    this.svg = svgElement;
    this.swimlanesGroup = this.svg.querySelector('#swimlanes');
    this.nodesGroup = this.svg.querySelector('#nodes');
    this.connectionsGroup = this.svg.querySelector('#connections');
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.processData = null;
    this.selectedNode = null;
    this.selectedLane = null;

    // Arrow marker removed - edges will display without arrows
  }

  addNodeTooltip(nodeGroup, node) {
    if (!node.description || node.description.trim() === '') {
      return;
    }

    let tooltip = null;

    const showTooltip = (e) => {
      // Create tooltip if it doesn't exist
      if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'node-tooltip';
        tooltip.textContent = node.description;
        document.body.appendChild(tooltip);
      }

      // Position tooltip near the cursor
      const x = e.clientX + 10;
      const y = e.clientY - 30;

      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
      tooltip.style.display = 'block';
    };

    const hideTooltip = () => {
      if (tooltip) {
        tooltip.style.display = 'none';
      }
    };

    const moveTooltip = (e) => {
      if (tooltip && tooltip.style.display === 'block') {
        tooltip.style.left = `${e.clientX + 10}px`;
        tooltip.style.top = `${e.clientY - 30}px`;
      }
    };

    nodeGroup.addEventListener('mouseenter', showTooltip);
    nodeGroup.addEventListener('mouseleave', hideTooltip);
    nodeGroup.addEventListener('mousemove', moveTooltip);

    // Clean up tooltip when node is removed
    const originalRemove = nodeGroup.remove;
    nodeGroup.remove = function () {
      if (tooltip) {
        tooltip.remove();
      }
      originalRemove.call(this);
    };
  }

  addConnectionAnchors(nodeGroup, x, y, nodeId) {
    const anchors = [
      { x: x + 35, y, position: 'right' },
      { x: x - 35, y, position: 'left' },
    ];

    anchors.forEach((anchor) => {
      const anchorCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      anchorCircle.setAttribute('cx', anchor.x);
      anchorCircle.setAttribute('cy', anchor.y);
      anchorCircle.setAttribute('r', '8');
      anchorCircle.classList.add('connection-anchor');
      anchorCircle.setAttribute('data-node-id', nodeId);
      anchorCircle.setAttribute('data-position', anchor.position);
      anchorCircle.style.opacity = '0';
      anchorCircle.style.fill = '#2196f3';
      anchorCircle.style.stroke = 'white';
      anchorCircle.style.strokeWidth = '2';
      anchorCircle.style.cursor = 'crosshair';
      anchorCircle.style.transition = 'opacity 0.2s';

      nodeGroup.appendChild(anchorCircle);
    });

    // Show anchors on hover
    nodeGroup.addEventListener('mouseenter', () => {
      const anchors = nodeGroup.querySelectorAll('.connection-anchor');
      anchors.forEach((a) => (a.style.opacity = '0.8'));
    });

    nodeGroup.addEventListener('mouseleave', () => {
      const anchors = nodeGroup.querySelectorAll('.connection-anchor');
      anchors.forEach((a) => (a.style.opacity = '0'));
    });
  }

  // Arrow marker method removed - edges will display without arrows

  createLaneDivider(laneGroup, yPosition) {
    const dividerLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    dividerLine.setAttribute('x1', '20');
    dividerLine.setAttribute('y1', yPosition);
    dividerLine.setAttribute('x2', '1420');
    dividerLine.setAttribute('y2', yPosition);
    dividerLine.classList.add('lane-divider');
    laneGroup.appendChild(dividerLine);
  }

  render(processData) {
    this.processData = processData;
    this.clear();
    this.renderSwimLanes();
    this.renderNodes();
    this.renderConnections();
    this.fitToScreen();
  }

  clear() {
    // Safe DOM manipulation to prevent XSS
    while (this.swimlanesGroup.firstChild) {
      this.swimlanesGroup.removeChild(this.swimlanesGroup.firstChild);
    }
    while (this.nodesGroup.firstChild) {
      this.nodesGroup.removeChild(this.nodesGroup.firstChild);
    }
    while (this.connectionsGroup.firstChild) {
      this.connectionsGroup.removeChild(this.connectionsGroup.firstChild);
    }
  }

  renderSwimLanes() {
    let currentY = 50;

    this.processData.lanes.forEach((lane, index) => {
      const laneGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      laneGroup.setAttribute('data-lane-id', lane.id);
      laneGroup.classList.add('lane-group');

      const laneRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      laneRect.setAttribute('x', '20');
      laneRect.setAttribute('y', currentY);
      laneRect.setAttribute('width', '1400');
      laneRect.setAttribute('height', lane.height || 140);
      laneRect.setAttribute('rx', '2');
      laneRect.setAttribute('ry', '2');
      laneRect.classList.add('swimlane');

      const laneLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      laneLabel.setAttribute('x', '40');
      laneLabel.setAttribute('y', currentY + 30);
      laneLabel.classList.add('lane-label');
      laneLabel.textContent = lane.name;

      if (index > 0) {
        // Create lane divider
        this.createLaneDivider(laneGroup, currentY - 5);
      }

      // Create reorder menu button (three dots)
      const reorderButton = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      reorderButton.classList.add('resize-handle');
      reorderButton.setAttribute('data-lane-id', lane.id);

      // Button background
      const buttonBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      buttonBg.setAttribute('x', '1405');
      buttonBg.setAttribute('y', currentY + (lane.height || 140) / 2 - 15);
      buttonBg.setAttribute('width', '30');
      buttonBg.setAttribute('height', '30');
      buttonBg.setAttribute('rx', '4');
      buttonBg.classList.add('resize-handle');
      buttonBg.setAttribute('data-lane-id', lane.id);

      // Three dots
      for (let i = 0; i < 3; i++) {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', '1420');
        dot.setAttribute('cy', currentY + (lane.height || 140) / 2 - 5 + i * 10);
        dot.setAttribute('r', '2');
        dot.setAttribute('fill', '#666');
        dot.style.pointerEvents = 'none';
        reorderButton.appendChild(dot);
      }

      reorderButton.insertBefore(buttonBg, reorderButton.firstChild);

      laneGroup.appendChild(laneRect);
      laneGroup.appendChild(laneLabel);
      laneGroup.appendChild(reorderButton);

      this.swimlanesGroup.appendChild(laneGroup);

      lane.y = currentY;
      currentY += (lane.height || 140) + 10;
    });

    this.svg.setAttribute('viewBox', `0 0 1440 ${currentY + 50}`);
  }

  renderNodes() {
    this.processData.lanes.forEach((lane) => {
      lane.nodes.forEach((node) => {
        const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        nodeGroup.setAttribute('data-node-id', node.id);
        nodeGroup.setAttribute('data-lane-id', lane.id);
        nodeGroup.classList.add('process-node');
        nodeGroup.style.cursor = 'move';

        let nodeShape;
        const x = node.position.x;
        // Always use lane center for y position - nodes should align with their lanes
        const y = lane.y + 70;

        // Store the calculated position
        node.position.y = y;

        switch (node.type) {
          case 'start':
          case 'end':
            nodeShape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            nodeShape.setAttribute('cx', x);
            nodeShape.setAttribute('cy', y);
            nodeShape.setAttribute('r', '35');
            break;
          case 'decision':
            nodeShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const points = `${x},${y - 35} ${x + 35},${y} ${x},${y + 35} ${x - 35},${y}`;
            nodeShape.setAttribute('points', points);
            break;
          default:
            nodeShape = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            nodeShape.setAttribute('x', x - 50);
            nodeShape.setAttribute('y', y - 25);
            nodeShape.setAttribute('width', '100');
            nodeShape.setAttribute('height', '50');
            nodeShape.setAttribute('rx', '25');
            nodeShape.setAttribute('ry', '25');
            break;
        }

        nodeShape.classList.add(`node-${node.type}`);
        nodeShape.style.fill = node.color || this.getNodeColor(node.type);
        nodeShape.style.stroke = 'white';
        nodeShape.style.strokeWidth = '2';

        const nodeIcon = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nodeIcon.setAttribute('x', x);
        nodeIcon.setAttribute('y', y - 10);
        nodeIcon.classList.add('node-text');
        nodeIcon.style.fontSize = '20px';
        nodeIcon.textContent = node.icon;

        const nodeText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nodeText.setAttribute('x', x);
        nodeText.setAttribute('y', y + 10);
        nodeText.classList.add('node-text');
        nodeText.style.fontSize = '12px';
        nodeText.textContent = node.text;

        nodeGroup.appendChild(nodeShape);
        nodeGroup.appendChild(nodeIcon);
        nodeGroup.appendChild(nodeText);

        // Add connection anchors
        this.addConnectionAnchors(nodeGroup, x, y, node.id);

        // Add tooltip functionality
        this.addNodeTooltip(nodeGroup, node);

        this.nodesGroup.appendChild(nodeGroup);
      });
    });
  }

  renderConnections() {
    this.processData.connections.forEach((conn) => {
      const fromNode = this.findNode(conn.from);
      const toNode = this.findNode(conn.to);

      if (fromNode && toNode) {
        const path = this.calculatePath(fromNode, toNode);

        const connectionPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        connectionPath.setAttribute('d', path);
        connectionPath.classList.add('connection-line');
        // Arrow removed from edge - displays as simple line
        connectionPath.setAttribute('data-from', conn.from);
        connectionPath.setAttribute('data-to', conn.to);

        if (conn.label) {
          const midPoint = this.getPathMidpoint(fromNode, toNode);
          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('x', midPoint.x);
          label.setAttribute('y', midPoint.y - 5);
          label.classList.add('connection-label');
          label.setAttribute('data-from', conn.from);
          label.setAttribute('data-to', conn.to);
          label.textContent = conn.label;
          this.connectionsGroup.appendChild(label);
        }

        this.connectionsGroup.appendChild(connectionPath);
      }
    });
  }

  calculatePath(fromNode, toNode) {
    const fromX = fromNode.position.x;
    const fromY = fromNode.position.y;
    const toX = toNode.position.x;
    const toY = toNode.position.y;

    const dx = toX - fromX;
    const dy = toY - fromY;
    const anchorDistance = 35;

    // Determine which anchors to use (left or right)
    let startX, startY, endX, endY;

    if (dx > 0) {
      // Target is to the right of source
      startX = fromX + anchorDistance; // Right anchor of source
      startY = fromY;
      endX = toX - anchorDistance; // Left anchor of target
      endY = toY;
    } else {
      // Target is to the left of source
      startX = fromX - anchorDistance; // Left anchor of source
      startY = fromY;
      endX = toX + anchorDistance; // Right anchor of target
      endY = toY;
    }

    // Determine path type based on node positions
    const verticalOffset = Math.abs(dy);
    const horizontalGap = Math.abs(endX - startX);

    // Case 1: Nodes are horizontally aligned (straight line)
    if (verticalOffset < 10) {
      return `M ${startX} ${startY} L ${endX} ${endY}`;
    }

    // Case 2: Nodes need to connect around each other (going backwards)
    if ((dx > 0 && endX < startX) || (dx < 0 && endX > startX)) {
      // Create a rectangular path when nodes overlap horizontally
      const midPointOffset = Math.max(50, Math.abs(dx) * 0.3);
      const extendX1 = dx > 0 ? startX + midPointOffset : startX - midPointOffset;
      const extendX2 = dx > 0 ? endX - midPointOffset : endX + midPointOffset;

      return `M ${startX} ${startY} L ${extendX1} ${startY} L ${extendX1} ${endY} L ${endX} ${endY}`;
    }

    // Case 3: Standard curved connection for vertical offset
    if (horizontalGap > 100) {
      // Use bezier curve for longer distances
      const controlOffset = Math.min(horizontalGap * 0.5, 150);
      const controlX1 = startX + (dx > 0 ? controlOffset : -controlOffset);
      const controlY1 = startY;
      const controlX2 = endX + (dx > 0 ? -controlOffset : controlOffset);
      const controlY2 = endY;

      return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
    } else {
      // Use quadratic curve for shorter distances
      const midX = (startX + endX) / 2;
      const midY = (startY + endY) / 2;

      return `M ${startX} ${startY} Q ${midX} ${startY}, ${midX} ${midY} T ${endX} ${endY}`;
    }
  }

  getPathMidpoint(fromNode, toNode) {
    return {
      x: (fromNode.position.x + toNode.position.x) / 2,
      y: (fromNode.position.y + toNode.position.y) / 2,
    };
  }

  findNode(nodeId) {
    for (const lane of this.processData.lanes) {
      const node = lane.nodes.find((n) => n.id === nodeId);
      if (node) {
        return node;
      }
    }
    return null;
  }

  findLane(laneId) {
    return this.processData.lanes.find((l) => l.id === laneId);
  }

  getNodeColor(type) {
    return Theme.nodes.getColor(type);
  }

  fitToScreen() {
    const bbox = this.svg.getBBox();
    const viewBox = `${bbox.x - 20} ${bbox.y - 20} ${bbox.width + 40} ${bbox.height + 40}`;
    this.svg.setAttribute('viewBox', viewBox);
  }

  zoom(factor) {
    const viewBox = this.svg.getAttribute('viewBox') || '0 0 1440 800';
    const [x, y, width, height] = viewBox.split(' ').map(Number);

    // Calculate the center point of the current view
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    // Calculate new dimensions
    const newWidth = width / factor;
    const newHeight = height / factor;

    // Calculate new position to keep center point stable
    const newX = centerX - newWidth / 2;
    const newY = centerY - newHeight / 2;

    this.svg.setAttribute('viewBox', `${newX} ${newY} ${newWidth} ${newHeight}`);
  }

  zoomAtPoint(factor, mouseX, mouseY) {
    const viewBox = this.svg.getAttribute('viewBox') || '0 0 1440 800';
    const [x, y, width, height] = viewBox.split(' ').map(Number);

    // Convert mouse position to SVG coordinates
    const svgX = x + (mouseX / this.svg.clientWidth) * width;
    const svgY = y + (mouseY / this.svg.clientHeight) * height;

    // Calculate new dimensions
    const newWidth = width / factor;
    const newHeight = height / factor;

    // Calculate new position to keep mouse point stable
    const newX = svgX - (mouseX / this.svg.clientWidth) * newWidth;
    const newY = svgY - (mouseY / this.svg.clientHeight) * newHeight;

    // Apply limits to prevent extreme zoom
    const minWidth = 200;
    const maxWidth = 10000;

    if (newWidth >= minWidth && newWidth <= maxWidth) {
      this.svg.setAttribute('viewBox', `${newX} ${newY} ${newWidth} ${newHeight}`);
    }
  }

  pan(dx, dy) {
    const viewBox = this.svg.getAttribute('viewBox') || '0 0 1440 800';
    const [x, y, width, height] = viewBox.split(' ').map(Number);

    const newX = x - dx * (width / this.svg.clientWidth);
    const newY = y - dy * (height / this.svg.clientHeight);

    this.svg.setAttribute('viewBox', `${newX} ${newY} ${width} ${height}`);
  }

  applyTransform() {
    // This method is no longer needed as we're using viewBox directly
    // Kept for backward compatibility
  }

  addLane(name) {
    const newLane = {
      id: `lane_${Date.now()}`,
      name: name || `New Lane ${this.processData.lanes.length + 1}`,
      color: this.generateLaneColor(this.processData.lanes.length),
      nodes: [],
      height: 140,
    };

    this.processData.lanes.push(newLane);
    this.render(this.processData);
    return newLane;
  }

  addNode(laneId, type = 'process', text = 'New Node', x = null, y = null) {
    const lane = this.findLane(laneId);
    if (!lane) {
      return null;
    }

    const newNode = {
      id: `node_${Date.now()}`,
      text,
      type,
      description: '', // Initialize with empty description
      position: {
        x: x !== null ? x : 150 + lane.nodes.length * 200,
        y: lane.y + 70, // Always place nodes at the center of their lane
      },
      color: this.getNodeColor(type),
      icon: this.getNodeIcon(type),
    };

    lane.nodes.push(newNode);
    this.render(this.processData);
    return newNode;
  }

  getNodeIcon(type) {
    return Theme.nodes.getIcon(type);
  }

  generateLaneColor(index) {
    return Theme.lanes.getColor(index);
  }

  updateNode(nodeId, updates) {
    const node = this.findNode(nodeId);
    if (node) {
      Object.assign(node, updates);
      this.render(this.processData);
    }
  }

  deleteNode(nodeId) {
    for (const lane of this.processData.lanes) {
      const index = lane.nodes.findIndex((n) => n.id === nodeId);
      if (index !== -1) {
        lane.nodes.splice(index, 1);
        this.processData.connections = this.processData.connections.filter(
          (conn) => conn.from !== nodeId && conn.to !== nodeId,
        );
        this.render(this.processData);
        return true;
      }
    }
    return false;
  }

  deleteLane(laneId) {
    const index = this.processData.lanes.findIndex((l) => l.id === laneId);
    if (index !== -1) {
      const lane = this.processData.lanes[index];
      const nodeIds = lane.nodes.map((n) => n.id);
      this.processData.connections = this.processData.connections.filter(
        (conn) => !nodeIds.includes(conn.from) && !nodeIds.includes(conn.to),
      );
      this.processData.lanes.splice(index, 1);
      this.render(this.processData);
      return true;
    }
    return false;
  }

  addConnection(fromId, toId, label = '') {
    const connection = {
      from: fromId,
      to: toId,
      label,
    };
    this.processData.connections.push(connection);
    this.render(this.processData);
    return connection;
  }

  findConnection(fromId, toId) {
    return this.processData.connections.find((conn) => conn.from === fromId && conn.to === toId);
  }

  updateConnection(fromId, toId, newLabel) {
    const connection = this.findConnection(fromId, toId);
    if (connection) {
      connection.label = newLabel;
      this.render(this.processData);
      return true;
    }
    return false;
  }

  deleteConnection(fromId, toId) {
    const index = this.processData.connections.findIndex(
      (conn) => conn.from === fromId && conn.to === toId,
    );
    if (index !== -1) {
      this.processData.connections.splice(index, 1);
      this.render(this.processData);
      return true;
    }
    return false;
  }

  getProcessData() {
    return this.processData;
  }
}

window.SwimLaneRenderer = SwimLaneRenderer;
