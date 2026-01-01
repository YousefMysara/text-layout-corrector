/**
 * Text Layout Corrector Pro - Utility Functions
 * Shared helper functions for the extension
 */

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} text - The text to escape
 * @returns {string} The escaped text safe for innerHTML
 */
export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Sanitizes user input by removing potentially dangerous characters
 * @param {string} input - The input string to sanitize
 * @returns {string} The sanitized string
 */
export function sanitizeInput(input) {
    if (typeof input !== 'string') return '';
    return input.replace(/[<>]/g, '');
}

// ============================================================================
// TEXT DETECTION UTILITIES
// ============================================================================

/**
 * Detects if the given text is primarily Arabic-layout text
 * Uses Unicode ranges for Arabic characters
 * @param {string} text - The text to analyze
 * @returns {boolean} True if text appears to be Arabic-layout
 */
export function isArabicText(text) {
    if (!text || typeof text !== 'string') return false;

    // Arabic Unicode range: \u0600-\u06FF (Arabic)
    // Arabic Extended: \u0750-\u077F, \u08A0-\u08FF
    // Arabic Presentation Forms: \uFB50-\uFDFF, \uFE70-\uFEFF
    const arabicPattern = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
    const arabicMatches = text.match(arabicPattern) || [];
    const totalChars = text.replace(/\s/g, '').length;

    if (totalChars === 0) return false;

    // If more than 30% of non-whitespace characters are Arabic, consider it Arabic text
    return (arabicMatches.length / totalChars) > 0.3;
}

/**
 * Detects if the given text is primarily Hebrew
 * @param {string} text - The text to analyze
 * @returns {boolean} True if text appears to be Hebrew
 */
export function isHebrewText(text) {
    if (!text || typeof text !== 'string') return false;

    // Hebrew Unicode range: \u0590-\u05FF
    const hebrewPattern = /[\u0590-\u05FF]/g;
    const hebrewMatches = text.match(hebrewPattern) || [];
    const totalChars = text.replace(/\s/g, '').length;

    if (totalChars === 0) return false;

    return (hebrewMatches.length / totalChars) > 0.3;
}

/**
 * Detects the likely keyboard layout based on text content
 * @param {string} text - The text to analyze
 * @returns {'arabic' | 'hebrew' | 'english' | 'unknown'} The detected layout
 */
