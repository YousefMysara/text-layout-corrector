document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const input1 = document.getElementById('input-1');
    const input2 = document.getElementById('input-2');
    const label1 = document.getElementById('label-1');
    const label2 = document.getElementById('label-2');
    const swapBtn = document.getElementById('swap-btn');
    const copyBtn = document.getElementById('copy-btn');
    const clearBtn = document.getElementById('clear-btn');
    
    // Modal UI elements
    const manageRulesBtn = document.getElementById('manage-rules-btn');
    const rulesModal = document.getElementById('rules-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const addRuleForm = document.getElementById('add-rule-form');
    const ruleFromInput = document.getElementById('rule-from');
    const ruleToInput = document.getElementById('rule-to');
    const customRulesList = document.getElementById('custom-rules-list');

    // --- State ---
    let isArabicToEnglish = true;
    let customRules = {};

    // --- Communication with Background Script ---
    const convertText = () => {
        const text = input1.value;
        chrome.runtime.sendMessage({ type: 'CONVERT_TEXT', text, isArabicToEnglish }, (response) => {
            if (response && response.convertedText !== undefined) {
                input2.value = response.convertedText;
            }
        });
    };

    const getRules = () => {
        chrome.runtime.sendMessage({ type: 'GET_RULES' }, (response) => {
            if (response && response.rules) {
                customRules = response.rules;
                renderCustomRules();
            }
        });
    };

    const saveRules = () => {
        chrome.runtime.sendMessage({ type: 'SAVE_RULES', rules: customRules }, (response) => {
            if (response && response.success) {
                renderCustomRules();
                convertText(); // Re-convert text with new rules
            }
        });
    };

    // --- UI Update Functions ---
    const renderCustomRules = () => {
        customRulesList.innerHTML = '';
        if (Object.keys(customRules).length === 0) {
            customRulesList.innerHTML = '<p class="text-slate-500 text-sm text-center">No custom rules yet.</p>';
            return;
        }
        for (const key in customRules) {
            const ruleDiv = document.createElement('div');
            ruleDiv.className = 'rule-item';
            ruleDiv.innerHTML = `
                <div>
                    <span class="font-semibold">${key}</span>
                    <span class="mx-2 text-slate-400">→</span>
                    <span class="font-semibold">${customRules[key]}</span>
                </div>
                <button data-key="${key}" class="delete-rule-btn" title="Delete Rule">&times;</button>
            `;
            customRulesList.appendChild(ruleDiv);
        }
    };
    
    const updateUIForDirection = () => {
        if (isArabicToEnglish) {
            label1.textContent = 'Arabic-Layout Text';
            label2.textContent = 'Corrected English Text';
            input1.placeholder = 'اكتب هنا...';
            input2.placeholder = 'Your text appears here...';
        } else {
            label1.textContent = 'English-Layout Text';
            label2.textContent = 'Corrected Arabic Text';
            input1.placeholder = 'Type here...';
            input2.placeholder = 'النص الخاص بك يظهر هنا...';
        }
    };

    // --- Event Listeners ---
    swapBtn.addEventListener('click', () => {
        isArabicToEnglish = !isArabicToEnglish;
        const tempVal = input1.value;
        input1.value = input2.value;
        updateUIForDirection();
        convertText();
    });
    
    input1.addEventListener('input', convertText);
    copyBtn.addEventListener('click', () => { if (input2.value) navigator.clipboard.writeText(input2.value); });
    clearBtn.addEventListener('click', () => { input1.value = ''; input2.value = ''; input1.focus(); });

    // Modal Listeners
    manageRulesBtn.addEventListener('click', () => {
        getRules();
        rulesModal.style.display = 'flex';
    });
    closeModalBtn.addEventListener('click', () => {
        rulesModal.style.display = 'none';
    });
    addRuleForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (ruleFromInput.value && ruleToInput.value) {
            customRules[ruleFromInput.value] = ruleToInput.value;
            saveRules();
            ruleFromInput.value = '';
            ruleToInput.value = '';
        }
    });

    customRulesList.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-rule-btn')) {
            const keyToDelete = e.target.dataset.key;
            delete customRules[keyToDelete];
            saveRules();
        }
    });

    // --- Initial Load ---
    const initializeApp = () => {
        getRules();
        updateUIForDirection();
        // Check for text from context menu
        chrome.storage.local.get('selectedText', (result) => {
            if (result.selectedText) {
                input1.value = result.selectedText;
                convertText();
                chrome.storage.local.remove('selectedText');
            }
        });
    };

    initializeApp();
});