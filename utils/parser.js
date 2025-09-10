class ProcessParser {
    constructor() {
        this.defaultNodeTypes = ['start', 'process', 'decision', 'end'];
        this.nodeIcons = {
            start: '🏁',
            process: '🏊',
            decision: '🤿',
            end: '🏆'
        };
    }

    validateJSON(jsonData) {
        const errors = [];
        
        if (!jsonData) {
            errors.push('JSON data is empty');
            return { valid: false, errors };
        }

        if (!jsonData.lanes || !Array.isArray(jsonData.lanes)) {
            errors.push('JSON must contain a "lanes" array');
        } else {
            jsonData.lanes.forEach((lane, index) => {
                if (!lane.id) {
                    errors.push(`Lane at index ${index} missing "id" property`);
                }
                if (!lane.name) {
                    errors.push(`Lane at index ${index} missing "name" property`);
                }
                if (lane.nodes && !Array.isArray(lane.nodes)) {
                    errors.push(`Lane "${lane.name || index}" has invalid "nodes" property`);
                } else if (lane.nodes) {
                    lane.nodes.forEach((node, nodeIndex) => {
                        if (!node.id) {
                            errors.push(`Node at index ${nodeIndex} in lane "${lane.name || index}" missing "id" property`);
                        }
                        if (!node.text) {
                            errors.push(`Node at index ${nodeIndex} in lane "${lane.name || index}" missing "text" property`);
                        }
                    });
                }
            });
        }

        if (jsonData.connections && !Array.isArray(jsonData.connections)) {
            errors.push('Connections must be an array');
        } else if (jsonData.connections) {
            jsonData.connections.forEach((conn, index) => {
                if (!conn.from) {
                    errors.push(`Connection at index ${index} missing "from" property`);
                }
                if (!conn.to) {
                    errors.push(`Connection at index ${index} missing "to" property`);
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    parseProcess(jsonData) {
        const validation = this.validateJSON(jsonData);
        if (!validation.valid) {
            throw new Error('Invalid JSON: ' + validation.errors.join(', '));
        }

        const process = {
            title: jsonData.title || 'Untitled Process',
            lanes: [],
            connections: jsonData.connections || [],
            metadata: jsonData.metadata || {}
        };

        jsonData.lanes.forEach((lane, laneIndex) => {
            const parsedLane = {
                id: lane.id || `lane_${laneIndex}`,
                name: lane.name || `Lane ${laneIndex + 1}`,
                color: lane.color || this.generateLaneColor(laneIndex),
                nodes: [],
                position: lane.position || { y: laneIndex * 150 + 50 },
                height: lane.height || 140
            };

            if (lane.nodes) {
                lane.nodes.forEach((node, nodeIndex) => {
                    parsedLane.nodes.push(this.parseNode(node, nodeIndex, laneIndex));
                });
            }

            process.lanes.push(parsedLane);
        });

        return process;
    }

    parseNode(node, nodeIndex, laneIndex) {
        const defaultPosition = {
            x: nodeIndex * 200 + 150,
            y: laneIndex * 150 + 100
        };

        return {
            id: node.id || `node_${laneIndex}_${nodeIndex}`,
            text: node.text || 'Node',
            type: node.type || 'process',
            position: node.position || defaultPosition,
            color: node.color || this.getNodeColor(node.type),
            icon: this.nodeIcons[node.type] || '🏊',
            metadata: node.metadata || {}
        };
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

    getNodeColor(type) {
        const colors = {
            start: '#4caf50',
            process: '#2196f3',
            decision: '#ff9800',
            end: '#f44336'
        };
        return colors[type] || '#2196f3';
    }

    loadFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const jsonData = JSON.parse(e.target.result);
                    const processData = this.parseProcess(jsonData);
                    resolve(processData);
                } catch (error) {
                    reject(new Error('Failed to parse JSON: ' + error.message));
                }
            };

            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };

            reader.readAsText(file);
        });
    }

    generateSampleProcess() {
        return {
            title: 'Sample Swimming Pool Maintenance Process',
            lanes: [
                {
                    id: 'lane_1',
                    name: 'Pool Owner',
                    color: '#64b5f6',
                    nodes: [
                        {
                            id: 'node_1',
                            text: 'Notice Pool Issues',
                            type: 'start',
                            position: { x: 100, y: 50 }
                        },
                        {
                            id: 'node_2',
                            text: 'Submit Request',
                            type: 'process',
                            position: { x: 300, y: 50 }
                        },
                        {
                            id: 'node_7',
                            text: 'Approve Work',
                            type: 'decision',
                            position: { x: 700, y: 50 }
                        }
                    ]
                },
                {
                    id: 'lane_2',
                    name: 'Pool Service',
                    color: '#4fc3f7',
                    nodes: [
                        {
                            id: 'node_3',
                            text: 'Receive Request',
                            type: 'process',
                            position: { x: 300, y: 200 }
                        },
                        {
                            id: 'node_4',
                            text: 'Inspect Pool',
                            type: 'process',
                            position: { x: 500, y: 200 }
                        },
                        {
                            id: 'node_5',
                            text: 'Perform Service',
                            type: 'process',
                            position: { x: 700, y: 200 }
                        }
                    ]
                },
                {
                    id: 'lane_3',
                    name: 'Quality Check',
                    color: '#29b6f6',
                    nodes: [
                        {
                            id: 'node_6',
                            text: 'Test Water Quality',
                            type: 'process',
                            position: { x: 900, y: 350 }
                        },
                        {
                            id: 'node_8',
                            text: 'Complete',
                            type: 'end',
                            position: { x: 1100, y: 350 }
                        }
                    ]
                }
            ],
            connections: [
                { from: 'node_1', to: 'node_2', label: 'Report' },
                { from: 'node_2', to: 'node_3', label: 'Request' },
                { from: 'node_3', to: 'node_4', label: 'Schedule' },
                { from: 'node_4', to: 'node_5', label: 'Issues Found' },
                { from: 'node_5', to: 'node_7', label: 'Review' },
                { from: 'node_7', to: 'node_6', label: 'Approved' },
                { from: 'node_6', to: 'node_8', label: 'Pass' }
            ]
        };
    }
}

window.ProcessParser = ProcessParser;