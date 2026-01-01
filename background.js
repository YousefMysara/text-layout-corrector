/**
 * Text Layout Corrector Pro - Background Service Worker
 * Handles context menu actions, text conversion, and extension commands
 */

// ============================================================================
// CONSTANTS (inline for service worker - can't use ES modules)
// ============================================================================

/**
 * Storage keys for chrome.storage operations
 * @constant {Object}
 */
const STORAGE_KEYS = {
    CUSTOM_RULES: 'customLayoutRules',
    SETTINGS: 'extensionSettings',
    HISTORY: 'conversionHistory',
    STATISTICS: 'usageStatistics',
    THEME: 'themePreference'
};

/**
 * Default custom rules for special character mappings
 * @constant {Object}
 */
const DEFAULT_RULES = {
    '\u0644\u0622': 'B',
    '\u0644\u0627': 'b',
    '\u0629': 'm',
    '\u0648': ',',
    '\u0644\u0625': 'T',
    '\u0644\u0623': 'G'
};

/**
 * Default settings for the extension
 * @constant {Object}
 */
const DEFAULT_SETTINGS = {
    soundEnabled: true,
    soundVolume: 1.0,
    notificationsEnabled: true,
    theme: 'light',
    languagePair: 'ar-en',
    autoDetectDirection: true,
    maxHistoryItems: 20
};

/**
 * Base mapping from Arabic keyboard layout to English
 * @constant {Object}
 */
const BASE_MAP_AR_TO_EN = {
    // Row 1 - Number row
    '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5',
    '٦': '6', '٧': '7', '٨': '8', '٩': '9', '٠': '0',

    // Row 2 - QWERTY row (lowercase)
    'ض': 'q', 'ص': 'w', 'ث': 'e', 'ق': 'r', 'ف': 't',
    'غ': 'y', 'ع': 'u', 'ه': 'i', 'خ': 'o', 'ح': 'p',
    'ج': '[', 'د': ']',

    // Row 3 - ASDF row (lowercase)
    'ش': 'a', 'س': 's', 'ي': 'd', 'ب': 'f', 'ل': 'g',
    'ا': 'h', 'ت': 'j', 'ن': 'k', 'م': 'l', 'ك': ';',
    'ط': "'",

    // Row 4 - ZXCV row (lowercase)
    'ئ': 'z', 'ء': 'x', 'ؤ': 'c', 'ر': 'v', 'ى': 'n',
    'ز': '.', 'ظ': '/', 'ذ': '`',

    // Row 2 - QWERTY row (Shift - uppercase/diacritics)
    'َ': 'Q', 'ً': 'W', 'ُ': 'E', 'ٌ': 'R', 'إ': 'Y',
    '\u2019': 'U', '÷': 'I', '×': 'O', '؛': 'P',

    // Row 3 - ASDF row (Shift)
    'ِ': 'A', 'ٍ': 'S', ']': 'D', '[': 'F', 'أ': 'H',
    'ـ': 'J', '،': 'K', '/': 'L', ':': ':', '"': '"',

    // Row 4 - ZXCV row (Shift)
    '~': 'Z', 'ْ': 'X', '}': 'C', '{': 'V', 'آ': 'N',
    '<': '<', '>': '>', '؟': '?'
};

/**
 * Persian/Farsi specific mappings
 * @constant {Object}
 */
const BASE_MAP_FA_EXTRA = {
    'پ': 'p', 'چ': 'c', 'ژ': 'j', 'گ': 'g', 'ک': 'k',
    '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5',
    '۶': '6', '۷': '7', '۸': '8', '۹': '9', '۰': '0'
};

/**
 * Hebrew to English keyboard mapping
 * @constant {Object}
 */
