/**
 * Text Layout Corrector Pro - Popup Script
 * Handles all popup UI interactions, theme management, and user actions
 */

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const elements = {
    // Main inputs
    input1: document.getElementById('input-1'),
    input2: document.getElementById('input-2'),
    label1: document.getElementById('label-1'),
    label2: document.getElementById('label-2'),
    charCount1: document.getElementById('char-count-1'),
    charCount2: document.getElementById('char-count-2'),

    // Buttons
    swapBtn: document.getElementById('swap-btn'),
    copyBtn: document.getElementById('copy-btn'),
    clearBtn: document.getElementById('clear-btn'),
    manageRulesBtn: document.getElementById('manage-rules-btn'),
    themeToggleBtn: document.getElementById('theme-toggle-btn'),
    historyBtn: document.getElementById('history-btn'),
    settingsBtn: document.getElementById('settings-btn'),
    autoDetectBtn: document.getElementById('auto-detect-btn'),

    // Copy button internals
    copyIcon: document.getElementById('copy-icon'),
    copiedIcon: document.getElementById('copied-icon'),
    copyText: document.getElementById('copy-text'),

    // Direction indicators
    directionFrom: document.getElementById('direction-from'),
    directionTo: document.getElementById('direction-to'),

    // Loading
    loadingOverlay: document.getElementById('loading-overlay'),

    // Theme icons
    themeIconLight: document.getElementById('theme-icon-light'),
    themeIconDark: document.getElementById('theme-icon-dark'),

    // Stats
    totalConversions: document.getElementById('total-conversions'),

    // Rules Modal
    rulesModal: document.getElementById('rules-modal'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    addRuleForm: document.getElementById('add-rule-form'),
    ruleFromInput: document.getElementById('rule-from'),
    ruleToInput: document.getElementById('rule-to'),
    customRulesList: document.getElementById('custom-rules-list'),
    ruleSearch: document.getElementById('rule-search'),
    rulesCount: document.getElementById('rules-count'),
    importRulesBtn: document.getElementById('import-rules-btn'),
    exportRulesBtn: document.getElementById('export-rules-btn'),
    resetRulesBtn: document.getElementById('reset-rules-btn'),
    importFileInput: document.getElementById('import-file-input'),

    // History Modal
    historyModal: document.getElementById('history-modal'),
    closeHistoryBtn: document.getElementById('close-history-btn'),
    historyList: document.getElementById('history-list'),
    historyEmpty: document.getElementById('history-empty'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),

    // Confirm Dialog
    confirmDialog: document.getElementById('confirm-dialog'),
    confirmTitle: document.getElementById('confirm-title'),
    confirmMessage: document.getElementById('confirm-message'),
    confirmCancel: document.getElementById('confirm-cancel'),
    confirmOk: document.getElementById('confirm-ok'),

    // Toast
    toastContainer: document.getElementById('toast-container')
};

// ============================================================================
// STATE
// ============================================================================

let state = {
    isArabicToEnglish: true,
    customRules: {},
    settings: {
        theme: 'light',
        autoDetectDirection: true,
        soundEnabled: true,
        soundVolume: 1.0,
        notificationsEnabled: true
    },
    history: [],
    statistics: {
        totalConversions: 0,
        charactersConverted: 0
    },
    searchQuery: '',
    confirmCallback: null
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Debounces a function call
 * @param {Function} func - Function to debounce
 * @param {number} wait - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Formats a timestamp for display
 * @param {string} isoString - ISO timestamp
 * @returns {string} Formatted time
 */
function formatTimestamp(isoString) {
    try {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString();
    } catch {
        return 'Unknown';
    }
}

/**
 * Truncates text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================

/**
 * Shows a toast notification
 * @param {string} message - Message to display
 * @param {'success' | 'error' | 'info' | 'warning'} type - Toast type
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
        success: '✓',
        error: '✕',
        info: 'ℹ',
        warning: '⚠'
    };

    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
    `;

    elements.toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('toast-show');
    });

    // Remove after duration
    setTimeout(() => {
        toast.classList.remove('toast-show');
        toast.classList.add('toast-hide');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ============================================================================
// CONFIRM DIALOG
// ============================================================================

/**
 * Shows a confirmation dialog
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @returns {Promise<boolean>} User's choice
 */
function showConfirm(title, message) {
    return new Promise((resolve) => {
        elements.confirmTitle.textContent = title;
        elements.confirmMessage.textContent = message;
        elements.confirmDialog.style.display = 'flex';

        state.confirmCallback = resolve;
    });
}

// ============================================================================
// THEME MANAGEMENT
// ============================================================================

/**
 * Applies the theme to the document
 * @param {'light' | 'dark'} theme - Theme to apply
 */
function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);

    if (theme === 'dark') {
        elements.themeIconLight.classList.add('hidden');
        elements.themeIconDark.classList.remove('hidden');
    } else {
        elements.themeIconLight.classList.remove('hidden');
        elements.themeIconDark.classList.add('hidden');
    }

    state.settings.theme = theme;
}

