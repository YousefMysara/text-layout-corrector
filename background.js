// --- Base Conversion Map ---
const baseMapArToEn = {
    'ض': 'q', 'ص': 'w', 'ث': 'e', 'ق': 'r', 'ف': 't', 'غ': 'y', 'ع': 'u', 'ه': 'i', 'خ': 'o', 'ح': 'p', 'ج': '[', 'د': ']',
    'ش': 'a', 'س': 's', 'ي': 'd', 'ب': 'f', 'ل': 'g', 'ا': 'h', 'ت': 'j', 'ن': 'k', 'م': 'l', 'ك': ';', 'ط': "'",
    'ئ': 'z', 'ء': 'x', 'ؤ': 'c', 'ر': 'v', 'ى': 'n', 'ز': '.', 'ظ': '/', 'ذ': '`',
    'َ': 'Q', 'ً': 'W', 'ُ': 'E', 'ٌ': 'R', 'إ': 'Y', '‘': 'U', '÷': 'I', '×': 'O', '؛': 'P',
    'ِ': 'A', 'ٍ': 'S', ']': 'D', '[': 'F', 'أ': 'H', 'ـ': 'J', '،': 'K', '/': 'L', ':': ':', '"': '"',
    '~': 'Z', 'ْ': 'X', '}': 'C', '{': 'V', 'آ': 'N', '<': '<', '>': '>', '؟': '?',
    '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9', '٠': '0'
};

// --- Helper Function to Perform Conversion ---
function performConversion(text, customRules, isArabicToEnglish) {
    const arabicToEnglishMap = { ...baseMapArToEn, ...customRules };
    const englishToArabicMap = Object.fromEntries(Object.entries(arabicToEnglishMap).map(([key, value]) => [value, key]));
    
    const map = isArabicToEnglish ? arabicToEnglishMap : englishToArabicMap;
    const rulesToCheck = isArabicToEnglish ? customRules : {};
    
    let outputText = '';
    let i = 0;
    while (i < text.length) {
        let foundRule = false;
        if (isArabicToEnglish) {
            const sortedCustomKeys = Object.keys(rulesToCheck).sort((a, b) => b.length - a.length);
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
        const char = text[i];
        outputText += map[char] || char;
        i++;
    }
    return outputText;
}

// --- Sound Playback Function ---
async function playSound(source = 'notification.mp3', volume = 1.0) {
    const existingContexts = await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] });
    if (existingContexts.length > 0) {
        chrome.runtime.sendMessage({ type: 'play-sound', target: 'offscreen', source, volume });
    } else {
        await chrome.offscreen.createDocument({
            url: 'offscreen.html',
            reasons: ['AUDIO_PLAYBACK'],
            justification: 'Playing a notification sound',
        });
        chrome.runtime.sendMessage({ type: 'play-sound', target: 'offscreen', source, volume });
    }
}

// --- Context Menu (Right-Click) Setup ---
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "correctAndCopy",
        title: "Correct Layout / Copy",
        contexts: ["selection"]
    });
});

// --- Listener for the Right-Click Action ---
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "correctAndCopy" && info.selectionText) {
        chrome.storage.local.get('customLayoutRules', (result) => {
            const defaultRules = { 'لآ': 'B', 'لا': 'b', 'ة': 'm', '’': 'M', 'و': ',', 'لإ': 'T', 'لأ': 'G' };
            const customRules = result.customLayoutRules || defaultRules;
            const correctedText = performConversion(info.selectionText, customRules, true);

            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (text) => navigator.clipboard.writeText(text),
                args: [correctedText]
            }).then(() => {
                // --- All 3 Notifications Happen Here ---
                // 1. Badge Notification
                chrome.action.setBadgeText({ text: '✓' });
                chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
                setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);

                // 2. System Notification
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'images/icon128.png',
                    title: 'Layout Corrector Pro',
                    message: 'Corrected text copied! Press Ctrl+V to paste.',
                    priority: 2
                });
                
                // 3. Sound Notification
                playSound();
            });
        });
    }
});

// --- Message Listener for Popup Communication ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        if (request.type === 'CONVERT_TEXT') {
            const result = await chrome.storage.local.get('customLayoutRules');
            const defaultRules = { 'لآ': 'B', 'لا': 'b', 'ة': 'm', '’': 'M', 'و': ',', 'لإ': 'T', 'لأ': 'G' };
            const customRules = result.customLayoutRules || defaultRules;
            const convertedText = performConversion(request.text, customRules, request.isArabicToEnglish);
            sendResponse({ convertedText });
        } else if (request.type === 'GET_RULES') {
            const result = await chrome.storage.local.get('customLayoutRules');
            const defaultRules = { 'لآ': 'B', 'لا': 'b', 'ة': 'm', '’': 'M', 'و': ',', 'لإ': 'T', 'لأ': 'G' };
            sendResponse({ rules: result.customLayoutRules || defaultRules });
        } else if (request.type === 'SAVE_RULES') {
            await chrome.storage.local.set({ customLayoutRules: request.rules });
            sendResponse({ success: true });
        }
    })();
    return true; // Indicates an asynchronous response.
});