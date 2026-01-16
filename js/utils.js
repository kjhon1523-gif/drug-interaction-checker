// Utility functions
const Utils = {
    // Debounce function for search
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Format date
    formatDate: function(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    },

    // Create element with attributes
    createElement: function(tag, attributes = {}, textContent = '') {
        const element = document.createElement(tag);
        Object.keys(attributes).forEach(key => {
            element.setAttribute(key, attributes[key]);
        });
        if (textContent) {
            element.textContent = textContent;
        }
        return element;
    },

    // Show notification
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            background: ${type === 'success' ? '#c6f6d5' : type === 'error' ? '#fed7d7' : '#bee3f8'};
            color: ${type === 'success' ? '#22543d' : type === 'error' ? '#9b2c2c' : '#2c5282'};
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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
    },

    // Validate drug data
    validateDrug: function(drug) {
        if (!drug.name || drug.name.trim().length < 2) {
            return { valid: false, message: 'Drug name is required and must be at least 2 characters' };
        }
        return { valid: true };
    },

    // Validate interaction data
    validateInteraction: function(interaction) {
        if (!interaction.drugAId || !interaction.drugBId) {
            return { valid: false, message: 'Both drugs must be selected' };
        }
        if (interaction.drugAId === interaction.drugBId) {
            return { valid: false, message: 'Cannot create interaction between the same drug' };
        }
        if (!interaction.severity) {
            return { valid: false, message: 'Severity level is required' };
        }
        if (!interaction.description || interaction.description.trim().length < 10) {
            return { valid: false, message: 'Description is required and must be at least 10 characters' };
        }
        return { valid: true };
    },

    // Get severity color
    getSeverityColor: function(severityId) {
        const severityLevels = DrugInteractionDB.getSeverityLevels();
        const severity = severityLevels.find(s => s.id === severityId);
        return severity ? severity.color : '#718096';
    },

    // Get severity name
    getSeverityName: function(severityId) {
        const severityLevels = DrugInteractionDB.getSeverityLevels();
        const severity = severityLevels.find(s => s.id === severityId);
        return severity ? severity.name : 'Unknown';
    },

    // Get category name
    getCategoryName: function(categoryId) {
        const categories = DrugInteractionDB.getCategories();
        const category = categories.find(c => c.id === categoryId);
        return category ? category.name : 'Uncategorized';
    }
};

// Add CSS for notifications
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
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
document.head.appendChild(notificationStyles);