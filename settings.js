/**
 * Text Layout Corrector Pro - Settings Script
 * Handles the options/settings page functionality
 */

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
    // Theme
    themeSelect: document.getElementById('theme-select'),

    // Notifications
    soundEnabled: document.getElementById('sound-enabled'),
    soundVolume: document.getElementById('sound-volume'),
    volumeValue: document.getElementById('volume-value'),
    notificationsEnabled: document.getElementById('notifications-enabled'),

    // Conversion
    autoDetect: document.getElementById('auto-detect'),
    languagePair: document.getElementById('language-pair'),

    // Statistics
    statConversions: document.getElementById('stat-conversions'),
    statCharacters: document.getElementById('stat-characters'),
    statLastUsed: document.getElementById('stat-last-used'),

    // Actions
    resetAllBtn: document.getElementById('reset-all-btn'),
    backLink: document.getElementById('back-link'),

    // Toast
    toastContainer: document.getElementById('toast-container')
};

// ============================================================================
// STATE
// ============================================================================

let settings = {
    theme: 'light',
    soundEnabled: true,
    soundVolume: 1.0,
    notificationsEnabled: true,
    autoDetectDirection: true,
    languagePair: 'ar-en'
};

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Shows a toast notification
 * @param {string} message - Message to display
 * @param {'success' | 'error' | 'info'} type - Toast type
 */
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = { success: '✓', error: '✕', info: 'ℹ' };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${message}</span>
    `;

    elements.toastContainer.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('toast-show'));

    setTimeout(() => {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Sends a message to the background script
 */
function sendMessage(type, data = {}) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ type, ...data }, (response) => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(response);
            }
        });
    });
}

/**
 * Formats a number for display
 */
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
}

/**
 * Formats a timestamp for display
 */
function formatLastUsed(isoString) {
    if (!isoString) return '—';

    try {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;

        return date.toLocaleDateString();
    } catch {
        return '—';
    }
}

// ============================================================================
// THEME MANAGEMENT
// ============================================================================

/**
 * Applies the theme
 */
function applyTheme(theme) {
    if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    } else {
        document.body.setAttribute('data-theme', theme);
    }
}

// ============================================================================
// LOAD/SAVE SETTINGS
// ============================================================================

/**
 * Loads settings from storage
 */
async function loadSettings() {
    try {
        const response = await sendMessage('GET_SETTINGS');
        if (response?.settings) {
            settings = { ...settings, ...response.settings };
            updateUIFromSettings();
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

/**
 * Saves settings to storage
 */
async function saveSettings() {
    try {
        await sendMessage('SAVE_SETTINGS', { settings });
        showToast('Settings saved!', 'success');
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('Failed to save settings', 'error');
    }
}

/**
 * Updates UI elements from settings
 */
function updateUIFromSettings() {
    elements.themeSelect.value = settings.theme;
    applyTheme(settings.theme);

    elements.soundEnabled.checked = settings.soundEnabled;
    elements.soundVolume.value = settings.soundVolume * 100;
    elements.volumeValue.textContent = Math.round(settings.soundVolume * 100) + '%';
    elements.soundVolume.disabled = !settings.soundEnabled;

    elements.notificationsEnabled.checked = settings.notificationsEnabled;
    elements.autoDetect.checked = settings.autoDetectDirection;
    elements.languagePair.value = settings.languagePair;
}

/**
 * Loads and displays statistics
 */
async function loadStatistics() {
    try {
        const response = await sendMessage('GET_STATISTICS');
        if (response?.statistics) {
            const stats = response.statistics;
            elements.statConversions.textContent = formatNumber(stats.totalConversions || 0);
            elements.statCharacters.textContent = formatNumber(stats.charactersConverted || 0);
            elements.statLastUsed.textContent = formatLastUsed(stats.lastUsed);
        }
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    // Theme select
    elements.themeSelect.addEventListener('change', (e) => {
        settings.theme = e.target.value;
        applyTheme(settings.theme);
        saveSettings();
    });

    // Sound enabled toggle
    elements.soundEnabled.addEventListener('change', (e) => {
        settings.soundEnabled = e.target.checked;
        elements.soundVolume.disabled = !e.target.checked;
        saveSettings();
    });

    // Sound volume slider
    elements.soundVolume.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        elements.volumeValue.textContent = value + '%';
        settings.soundVolume = value / 100;
    });

    elements.soundVolume.addEventListener('change', () => {
        saveSettings();
    });

    // Notifications toggle
    elements.notificationsEnabled.addEventListener('change', (e) => {
        settings.notificationsEnabled = e.target.checked;
        saveSettings();
    });

    // Auto-detect toggle
    elements.autoDetect.addEventListener('change', (e) => {
        settings.autoDetectDirection = e.target.checked;
        saveSettings();
    });

    // Language pair select
    elements.languagePair.addEventListener('change', (e) => {
        settings.languagePair = e.target.value;
        saveSettings();
    });

    // Reset all button
    elements.resetAllBtn.addEventListener('click', async () => {
        const confirmed = confirm('This will reset ALL settings, custom rules, and clear history. This cannot be undone. Continue?');

        if (confirmed) {
            try {
                await sendMessage('RESET_ALL');
                showToast('All data has been reset', 'success');

                // Reload settings
                setTimeout(() => {
                    loadSettings();
                    loadStatistics();
                }, 500);
            } catch (error) {
                console.error('Error resetting data:', error);
                showToast('Failed to reset data', 'error');
            }
        }
    });

    // Back link
    elements.backLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.close();
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (settings.theme === 'system') {
            applyTheme('system');
        }
    });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    await loadSettings();
    await loadStatistics();
});
