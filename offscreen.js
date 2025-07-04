// This script runs in the offscreen document.
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.target === 'offscreen' && msg.type === 'play-sound') {
        const audioPlayer = document.querySelector('#audio-player');
        audioPlayer.src = msg.source;
        audioPlayer.volume = msg.volume;
        audioPlayer.play();
    }
});