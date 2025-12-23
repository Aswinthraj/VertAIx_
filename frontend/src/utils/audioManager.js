// Audio utility for posture alerts
class AudioManager {
  constructor() {
    this.audioContext = null;
    this.alertPlayed = false;
  }

  // Initialize audio context
  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  // Play warning beep sound
  playWarning() {
    this.init();
    this.playTone(800, 0.2, 0.1); // frequency, duration, volume
  }

  // Play alert sound (more urgent)
  playAlert() {
    this.init();
    // Play two beeps for urgent alert
    this.playTone(1000, 0.15, 0.15);
    setTimeout(() => this.playTone(1000, 0.15, 0.15), 200);
  }

  // Play success sound
  playSuccess() {
    this.init();
    this.playTone(600, 0.1, 0.1);
    setTimeout(() => this.playTone(800, 0.1, 0.1), 100);
  }

  // Generate and play tone
  playTone(frequency, duration, volume) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  // Reset alert state
  resetAlert() {
    this.alertPlayed = false;
  }

  // Check if alert was recently played
  shouldPlayAlert() {
    if (!this.alertPlayed) {
      this.alertPlayed = true;
      return true;
    }
    return false;
  }
}

export const audioManager = new AudioManager();
