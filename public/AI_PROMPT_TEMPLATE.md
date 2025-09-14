# AI Prompt Template for Swim Lane Diagram Generation

## Instructions for Using This Prompt

Copy the entire prompt below and paste it into ChatGPT or Claude along with your process documentation, interview transcripts, or notes. The AI will analyze your content and generate a properly formatted JSON file that can be directly imported into the Swim Lane Visualizer.

---

## PROMPT START

You are a process analyst expert who creates swim lane diagrams from various types of documentation. Your task is to analyze the provided content and generate a JSON file that represents the process as a swim lane diagram.

### Your Task:
1. Analyze the provided text/documentation
2. Identify the key actors/departments/roles (these become lanes)
3. Identify process phases or stages (these become vertical dividers)
4. Extract the process steps and decisions
5. Determine the logical flow between steps
6. Generate a valid JSON file following the exact specification below

### JSON Output Requirements:

You MUST output ONLY valid JSON that follows this exact structure:

```json
{
  "title": "Process Name Here",
  "phases": [
    {
      "id": "phase_1",
      "name": "Phase Name",
      "position": number
    }
  ],
  "lanes": [
    {
      "id": "lane_1",
      "name": "Department/Role Name",
      "color": "#64b5f6",
      "nodes": [
        {
          "id": "node_1",
          "text": "Task Description",
          "type": "process|start|decision|end",
          "position": { "x": number, "y": number }
        }
      ]
    }
  ],
  "connections": [
    {
      "from": "node_id",
      "to": "node_id",
      "label": "Optional Label"
    }
  ]
}
```

### Field Specifications:

**Title**: A clear, descriptive name for the overall process

**Phases** (Optional): Vertical dividers that organize the process into stages
- `id`: Unique identifier (format: "phase_X" where X is a number)
- `name`: Display name for the phase (e.g., "Discovery", "Implementation", "Review")
- `position`: X-coordinate where the phase divider appears (must be between node positions)
  - Phases create visual boundaries to group related activities
  - Position values should align with logical breaks in your process flow
  - Example: If nodes are at x=100, 300, 500, 700, place phase at 400 to divide after second node

**Lanes**: Each lane represents a department, role, or actor
- `id`: Unique identifier (format: "lane_X" where X is a number)
- `name`: Display name for the lane (keep concise, max 30 chars)
- `color`: Hex color code. Use these colors for variety:
  - Blue: #64b5f6
  - Green: #81c784
  - Orange: #ffb74d
  - Purple: #ba68c8
  - Red: #e57373
  - Teal: #4dd0e1
  - Yellow: #fff176
- `nodes`: Array of process steps in this lane

**Nodes**: Individual process steps
- `id`: Unique identifier (format: "node_X" where X is a number)
- `text`: Brief description of the step (max 50 chars, be concise)
- `type`: Must be one of:
  - "start": Green circle, use for process entry points
  - "process": Blue rectangle, use for standard tasks/actions
  - "decision": Yellow diamond, use for decision points/conditionals
  - "end": Red circle, use for process exit points
- `position`:
  - `x`: Horizontal position (100-1200, space nodes ~200 pixels apart)
  - `y`: Vertical position within lane (30-120, typically use 50 for single row)

**Connections**: Arrows between nodes
- `from`: Source node ID
- `to`: Target node ID
- `label`: Optional text for the connection (use for decision branches like "Yes"/"No")

### Positioning Guidelines:
1. Start nodes typically at x=100
2. Space nodes horizontally ~200 pixels apart (x: 100, 300, 500, 700...)
3. Keep y-position at 50 for linear flows within a lane
4. Use y=30 and y=80 for parallel activities in the same lane
5. Align nodes vertically across lanes when they happen simultaneously
6. Place phase dividers between logical groups of activities (e.g., x=400 between nodes at x=300 and x=500)
7. Ensure phase positions don't overlap with node positions

### Best Practices:
1. **Identify Clear Lanes**: Look for distinct roles, departments, or systems
2. **Define Phases**: Group related activities into logical phases (e.g., "Planning", "Execution", "Review")
3. **Keep Text Concise**: Node text should be action-oriented (e.g., "Submit Request", "Review Document")
4. **Logical Flow**: Ensure every node (except ends) has at least one outgoing connection
5. **Decision Points**: Always have at least 2 outgoing connections from decision nodes
6. **Start and End**: Every process should have at least one start and one end node
7. **No Orphans**: Every node must be connected to the flow
8. **Phase Placement**: Position phases to clearly separate distinct stages of the process

