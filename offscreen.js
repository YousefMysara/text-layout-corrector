/**
 * Text Layout Corrector Pro - Offscreen Document Script
 * Handles audio playback for notification sounds
 * 
 * This file runs in an offscreen document context,
 * which allows playing audio from the background service worker.
 */

// Get the audio player element
const audioPlayer = document.getElementById('audio-player');

/**
 * Message listener for sound playback requests
 * Receives messages from the background service worker
 */
chrome.runtime.onMessage.addListener((message) => {
    // Only process messages intended for this offscreen document
    if (message.target !== 'offscreen') {
        return;
    }

    switch (message.type) {
        case 'play-sound':
            playSound(message.source, message.volume);
            break;

        case 'stop-sound':
            stopSound();
            break;

        default:
            console.warn('Unknown message type:', message.type);
    }
});

/**
 * Plays a sound file
 * @param {string} source - Path to the audio file
 * @param {number} volume - Volume level (0.0 to 1.0)
 */
function playSound(source, volume = 1.0) {
    try {
        // Stop any currently playing audio
        audioPlayer.pause();
        audioPlayer.currentTime = 0;

        // Set the new source and volume
        audioPlayer.src = source;
        audioPlayer.volume = Math.max(0, Math.min(1, volume));

        // Play the audio
        audioPlayer.play().catch((error) => {
            console.error('Error playing audio:', error);
        });
    } catch (error) {
        console.error('Error in playSound:', error);
    }
}

/**
 * Stops any currently playing audio
 */
function stopSound() {
    try {
        audioPlayer.pause();
        audioPlayer.currentTime = 0;
    } catch (error) {
        console.error('Error stopping audio:', error);
    }
}

// Log when the offscreen document is ready
console.log('Offscreen document initialized');