export function detectTextLayout(text) {
    if (isArabicText(text)) return 'arabic';
    if (isHebrewText(text)) return 'hebrew';

    // Check if it's primarily ASCII/English
    const asciiPattern = /[a-zA-Z]/g;
    const asciiMatches = text.match(asciiPattern) || [];
    const totalChars = text.replace(/\s/g, '').length;

    if (totalChars > 0 && (asciiMatches.length / totalChars) > 0.3) {
        return 'english';
    }

    return 'unknown';
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validates a custom rule entry
 * @param {string} from - The source character(s)
 * @param {string} to - The target character(s)
 * @param {Object} existingRules - Current rules to check for duplicates
 * @param {Object} limits - Limit configuration
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateRule(from, to, existingRules = {}, limits = {}) {
    const maxKeyLength = limits.MAX_RULE_KEY_LENGTH || 10;
    const maxValueLength = limits.MAX_RULE_VALUE_LENGTH || 10;
    const maxRules = limits.MAX_CUSTOM_RULES || 100;

    // Check for empty values
    if (!from || !from.trim()) {
        return { valid: false, error: 'Source field cannot be empty' };
    }
    if (!to || !to.trim()) {
        return { valid: false, error: 'Target field cannot be empty' };
    }

    // Trim values
    const trimmedFrom = from.trim();
    const trimmedTo = to.trim();

    // Check length limits
    if (trimmedFrom.length > maxKeyLength) {
        return { valid: false, error: `Source must be ${maxKeyLength} characters or less` };
    }
    if (trimmedTo.length > maxValueLength) {
        return { valid: false, error: `Target must be ${maxValueLength} characters or less` };
    }

    // Check for duplicate
    if (existingRules[trimmedFrom]) {
        return { valid: false, error: 'This rule already exists' };
    }

    // Check max rules limit
    if (Object.keys(existingRules).length >= maxRules) {
        return { valid: false, error: `Maximum of ${maxRules} rules allowed` };
    }

    return { valid: true };
}

// ============================================================================
// TIMING UTILITIES
// ============================================================================

/**
 * Creates a debounced version of a function
 * @param {Function} func - The function to debounce
 * @param {number} wait - The debounce delay in milliseconds
 * @returns {Function} The debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Creates a throttled version of a function
 * @param {Function} func - The function to throttle
 * @param {number} limit - The throttle limit in milliseconds
 * @returns {Function} The throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================================================
// STORAGE UTILITIES
// ============================================================================

/**
 * Safely gets data from chrome storage with fallback
 * @param {string} key - The storage key
 * @param {*} defaultValue - Default value if key doesn't exist
 * @returns {Promise<*>} The stored value or default
 */
export async function getStorageItem(key, defaultValue = null) {
    try {
        const result = await chrome.storage.sync.get(key);
        return result[key] !== undefined ? result[key] : defaultValue;
    } catch (error) {
        console.error(`Error getting storage item "${key}":`, error);
        // Fallback to local storage if sync fails
        try {
            const localResult = await chrome.storage.local.get(key);
            return localResult[key] !== undefined ? localResult[key] : defaultValue;
        } catch (localError) {
            console.error(`Error getting local storage item "${key}":`, localError);
            return defaultValue;
        }
    }
}

/**
 * Safely sets data in chrome storage
 * @param {string} key - The storage key
 * @param {*} value - The value to store
 * @returns {Promise<boolean>} True if successful
 */
export async function setStorageItem(key, value) {
    try {
        await chrome.storage.sync.set({ [key]: value });
        return true;
    } catch (error) {
        console.error(`Error setting storage item "${key}":`, error);
        // Fallback to local storage if sync fails (e.g., quota exceeded)
        try {
            await chrome.storage.local.set({ [key]: value });
            return true;
        } catch (localError) {
            console.error(`Error setting local storage item "${key}":`, localError);
            return false;
        }
    }
}

// ============================================================================
// HISTORY UTILITIES
// ============================================================================

/**
 * Adds an item to the conversion history
 * @param {string} original - The original text
 * @param {string} converted - The converted text
 * @param {string} direction - The conversion direction ('ar-en' or 'en-ar')
 * @param {number} maxItems - Maximum history items to keep
 * @returns {Promise<void>}
 */
export async function addToHistory(original, converted, direction, maxItems = 20) {
    try {
        const history = await getStorageItem('conversionHistory', []);

        // Create history entry
        const entry = {
            id: Date.now(),
            original: original.substring(0, 100), // Limit stored text length
            converted: converted.substring(0, 100),
            direction,
            timestamp: new Date().toISOString()
        };

        // Add to beginning of array
        history.unshift(entry);

        // Keep only the most recent items
        const trimmedHistory = history.slice(0, maxItems);

        await setStorageItem('conversionHistory', trimmedHistory);
    } catch (error) {
        console.error('Error adding to history:', error);
    }
}

/**
 * Clears the conversion history
 * @returns {Promise<boolean>} True if successful
 */
export async function clearHistory() {
    return await setStorageItem('conversionHistory', []);
}

// ============================================================================
// STATISTICS UTILITIES
// ============================================================================

/**
 * Increments a usage statistic
 * @param {string} statKey - The statistic key to increment
 * @param {number} amount - Amount to increment by (default 1)
 * @returns {Promise<void>}
 */
export async function incrementStat(statKey, amount = 1) {
    try {
        const stats = await getStorageItem('usageStatistics', {
            totalConversions: 0,
            charactersConverted: 0,
            lastUsed: null
        });

        if (typeof stats[statKey] === 'number') {
            stats[statKey] += amount;
        } else {
            stats[statKey] = amount;
        }

        stats.lastUsed = new Date().toISOString();

        await setStorageItem('usageStatistics', stats);
    } catch (error) {
        console.error('Error incrementing stat:', error);
    }
}

// ============================================================================
// FORMAT UTILITIES
// ============================================================================

/**
 * Formats a timestamp for display
 * @param {string} isoString - ISO timestamp string
 * @returns {string} Formatted date/time string
 */
export function formatTimestamp(isoString) {
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
    } catch (error) {
        return 'Unknown';
    }
}

/**
 * Truncates text with ellipsis
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}
