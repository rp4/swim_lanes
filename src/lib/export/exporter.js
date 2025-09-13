export class ProcessExporter {
    constructor() {
        this.svgNamespace = 'http://www.w3.org/2000/svg';
    }

    exportToJSON(processData) {
        const exportData = {
            title: processData.title,
            lanes: processData.lanes.map(lane => ({
                id: lane.id,
                name: lane.name,
                color: lane.color,
                height: lane.height,
                nodes: lane.nodes.map(node => ({
                    id: node.id,
                    text: node.text,
                    type: node.type,
                    position: {
                        x: node.position.x,
                        y: node.position.y
                    },
                    color: node.color,
                    metadata: node.metadata || {}
                }))
            })),
            connections: processData.connections.map(conn => ({
                from: conn.from,
                to: conn.to,
                label: conn.label || ''
            })),
            metadata: processData.metadata || {}
        };

        return JSON.stringify(exportData, null, 2);
    }

    downloadJSON(processData, filename = 'swimlane-process.json') {
        const jsonString = this.exportToJSON(processData);
        const blob = new Blob([jsonString], { type: 'application/json' });
        this.downloadFile(blob, filename);
    }

    exportToImage(svgElement, format = 'png', filename = 'swimlane-diagram') {
        const svgClone = svgElement.cloneNode(true);
        
        this.addStyleToSVG(svgClone);
        
        const svgString = new XMLSerializer().serializeToString(svgClone);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        
        if (format === 'svg') {
            this.downloadFile(svgBlob, `${filename}.svg`);
        } else if (format === 'png') {
            this.convertSVGToPNG(svgString, filename);
        }
    }

    addStyleToSVG(svgElement) {
        const style = document.createElementNS(this.svgNamespace, 'style');
        style.textContent = `
            .swimlane {
                fill: url(#laneGradient);
                stroke: #1976d2;
                stroke-width: 2;
                opacity: 0.8;
            }
            .lane-divider {
                stroke: #ffc107;
                stroke-width: 3;
                stroke-dasharray: 10, 5;
                opacity: 0.8;
            }
            .lane-label {
                fill: #0d47a1;
                font-size: 18px;
                font-weight: bold;
                text-anchor: middle;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            .process-node {
                cursor: move;
            }
            .node-start {
                fill: #4caf50;
                stroke: white;
                stroke-width: 2;
            }
            .node-process {
                fill: #2196f3;
                stroke: white;
                stroke-width: 2;
            }
            .node-decision {
                fill: #ff9800;
                stroke: white;
                stroke-width: 2;
            }
            .node-end {
                fill: #f44336;
                stroke: white;
                stroke-width: 2;
            }
            .node-text {
                fill: white;
                font-size: 14px;
                text-anchor: middle;
                font-weight: 500;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            .connection-line {
                stroke: #1565c0;
                stroke-width: 2;
                fill: none;
            }
            .connection-label {
                fill: #0d47a1;
                font-size: 12px;
                text-anchor: middle;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
        `;
        svgElement.insertBefore(style, svgElement.firstChild);
    }

    convertSVGToPNG(svgString, filename) {
        const img = new Image();
        const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString);
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const scale = 2;
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob(blob => {
                this.downloadFile(blob, `${filename}.png`);
            }, 'image/png');
        };
        
        img.src = url;
    }

    downloadFile(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    exportToPDF(svgElement, processData, filename = 'swimlane-diagram.pdf') {
        alert('PDF export requires additional libraries. For now, please use PNG or SVG export and convert to PDF using external tools.');
    }

    exportToCSV(processData, filename = 'process-data.csv') {
        const rows = [['Lane', 'Node ID', 'Node Text', 'Node Type', 'Position X', 'Position Y']];
        
        processData.lanes.forEach(lane => {
            lane.nodes.forEach(node => {
                rows.push([
                    lane.name,
                    node.id,
                    node.text,
                    node.type,
                    node.position.x,
                    node.position.y
                ]);
            });
        });
        
        const csvContent = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        this.downloadFile(blob, filename);
    }

    copyToClipboard(processData) {
        const jsonString = this.exportToJSON(processData);
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(jsonString).then(() => {
                this.showNotification('Process data copied to clipboard!');
            }).catch(err => {
                console.error('Failed to copy to clipboard:', err);
                this.fallbackCopyToClipboard(jsonString);
            });
        } else {
            this.fallbackCopyToClipboard(jsonString);
        }
    }

    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.opacity = '0';
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showNotification('Process data copied to clipboard!');
            } else {
                this.showNotification('Failed to copy to clipboard', 'error');
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            this.showNotification('Failed to copy to clipboard', 'error');
        }
        
        document.body.removeChild(textArea);
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4caf50' : '#f44336'};
            color: white;
            border-radius: 5px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    generateShareableLink(processData) {
        const jsonString = this.exportToJSON(processData);
        const compressed = btoa(encodeURIComponent(jsonString));
        const currentUrl = window.location.origin + window.location.pathname;
        const shareUrl = `${currentUrl}?data=${compressed}`;
        
        if (shareUrl.length > 2000) {
            this.showNotification('Process too large for URL sharing. Please use file export.', 'error');
            return null;
        }
        
        return shareUrl;
    }
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

window.ProcessExporter = ProcessExporter;