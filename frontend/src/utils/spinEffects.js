class TickAudioManager {
  constructor() {
    this.audioContext = null;
    this.enabled = false;
    this.volume = 0.08;
    this.lastTickTime = 0;
    this.minTickInterval = 30;
  }
  
  initialize() {
    if (typeof window === 'undefined') return false;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return false;
      this.audioContext = new AudioContext();
      this.enabled = true;
      return true;
    } catch (e) {
      return false;
    }
  }
  
  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled && !this.audioContext) this.initialize();
  }
  
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }
  
  playTick() {
    if (!this.enabled || !this.audioContext) return;
    const now = performance.now();
    if (now - this.lastTickTime < this.minTickInterval) return;
    this.lastTickTime = now;
    
    if (this.audioContext.state === 'suspended') this.audioContext.resume();
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      const filterNode = this.audioContext.createBiquadFilter();
      
      oscillator.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = 1200;
      oscillator.type = 'sine';
      filterNode.type = 'highpass';
      filterNode.frequency.value = 800;
      
      const currentTime = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume, currentTime + 0.002);
      gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.04);
      
      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.04);
    } catch (e) {}
  }
  
  playLandingTick() {
    if (!this.enabled || !this.audioContext) return;
    if (this.audioContext.state === 'suspended') this.audioContext.resume();
    
    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      oscillator.frequency.value = 600;
      oscillator.type = 'triangle';
      
      const currentTime = this.audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 1.5, currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.15);
      
      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.15);
    } catch (e) {}
  }
  
  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.enabled = false;
  }
}

class HapticFeedback {
  constructor() {
    this.enabled = false;
    this.hasVibration = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }
  
  setEnabled(enabled) {
    this.enabled = enabled && this.hasVibration;
  }
  
  tick() {
    if (!this.enabled) return;
    try { navigator.vibrate(5); } catch (e) {}
  }
  
  landing() {
    if (!this.enabled) return;
    try { navigator.vibrate([10, 30, 20]); } catch (e) {}
  }
  
  win() {
    if (!this.enabled) return;
    try { navigator.vibrate([20, 50, 20, 50, 40]); } catch (e) {}
  }
}

export class SpinEffectsManager {
  constructor(options = {}) {
    this.audio = new TickAudioManager();
    this.haptic = new HapticFeedback();
    
    this.options = {
      enableAudio: options.enableAudio ?? false,
      enableHaptic: options.enableHaptic ?? true,
      audioVolume: options.audioVolume ?? 0.08
    };
    
    this.apply(this.options);
  }
  
  apply(options) {
    if (options.enableAudio !== undefined) this.audio.setEnabled(options.enableAudio);
    if (options.enableHaptic !== undefined) this.haptic.setEnabled(options.enableHaptic);
    if (options.audioVolume !== undefined) this.audio.setVolume(options.audioVolume);
    this.options = { ...this.options, ...options };
  }
  
  onSegmentCross() {
    this.audio.playTick();
    this.haptic.tick();
  }
  
  onLanding() {
    this.audio.playLandingTick();
    this.haptic.landing();
  }
  
  onWin() {
    this.haptic.win();
  }
  
  dispose() {
    this.audio.dispose();
  }
}

export default SpinEffectsManager;
