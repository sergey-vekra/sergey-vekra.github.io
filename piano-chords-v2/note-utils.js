import { NOTE_NAMES } from './constants.js';

export function semitoneToLabel(semitone, preferAccidental = 'auto') {
    const names = NOTE_NAMES[semitone];

    if (!names || names.length === 0) return '?';

    if (names.length === 1) return names[0];

    if (preferAccidental === 'flat') {
        const flat = names.find(n => n.includes('b'));
        return flat || names[0];
    }

    if (preferAccidental === 'sharp') {
        const sharp = names.find(n => n.includes('#'));
        return sharp || names[0];
    }

    return names[0];
}

export function prettyAccidentals(label) {
    return label.replace('#', '\u266F').replace('b', '\u266D');
}