### Example Output:

```json
{
  "title": "Purchase Order Approval Process",
  "phases": [
    {
      "id": "phase_1",
      "name": "Request Phase",
      "position": 400
    },
    {
      "id": "phase_2",
      "name": "Approval Phase",
      "position": 800
    },
    {
      "id": "phase_3",
      "name": "Execution Phase",
      "position": 1000
    }
  ],
  "lanes": [
    {
      "id": "lane_1",
      "name": "Requester",
      "color": "#64b5f6",
      "nodes": [
        {
          "id": "node_1",
          "text": "Start",
          "type": "start",
          "position": { "x": 100, "y": 50 }
        },
        {
          "id": "node_2",
          "text": "Submit PO Request",
          "type": "process",
          "position": { "x": 300, "y": 50 }
        },
        {
          "id": "node_7",
          "text": "Receive Approval",
          "type": "process",
          "position": { "x": 900, "y": 50 }
        },
        {
          "id": "node_8",
          "text": "End",
          "type": "end",
          "position": { "x": 1100, "y": 50 }
        }
      ]
    },
    {
      "id": "lane_2",
      "name": "Manager",
      "color": "#81c784",
      "nodes": [
        {
          "id": "node_3",
          "text": "Review Request",
          "type": "process",
          "position": { "x": 500, "y": 50 }
        },
        {
          "id": "node_4",
          "text": "Approve?",
          "type": "decision",
          "position": { "x": 700, "y": 50 }
        }
      ]
    },
    {
      "id": "lane_3",
      "name": "Finance",
      "color": "#ffb74d",
      "nodes": [
        {
          "id": "node_5",
          "text": "Budget Check",
          "type": "process",
          "position": { "x": 500, "y": 50 }
        },
        {
          "id": "node_6",
          "text": "Process Payment",
          "type": "process",
          "position": { "x": 900, "y": 50 }
        }
      ]
    }
  ],
  "connections": [
    {
      "from": "node_1",
      "to": "node_2",
      "label": ""
    },
    {
      "from": "node_2",
      "to": "node_3",
      "label": ""
    },
    {
      "from": "node_3",
      "to": "node_5",
      "label": ""
    },
    {
      "from": "node_5",
      "to": "node_4",
      "label": ""
    },
    {
      "from": "node_4",
      "to": "node_6",
      "label": "Yes"
    },
    {
      "from": "node_4",
      "to": "node_2",
      "label": "No"
    },
    {
      "from": "node_6",
      "to": "node_7",
      "label": ""
    },
    {
      "from": "node_7",
      "to": "node_8",
      "label": ""
    }
  ]
}
```

### Now, analyze the following content and generate the JSON:

[PASTE YOUR DOCUMENTATION/TRANSCRIPTS/NOTES HERE]

---

Remember: Output ONLY the JSON, no explanations or markdown code blocks. The output should be directly copyable and usable in the swim lane visualizer.

## PROMPT END

---

## Usage Instructions:

1. Copy everything between "PROMPT START" and "PROMPT END"
2. Replace "[PASTE YOUR DOCUMENTATION/TRANSCRIPTS/NOTES HERE]" with your actual content
3. Submit to ChatGPT or Claude
4. Copy the generated JSON output
5. Save it as a .json file
6. Import into the Swim Lane Visualizer using the "Import JSON" button

## Tips for Best Results:

- Provide clear process documentation with identified roles/actors
- Include decision points and their conditions
- Mention the sequence of steps explicitly
- If you have interview transcripts, highlight who does what
- The more structured your input, the better the output

## Troubleshooting:

If the AI includes markdown formatting or explanations:
- Add to your prompt: "Output raw JSON only, no code blocks or explanations"
- Ask it to regenerate: "Please provide only the JSON without any markdown formatting"

If the JSON has errors:
- Validate using a JSON validator (jsonlint.com)
- Common issues: missing commas, unclosed brackets, invalid node references