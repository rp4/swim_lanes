# 🏊 Swim Lane Diagram Visualizer

An interactive, pool-themed swim lane diagram creator for visualizing business processes. Upload JSON process definitions, edit them visually, and export the results.

## Features

### 🎨 Pool-Themed Design
- Swimming pool aesthetic with water animations
- Lane dividers styled as pool lane ropes
- Nodes represented as swimmers with emoji icons
- Gradient blue color scheme throughout

### 📤 Import/Export
- **Upload JSON** files with process definitions
- **Drag & Drop** support for file uploads
- **Export to JSON** with formatted structure
- **Export to PNG/SVG** images for presentations
- **Sample data** included for quick start

### ✏️ Interactive Editing
- **Drag nodes** to reposition them anywhere
- **Double-click nodes** to edit properties (text, type, color)
- **Double-click lanes** to edit lane properties
- **Add/remove lanes** dynamically
- **Connect nodes** with labeled connections
- **Undo/Redo** support for all actions

### 🎮 Controls
- **Zoom in/out** for better visibility
- **Fit to screen** option
- **Connection mode** for linking nodes
- **Keyboard shortcuts** for power users

## Quick Start

1. Open `index.html` in a modern web browser
2. Click "Load Sample Process" to see an example
3. Or upload your own JSON file
4. Edit the diagram by:
   - Dragging nodes to reposition
   - Double-clicking to edit
   - Using toolbar buttons for actions

## JSON Format

```json
{
  "title": "Process Name",
  "lanes": [
    {
      "id": "lane_1",
      "name": "Department",
      "color": "#64b5f6",
      "nodes": [
        {
          "id": "node_1",
          "text": "Task Description",
          "type": "process",
          "position": { "x": 100, "y": 50 }
        }
      ]
    }
  ],
  "connections": [
    {
      "from": "node_1",
      "to": "node_2",
      "label": "Flow Label"
    }
  ]
}
```

## Node Types

- **Start** (🏁): Green circle - Process beginning
- **Process** (🏊): Blue rounded rectangle - Regular task
- **Decision** (🤿): Orange diamond - Decision point
- **End** (🏆): Red circle - Process completion

## Keyboard Shortcuts

### File Operations
- `Ctrl+O`: Open file
- `Ctrl+S`: Save as JSON
- `Ctrl+E`: Export as image

### Editing
- `Ctrl+L`: Add new lane
- `Ctrl+N`: Add new node
- `C`: Toggle connection mode
- `Delete`: Delete selected node
- `Ctrl+Z`: Undo
- `Ctrl+Y`: Redo

### View
- `Ctrl+Plus`: Zoom in
- `Ctrl+Minus`: Zoom out
- `Ctrl+0`: Fit to screen
- `H`: Show help

## Browser Support

Works best in modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Local Development

To run locally with a web server:

```bash
# Python 3
python3 -m http.server 8080

# Node.js
npx http-server -p 8080

# Then open http://localhost:8080
```

## License

Free to use for personal and commercial projects.

## Credits

Created with vanilla JavaScript, SVG, and CSS3 animations.
Icons and emojis are native Unicode characters.