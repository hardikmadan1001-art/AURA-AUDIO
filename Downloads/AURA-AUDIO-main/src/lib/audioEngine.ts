export interface Track {
  id: string
  title: string
  artist: string
  src: string
  color: string
}

export const TRACKS: Track[] = [
  {
    id: 'let-it-happen',
    title: 'Let It Happen',
    artist: 'Tame Impala',
    src: '/audio/let-it-happen.mp3',
    color: '#6b5b95',
  },
  {
    id: 'welcome-to-los-santos',
    title: 'Welcome To Los Santos',
    artist: 'GTA V Theme',
    src: '/audio/GTA-V-Welcome-to-Los-Santosx.mp3',
    color: '#e0231c',
  },
  {
    id: 'nightcall',
    title: 'Nightcall',
    artist: 'Kavinsky',
    src: '/audio/Kavinsky - Nightcall (Official Audio - HD).mp3',
    color: '#1a1a2e',
  },
  {
    id: 'resonance',
    title: 'Resonance',
    artist: 'Home',
    src: '/audio/Resonance - Home.mp3',
    color: '#4a4e69',
  },
  {
    id: 'midnight-city',
    title: 'Midnight City',
    artist: 'M83',
    src: '/audio/M83 - Midnight City.mp3',
    color: '#0f3460',
  },
  {
    id: 'strobe',
    title: 'Strobe (Club Edit)',
    artist: 'Deadmau5',
    src: '/audio/04-Deadmau5 - Strobe (Club Edit).mp3',
    color: '#1e1e2e',
  },
]

export interface AudioEngineState {
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
}

export class AudioEngine {
  private audioContext: AudioContext | null = null
  private audioElement: HTMLAudioElement | null = null
  private sourceNode: MediaElementAudioSourceNode | null = null
  private gainNode: GainNode | null = null
  private state: AudioEngineState = {
    currentTrack: null,
    isPlaying: false,
    volume: 0.7,
  }
  private onStateChange: ((state: AudioEngineState) => void) | null = null

  setOnStateChange(callback: (state: AudioEngineState) => void) {
    this.onStateChange = callback
  }

  private notifyStateChange() {
    this.onStateChange?.(this.state)
  }

  async playTrack(track: Track): Promise<void> {
    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }

    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }

    // Stop current track if playing
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.src = ''
      this.audioElement.load()
    }

    // Create new audio element
    this.audioElement = new Audio(track.src)
    this.audioElement.volume = this.state.volume

    // Set up audio graph
    this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement)
    this.gainNode = this.audioContext.createGain()
    this.gainNode.gain.value = this.state.volume
    this.sourceNode.connect(this.gainNode)
    this.gainNode.connect(this.audioContext.destination)

    // Update state
    this.state.currentTrack = track
    this.state.isPlaying = true
    this.notifyStateChange()

    // Play
    await this.audioElement.play()
  }

  pause(): void {
    if (this.audioElement) {
      this.audioElement.pause()
      this.state.isPlaying = false
      this.notifyStateChange()
    }
  }

  resume(): void {
    if (this.audioElement && this.state.currentTrack) {
      if (this.audioContext?.state === 'suspended') {
        this.audioContext.resume()
      }
      this.audioElement.play()
      this.state.isPlaying = true
      this.notifyStateChange()
    }
  }

  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.src = ''
      this.audioElement.load()
      this.state.currentTrack = null
      this.state.isPlaying = false
      this.notifyStateChange()
    }
  }

  setVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(1, volume))
    if (this.gainNode) {
      this.gainNode.gain.value = this.state.volume
    }
    if (this.audioElement) {
      this.audioElement.volume = this.state.volume
    }
    this.notifyStateChange()
  }

  getState(): AudioEngineState {
    return { ...this.state }
  }

  getCurrentTrack(): Track | null {
    return this.state.currentTrack
  }

  dispose(): void {
    this.stop()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
  }
}

export const createRadialPosition = (
  index: number,
  total: number,
  radius: number,
  center: { x: number; y: number }
): { x: number; y: number } => {
  const angle = (index / total) * Math.PI * 2 - Math.PI / 2
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  }
}

export const getAngleFromCenter = (
  point: { x: number; y: number },
  center: { x: number; y: number }
): number => {
  return Math.atan2(point.y - center.y, point.x - center.x)
}

export const getNearestTrackIndex = (
  angle: number,
  total: number
): number => {
  const normalizedAngle = (angle + Math.PI / 2 + Math.PI * 2) % (Math.PI * 2)
  const segmentAngle = (Math.PI * 2) / total
  return Math.floor(normalizedAngle / segmentAngle) % total
}