/**
 * Toggles between light and dark themes
 */
function toggleTheme() {
    const newTheme = state.settings.theme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
    saveSettings();
    showToast(`${newTheme === 'dark' ? '🌙' : '☀️'} ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode`, 'info', 1500);
}

// ============================================================================
// COMMUNICATION WITH BACKGROUND
// ============================================================================

/**
 * Sends a message to the background script
 * @param {string} type - Message type
 * @param {Object} data - Additional data
 * @returns {Promise<any>} Response from background
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
 * Converts text via the background script
 */
async function convertText() {
    const text = elements.input1.value;

    if (!text) {
        elements.input2.value = '';
        updateCharCounts();
        updateButtonStates();
        return;
    }

    try {
        // Auto-detect direction if enabled
        let direction = state.isArabicToEnglish;

        if (state.settings.autoDetectDirection) {
            // Check if text contains Arabic/Persian/Hebrew characters
            const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
            const hasArabicChars = arabicRegex.test(text);
            direction = hasArabicChars; // If has Arabic, convert to English

            // Update state and UI to match detected direction
            if (direction !== state.isArabicToEnglish) {
                state.isArabicToEnglish = direction;
                updateUIForDirection();
            }
        }

        const response = await sendMessage('CONVERT_TEXT', {
            text,
            isArabicToEnglish: direction
        });

        if (response?.convertedText !== undefined) {
            elements.input2.value = response.convertedText;
            updateCharCounts();
            updateButtonStates();
        }
    } catch (error) {
        console.error('Conversion error:', error);
        showToast('Conversion failed', 'error');
    }
}

/**
 * Gets custom rules from storage
 */
async function getRules() {
    try {
        const response = await sendMessage('GET_RULES');
        if (response?.rules) {
            state.customRules = response.rules;
            renderCustomRules();
        }
    } catch (error) {
        console.error('Error getting rules:', error);
    }
}

/**
 * Saves custom rules to storage
 */
async function saveRules() {
    try {
        await sendMessage('SAVE_RULES', { rules: state.customRules });
        renderCustomRules();
        convertText(); // Re-convert with new rules
    } catch (error) {
        console.error('Error saving rules:', error);
        showToast('Failed to save rules', 'error');
    }
}

/**
 * Gets settings from storage
 */
async function getSettings() {
    try {
        const response = await sendMessage('GET_SETTINGS');
        if (response?.settings) {
            state.settings = { ...state.settings, ...response.settings };
            applyTheme(state.settings.theme);
            updateAutoDetectButton();
        }
    } catch (error) {
        console.error('Error getting settings:', error);
    }
}

/**
 * Saves settings to storage
 */