const BASE_MAP_HE_TO_EN = {
    'ש': 'a', 'נ': 'b', 'ב': 'c', 'ג': 'd', 'ק': 'e',
    'כ': 'f', 'ע': 'g', 'י': 'h', 'ן': 'i', 'ח': 'j',
    'ל': 'k', 'ך': 'l', 'צ': 'm', 'מ': 'n', 'ם': 'o',
    'פ': 'p', '/': 'q', 'ר': 'r', 'ד': 's', 'א': 't',
    'ו': 'u', 'ה': 'v', "'": 'w', 'ס': 'x', 'ט': 'y',
    'ז': 'z', 'ף': ';', 'ת': ','
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Gets the appropriate character mapping based on language pair
 * @param {string} languagePair - The language pair code ('ar-en', 'fa-en', 'he-en')
 * @returns {Object} The character mapping object
 */
function getBaseMap(languagePair = 'ar-en') {
    switch (languagePair) {
        case 'fa-en':
            return { ...BASE_MAP_AR_TO_EN, ...BASE_MAP_FA_EXTRA };
        case 'he-en':
            return BASE_MAP_HE_TO_EN;
        case 'ar-en':
        default:
            return BASE_MAP_AR_TO_EN;
    }
}

/**
 * Performs text conversion between keyboard layouts
 * @param {string} text - The input text to convert
 * @param {Object} customRules - User-defined conversion rules
 * @param {boolean} isSourceToTarget - Direction of conversion (true = Arabic→English)
 * @param {string} languagePair - The language pair to use
 * @returns {string} The converted text
 */
function performConversion(text, customRules, isSourceToTarget, languagePair = 'ar-en') {
    // Get base map for the language pair
    const baseMap = getBaseMap(languagePair);

    // Merge base map with custom rules (custom rules take precedence)
    const sourceToTargetMap = { ...baseMap, ...customRules };

    // Create reverse mapping for target→source conversion
    const targetToSourceMap = Object.fromEntries(
        Object.entries(sourceToTargetMap).map(([key, value]) => [value, key])
    );

    // Select the appropriate map based on direction
    const map = isSourceToTarget ? sourceToTargetMap : targetToSourceMap;
    const rulesToCheck = isSourceToTarget ? customRules : {};

    let outputText = '';
    let i = 0;

    while (i < text.length) {
        let foundRule = false;

        // Check custom rules first (they can be multi-character)
        if (isSourceToTarget && Object.keys(rulesToCheck).length > 0) {
            // Sort by length (longest first) to match longer sequences first
            const sortedCustomKeys = Object.keys(rulesToCheck)
                .sort((a, b) => b.length - a.length);

            for (const key of sortedCustomKeys) {
                if (text.substring(i, i + key.length) === key) {
                    outputText += map[key];
                    i += key.length;
                    foundRule = true;
                    break;
                }
            }
        }

        if (foundRule) continue;

        // Single character mapping
        const char = text[i];
        outputText += map[char] || char;
        i++;
    }

    return outputText;
}

/**
 * Plays a notification sound using the offscreen document
 * @param {string} source - Path to the audio file
 * @param {number} volume - Volume level (0.0 to 1.0)
 * @returns {Promise<void>}
 */
async function playSound(source = 'notification.mp3', volume = 1.0) {
    try {
        const existingContexts = await chrome.runtime.getContexts({
            contextTypes: ['OFFSCREEN_DOCUMENT']
        });

        if (existingContexts.length === 0) {
            await chrome.offscreen.createDocument({
                url: 'offscreen.html',
                reasons: ['AUDIO_PLAYBACK'],
                justification: 'Playing a notification sound',
            });
        }

        chrome.runtime.sendMessage({
            type: 'play-sound',
            target: 'offscreen',
            source,
            volume
        });
    } catch (error) {
        console.error('Error playing sound:', error);
    }
}

/**
 * Shows a badge notification on the extension icon
 * @param {string} text - The badge text
 * @param {string} color - The badge background color
 * @param {number} duration - How long to show the badge (ms)
 */
function showBadge(text, color = '#4CAF50', duration = 3000) {
    chrome.action.setBadgeText({ text });
    chrome.action.setBadgeBackgroundColor({ color });

    setTimeout(() => {
        chrome.action.setBadgeText({ text: '' });
    }, duration);
}

/**
 * Shows a system notification
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
function showNotification(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon128.png',
        title,
        message,
        priority: 2
    });
}

/**
 * Adds a conversion to the history
 * @param {string} original - Original text
 * @param {string} converted - Converted text
 * @param {boolean} isArToEn - Direction of conversion
 * @returns {Promise<void>}
 */
async function addToHistory(original, converted, isArToEn) {
    try {
        const result = await chrome.storage.sync.get(STORAGE_KEYS.HISTORY);
        const history = result[STORAGE_KEYS.HISTORY] || [];

        const entry = {
            id: Date.now(),
            original: original.substring(0, 100),
            converted: converted.substring(0, 100),
            direction: isArToEn ? 'ar-en' : 'en-ar',
            timestamp: new Date().toISOString()
        };

        history.unshift(entry);

        // Keep only last 20 items
        const trimmedHistory = history.slice(0, 20);

        await chrome.storage.sync.set({
            [STORAGE_KEYS.HISTORY]: trimmedHistory
        });
    } catch (error) {
        console.error('Error adding to history:', error);
    }
}

/**
 * Increments usage statistics
 * @param {number} charCount - Number of characters converted
 * @returns {Promise<void>}
 */
async function updateStatistics(charCount) {
    try {
        const result = await chrome.storage.sync.get(STORAGE_KEYS.STATISTICS);
        const stats = result[STORAGE_KEYS.STATISTICS] || {
            totalConversions: 0,
            charactersConverted: 0,
            lastUsed: null
        };

        stats.totalConversions += 1;
        stats.charactersConverted += charCount;
        stats.lastUsed = new Date().toISOString();

        await chrome.storage.sync.set({
            [STORAGE_KEYS.STATISTICS]: stats
        });
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

/**
 * Gets extension settings with defaults
 * @returns {Promise<Object>} The settings object
 */
async function getSettings() {
    try {
        const result = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
        return { ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.SETTINGS] };
    } catch (error) {
        console.error('Error getting settings:', error);
        return DEFAULT_SETTINGS;
    }
}

/**
 * Gets custom rules with defaults
 * @returns {Promise<Object>} The custom rules object
 */
async function getCustomRules() {
    try {
        const result = await chrome.storage.sync.get(STORAGE_KEYS.CUSTOM_RULES);
        return result[STORAGE_KEYS.CUSTOM_RULES] || DEFAULT_RULES;
    } catch (error) {
        console.error('Error getting custom rules:', error);
        return DEFAULT_RULES;
    }
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Extension installation/update handler
 * Sets up context menu and initializes storage with defaults
 */
chrome.runtime.onInstalled.addListener(async () => {
    // Create context menu for text selection
    chrome.contextMenus.create({
        id: 'correctAndCopy',
        title: 'Correct It',
        contexts: ['selection']
    });

    // Initialize default settings if not exists
    const settings = await chrome.storage.sync.get(STORAGE_KEYS.SETTINGS);
    if (!settings[STORAGE_KEYS.SETTINGS]) {
        await chrome.storage.sync.set({
            [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS
        });
    }

    // Initialize default rules if not exists
    const rules = await chrome.storage.sync.get(STORAGE_KEYS.CUSTOM_RULES);
    if (!rules[STORAGE_KEYS.CUSTOM_RULES]) {
        await chrome.storage.sync.set({
            [STORAGE_KEYS.CUSTOM_RULES]: DEFAULT_RULES
        });
    }

    // Initialize history if not exists
    const history = await chrome.storage.sync.get(STORAGE_KEYS.HISTORY);
    if (!history[STORAGE_KEYS.HISTORY]) {
        await chrome.storage.sync.set({
            [STORAGE_KEYS.HISTORY]: []
        });
    }

    // Initialize statistics if not exists
    const stats = await chrome.storage.sync.get(STORAGE_KEYS.STATISTICS);
    if (!stats[STORAGE_KEYS.STATISTICS]) {
        await chrome.storage.sync.set({
            [STORAGE_KEYS.STATISTICS]: {
                totalConversions: 0,
                charactersConverted: 0,
                lastUsed: null
            }
        });
    }

    console.log('Text Layout Corrector Pro installed/updated');
});

/**
 * Context menu click handler
 * Converts selected text and copies to clipboard
 */
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== 'correctAndCopy' || !info.selectionText) {
        return;
    }

    try {
        const customRules = await getCustomRules();
        const settings = await getSettings();

        // Auto-detect text direction based on selected text
        // Check if text contains Arabic/Persian/Hebrew characters
        const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
        const hasArabicChars = arabicRegex.test(info.selectionText);

        // If text has Arabic characters, convert to English; otherwise convert to Arabic
        const isArabicToEnglish = hasArabicChars;

        // Perform the conversion
        const correctedText = performConversion(
            info.selectionText,
            customRules,
            isArabicToEnglish,
            settings.languagePair
        );

        // Copy to clipboard via content script
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: (text) => navigator.clipboard.writeText(text),
            args: [correctedText]
        });

        // Update history and statistics with correct direction
        await addToHistory(info.selectionText, correctedText, isArabicToEnglish);
        await updateStatistics(info.selectionText.length);

        // Show feedback based on settings
        showBadge('✓', '#4CAF50', 3000);

        if (settings.notificationsEnabled) {
            showNotification(
                'Layout Corrector Pro',
                'Corrected text copied! Press Ctrl+V to paste.'
            );
        }

        if (settings.soundEnabled) {
            await playSound('notification.mp3', settings.soundVolume);
        }

    } catch (error) {
        console.error('Error in context menu handler:', error);
        showBadge('✕', '#ef4444', 3000);
    }
});



