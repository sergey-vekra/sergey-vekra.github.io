import { CHORD_TYPES } from './constants.js';

export class ChordGenerator {
    generateRootChord(rootSemitone, type) {
        const typeData = CHORD_TYPES[type];
        if (!typeData) return null;

        const targetIndices = typeData.intervals.map(iv => (rootSemitone + iv) % 12);

        return {
            rootSemitone,
            type,
            typeLabel: typeData.label,
            intervals: typeData.intervals,
            targetIndices
        };
    }
}
