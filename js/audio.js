// 8비트 레트로풍 오디오 시스템
class RetroAudio {
    constructor() {
        this.audioContext = null;
        this.isMuted = false;
        this.bgmOscillators = [];
        this.bgmGain = null;
        this.isPlaying = false;
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.bgmGain = this.audioContext.createGain();
            this.bgmGain.connect(this.audioContext.destination);
            this.bgmGain.gain.value = 0.15;
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // 8비트 스타일 BGM 재생
    playBGM() {
        if (!this.audioContext || this.isPlaying || this.isMuted) return;
        
        this.resume();
        this.isPlaying = true;
        
        // 제주도 느낌의 밝고 경쾌한 멜로디
        const melody = [
            { note: 392, duration: 250 }, // G4
            { note: 440, duration: 250 }, // A4
            { note: 494, duration: 250 }, // B4
            { note: 523, duration: 500 }, // C5
            { note: 494, duration: 250 }, // B4
            { note: 440, duration: 250 }, // A4
            { note: 392, duration: 500 }, // G4
            { note: 330, duration: 250 }, // E4
            { note: 392, duration: 250 }, // G4
            { note: 440, duration: 500 }, // A4
            { note: 392, duration: 250 }, // G4
            { note: 330, duration: 250 }, // E4
            { note: 294, duration: 500 }, // D4
            { note: 330, duration: 250 }, // E4
            { note: 392, duration: 250 }, // G4
            { note: 440, duration: 500 }, // A4
        ];

        const bass = [
            { note: 196, duration: 500 }, // G3
            { note: 220, duration: 500 }, // A3
            { note: 247, duration: 500 }, // B3
            { note: 262, duration: 500 }, // C4
            { note: 247, duration: 500 }, // B3
            { note: 220, duration: 500 }, // A3
            { note: 196, duration: 500 }, // G3
            { note: 165, duration: 500 }, // E3
        ];

        this.playMelodyLoop(melody, 'square', 0.1);
        this.playMelodyLoop(bass, 'triangle', 0.08);
    }

    playMelodyLoop(notes, waveType, volume) {
        let time = this.audioContext.currentTime;
        let noteIndex = 0;

        const playNextNote = () => {
            if (!this.isPlaying || this.isMuted) return;

            const note = notes[noteIndex];
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = waveType;
            osc.frequency.value = note.note;

            gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + note.duration / 1000);

            osc.connect(gain);
            gain.connect(this.bgmGain);

            osc.start();
            osc.stop(this.audioContext.currentTime + note.duration / 1000);

            this.bgmOscillators.push(osc);

            noteIndex = (noteIndex + 1) % notes.length;
            setTimeout(playNextNote, note.duration);
        };

        playNextNote();
    }

    stopBGM() {
        this.isPlaying = false;
        this.bgmOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {}
        });
        this.bgmOscillators = [];
    }

    // 효과음: 한라봉 수집
    playCollectSound() {
        if (!this.audioContext || this.isMuted) return;
        this.resume();

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(587, this.audioContext.currentTime);
        osc.frequency.setValueAtTime(784, this.audioContext.currentTime + 0.05);
        osc.frequency.setValueAtTime(988, this.audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.2);
    }

    // 효과음: 게임 오버
    playGameOverSound() {
        if (!this.audioContext || this.isMuted) return;
        this.resume();

        const frequencies = [392, 330, 262, 196];
        let time = this.audioContext.currentTime;

        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sawtooth';
            osc.frequency.value = freq;

            gain.gain.setValueAtTime(0.2, time + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, time + i * 0.15 + 0.3);

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.start(time + i * 0.15);
            osc.stop(time + i * 0.15 + 0.3);
        });
    }

    // 효과음: 던지기
    playThrowSound() {
        if (!this.audioContext || this.isMuted) return;
        this.resume();

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.stopBGM();
        }
        return this.isMuted;
    }
}

// 전역 오디오 인스턴스
const retroAudio = new RetroAudio();