/**
 * Message listener for popup and other extension pages
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        try {
            switch (request.type) {
                case 'CONVERT_TEXT': {
                    const customRules = await getCustomRules();
                    const settings = await getSettings();

                    const convertedText = performConversion(
                        request.text,
                        customRules,
                        request.isArabicToEnglish,
                        settings.languagePair
                    );

                    // Update statistics for popup conversions
                    if (request.text.length > 0) {
                        await updateStatistics(request.text.length);
                    }

                    sendResponse({ convertedText });
                    break;
                }

                case 'ADD_TO_HISTORY': {
                    if (request.original && request.converted) {
                        await addToHistory(request.original, request.converted, request.isArabicToEnglish);
                        await updateStatistics(request.original.length);
                    }
                    sendResponse({ success: true });
                    break;
                }

                case 'GET_RULES': {
                    const rules = await getCustomRules();
                    sendResponse({ rules });
                    break;
                }

                case 'SAVE_RULES': {
                    await chrome.storage.sync.set({
                        [STORAGE_KEYS.CUSTOM_RULES]: request.rules
                    });
                    sendResponse({ success: true });
                    break;
                }

                case 'GET_SETTINGS': {
                    const settings = await getSettings();
                    sendResponse({ settings });
                    break;
                }

                case 'SAVE_SETTINGS': {
                    await chrome.storage.sync.set({
                        [STORAGE_KEYS.SETTINGS]: request.settings
                    });
                    sendResponse({ success: true });
                    break;
                }

                case 'GET_HISTORY': {
                    const result = await chrome.storage.sync.get(STORAGE_KEYS.HISTORY);
                    sendResponse({ history: result[STORAGE_KEYS.HISTORY] || [] });
                    break;
                }

                case 'CLEAR_HISTORY': {
                    await chrome.storage.sync.set({ [STORAGE_KEYS.HISTORY]: [] });
                    sendResponse({ success: true });
                    break;
                }

                case 'GET_STATISTICS': {
                    const result = await chrome.storage.sync.get(STORAGE_KEYS.STATISTICS);
                    sendResponse({
                        statistics: result[STORAGE_KEYS.STATISTICS] || {
                            totalConversions: 0,
                            charactersConverted: 0,
                            lastUsed: null
                        }
                    });
                    break;
                }

                case 'EXPORT_RULES': {
                    const rules = await getCustomRules();
                    sendResponse({
                        data: JSON.stringify(rules, null, 2),
                        success: true
                    });
                    break;
                }

                case 'IMPORT_RULES': {
                    try {
                        const importedRules = JSON.parse(request.data);
                        if (typeof importedRules === 'object' && importedRules !== null) {
                            await chrome.storage.sync.set({
                                [STORAGE_KEYS.CUSTOM_RULES]: importedRules
                            });
                            sendResponse({ success: true });
                        } else {
                            sendResponse({ success: false, error: 'Invalid format' });
                        }
                    } catch (error) {
                        sendResponse({ success: false, error: 'Invalid JSON' });
                    }
                    break;
                }

                case 'RESET_ALL': {
                    await chrome.storage.sync.set({
                        [STORAGE_KEYS.CUSTOM_RULES]: DEFAULT_RULES,
                        [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS,
                        [STORAGE_KEYS.HISTORY]: [],
                        [STORAGE_KEYS.STATISTICS]: {
                            totalConversions: 0,
                            charactersConverted: 0,
                            lastUsed: null
                        }
                    });
                    sendResponse({ success: true });
                    break;
                }

                default:
                    sendResponse({ error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ error: error.message });
        }
    })();

    // Return true to indicate async response
    return true;
});