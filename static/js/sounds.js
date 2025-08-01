// Sound Effects Manager
class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.3;
    this.loadSounds();
  }

  loadSounds() {
    const soundFiles = {
      click:
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTk7KpUEgpInuDyvmIcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn",
      hover:
        "data:audio/wav;base64,UklGRnAEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUwEAACxhY6FbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+Dy",
      notification:
        "data:audio/wav;base64,UklGRnAEAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YUwEAACxhY6FbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEcBjiS2fPNeysFJHfH8N2QQAoUXrTp66hVFApGn",
    };

    Object.keys(soundFiles).forEach((key) => {
      this.sounds[key] = new Audio(soundFiles[key]);
      this.sounds[key].volume = this.volume;
      this.sounds[key].preload = "auto";
    });
  }

  play(soundName) {
    if (!this.enabled || !this.sounds[soundName]) return;

    try {
      this.sounds[soundName].currentTime = 0;
      this.sounds[soundName].play().catch((e) => {
        // Silently handle autoplay restrictions
        console.debug("Audio play blocked:", e);
      });
    } catch (error) {
      console.debug("Audio error:", error);
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    Object.values(this.sounds).forEach((sound) => {
      sound.volume = this.volume;
    });
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  mute() {
    this.enabled = false;
  }

  unmute() {
    this.enabled = true;
  }
}

// Global sound manager instance
const soundManager = new SoundManager();

// Global function for easy access
function playSound(soundName) {
  soundManager.play(soundName);
}

// Auto-enable audio on first user interaction
document.addEventListener(
  "click",
  function enableAudio() {
    soundManager.unmute();
    document.removeEventListener("click", enableAudio);
  },
  { once: true }
);
