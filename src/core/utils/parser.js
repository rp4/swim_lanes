import { ValidationService } from '../services/ValidationService.js';
import { Theme } from '../config/theme.js';

export class ProcessParser {
  constructor() {
    this.defaultNodeTypes = ['start', 'process', 'decision', 'end'];
  }

  parse(jsonString) {
    try {
      const jsonData = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      return this.parseProcess(jsonData);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${error.message}`);
    }
  }

  validateJSON(jsonData) {
    try {
      // Use ValidationService for comprehensive validation and sanitization
      const sanitizedData = ValidationService.validateProcessData(jsonData);
      return { valid: true, data: sanitizedData, errors: [] };
    } catch (error) {
      return {
        valid: false,
        data: null,
        errors: [error.message],
      };
    }
  }

  parseProcess(jsonData) {
    const validation = this.validateJSON(jsonData);
    if (!validation.valid) {
      throw new Error(`Invalid JSON: ${validation.errors.join(', ')}`);
    }

    // The validated data is already sanitized
    const sanitizedData = validation.data;

    const process = {
      title: sanitizedData.title,
      lanes: sanitizedData.lanes,
      connections: sanitizedData.connections,
      phases: sanitizedData.phases || [],
      metadata: jsonData.metadata || {},
    };

    // Enhance lanes with additional properties
    process.lanes.forEach((lane, laneIndex) => {
      if (!lane.color) {
        lane.color = this.generateLaneColor(laneIndex);
      }
      if (!lane.position) {
        lane.position = { y: laneIndex * 150 + 50 };
      }

      // Enhance nodes with icons and colors from theme
      lane.nodes.forEach((node) => {
        node.icon = Theme.nodes.getIcon(node.type);
        // Always use theme color based on node type, ignore imported color
        node.color = Theme.nodes.getColor(node.type);
      });
    });

    return process;
  }

  parseNode(node, nodeIndex, laneIndex) {
    const defaultPosition = {
      x: nodeIndex * 200 + 150,
      y: laneIndex * 150 + 100,
    };

    return {
      id: node.id || `node_${laneIndex}_${nodeIndex}`,
      text: node.text || 'Node',
      type: node.type || 'process',
      position: node.position || defaultPosition,
      color: node.color || this.getNodeColor(node.type),
      icon: this.nodeIcons[node.type] || '🏊',
      metadata: node.metadata || {},
    };
  }

  generateLaneColor(index) {
    return Theme.lanes.getColor(index, true); // Use water theme
  }

  getNodeColor(type) {
    return Theme.nodes.getColor(type);
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
          reject(new Error(`Failed to parse JSON: ${error.message}`));
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
      phases: [
        {
          id: 'phase_1',
          name: 'Phase 1: Discovery',
          position: 400, // 10 circles (400/40)
        },
        {
          id: 'phase_2',
          name: 'Phase 2: Assessment',
          position: 800, // 10 more circles (400/40)
        },
        {
          id: 'phase_3',
          name: 'Phase 3: Resolution',
          position: 1200, // 10 more circles (400/40)
        },
        {
          id: 'phase_4',
          name: 'Phase 4: Closure',
          position: 1600, // 10 more circles (400/40) - Total: 40 circles
        },
      ],
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
              position: { x: 100, y: 50 },
            },
            {
              id: 'node_2',
              text: 'Submit Request',
              type: 'process',
              position: { x: 300, y: 50 },
            },
            {
              id: 'node_7',
              text: 'Approve Work',
              type: 'decision',
              position: { x: 700, y: 50 },
            },
          ],
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
              position: { x: 300, y: 200 },
            },
            {
              id: 'node_4',
              text: 'Inspect Pool',
              type: 'process',
              position: { x: 500, y: 200 },
            },
            {
              id: 'node_5',
              text: 'Perform Service',
              type: 'process',
              position: { x: 700, y: 200 },
            },
          ],
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
              position: { x: 900, y: 350 },
            },
            {
              id: 'node_8',
              text: 'Complete',
              type: 'end',
              position: { x: 1100, y: 350 },
            },
          ],
        },
      ],
      connections: [
        { from: 'node_1', to: 'node_2', label: 'Report' },
        { from: 'node_2', to: 'node_3', label: 'Request' },
        { from: 'node_3', to: 'node_4', label: 'Schedule' },
        { from: 'node_4', to: 'node_5', label: 'Issues Found' },
        { from: 'node_5', to: 'node_7', label: 'Review' },
        { from: 'node_7', to: 'node_6', label: 'Approved' },
        { from: 'node_6', to: 'node_8', label: 'Pass' },
      ],
    };
  }
}

window.ProcessParser = ProcessParser;
