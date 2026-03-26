import { ref, onUnmounted } from 'vue'

interface SoundEffect {
    name: string
    audio: HTMLAudioElement
    enabled: boolean
}

export function useSoundEffects() {
    const sounds = ref<Map<string, SoundEffect>>(new Map())
    const masterVolume = ref(0.5)
    const isMuted = ref(false)

    // 初始化音效
    function init() {
        // 使用 Web Audio API 生成音效，无需外部文件
        createSoundEffect('match', 440, 'sine', 0.1)
        createSoundEffect('select', 880, 'sine', 0.05)
        createSoundEffect('error', 220, 'square', 0.15)
        createSoundEffect('win', 523.25, 'sine', 0.2)
        createSoundEffect('levelup', 659.25, 'sine', 0.3)
        createSoundEffect('gameover', 196, 'sawtooth', 0.5)
        createSoundEffect('click', 1000, 'triangle', 0.03)
    }

    // 创建音效（使用 Web Audio API）
    function createSoundEffect(name: string, frequency: number, type: OscillatorType, duration: number) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        
        const sound: SoundEffect = {
            name,
            audio: null as any,
            enabled: true
        }

        // 创建可重用的音频缓冲区
        const buffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate)
        const data = buffer.getChannelData(0)
        
        // 生成波形
        for (let i = 0; i < buffer.length; i++) {
            const t = i / audioContext.sampleRate
            const envelope = Math.exp(-t * 10) // 衰减包络
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope
            
            if (type === 'square') {
                data[i] = data[i] > 0 ? envelope : -envelope
            } else if (type === 'sawtooth') {
                data[i] = ((t * frequency) % 1) * 2 - 1 * envelope
            } else if (type === 'triangle') {
                data[i] = (2 * Math.abs(2 * ((t * frequency) % 1) - 1) - 1) * envelope
            }
        }

        sound.audio = {
            play: () => {
                if (isMuted.value || !sound.enabled) return
                
                const source = audioContext.createBufferSource()
                source.buffer = buffer
                
                const gainNode = audioContext.createGain()
                gainNode.gain.value = masterVolume.value
                
                source.connect(gainNode)
                gainNode.connect(audioContext.destination)
                source.start(0)
            }
        } as any

        sounds.value.set(name, sound)
    }

    // 播放音效
    function play(soundName: string) {
        const sound = sounds.value.get(soundName)
        if (sound && sound.audio) {
            sound.audio.play()
        }
    }

    // 设置音量
    function setVolume(volume: number) {
        masterVolume.value = Math.max(0, Math.min(1, volume))
    }

    // 静音切换
    function toggleMute() {
        isMuted.value = !isMuted.value
    }

    // 启用/禁用特定音效
    function setSoundEnabled(soundName: string, enabled: boolean) {
        const sound = sounds.value.get(soundName)
        if (sound) {
            sound.enabled = enabled
        }
    }

    // 播放胜利音效序列
    function playWinSequence() {
        const notes = [523.25, 659.25, 783.99, 1046.50]
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()
                
                oscillator.type = 'sine'
                oscillator.frequency.value = freq
                gainNode.gain.value = masterVolume.value * 0.5
                
                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)
                oscillator.start()
                oscillator.stop(audioContext.currentTime + 0.2)
            }, i * 150)
        })
    }

    // 播放升级音效序列
    function playLevelUpSequence() {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]
        notes.forEach((freq, i) => {
            setTimeout(() => {
                const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
                const oscillator = audioContext.createOscillator()
                const gainNode = audioContext.createGain()
                
                oscillator.type = 'sine'
                oscillator.frequency.value = freq
                gainNode.gain.value = masterVolume.value * 0.4
                
                oscillator.connect(gainNode)
                gainNode.connect(audioContext.destination)
                oscillator.start()
                oscillator.stop(audioContext.currentTime + 0.15)
            }, i * 100)
        })
    }

    onUnmounted(() => {
        sounds.value.clear()
    })

    return {
        init,
        play,
        setVolume,
        toggleMute,
        setSoundEnabled,
        playWinSequence,
        playLevelUpSequence,
        isMuted,
        masterVolume
    }
}
