let sampler = null;
let isInitialized = false;

// Initialize Tone.js and load Piano Samples
// We use a few samples per octave and let Tone.js pitch-shift the rest to save bandwidth
function createSampler() {
    sampler = new Tone.Sampler({
        urls: {
            "A0": "A0.mp3",
            "C1": "C1.mp3", "D#1": "Ds1.mp3", "F#1": "Fs1.mp3", "A1": "A1.mp3",
            "C2": "C2.mp3", "D#2": "Ds2.mp3", "F#2": "Fs2.mp3", "A2": "A2.mp3",
            "C3": "C3.mp3", "D#3": "Ds3.mp3", "F#3": "Fs3.mp3", "A3": "A3.mp3",
            "C4": "C4.mp3", "D#4": "Ds4.mp3", "F#4": "Fs4.mp3", "A4": "A4.mp3",
            "C5": "C5.mp3", "D#5": "Ds5.mp3", "F#5": "Fs5.mp3", "A5": "A5.mp3",
            "C6": "C6.mp3", "D#6": "Ds6.mp3", "F#6": "Fs6.mp3", "A6": "A6.mp3",
            "C7": "C7.mp3", "D#7": "Ds7.mp3", "F#7": "Fs7.mp3", "A7": "A7.mp3",
            "C8": "C8.mp3"
        },
        release: 1,
        baseUrl: "https://tonejs.github.io/audio/salamander/"
    }).toDestination();
}

// Convert MIDI number (e.g., 60) to Note Name (e.g., "C4")
function midiToNote(midi) {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const note = notes[midi % 12];
    return note + octave;
}

export async function initAudio() {
    if (isInitialized) return;

    // Browsers require a user gesture to start AudioContext
    await Tone.start();

    if (!sampler) {
        createSampler();
    }
    isInitialized = true;
}

export function playTone(midiNote, duration = "8n") {
    // If we try to play before user has clicked, just return or init
    if (!isInitialized) initAudio();
    if (!sampler || !sampler.loaded) return;

    const noteName = midiToNote(midiNote);

    // triggerAttackRelease(note, duration, time, velocity)
    sampler.triggerAttackRelease(noteName, duration);
}

export function playChord(midiNotes) {
    if (!isInitialized) initAudio();
    if (!sampler || !sampler.loaded) return;

    const now = Tone.now();

    // Strum effect: play notes slightly offset
    midiNotes.sort((a, b) => a - b).forEach((midi, i) => {
        const noteName = midiToNote(midi);
        // Offset each note by 0.05 seconds for a realistic "strum" feel
        sampler.triggerAttackRelease(noteName, "2n", now + (i * 0.05));
    });
}