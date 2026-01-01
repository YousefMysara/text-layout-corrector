# Text Layout Corrector Pro 🚀

A powerful Chrome extension to instantly correct text typed in the wrong keyboard layout. Features dark mode, custom conversion rules, keyboard shortcuts, conversion history, and multi-language support.

## ✨ Features

### Core Features
- **🔄 Instant Correction** - Right-click on selected text to copy the corrected version to your clipboard
- **🌙 Dark Mode** - Toggle between light and dark themes for comfortable viewing
- **📜 Conversion History** - Access your last 20 conversions for quick reference
- **🔧 Custom Rules** - Create, edit, and manage your own conversion rules

### Notification Options
- **🔔 System Notifications** - Desktop notifications when text is converted
- **🔊 Sound Effects** - Customizable audio feedback with volume control
- **✓ Badge Indicator** - Visual confirmation on the extension icon

### Advanced Features
- **🌐 Multi-Language Support** - Arabic ↔ English, Persian ↔ English, Hebrew ↔ English
- **📥 Import/Export Rules** - Backup and share your custom rules as JSON
- **📊 Usage Statistics** - Track your conversion count and characters processed
- **🔍 Rule Search** - Quickly find rules when you have many
- **🔄 Auto-Detect** - Automatically detect input language direction
- **☁️ Sync Storage** - Your settings sync across Chrome browsers

## 🛠️ Installation

### Prerequisites
- Google Chrome (or Chromium-based browser)

### Steps
1. Download this project as a ZIP file and unzip it, or clone the repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **"Developer mode"** using the toggle in the top-right corner
4. Click the **"Load unpacked"** button
5. Select the folder where you saved the project files
6. Pin the extension to your toolbar for easy access!

## 📖 Usage

### Quick Conversion (Right-Click)
1. Select any text on a webpage that was typed with the wrong layout
2. Right-click and choose **"Correct Layout & Copy"**
3. The corrected text is now on your clipboard, ready to paste with `Ctrl+V`

### Keyboard Shortcut
1. Select text on any webpage
2. Press `Ctrl+Shift+C` (or `Cmd+Shift+C` on Mac)
3. Corrected text is copied to your clipboard

### Manual Conversion (Popup)
1. Click the extension icon in your toolbar
2. Type or paste text in the input area
3. The corrected text appears automatically in the output area
4. Click **Copy** to copy the result

### Managing Custom Rules
1. Click **Rules** in the popup
2. Add new rules by entering source → target mappings
3. Edit existing rules by clicking the edit icon
4. Delete rules by clicking the delete icon
5. Use **Import/Export** to backup or share your rules

## ⚙️ Settings

Access settings by clicking the gear icon in the popup or navigating to the extension's options page.

### Available Settings
| Setting | Description |
|---------|-------------|
| Theme | Light, Dark, or System preference |
| Sound Effects | Enable/disable conversion sounds |
| Sound Volume | Adjust notification volume (0-100%) |
| System Notifications | Enable/disable desktop notifications |
| Auto-Detect | Automatically detect text direction |
| Language Pair | Select Arabic/Persian/Hebrew ↔ English |

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Alt+Shift+C` | Convert selected text and copy |
| `Alt+Shift+L` | Open extension popup |
| `Escape` | Close modals |
| `Ctrl+Enter` | Copy result (in popup) |

## 🔧 Custom Rules Examples

| From | To | Description |
|------|-----|-------------|
| `ة` | `m` | Arabic Ta Marbuta → m |
| `لا` | `b` | Lam-Alef combination → b |
| `لآ` | `B` | Lam-Alef Madda → B |

## 📁 Project Structure

```
Text Layout Corrector/
├── manifest.json        # Extension configuration
├── background.js        # Service worker (handles conversions)
├── popup.html          # Main popup interface
├── popup.js            # Popup functionality
├── style.css           # Styles (with dark mode)
├── settings.html       # Settings page
├── settings.js         # Settings functionality
├── constants.js        # Shared constants
├── utils.js            # Utility functions
├── offscreen.html      # Offscreen document for audio
├── offscreen.js        # Audio playback handler
├── notification.mp3    # Notification sound
├── images/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── LICENSE
└── README.md
```

## 🔒 Privacy

This extension:
- ✅ Works entirely locally - no data sent to external servers
- ✅ Only accesses the clipboard when you explicitly trigger a conversion
- ✅ Stores all data in your browser's local storage
- ✅ Syncs settings across your Chrome browsers (optional)

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📝 Changelog

### Version 2.0.0
- 🌙 Added dark mode support
- ⌨️ Added Right-Click menu
- 📜 Added conversion history
- 🔧 Added rule import/export
- 📊 Added usage statistics
- 🌐 Added Persian and Hebrew support
- ⚙️ Added comprehensive settings page
- 🎨 Complete UI redesign
- ☁️ Added Chrome sync storage

### Version 1.0.0
- Added custom rules management
- Added notification sounds
- UI improvements

### Version 0.1.0
- Initial release

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ by Yousef Mysara**