async function saveSettings() {
    try {
        await sendMessage('SAVE_SETTINGS', { settings: state.settings });
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}

/**
 * Gets conversion history
 */
async function getHistory() {
    try {
        const response = await sendMessage('GET_HISTORY');
        if (response?.history) {
            state.history = response.history;
            renderHistory();
        }
    } catch (error) {
        console.error('Error getting history:', error);
    }
}

/**
 * Gets usage statistics
 */
async function getStatistics() {
    try {
        const response = await sendMessage('GET_STATISTICS');
        if (response?.statistics) {
            state.statistics = response.statistics;
            updateStatisticsDisplay();
        }
    } catch (error) {
        console.error('Error getting statistics:', error);
    }
}

// ============================================================================
// UI UPDATE FUNCTIONS
// ============================================================================

/**
 * Updates character count displays
 */
function updateCharCounts() {
    elements.charCount1.textContent = elements.input1.value.length;
    elements.charCount2.textContent = elements.input2.value.length;
}

/**
 * Updates button disabled states
 */
function updateButtonStates() {
    const hasInput = elements.input1.value.length > 0;
    const hasOutput = elements.input2.value.length > 0;

    elements.copyBtn.disabled = !hasOutput;
    elements.clearBtn.disabled = !hasInput && !hasOutput;
}

/**
 * Updates the direction indicator badges
 */
function updateDirectionIndicator() {
    if (state.isArabicToEnglish) {
        elements.directionFrom.textContent = 'Arabic';
        elements.directionTo.textContent = 'English';
        elements.directionFrom.classList.add('active');
        elements.directionTo.classList.remove('active');
    } else {
        elements.directionFrom.textContent = 'English';
        elements.directionTo.textContent = 'Arabic';
        elements.directionFrom.classList.remove('active');
        elements.directionTo.classList.add('active');
    }
}

/**
 * Updates UI for the current conversion direction
 */
function updateUIForDirection() {
    if (state.isArabicToEnglish) {
        elements.label1.textContent = 'Arabic-Layout Text';
        elements.label2.textContent = 'Corrected English Text';
        elements.input1.placeholder = 'اكتب هنا...';
        elements.input2.placeholder = 'Your text appears here...';
        elements.input1.dir = 'rtl';
        elements.input2.dir = 'ltr';
    } else {
        elements.label1.textContent = 'English-Layout Text';
        elements.label2.textContent = 'Corrected Arabic Text';
        elements.input1.placeholder = 'Type here...';
        elements.input2.placeholder = 'النص الخاص بك يظهر هنا...';
        elements.input1.dir = 'ltr';
        elements.input2.dir = 'rtl';
    }
    updateDirectionIndicator();
}

/**
 * Updates the auto-detect button state
 */
function updateAutoDetectButton() {
    if (state.settings.autoDetectDirection) {
        elements.autoDetectBtn.classList.add('active');
        elements.autoDetectBtn.title = 'Auto-detect is enabled';
    } else {
        elements.autoDetectBtn.classList.remove('active');
        elements.autoDetectBtn.title = 'Auto-detect is disabled';
    }
}

/**
 * Updates statistics display
 */
function updateStatisticsDisplay() {
    elements.totalConversions.textContent = state.statistics.totalConversions.toLocaleString();
}

/**
 * Renders custom rules list
 */
function renderCustomRules() {
    const rules = state.customRules;
    const searchQuery = state.searchQuery.toLowerCase();

    // Filter rules based on search
    const filteredRules = Object.entries(rules).filter(([key, value]) => {
        if (!searchQuery) return true;
        return key.toLowerCase().includes(searchQuery) ||
            value.toLowerCase().includes(searchQuery);
    });

    // Update count
    elements.rulesCount.textContent = `(${Object.keys(rules).length})`;

    // Render rules
    if (filteredRules.length === 0) {
        if (searchQuery) {
            elements.customRulesList.innerHTML = `
                <div class="empty-state small">
                    <p>No rules match "${escapeHtml(searchQuery)}"</p>
                </div>
            `;
        } else {
            elements.customRulesList.innerHTML = `
                <div class="empty-state small">
                    <p>No custom rules yet</p>
                    <span>Add rules above to override default mappings</span>
                </div>
            `;
        }
        return;
    }

    elements.customRulesList.innerHTML = filteredRules.map(([key, value]) => `
        <div class="rule-item" data-key="${escapeHtml(key)}">
            <div class="rule-content">
                <span class="rule-from">${escapeHtml(key)}</span>
                <span class="rule-arrow">→</span>
                <span class="rule-to">${escapeHtml(value)}</span>
            </div>
            <div class="rule-actions">
                <button class="edit-rule-btn icon-btn-small" data-key="${escapeHtml(key)}" title="Edit Rule">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="delete-rule-btn icon-btn-small danger" data-key="${escapeHtml(key)}" title="Delete Rule">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

/**
 * Renders history list
 */
function renderHistory() {
    if (state.history.length === 0) {
        elements.historyList.classList.add('hidden');
        elements.historyEmpty.classList.remove('hidden');
        return;
    }

    elements.historyList.classList.remove('hidden');
    elements.historyEmpty.classList.add('hidden');

    elements.historyList.innerHTML = state.history.map((entry) => `
        <div class="history-item" data-id="${entry.id}">
            <div class="history-content">
                <div class="history-text">
                    <span class="history-original">${escapeHtml(truncateText(entry.original, 40))}</span>
                    <span class="history-arrow">→</span>
                    <span class="history-converted">${escapeHtml(truncateText(entry.converted, 40))}</span>
                </div>
                <div class="history-meta">
                    <span class="history-direction">${entry.direction === 'ar-en' ? 'AR → EN' : 'EN → AR'}</span>
                    <span class="history-time">${formatTimestamp(entry.timestamp)}</span>
                </div>
            </div>
            <button class="history-use-btn icon-btn-small" data-original="${escapeHtml(entry.original)}" data-direction="${entry.direction}" title="Use this conversion">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="9 10 4 15 9 20"></polyline>
                    <path d="M20 4v7a4 4 0 0 1-4 4H4"></path>
                </svg>
            </button>
        </div>
    `).join('');
}

// ============================================================================
// COPY FUNCTIONALITY
// ============================================================================

/**
 * Copies the output text to clipboard with feedback
 */
async function copyOutput() {
    const text = elements.input2.value;
    const original = elements.input1.value;
    if (!text) return;

    try {
        await navigator.clipboard.writeText(text);

        // Add to history and update statistics
        if (original && text) {
            try {
                await sendMessage('ADD_TO_HISTORY', {
                    original: original,
                    converted: text,
                    isArabicToEnglish: state.isArabicToEnglish
                });
                // Refresh statistics display
                await getStatistics();
            } catch (e) {
                console.log('History update skipped:', e);
            }
        }

        // Show feedback
        elements.copyIcon.classList.add('hidden');
        elements.copiedIcon.classList.remove('hidden');
        elements.copyText.textContent = 'Copied!';
        elements.copyBtn.classList.add('copied');

        showToast('Copied to clipboard!', 'success', 2000);

        // Reset after delay
        setTimeout(() => {
            elements.copyIcon.classList.remove('hidden');
            elements.copiedIcon.classList.add('hidden');
            elements.copyText.textContent = 'Copy';
            elements.copyBtn.classList.remove('copied');
        }, 2000);
    } catch (error) {
        console.error('Copy failed:', error);
        showToast('Failed to copy', 'error');
    }
}

// ============================================================================
// IMPORT/EXPORT FUNCTIONALITY
// ============================================================================

/**
 * Exports rules to a JSON file
 */
async function exportRules() {
    try {
        const response = await sendMessage('EXPORT_RULES');
        if (response?.success) {
            const blob = new Blob([response.data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'layout-corrector-rules.json';
            a.click();
            URL.revokeObjectURL(url);
            showToast('Rules exported successfully!', 'success');
        }
    } catch (error) {
        console.error('Export failed:', error);
        showToast('Export failed', 'error');
    }
}

/**
 * Imports rules from a JSON file
 */
async function importRules(file) {
    try {
        const text = await file.text();
        const response = await sendMessage('IMPORT_RULES', { data: text });

        if (response?.success) {
            await getRules();
            showToast('Rules imported successfully!', 'success');
        } else {
            showToast(response?.error || 'Import failed', 'error');
        }
    } catch (error) {
        console.error('Import failed:', error);
        showToast('Invalid file format', 'error');
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
    // Safety check - ensure all critical elements exist
    const criticalElements = [
        'input1', 'input2', 'swapBtn', 'copyBtn', 'clearBtn',
        'manageRulesBtn', 'themeToggleBtn', 'historyBtn', 'settingsBtn'
    ];

    for (const elementName of criticalElements) {
        if (!elements[elementName]) {
            console.error(`Critical element missing: ${elementName}`);
            return;
        }
    }

    // Text input with debouncing
    const debouncedConvert = debounce(convertText, 150);
    elements.input1.addEventListener('input', () => {
        debouncedConvert();
        updateCharCounts();
        updateButtonStates();
    });

    // Swap direction
    elements.swapBtn.addEventListener('click', () => {
        state.isArabicToEnglish = !state.isArabicToEnglish;
        const tempVal = elements.input1.value;
        elements.input1.value = elements.input2.value;
        elements.input2.value = '';
        updateUIForDirection();
        convertText();
    });

    // Copy button
    elements.copyBtn.addEventListener('click', copyOutput);

    // Clear button
    elements.clearBtn.addEventListener('click', async () => {
        if (elements.input1.value || elements.input2.value) {
            const confirmed = await showConfirm('Clear All', 'Are you sure you want to clear all text?');
            if (confirmed) {
                elements.input1.value = '';
                elements.input2.value = '';
                elements.input1.focus();
                updateCharCounts();
                updateButtonStates();
                showToast('Cleared', 'info', 1500);
            }
        }
    });

    // Theme toggle
    elements.themeToggleBtn.addEventListener('click', toggleTheme);

    // Auto-detect toggle
    elements.autoDetectBtn.addEventListener('click', () => {
        state.settings.autoDetectDirection = !state.settings.autoDetectDirection;
        updateAutoDetectButton();
        saveSettings();
        showToast(
            `Auto-detect ${state.settings.autoDetectDirection ? 'enabled' : 'disabled'}`,
            'info',
            1500
        );
    });

    // History button
    elements.historyBtn.addEventListener('click', async () => {
        await getHistory();
        elements.historyModal.style.display = 'flex';
    });

    // Close history modal
    elements.closeHistoryBtn.addEventListener('click', () => {
        elements.historyModal.style.display = 'none';
    });

    // Clear history
    elements.clearHistoryBtn.addEventListener('click', async () => {
        const confirmed = await showConfirm('Clear History', 'Are you sure you want to clear all history?');
        if (confirmed) {
            await sendMessage('CLEAR_HISTORY');
            state.history = [];
            renderHistory();
            showToast('History cleared', 'success');
        }
    });

    // History item click (use conversion)
    elements.historyList.addEventListener('click', (e) => {
        const useBtn = e.target.closest('.history-use-btn');
        if (useBtn) {
            const original = useBtn.dataset.original;
            const direction = useBtn.dataset.direction;

            state.isArabicToEnglish = direction === 'ar-en';
            updateUIForDirection();
            elements.input1.value = original;
            convertText();
            elements.historyModal.style.display = 'none';
            showToast('Loaded from history', 'info', 1500);
        }
    });

    // Settings button (open options page)
    elements.settingsBtn.addEventListener('click', () => {
        // Open settings page in new tab
        chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    });

    // Rules modal
    elements.manageRulesBtn.addEventListener('click', async () => {
        await getRules();
        elements.rulesModal.style.display = 'flex';
    });

    elements.closeModalBtn.addEventListener('click', () => {
        elements.rulesModal.style.display = 'none';
        state.searchQuery = '';
        elements.ruleSearch.value = '';
    });

    // Add rule form
    elements.addRuleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const from = elements.ruleFromInput.value.trim();
        const to = elements.ruleToInput.value.trim();

        if (!from || !to) {
            showToast('Both fields are required', 'error');
            return;
        }

        if (state.customRules[from]) {
            showToast('This rule already exists', 'warning');
            return;
        }

        state.customRules[from] = to;
        saveRules();
        elements.ruleFromInput.value = '';
        elements.ruleToInput.value = '';
        elements.ruleFromInput.focus();
        showToast('Rule added successfully!', 'success');
    });

    // Rule search
    elements.ruleSearch.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderCustomRules();
    });

    // Rule actions (edit/delete)
    elements.customRulesList.addEventListener('click', async (e) => {
        const deleteBtn = e.target.closest('.delete-rule-btn');
        const editBtn = e.target.closest('.edit-rule-btn');

        if (deleteBtn) {
            const key = deleteBtn.dataset.key;
            const confirmed = await showConfirm('Delete Rule', `Delete the rule "${key}"?`);
            if (confirmed) {
                delete state.customRules[key];
                saveRules();
                showToast('Rule deleted', 'success');
            }
        }

        if (editBtn) {
            const key = editBtn.dataset.key;
            const currentValue = state.customRules[key];
            elements.ruleFromInput.value = key;
            elements.ruleToInput.value = currentValue;
            delete state.customRules[key];
            elements.ruleFromInput.focus();
            showToast('Edit the rule and submit', 'info');
        }
    });

    // Import/Export/Reset
    elements.importRulesBtn.addEventListener('click', () => {
        elements.importFileInput.click();
    });

    elements.importFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await importRules(file);
            e.target.value = '';
        }
    });

    elements.exportRulesBtn.addEventListener('click', exportRules);

    elements.resetRulesBtn.addEventListener('click', async () => {
        const confirmed = await showConfirm('Reset Rules', 'Reset all rules to defaults? This cannot be undone.');
        if (confirmed) {
            await sendMessage('RESET_ALL');
            await getRules();
            showToast('Rules reset to defaults', 'success');
        }
    });

    // Confirm dialog
    elements.confirmCancel.addEventListener('click', () => {
        elements.confirmDialog.style.display = 'none';
        if (state.confirmCallback) {
            state.confirmCallback(false);
            state.confirmCallback = null;
        }
    });

    elements.confirmOk.addEventListener('click', () => {
        elements.confirmDialog.style.display = 'none';
        if (state.confirmCallback) {
            state.confirmCallback(true);
            state.confirmCallback = null;
        }
    });

    // Close modals on backdrop click
    [elements.rulesModal, elements.historyModal, elements.confirmDialog].forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                if (modal === elements.confirmDialog && state.confirmCallback) {
                    state.confirmCallback(false);
                    state.confirmCallback = null;
                }
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape to close modals
        if (e.key === 'Escape') {
            if (elements.confirmDialog.style.display === 'flex') {
                elements.confirmDialog.style.display = 'none';
                if (state.confirmCallback) {
                    state.confirmCallback(false);
                    state.confirmCallback = null;
                }
            } else if (elements.rulesModal.style.display === 'flex') {
                elements.rulesModal.style.display = 'none';
            } else if (elements.historyModal.style.display === 'flex') {
                elements.historyModal.style.display = 'none';
            }
        }

        // Ctrl+Enter to copy
        if (e.ctrlKey && e.key === 'Enter' && elements.input2.value) {
            copyOutput();
        }
    });
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initializes the popup
 */
async function initializeApp() {
    try {
        // Get settings first (for theme)
        await getSettings();

        // Get rules
        await getRules();

        // Get statistics
        await getStatistics();

        // Update UI
        updateUIForDirection();
        updateCharCounts();
        updateButtonStates();

        // Check for selected text passed from context menu
        chrome.storage.local.get('selectedText', (result) => {
            if (result.selectedText) {
                elements.input1.value = result.selectedText;
                convertText();
                chrome.storage.local.remove('selectedText');
            }
        });

        // Focus input
        elements.input1.focus();

    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Failed to initialize', 'error');
    }
}

// Start the app
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    initializeApp();
});