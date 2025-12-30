// fingerprinting.js - Comprehensive device fingerprinting without OS access

class DeviceFingerprintService {
    
    /**
     * Generate comprehensive device fingerprint
     */
    static async generateFingerprint() {
        const fingerprint = {
            userAgent: navigator.userAgent,
            language: navigator.language,
            platform: navigator.userAgentData.platform,
            hardwareConcurrency: navigator.hardwareConcurrency || 'unknown',
            deviceMemory: navigator.deviceMemory || 'unknown',
            maxTouchPoints: navigator.maxTouchPoints || 0,
            screenResolution: this.getScreenResolution(),
            colorDepth: screen.colorDepth,
            pixelDepth: screen.pixelDepth,
            timezone: this.getTimezone(),
            timezoneOffset: new Date().getTimezoneOffset(),
            canvasFingerprint: await this.getCanvasFingerprint(),
            webglFingerprint: this.getWebGLFingerprint(),
            fontList: this.getAvailableFonts(),
            pluginsInfo: this.getPluginsInfo(),
            localStorage: this.checkLocalStorageAvailable(),
            sessionStorage: this.checkSessionStorageAvailable(),
            indexedDB: this.checkIndexedDBAvailable(),
            openDatabase: this.checkOpenDatabaseAvailable(),
            localStorage: typeof(Storage) !== 'undefined',
            doNotTrack: navigator.doNotTrack,
            cookieEnabled: navigator.cookieEnabled,
            vibrate: typeof navigator.vibrate === 'function',
            batteryInfo: await this.getBatteryInfo(),
            mediaDevices: await this.getMediaDevices(),
            screenBrightness: await this.getScreenBrightness(),
            // Browser specific
            vendorPrefix: this.getBrowserVendor(),
            cookieStore: typeof window.cookieStore !== 'undefined',
            bluetooth: typeof navigator.bluetooth !== 'undefined',
            usb: typeof navigator.usb !== 'undefined',
            serial: typeof navigator.serial !== 'undefined'
        };
        
        return fingerprint;
    }
    
    /**
     * Create hash from fingerprint
     */
    static async createFingerprintHash(fingerprint) {
        const fingerprintString = JSON.stringify(fingerprint);
        const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(fingerprintString));
        const hashArray = Array.from(new Uint8Array(buffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }
    
    /**
     * Canvas fingerprinting - unique characteristics of rendering
     */
    static async getCanvasFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const text = 'pharmacy-management-system';
            
            ctx.textBaseline = 'top';
            ctx.font = '14px "Arial"';
            ctx.textBaseline = 'alphabetic';
            ctx.fillStyle = '#f60';
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = '#069';
            ctx.fillText(text, 2, 15);
            ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
            ctx.fillText(text, 4, 17);
            
            return canvas.toDataURL();
        } catch (e) {
            return 'canvas-unavailable';
        }
    }
    
    /**
     * WebGL fingerprinting - GPU capabilities
     */
    static getWebGLFingerprint() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (!gl) return 'webgl-unavailable';
            
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            
            return `${vendor}|${renderer}`;
        } catch (e) {
            return 'webgl-error';
        }
    }
    
    /**
     * Get available system fonts
     */
    static getAvailableFonts() {
        const baseFonts = ['monospace', 'sans-serif', 'serif'];
        const testFonts = [
            'Arial', 'Verdana', 'Times New Roman', 'Courier New',
            'Georgia', 'Palatino', 'Garamond', 'Bookman',
            'Comic Sans MS', 'Trebuchet MS', 'Impact'
        ];
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const getWidth = (font) => {
            ctx.font = `72px "${font}"`;
            return ctx.measureText('mmmmmmmmmmlli').width;
        };
        
        const baseFontsWidths = {};
        baseFonts.forEach(baseFont => {
            baseFontsWidths[baseFont] = getWidth(baseFont);
        });
        
        const detectedFonts = [];
        testFonts.forEach(testFont => {
            let detected = false;
            baseFonts.forEach(baseFont => {
                const testFontWidth = getWidth(`'${testFont}', ${baseFont}`);
                if (testFontWidth !== baseFontsWidths[baseFont]) {
                    detected = true;
                }
            });
            if (detected) {
                detectedFonts.push(testFont);
            }
        });
        
        return detectedFonts;
    }
    
    /**
     * Get browser plugins info
     */
    static getPluginsInfo() {
        try {
            if (!navigator.plugins) return [];
            
            const plugins = [];
            for (let i = 0; i < navigator.plugins.length; i++) {
                plugins.push({
                    name: navigator.plugins[i].name,
                    description: navigator.plugins[i].description,
                    version: navigator.plugins[i].version
                });
            }
            return plugins;
        } catch (e) {
            return [];
        }
    }
    
    /**
     * Screen resolution info
     */
    static getScreenResolution() {
        return `${window.screen.width}x${window.screen.height}`;
    }
    
    /**
     * Get timezone
     */
    static getTimezone() {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
        } catch (e) {
            return 'unknown';
        }
    }
    
    /**
     * Check local storage availability
     */
    static checkLocalStorageAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Check session storage availability
     */
    static checkSessionStorageAvailable() {
        try {
            const test = '__sessionStorage_test__';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    /**
     * Check IndexedDB availability
     */
    static checkIndexedDBAvailable() {
        return typeof indexedDB !== 'undefined' && indexedDB !== null;
    }
    
    /**
     * Check OpenDatabase availability
     */
    static checkOpenDatabaseAvailable() {
        return typeof openDatabase !== 'undefined';
    }
    
    /**
     * Get battery info (if available)
     */
    static async getBatteryInfo() {
        try {
            if ('getBattery' in navigator) {
                const battery = await navigator.getBattery();
                return {
                    level: battery.level,
                    charging: battery.charging,
                    chargingTime: battery.chargingTime,
                    dischargingTime: battery.dischargingTime
                };
            }
        } catch (e) {
            // Battery API deprecated/unavailable
        }
        return null;
    }
    
    /**
     * Get media devices (cameras, microphones)
     */
    static async getMediaDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            return devices.map(d => ({ kind: d.kind, label: d.label || 'unknown' }));
        } catch (e) {
            return [];
        }
    }
    
    /**
     * Get screen brightness (if available)
     */
    static async getScreenBrightness() {
        try {
            if ('getBrightness' in screen) {
                return await screen.getBrightness();
            }
        } catch (e) {
            // Not supported
        }
        return null;
    }
    
    /**
     * Get browser vendor prefix
     */
    static getBrowserVendor() {
        const style = document.createElement('div').style;
        if ('webkitTransform' in style) return 'webkit';
        if ('MozTransform' in style) return 'moz';
        if ('msTransform' in style) return 'ms';
        if ('OTransform' in style) return 'o';
        return 'standard';
    }
}

export default DeviceFingerprintService;