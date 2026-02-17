import { START_OCTAVE, NUM_OCTAVES, NUM_WHITE_KEYS } from './constants.js';

let blackKeyZones = [];

export function initPiano(containerId, onKeyInteraction) {
    const pianoEl = document.getElementById(containerId);
    pianoEl.innerHTML = '';
    blackKeyZones = [];

    let whiteKeyCount = 0;
    const totalNotes = NUM_OCTAVES * 12;
    const startMidi = START_OCTAVE * 12 + 12;

    const wkPercent = 100 / NUM_WHITE_KEYS;

    for (let i = 0; i < totalNotes; i++) {
        const midiVal = startMidi + i;
        const noteIndex = midiVal % 12;
        const isBlack = [1, 3, 6, 8, 10].includes(noteIndex);

        const key = document.createElement('div');
        key.dataset.note = midiVal;
        key.classList.add('key');
        key.id = `key-${midiVal}`;

        if (isBlack) {
            key.classList.add('key-black');
            let leftPercent = (whiteKeyCount * wkPercent);

            // Visual Tuning
            if (noteIndex === 1) leftPercent -= (wkPercent * 0.35);
            else if (noteIndex === 3) leftPercent -= (wkPercent * 0.15);
            else if (noteIndex === 6) leftPercent -= (wkPercent * 0.35);
            else if (noteIndex === 8) leftPercent -= (wkPercent * 0.25);
            else if (noteIndex === 10) leftPercent -= (wkPercent * 0.15);

            key.style.left = `${leftPercent}%`;

            const centerP = (leftPercent + 2.25) / 100;
            blackKeyZones.push({ midi: midiVal, center: centerP });

        } else {
            key.classList.add('key-white');
            if (noteIndex === 0) key.textContent = 'C' + (Math.floor(midiVal / 12) - 1);
            whiteKeyCount++;
        }
        pianoEl.appendChild(key);
    }

    attachInputHandlers(pianoEl, onKeyInteraction);
}

export function updateKeysVisual(pressedNotes, warnNotes = []) {
    document.querySelectorAll('.key').forEach(k => {
        k.classList.remove('active', 'warn', 'wrong', 'correct');
    });

    pressedNotes.forEach(midi => {
        const el = document.getElementById(`key-${midi}`);
        if (el) el.classList.add('active');
    });

    warnNotes.forEach(midi => {
        const el = document.getElementById(`key-${midi}`);
        if (el) el.classList.add('warn');
    });
}

export function setKeysStatus(midiNotes, statusClass) {
    midiNotes.forEach(midi => {
        const el = document.getElementById(`key-${midi}`);
        if (el) el.classList.add(statusClass);
    });
}

// Internal Input Logic
function attachInputHandlers(pianoEl, callback) {

    const handleInput = (e) => {
        // Prevent default to stop scrolling/highlighting
        if (e.cancelable) e.preventDefault();

        // Determine coordinates based on event type
        let clientX, clientY;

        if (e.type.startsWith('touch')) {
            // Use changedTouches for touchend, touches for touchstart
            const touch = e.changedTouches ? e.changedTouches[0] : e.touches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            // Mouse events
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const rect = pianoEl.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        const xPercent = x / rect.width;
        const blackKeyAreaHeight = rect.height * 0.6;

        processHit(xPercent, y, blackKeyAreaHeight, callback);
    };

    // --- MOUSE EVENTS ---
    // 1. mousedown: Prevent default to stop text selection, but DO NOT trigger note.
    pianoEl.addEventListener('mousedown', (e) => {
        if (e.cancelable) e.preventDefault();
    });

    // 2. mouseup: Trigger note here (React on release).
    pianoEl.addEventListener('mouseup', handleInput);

    // --- TOUCH EVENTS ---
    // 1. touchstart: Trigger note immediately (Low latency preferred for touch).
    pianoEl.addEventListener('touchstart', handleInput, { passive: false });

    // 2. touchmove: Prevent scrolling, but DO NOT trigger notes (prevents glissando).
    pianoEl.addEventListener('touchmove', (e) => {
        if (e.cancelable) e.preventDefault();
    }, { passive: false });
}

function processHit(xPercent, y, boundaryY, callback) {
    let detectedMidi = -1;

    if (y < boundaryY) {
        const magnetRadius = 0.035;
        const nearestBlack = blackKeyZones.find(z => Math.abs(z.center - xPercent) < magnetRadius);
        detectedMidi = nearestBlack ? nearestBlack.midi : getWhiteKeyMidi(xPercent);
    } else {
        detectedMidi = getWhiteKeyMidi(xPercent);
    }

    if (detectedMidi !== -1) {
        callback(detectedMidi);
    }
}

function getWhiteKeyMidi(xPercent) {
    const index = Math.floor(xPercent * NUM_WHITE_KEYS);
    const scale = [0, 2, 4, 5, 7, 9, 11];
    if (index < 0 || index >= NUM_WHITE_KEYS) return -1;

    const octave = Math.floor(index / 7);
    const step = index % 7;
    const startMidi = START_OCTAVE * 12 + 12;
    return startMidi + (octave * 12) + scale[step];
}