// camera.js
class CameraApp {
    constructor() {
        this.video = document.getElementById('videoElement');
        this.canvas = document.getElementById('canvas');
        this.capturedImage = document.getElementById('capturedImage');
        this.startCameraBtn = document.getElementById('startCamera');
        this.capturePhotoBtn = document.getElementById('capturePhoto');
        this.retakePhotoBtn = document.getElementById('retakePhoto');
        this.cameraStatus = document.getElementById('cameraStatus');
        
        this.stream = null;
        this.isCaptured = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkCameraSupport();
    }

    setupEventListeners() {
        this.startCameraBtn.addEventListener('click', () => this.startCamera());
        this.capturePhotoBtn.addEventListener('click', () => this.capturePhoto());
        this.retakePhotoBtn.addEventListener('click', () => this.retakePhoto());
    }

    checkCameraSupport() {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.updateStatus('Camera not supported in this browser', 'error');
            this.startCameraBtn.disabled = true;
            return false;
        }
        return true;
    }

    async startCamera() {
        try {
            this.updateStatus('Requesting camera access...');
            
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 960 },
                    facingMode: 'user'
                }
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            
            this.video.onloadedmetadata = () => {
                this.updateStatus('Camera ready - Position yourself and click Capture Photo');
                this.showCaptureControls();
            };
            
        } catch (error) {
            console.error('Camera access error:', error);
            let errorMessage = 'Failed to access camera';
            
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Camera access denied. Please allow camera access and try again.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No camera found on this device.';
            } else if (error.name === 'NotReadableError') {
                errorMessage = 'Camera is already in use by another application.';
            }
            
            this.updateStatus(errorMessage, 'error');
        }
    }

    capturePhoto() {
        try {
            // Set canvas dimensions to match video
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            
            // Draw video frame to canvas
            const context = this.canvas.getContext('2d');
            context.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Convert canvas to image data
            const imageData = this.canvas.toDataURL('image/jpeg', 0.8);
            
            // Show captured image
            this.capturedImage.src = imageData;
            this.capturedImage.classList.remove('hidden');
            this.video.classList.add('hidden');
            
            // Update UI
            this.isCaptured = true;
            this.showRetakeControls();
            this.updateStatus('Photo captured successfully!');
            
            // Notify main app
            if (window.smartFormApp) {
                window.smartFormApp.onImageCaptured(imageData);
            }
            
        } catch (error) {
            console.error('Photo capture error:', error);
            this.updateStatus('Failed to capture photo', 'error');
        }
    }

    retakePhoto() {
        // Hide captured image, show video
        this.capturedImage.classList.add('hidden');
        this.video.classList.remove('hidden');
        
        // Reset state
        this.isCaptured = false;
        this.showCaptureControls();
        this.updateStatus('Position yourself and click Capture Photo');
        
        // Notify main app
        if (window.smartFormApp) {
            window.smartFormApp.onImageCaptured(null);
        }
    }

    resetCamera() {
        // Stop camera stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        // Reset UI
        this.video.classList.remove('hidden');
        this.capturedImage.classList.add('hidden');
        this.isCaptured = false;
        this.showStartControls();
        this.updateStatus('Click "Start Camera" to begin');
        
        // Clear video source
        this.video.srcObject = null;
    }

    showStartControls() {
        this.startCameraBtn.classList.remove('hidden');
        this.capturePhotoBtn.classList.add('hidden');
        this.retakePhotoBtn.classList.add('hidden');
    }

    showCaptureControls() {
        this.startCameraBtn.classList.add('hidden');
        this.capturePhotoBtn.classList.remove('hidden');
        this.retakePhotoBtn.classList.add('hidden');
    }

    showRetakeControls() {
        this.startCameraBtn.classList.add('hidden');
        this.capturePhotoBtn.classList.add('hidden');
        this.retakePhotoBtn.classList.remove('hidden');
    }

    updateStatus(message, type = 'info') {
        this.cameraStatus.textContent = message;
        this.cameraStatus.className = 'camera-status';
        
        if (type === 'error') {
            this.cameraStatus.style.color = 'var(--google-red)';
        } else {
            this.cameraStatus.style.color = 'var(--text-secondary)';
        }
    }

    // Cleanup method
    destroy() {
        this.resetCamera();
    }
}

// Initialize camera module when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.cameraApp = new CameraApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.cameraApp) {
        window.cameraApp.destroy();
    }
});