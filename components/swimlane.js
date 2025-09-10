class SwimLaneRenderer {
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
        
        this.setupArrowMarker();
    }

    setupArrowMarker() {
        const defs = this.svg.querySelector('defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '10');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3');
        marker.setAttribute('orient', 'auto');
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3, 0 6');
        polygon.setAttribute('fill', '#1565c0');
        
        marker.appendChild(polygon);
        defs.appendChild(marker);
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
        this.swimlanesGroup.innerHTML = '';
        this.nodesGroup.innerHTML = '';
        this.connectionsGroup.innerHTML = '';
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
            laneRect.setAttribute('rx', '10');
            laneRect.setAttribute('ry', '10');
            laneRect.classList.add('swimlane');
            laneRect.style.fill = lane.color + '40';
            laneRect.style.stroke = lane.color;
            
            const laneLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            laneLabel.setAttribute('x', '40');
            laneLabel.setAttribute('y', currentY + 30);
            laneLabel.classList.add('lane-label');
            laneLabel.textContent = lane.name;
            
            if (index > 0) {
                const divider = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                divider.setAttribute('x1', '20');
                divider.setAttribute('y1', currentY - 5);
                divider.setAttribute('x2', '1420');
                divider.setAttribute('y2', currentY - 5);
                divider.classList.add('lane-divider');
                laneGroup.appendChild(divider);
            }
            
            const resizeHandle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            resizeHandle.setAttribute('x', '1415');
            resizeHandle.setAttribute('y', currentY + (lane.height || 140) / 2 - 20);
            resizeHandle.setAttribute('width', '10');
            resizeHandle.setAttribute('height', '40');
            resizeHandle.classList.add('resize-handle');
            resizeHandle.setAttribute('data-lane-id', lane.id);
            
            laneGroup.appendChild(laneRect);
            laneGroup.appendChild(laneLabel);
            laneGroup.appendChild(resizeHandle);
            
            this.swimlanesGroup.appendChild(laneGroup);
            
            lane.y = currentY;
            currentY += (lane.height || 140) + 10;
        });
        
        this.svg.setAttribute('viewBox', `0 0 1440 ${currentY + 50}`);
    }

    renderNodes() {
        this.processData.lanes.forEach(lane => {
            lane.nodes.forEach(node => {
                const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                nodeGroup.setAttribute('data-node-id', node.id);
                nodeGroup.setAttribute('data-lane-id', lane.id);
                nodeGroup.classList.add('process-node');
                nodeGroup.style.cursor = 'move';
                
                let nodeShape;
                const x = node.position.x;
                const y = lane.y + 70;
                
                node.position.y = y;
                
                switch(node.type) {
                    case 'start':
                    case 'end':
                        nodeShape = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        nodeShape.setAttribute('cx', x);
                        nodeShape.setAttribute('cy', y);
                        nodeShape.setAttribute('r', '35');
                        break;
                    case 'decision':
                        nodeShape = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                        const points = `${x},${y-35} ${x+35},${y} ${x},${y+35} ${x-35},${y}`;
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
                
                this.nodesGroup.appendChild(nodeGroup);
            });
        });
    }

    renderConnections() {
        this.processData.connections.forEach(conn => {
            const fromNode = this.findNode(conn.from);
            const toNode = this.findNode(conn.to);
            
            if (fromNode && toNode) {
                const path = this.calculatePath(fromNode, toNode);
                
                const connectionPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                connectionPath.setAttribute('d', path);
                connectionPath.classList.add('connection-line');
                connectionPath.setAttribute('marker-end', 'url(#arrowhead)');
                connectionPath.setAttribute('data-from', conn.from);
                connectionPath.setAttribute('data-to', conn.to);
                
                if (conn.label) {
                    const midPoint = this.getPathMidpoint(fromNode, toNode);
                    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    label.setAttribute('x', midPoint.x);
                    label.setAttribute('y', midPoint.y - 5);
                    label.classList.add('connection-label');
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
        
        let startX = fromX;
        let startY = fromY;
        let endX = toX;
        let endY = toY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            startX += dx > 0 ? 35 : -35;
            endX += dx > 0 ? -35 : 35;
        } else {
            startY += dy > 0 ? 35 : -35;
            endY += dy > 0 ? -35 : 35;
        }
        
        const controlX1 = startX + (endX - startX) * 0.5;
        const controlY1 = startY;
        const controlX2 = startX + (endX - startX) * 0.5;
        const controlY2 = endY;
        
        return `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;
    }

    getPathMidpoint(fromNode, toNode) {
        return {
            x: (fromNode.position.x + toNode.position.x) / 2,
            y: (fromNode.position.y + toNode.position.y) / 2
        };
    }

    findNode(nodeId) {
        for (const lane of this.processData.lanes) {
            const node = lane.nodes.find(n => n.id === nodeId);
            if (node) return node;
        }
        return null;
    }

    findLane(laneId) {
        return this.processData.lanes.find(l => l.id === laneId);
    }

    getNodeColor(type) {
        const colors = {
            start: '#4caf50',
            process: '#2196f3',
            decision: '#ff9800',
            end: '#f44336'
        };
        return colors[type] || '#2196f3';
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
            height: 140
        };
        
        this.processData.lanes.push(newLane);
        this.render(this.processData);
        return newLane;
    }

    addNode(laneId, type = 'process', text = 'New Node') {
        const lane = this.findLane(laneId);
        if (!lane) return null;
        
        const newNode = {
            id: `node_${Date.now()}`,
            text: text,
            type: type,
            position: {
                x: 150 + lane.nodes.length * 200,
                y: lane.y + 70
            },
            color: this.getNodeColor(type),
            icon: this.getNodeIcon(type)
        };
        
        lane.nodes.push(newNode);
        this.render(this.processData);
        return newNode;
    }

    getNodeIcon(type) {
        const icons = {
            start: '🏁',
            process: '🏊',
            decision: '🤿',
            end: '🏆'
        };
        return icons[type] || '🏊';
    }

    generateLaneColor(index) {
        const colors = [
            '#64b5f6',
            '#4fc3f7',
            '#29b6f6',
            '#03a9f4',
            '#039be5',
            '#0288d1'
        ];
        return colors[index % colors.length];
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
            const index = lane.nodes.findIndex(n => n.id === nodeId);
            if (index !== -1) {
                lane.nodes.splice(index, 1);
                this.processData.connections = this.processData.connections.filter(
                    conn => conn.from !== nodeId && conn.to !== nodeId
                );
                this.render(this.processData);
                return true;
            }
        }
        return false;
    }

    deleteLane(laneId) {
        const index = this.processData.lanes.findIndex(l => l.id === laneId);
        if (index !== -1) {
            const lane = this.processData.lanes[index];
            const nodeIds = lane.nodes.map(n => n.id);
            this.processData.connections = this.processData.connections.filter(
                conn => !nodeIds.includes(conn.from) && !nodeIds.includes(conn.to)
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
            label: label
        };
        this.processData.connections.push(connection);
        this.render(this.processData);
        return connection;
    }

    getProcessData() {
        return this.processData;
    }
}

window.SwimLaneRenderer = SwimLaneRenderer;