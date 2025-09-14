/**
 * Theme Configuration
 * Centralized color and style definitions for the application
 */
export const Theme = {
  // Node colors by type
  nodes: {
    colors: {
      start: '#4caf50',
      process: '#2196f3',
      decision: '#ff9800',
      end: '#f44336',
      risk: '#f44336',
      control: '#4caf50',
      default: '#2196f3',
    },
    icons: {
      start: '',
      process: '',
      decision: '',
      end: '',
      risk: '',
      control: '',
      default: '',
    },
    /**
     * Get color for node type
     * @param {string} type - Node type
     * @returns {string} Color hex code
     */
    getColor(type) {
      return this.colors[type] || this.colors.default;
    },
    /**
     * Get icon for node type
     * @param {string} type - Node type
     * @returns {string} Icon emoji
     */
    getIcon(type) {
      return this.icons[type] || this.icons.default;
    },
  },

  // Lane colors palette
  lanes: {
    palette: [
      '#e3f2fd', // Light Blue
      '#f3e5f5', // Light Purple
      '#e8f5e9', // Light Green
      '#fff3e0', // Light Orange
      '#fce4ec', // Light Pink
      '#f1f8e9', // Light Lime
      '#e0f2f1', // Light Teal
      '#ede7f6', // Light Deep Purple
      '#fff8e1', // Light Amber
      '#efebe9', // Light Brown
    ],
    waterPalette: [
      '#64b5f6', // Blue 300
      '#4fc3f7', // Light Blue 300
      '#29b6f6', // Light Blue 400
      '#03a9f4', // Light Blue 500
      '#039be5', // Light Blue 600
      '#0288d1', // Light Blue 700
    ],
    /**
     * Get color for lane by index
     * @param {number} index - Lane index
     * @param {boolean} useWaterTheme - Use water theme colors
     * @returns {string} Color hex code
     */
    getColor(index, useWaterTheme = false) {
      const palette = useWaterTheme ? this.waterPalette : this.palette;
      return palette[index % palette.length];
    },
  },

  // Connection/Edge colors
  connections: {
    colors: {
      normal: '#666666',
      conditional: '#ff9800',
      error: '#f44336',
      success: '#4caf50',
      default: '#666666',
    },
    strokeWidth: {
      normal: 2,
      selected: 3,
      hover: 2.5,
    },
    /**
     * Get color for connection type
     * @param {string} type - Connection type
     * @returns {string} Color hex code
     */
    getColor(type) {
      return this.colors[type] || this.colors.default;
    },
  },

  // Risk level colors
  riskLevels: {
    low: '#4caf50',
    medium: '#ff9800',
    high: '#f44336',
    critical: '#9c27b0',
    /**
     * Get color for risk level
     * @param {string} level - Risk level
     * @returns {string} Color hex code
     */
    getColor(level) {
      return this[level] || '#666666';
    },
  },

  // UI Component colors
  ui: {
    primary: '#2196f3',
    secondary: '#64b5f6',
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
    background: '#ffffff',
    surface: '#f5f5f5',
    text: {
      primary: '#212121',
      secondary: '#757575',
      disabled: '#bdbdbd',
    },
    border: {
      light: '#e0e0e0',
      normal: '#bdbdbd',
      dark: '#9e9e9e',
    },
  },

  // Animation durations (ms)
  animations: {
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 1000,
  },

  // Shadows
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 8px rgba(0, 0, 0, 0.15)',
    large: '0 8px 16px rgba(0, 0, 0, 0.2)',
    elevated: '0 4px 15px rgba(0, 0, 0, 0.2)',
  },

  // Border radius
  borderRadius: {
    small: '4px',
    normal: '8px',
    large: '16px',
    round: '50%',
    pill: '25px',
  },

  // Z-index layers
  zIndex: {
    background: 0,
    swimlanes: 10,
    connections: 20,
    nodes: 30,
    anchors: 40,
    tooltips: 100,
    modals: 1000,
    notifications: 10000,
  },

  /**
   * Get complete theme object for a specific component
   * @param {string} component - Component name
   * @returns {Object} Theme configuration for component
   */
  getComponentTheme(component) {
    switch (component) {
      case 'node':
        return {
          colors: this.nodes.colors,
          icons: this.nodes.icons,
          shadow: this.shadows.medium,
          borderRadius: this.borderRadius.normal,
        };
      case 'lane':
        return {
          colors: this.lanes.palette,
          shadow: this.shadows.small,
          borderRadius: this.borderRadius.small,
        };
      case 'connection':
        return {
          colors: this.connections.colors,
          strokeWidth: this.connections.strokeWidth,
        };
      case 'notification':
        return {
          colors: {
            success: this.ui.success,
            error: this.ui.error,
            warning: this.ui.warning,
            info: this.ui.info,
          },
          shadow: this.shadows.elevated,
          borderRadius: this.borderRadius.pill,
          zIndex: this.zIndex.notifications,
        };
      default:
        return this.ui;
    }
  },

  /**
   * Apply theme to an element
   * @param {HTMLElement} element - Element to apply theme to
   * @param {Object} theme - Theme configuration
   */
  applyToElement(element, theme) {
    if (theme.color) {
      element.style.color = theme.color;
    }
    if (theme.backgroundColor) {
      element.style.backgroundColor = theme.backgroundColor;
    }
    if (theme.shadow) {
      element.style.boxShadow = theme.shadow;
    }
    if (theme.borderRadius) {
      element.style.borderRadius = theme.borderRadius;
    }
    if (theme.zIndex) {
      element.style.zIndex = theme.zIndex;
    }
  },
};

// Default export for convenience
export default Theme;
