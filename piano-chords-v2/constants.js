export const START_OCTAVE = 3;
export const NUM_OCTAVES = 2;
export const NUM_WHITE_KEYS = 14;

export const NOTE_NAMES = [
    ['C'], ['C#', 'Db'], ['D'], ['D#', 'Eb'], ['E'], ['F'], ['F#', 'Gb'],
    ['G'], ['G#', 'Ab'], ['A'], ['A#', 'Bb'], ['B']
];
// Indices of White Keys: C, D, E, F, G, A, B
export const NATURAL_INDICES = [0, 2, 4, 5, 7, 9, 11];

// New Sequence: C, G, D, A, E, B, F#, Db, Ab, Eb, Bb, F
export const CIRCLE_OF_FIFTHS = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];

export const CHORD_TYPES = {
    'Major': { label: '', intervals: [0, 4, 7] },
    'Minor': { label: 'm', intervals: [0, 3, 7] },
    'Diminished': { label: 'dim', intervals: [0, 3, 6] },
    'Augmented': { label: 'aug', intervals: [0, 4, 8] }
};

export const INVERSIONS = {
    0: { name: "Root Position", bassIdx: 0 },
    1: { name: "1st Inversion", bassIdx: 1 },
    2: { name: "2nd Inversion", bassIdx: 2 }
};