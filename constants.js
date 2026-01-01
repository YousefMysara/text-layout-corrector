/**
 * Text Layout Corrector Pro - Constants
 * Shared constants and configuration for the extension
 */

// ============================================================================
// STORAGE KEYS
// ============================================================================

/**
 * Keys used for chrome.storage operations
 * @constant {Object}
 */
export const STORAGE_KEYS = {
    CUSTOM_RULES: 'customLayoutRules',
    SETTINGS: 'extensionSettings',
    HISTORY: 'conversionHistory',
    STATISTICS: 'usageStatistics',
    THEME: 'themePreference'
};

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

/**
 * Default custom rules for special character mappings
 * These rules handle multi-character combinations and special cases
 * @constant {Object}
 */
export const DEFAULT_RULES = {
    'لآ': 'B',
    'لا': 'b',
    'ة': 'm',
    ''': 'M',
    'و': ',',
    'لإ': 'T',
    'لأ': 'G'
};

/**
 * Default settings for the extension
 * @constant {Object}
 */
export const DEFAULT_SETTINGS = {
    soundEnabled: true,
    soundVolume: 1.0,
    notificationsEnabled: true,
    theme: 'light', // 'light', 'dark', 'system'
    languagePair: 'ar-en', // 'ar-en', 'fa-en', 'he-en'
    autoDetectDirection: true,
    maxHistoryItems: 20
};

// ============================================================================
// BASE CHARACTER MAPPINGS
// ============================================================================

/**
 * Base mapping from Arabic keyboard layout to English
 * Maps Arabic characters to their English keyboard equivalents
 * @constant {Object}
 */
export const BASE_MAP_AR_TO_EN = {
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
    ''': 'U', '÷': 'I', '×': 'O', '؛': 'P',

    // Row 3 - ASDF row (Shift)
    'ِ': 'A', 'ٍ': 'S', ']': 'D', '[': 'F', 'أ': 'H',
    'ـ': 'J', '،': 'K', '/': 'L', ':': ':', '"': '"',

    // Row 4 - ZXCV row (Shift)
    '~': 'Z', 'ْ': 'X', '}': 'C', '{': 'V', 'آ': 'N',
    '<': '<', '>': '>', '؟': '?'
};

/**
 * Persian/Farsi to English keyboard mapping
 * @constant {Object}
 */
export const BASE_MAP_FA_TO_EN = {
    // Persian-specific characters extending Arabic
    'پ': 'p', 'چ': 'c', 'ژ': 'j', 'گ': 'g', 'ک': 'k',
    '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5',
    '۶': '6', '۷': '7', '۸': '8', '۹': '9', '۰': '0',
    // Extend with Arabic base map
    ...BASE_MAP_AR_TO_EN
};

/**
 * Hebrew to English keyboard mapping
 * @constant {Object}
 */
export const BASE_MAP_HE_TO_EN = {
    // Hebrew characters
    'ש': 'a', 'נ': 'b', 'ב': 'c', 'ג': 'd', 'ק': 'e',
    'כ': 'f', 'ע': 'g', 'י': 'h', 'ן': 'i', 'ח': 'j',
    'ל': 'k', 'ך': 'l', 'צ': 'm', 'מ': 'n', 'ם': 'o',
    'פ': 'p', '/': 'q', 'ר': 'r', 'ד': 's', 'א': 't',
    'ו': 'u', 'ה': 'v', "'": 'w', 'ס': 'x', 'ט': 'y',
    'ז': 'z', 'ף': ';', 'ת': ','
};

// ============================================================================
// UI CONFIGURATION
// ============================================================================

/**
 * Theme color configurations
 * @constant {Object}
 */
export const THEMES = {
    light: {
        name: 'Light',
        bgColor: '#f4f7fc',
        cardBg: '#ffffff',
        textPrimary: '#111827',
        textSecondary: '#6b7280',
        borderColor: '#d1d5db',
        accentColor: '#4f46e5',
        accentHover: '#4338ca',
        dangerColor: '#ef4444',
        dangerHover: '#dc2626'
    },
    dark: {
        name: 'Dark',
        bgColor: '#0f172a',
        cardBg: '#1e293b',
        textPrimary: '#f1f5f9',
        textSecondary: '#94a3b8',
        borderColor: '#334155',
        accentColor: '#6366f1',
        accentHover: '#818cf8',
        dangerColor: '#f87171',
        dangerHover: '#ef4444'
    }
};

/**
 * Toast notification types and their colors
 * @constant {Object}
 */
export const TOAST_TYPES = {
    success: {
        icon: '✓',
        bgColor: '#10b981',
        textColor: '#ffffff'
    },
    error: {
        icon: '✕',
        bgColor: '#ef4444',
        textColor: '#ffffff'
    },
    info: {
        icon: 'ℹ',
        bgColor: '#3b82f6',
        textColor: '#ffffff'
    },
    warning: {
        icon: '⚠',
        bgColor: '#f59e0b',
        textColor: '#ffffff'
    }
};

/**
 * Maximum limits for various features
 * @constant {Object}
 */
export const LIMITS = {
    MAX_HISTORY_ITEMS: 20,
    MAX_RULE_KEY_LENGTH: 10,
    MAX_RULE_VALUE_LENGTH: 10,
    MAX_CUSTOM_RULES: 100,
    TOAST_DURATION_MS: 3000,
    BADGE_DURATION_MS: 3000,
    DEBOUNCE_DELAY_MS: 150
};

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

/**
 * Default keyboard shortcut commands
 * @constant {Object}
 */
export const COMMANDS = {
    CONVERT_AND_COPY: 'convert-and-copy',
    TOGGLE_DIRECTION: 'toggle-direction',
    OPEN_POPUP: 'open-popup'
};
