export class LandingPage {
  constructor(config = {}) {
    this.config = {
      icon: '🏊',
      title: 'Swim Lane Diagram',
      subtitle: 'Pool Planner',
      showInfoButton: false,
      infoPopup: null,
      actions: [],
      fileUpload: null,
      footerLinks: [],
      className: '',
      containerClassName: '',
      ...config
    };

    this.isDragging = false;
    this.showPrivacyInfo = false;
    this.element = null;
  }

  render() {
    const container = document.createElement('div');
    container.className = `landing-page-wrapper ${this.config.className}`;
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      background: url('/pool.png') center/cover;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    `;

    const innerContainer = document.createElement('div');
    innerContainer.className = `landing-container ${this.config.containerClassName}`;
    innerContainer.style.cssText = `
      width: 100%;
      max-width: 42rem;
      padding: 3rem;
      border: 2px dashed;
      border-radius: 1rem;
      transition: all 0.3s ease;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      ${this.isDragging
        ? 'border-color: #5b21b6; background: rgba(139, 92, 246, 0.1);'
        : 'border-color: #d1d5db; background: rgba(255, 255, 255, 0.95);'}
    `;

    innerContainer.innerHTML = `
      <div style="text-align: center;">
        <!-- Title with icon -->
        <h2 style="font-size: 3rem; font-weight: bold; color: #1f2937; margin-bottom: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.75rem;">
          <span style="font-size: 3.75rem;">${this.config.icon}</span>
          ${this.config.title}
        </h2>

        <!-- Subtitle with optional info button -->
        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 1.5rem; position: relative;">
          <p style="font-size: 1.25rem; color: #4b5563;">${this.config.subtitle}</p>
          ${this.config.showInfoButton ? `
            <button class="info-button" style="
              background: none;
              border: none;
              cursor: help;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #9ca3af; transition: color 0.2s;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </button>
            <div class="info-popup" style="display: none; position: absolute;">
              <!-- Info popup content would go here -->
            </div>
          ` : ''}
        </div>

        <!-- File input (hidden) -->
        ${this.config.fileUpload ? `
          <input type="file"
            accept="${this.config.fileUpload.accept || '.json'}"
            style="display: none;"
            id="landing-file-input"
          />
        ` : ''}

        <!-- Action buttons -->
        ${this.config.actions.length > 0 ? `
          <div style="display: flex; align-items: center; justify-content: center; gap: 1rem; flex-wrap: wrap;">
            ${this.config.actions.map((action, idx) => {
              const isFileUploadButton = action.label === 'Choose File' && this.config.fileUpload;
              const buttonStyles = this.getButtonStyles(action.variant);

              if (isFileUploadButton) {
                return `
                  <label for="landing-file-input"
                    style="
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      width: 13rem;
                      height: 5rem;
                      padding: 0 1.5rem;
                      font-size: 1.125rem;
                      font-weight: 500;
                      border-radius: 0.5rem;
                      cursor: pointer;
                      transition: all 0.3s;
                      ${buttonStyles}
                      ${action.className || ''}
                    "
                    title="${action.tooltip || ''}"
                  >
                    ${action.icon || ''}
                    ${action.label}
                  </label>
                `;
              }

              return `
                <button
                  data-action-index="${idx}"
                  style="
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 13rem;
                    height: 5rem;
                    padding: 0 1.5rem;
                    font-size: 1.125rem;
                    font-weight: 500;
                    border-radius: 0.5rem;
                    transition: all 0.3s;
                    cursor: pointer;
                    ${buttonStyles}
                    ${action.className || ''}
                  "
                  title="${action.tooltip || ''}"
                >
                  ${action.icon || ''}
                  ${action.label}
                </button>
              `;
            }).join('')}
          </div>
        ` : ''}

        <!-- Footer links -->
        ${this.config.footerLinks.length > 0 ? `
          <div style="display: flex; align-items: center; justify-content: center; gap: 1.5rem; margin-top: 2rem;">
            ${this.config.footerLinks.map(link => {
              // Check if icon is an emoji (not SVG)
              const isEmoji = !link.icon.includes('<svg');
              return `
                <a href="${link.href}"
                  target="${link.target || '_blank'}"
                  rel="noopener noreferrer"
                  style="
                    color: #4b5563;
                    transition: all 0.3s;
                    display: inline-block;
                    ${isEmoji ? 'font-size: 24px; line-height: 1;' : ''}
                  "
                  title="${link.title || ''}"
                  onmouseover="this.style.color='#1f2937'; this.style.transform='scale(1.1)'"
                  onmouseout="this.style.color='#4b5563'; this.style.transform='scale(1)'"
                >
                  ${link.icon}
                </a>
              `;
            }).join('')}
          </div>
        ` : ''}
      </div>
    `;

    container.appendChild(innerContainer);

    // Setup event listeners
    this.setupEventListeners(container, innerContainer);

    this.element = container;
    return container;
  }

  setupEventListeners(container, innerContainer) {
    // Handle drag and drop if enabled
    if (this.config.fileUpload?.dragDropEnabled) {
      innerContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        this.isDragging = true;
        innerContainer.style.borderColor = '#5b21b6';
        innerContainer.style.background = 'rgba(139, 92, 246, 0.1)';
      });

      innerContainer.addEventListener('dragleave', (e) => {
        e.preventDefault();
        this.isDragging = false;
        innerContainer.style.borderColor = '#d1d5db';
        innerContainer.style.background = 'rgba(255, 255, 255, 0.95)';
      });

      innerContainer.addEventListener('drop', (e) => {
        e.preventDefault();
        this.isDragging = false;
        innerContainer.style.borderColor = '#d1d5db';
        innerContainer.style.background = 'rgba(255, 255, 255, 0.95)';

        const files = Array.from(e.dataTransfer.files);
        if (files[0]) {
          this.config.fileUpload.onFileSelect(files[0]);
        }
      });
    }

    // Handle file input change
    const fileInput = container.querySelector('#landing-file-input');
    if (fileInput) {
      fileInput.addEventListener('change', (e) => {
        if (e.target.files?.[0]) {
          this.config.fileUpload.onFileSelect(e.target.files[0]);
        }
      });
    }

    // Handle action button clicks
    container.querySelectorAll('button[data-action-index]').forEach(button => {
      button.addEventListener('click', () => {
        const index = parseInt(button.dataset.actionIndex);
        const action = this.config.actions[index];
        if (action?.onClick) {
          action.onClick();
        }
      });
    });

    // Handle info button hover
    const infoButton = container.querySelector('.info-button');
    const infoPopup = container.querySelector('.info-popup');
    if (infoButton && infoPopup && this.config.infoPopup) {
      infoButton.addEventListener('mouseenter', () => {
        this.showPrivacyInfo = true;
        this.renderInfoPopup(infoPopup);
      });

      infoButton.addEventListener('mouseleave', () => {
        this.showPrivacyInfo = false;
        infoPopup.style.display = 'none';
      });

      // Keep popup open when hovering over it
      infoPopup.addEventListener('mouseenter', () => {
        this.showPrivacyInfo = true;
        infoPopup.style.display = 'block';
      });

      infoPopup.addEventListener('mouseleave', () => {
        this.showPrivacyInfo = false;
        infoPopup.style.display = 'none';
      });
    }
  }

  renderInfoPopup(popupElement) {
    if (!this.config.infoPopup) return;

    // Position the popup to the side with fixed positioning to stay in viewport
    popupElement.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      max-width: min(90vw, 500px);
      width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      background: #f9fafb;
      border-radius: 0.75rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      border: 1px solid #e5e7eb;
      padding: 2rem;
      z-index: 10000;
      display: block;
    `;

    // Render popup content with icons
    popupElement.innerHTML = `
      <!-- Header with shield icon -->
      <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 2rem;">
        ${this.config.infoPopup.icon ? `
          <div style="width: 3rem; height: 3rem; background: #dbeafe; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            ${this.config.infoPopup.icon}
          </div>
        ` : ''}
        <h3 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin: 0;">
          ${this.config.infoPopup.title}
        </h3>
      </div>

      <!-- Sections -->
      ${this.config.infoPopup.sections.map((section, idx) => `
        <div style="display: flex; align-items: flex-start; gap: 1rem; margin-bottom: ${idx < this.config.infoPopup.sections.length - 1 ? '1.5rem' : '0'};">
          ${section.icon ? `
            <div style="width: 2.5rem; height: 2.5rem; background: #e5e7eb; border-radius: 0.5rem; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 0.25rem;">
              ${section.icon}
            </div>
          ` : ''}
          <div style="flex: 1;">
            <h4 style="font-size: 1.125rem; font-weight: 600; color: #111827; margin: 0 0 0.5rem 0;">
              ${section.title}
            </h4>
            ${section.content ? `
              <p style="color: #6b7280; margin: 0 0 0.5rem 0; line-height: 1.5;">
                ${section.content}
              </p>
            ` : ''}
            ${section.bullets ? `
              <ul style="list-style: none; padding: 0; margin: 0;">
                ${section.bullets.map(bullet => `
                  <li style="color: #6b7280; margin-bottom: 0.5rem; padding-left: 1.25rem; position: relative;">
                    <span style="position: absolute; left: 0;">•</span>
                    ${bullet}
                  </li>
                `).join('')}
              </ul>
            ` : ''}
          </div>
        </div>
      `).join('')}
    `;
  }

  getButtonStyles(variant = 'primary') {
    switch (variant) {
      case 'secondary':
        return 'border: 2px solid #6366f1; color: #4f46e5; background: white;';
      case 'success':
        return 'background: #10b981; color: white; border: 2px solid #10b981;';
      case 'primary':
      default:
        return 'background: #6366f1; color: white; border: 2px solid #6366f1;';
    }
  }

  show() {
    if (this.element) {
      this.element.style.display = 'flex';
    }
  }

  hide() {
    if (this.element) {
      this.element.style.display = 'none';
    }
  }

  remove() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}