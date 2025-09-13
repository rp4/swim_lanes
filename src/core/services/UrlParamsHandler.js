export class UrlParamsHandler {
    constructor(app) {
        this.app = app;
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const data = urlParams.get('data');
        
        if (data) {
            this.loadSharedDiagram(data);
        }
    }

    loadSharedDiagram(data) {
        try {
            const jsonString = decodeURIComponent(atob(data));
            const jsonData = JSON.parse(jsonString);
            const processData = this.app.parser.parseProcess(jsonData);
            this.app.controls.displayDiagram(processData);
        } catch (error) {
            console.error('Failed to load shared diagram:', error);
            this.showErrorMessage('Failed to load shared diagram. The link may be corrupted.');
        }
    }

    createShareableUrl(jsonData) {
        const jsonString = JSON.stringify(jsonData);
        const encodedData = btoa(encodeURIComponent(jsonString));
        const baseUrl = window.location.origin + window.location.pathname;
        return `${baseUrl}?data=${encodedData}`;
    }

    showErrorMessage(message) {
        // This could be enhanced with a better UI notification system
        console.error(message);
        alert(message);
    }
}