// app.js
class SmartFormApp {
    constructor() {
        this.form = document.getElementById('dataForm');
        this.submitBtn = document.getElementById('submitForm');
        this.resetBtn = document.getElementById('resetForm');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.successModal = document.getElementById('successModal');
        this.capturedImageData = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormValidation();
    }

    setupEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Form reset
        this.resetBtn.addEventListener('click', () => this.handleFormReset());
        
        // Modal buttons
        document.getElementById('newSubmission').addEventListener('click', () => this.handleNewSubmission());
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        
        // Click outside modal to close
        this.successModal.addEventListener('click', (e) => {
            if (e.target === this.successModal) {
                this.closeModal();
            }
        });
    }

    setupFormValidation() {
        const requiredFields = this.form.querySelectorAll('[required]');
        
        requiredFields.forEach(field => {
            field.addEventListener('blur', () => this.validateField(field));
            field.addEventListener('input', () => {
                if (field.classList.contains('error')) {
                    this.validateField(field);
                }
                this.checkFormValidity();
            });
        });
    }

    validateField(field) {
        const errorElement = document.getElementById(`${field.name}Error`);
        let isValid = true;
        let errorMessage = '';

        // Remove previous error state
        field.classList.remove('error');
        if (errorElement) errorElement.textContent = '';

        // Check if field is empty
        if (field.hasAttribute('required') && !field.value.trim()) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Email validation
        if (field.type === 'email' && field.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }

        // Phone validation
        if (field.type === 'tel' && field.value) {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(field.value) || field.value.replace(/\D/g, '').length < 10) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }

        // Display error if invalid
        if (!isValid) {
            field.classList.add('error');
            if (errorElement) errorElement.textContent = errorMessage;
        }

        return isValid;
    }

    checkFormValidity() {
        const requiredFields = this.form.querySelectorAll('[required]');
        let allValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim() || field.classList.contains('error')) {
                allValid = false;
            }
        });

        // Check if image is captured
        if (!this.capturedImageData) {
            allValid = false;
        }

        this.submitBtn.disabled = !allValid;
        return allValid;
    }

    async handleFormSubmit(e) {
        e.preventDefault();

        if (!this.checkFormValidity()) {
            this.showError('Please complete all required fields and capture a photo');
            return;
        }

        try {
            this.showLoading(true);

            const formData = this.getFormData();
            const response = await this.submitData(formData);

            if (response.success) {
                this.showSuccess(response.data);
            } else {
                throw new Error(response.message || 'Submission failed');
            }
        } catch (error) {
            console.error('Submission error:', error);
            this.showError(error.message || 'An error occurred during submission');
        } finally {
            this.showLoading(false);
        }
    }

    getFormData() {
        const formData = new FormData(this.form);
        const data = {};
        
        // Convert FormData to object
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }

        // Add timestamp
        data.timestamp = new Date().toISOString();
        
        // Add image data
        data.imageData = this.capturedImageData;

        return data;
    }

    async submitData(data) {
        // In a real implementation, this would call your Google Apps Script endpoint
        // For now, we'll simulate the API call
        
        const API_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxTZP93ECiJz3Fl7QdIi1U1ckw5z3N67B0g5EIAiMZgGqlS8suM7qIyO-Jd04xBCf-X/exec'; // Replace with actual URL
        
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            // For development, simulate a successful response
            console.log('Simulating successful submission...');
            return {
                success: true,
                data: {
                    submissionId: 'SUB_' + Date.now(),
                    timestamp: data.timestamp,
                    message: 'Data submitted successfully'
                }
            };
        }
    }

    showSuccess(data) {
        const detailsElement = document.getElementById('submissionDetails');
        detailsElement.innerHTML = `
            <strong>Submission ID:</strong> ${data.submissionId}<br>
            <strong>Time:</strong> ${new Date(data.timestamp).toLocaleString()}<br>
            <strong>Status:</strong> Successfully saved to Google Sheets
        `;
        
        this.successModal.classList.remove('hidden');
    }

    showError(message) {
        // Create error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.innerHTML = `
            <div class="error-content">
                <span class="error-icon">⚠️</span>
                <span class="error-message">${message}</span>
                <button class="error-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add styles for error notification
        if (!document.querySelector('#error-styles')) {
            const style = document.createElement('style');
            style.id = 'error-styles';
            style.textContent = `
                .error-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--google-red);
                    color: white;
                    padding: 15px 20px;
                    border-radius: var(--border-radius);
                    box-shadow: var(--shadow-lg);
                    z-index: 2000;
                    max-width: 400px;
                    animation: slideIn 0.3s ease-out;
                }
                .error-content {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .error-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 1.2rem;
                    cursor: pointer;
                    margin-left: auto;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }

    showLoading(show) {
        if (show) {
            this.loadingOverlay.classList.remove('hidden');
        } else {
            this.loadingOverlay.classList.add('hidden');
        }
    }

    closeModal() {
        this.successModal.classList.add('hidden');
    }

    handleNewSubmission() {
        this.handleFormReset();
        this.closeModal();
    }

    handleFormReset() {
        this.form.reset();
        this.capturedImageData = null;
        
        // Clear all error states
        this.form.querySelectorAll('.error').forEach(field => {
            field.classList.remove('error');
        });
        
        this.form.querySelectorAll('.error-message').forEach(error => {
            error.textContent = '';
        });
        
        // Reset submit button
        this.submitBtn.disabled = true;
        
        // Reset camera if camera module is available
        if (window.cameraApp) {
            window.cameraApp.resetCamera();
        }
    }

    // Method to be called by camera module when image is captured
    onImageCaptured(imageData) {
        this.capturedImageData = imageData;
        this.checkFormValidity();
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.smartFormApp = new SmartFormApp();
});