import { ValidationService } from '../services/ValidationService.js';
import { Theme } from '../config/theme.js';

export class ProcessParser {
  constructor() {
    this.defaultNodeTypes = ['start', 'process', 'decision', 'end'];
  }

  parse(jsonString) {
    try {
      const jsonData = typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
      console.log('Parsing JSON data:', jsonData);
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
        console.log(`Processing node in lane ${lane.name}:`, node.id, 'Type:', node.type, 'Text:', node.text);
        node.icon = Theme.nodes.getIcon(node.type);
        // Always use theme color based on node type, ignore imported color
        node.color = Theme.nodes.getColor(node.type);
        console.log(`  -> Assigned color:`, node.color, 'for type:', node.type);
      });
    });

    return process;
  }

  parseNode(node, nodeIndex, laneIndex) {
    const defaultPosition = {
      x: nodeIndex * 200 + 150,
      y: laneIndex * 150 + 100,
    };

    const parsedNode = {
      id: node.id || `node_${laneIndex}_${nodeIndex}`,
      text: node.text || 'Node',
      type: node.type || 'process',
      position: node.position || defaultPosition,
      color: node.color || this.getNodeColor(node.type),
      icon: this.nodeIcons[node.type] || '🏊',
      metadata: node.metadata || {},
    };

    // Include risks with embedded controls if present
    if (node.risks && Array.isArray(node.risks)) {
      parsedNode.risks = node.risks.map(risk => ({
        id: risk.id || `risk_${Date.now()}_${Math.random()}`,
        text: risk.text || '',
        level: risk.level || 'medium',
        description: risk.description || '',
        controls: risk.controls && Array.isArray(risk.controls)
          ? risk.controls.map(control => ({
              id: control.id || `control_${Date.now()}_${Math.random()}`,
              text: control.text || '',
              type: control.type || 'preventive',
              description: control.description || ''
            }))
          : []
      }));
    }

    // Handle legacy structure with separate controls array (for backward compatibility)
    if (node.controls && Array.isArray(node.controls)) {
      // This will be migrated by RiskDetailsModal when opened
      parsedNode.controls = node.controls;
    }

    return parsedNode;
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
      title: 'Loan Approval Process with Risk Management',
      phases: [
        {
          id: 'phase_1',
          name: 'Application',
          position: 250,
        },
        {
          id: 'phase_2',
          name: 'Verification',
          position: 550,
        },
        {
          id: 'phase_3',
          name: 'Approval',
          position: 850,
        },
        {
          id: 'phase_4',
          name: 'Disbursement',
          position: 1150,
        },
      ],
      lanes: [
        {
          id: 'lane_1',
          name: 'Customer',
          color: '#64b5f6',
          nodes: [
            {
              id: 'node_1',
              text: 'Submit Application',
              type: 'start',
              position: { x: 150, y: 70 },
              risks: [
                {
                  id: 'risk_1',
                  text: 'Incomplete documentation',
                  level: 'medium',
                  description: 'Customer may not provide all required documents',
                  controlIds: ['control_1'],
                },
                {
                  id: 'risk_2',
                  text: 'Fraudulent information',
                  level: 'high',
                  description: 'Customer may submit false information',
                  controlIds: [],
                },
              ],
              controls: [
                {
                  id: 'control_1',
                  text: 'Document checklist',
                  type: 'preventive',
                  description: 'Automated validation of required documents',
                },
              ],
            },
          ],
        },
        {
          id: 'lane_2',
          name: 'Front Office',
          color: '#4fc3f7',
          nodes: [
            {
              id: 'node_2',
              text: 'Initial Review',
              type: 'process',
              position: { x: 350, y: 70 },
              risks: [
                {
                  id: 'risk_3',
                  text: 'Processing delays',
                  level: 'low',
                  description: 'High volume may cause backlogs',
                  controlIds: ['control_2', 'control_3'],
                },
              ],
              controls: [
                {
                  id: 'control_2',
                  text: 'SLA monitoring',
                  type: 'detective',
                  description: 'Track processing times against targets',
                },
                {
                  id: 'control_3',
                  text: 'Workload balancing',
                  type: 'preventive',
                  description: 'Automated distribution of applications',
                },
              ],
            },
            {
              id: 'node_3',
              text: 'Document Verification',
              type: 'process',
              position: { x: 550, y: 70 },
              risks: [
                {
                  id: 'risk_4',
                  text: 'Document forgery',
                  level: 'high',
                  description: 'Submitted documents may be forged',
                  controlIds: ['control_4', 'control_5'],
                },
              ],
              controls: [
                {
                  id: 'control_4',
                  text: 'Document authentication',
                  type: 'detective',
                  description: 'Digital verification of document authenticity',
                },
                {
                  id: 'control_5',
                  text: 'Dual verification',
                  type: 'preventive',
                  description: 'Two-person review for high-value loans',
                },
              ],
            },
          ],
        },
        {
          id: 'lane_3',
          name: 'Credit Department',
          color: '#29b6f6',
          nodes: [
            {
              id: 'node_4',
              text: 'Credit Check',
              type: 'process',
              position: { x: 750, y: 70 },
              risks: [
                {
                  id: 'risk_5',
                  text: 'Identity theft',
                  level: 'high',
                  description: 'Applicant may be using stolen identity',
                  controlIds: [],
                },
              ],
              controls: [],
            },
            {
              id: 'node_5',
              text: 'Risk Assessment',
              type: 'decision',
              position: { x: 950, y: 70 },
              risks: [],
              controls: [],
            },
            {
              id: 'node_6',
              text: 'Final Approval',
              type: 'end',
              position: { x: 1150, y: 70 },
              risks: [],
              controls: [],
            },
          ],
        },
      ],
      connections: [
        { from: 'node_1', to: 'node_2', label: 'Application received' },
        { from: 'node_2', to: 'node_3', label: 'Initial check passed' },
        { from: 'node_3', to: 'node_4', label: 'Documents verified' },
        { from: 'node_4', to: 'node_5', label: 'Credit checked' },
        { from: 'node_5', to: 'node_6', label: 'Risk acceptable' },
      ],
    };
  }
}

window.ProcessParser = ProcessParser;
