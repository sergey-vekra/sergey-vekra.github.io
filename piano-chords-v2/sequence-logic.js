import { NATURAL_INDICES, CIRCLE_OF_FIFTHS } from './constants.js';
import { AlterationEngine } from './alteration-engine.js';

export class RandomSequence {
    getNext(options) {
        const rootSemitone = NATURAL_INDICES[Math.floor(Math.random() * NATURAL_INDICES.length)];
        const type = options.enabledTypes[Math.floor(Math.random() * options.enabledTypes.length)];
        const inversionId = options.enabledInversions[Math.floor(Math.random() * options.enabledInversions.length)];

        const validShifts = AlterationEngine.getValidShifts(
            rootSemitone,
            options.useNaturals,
            options.useAccidentals
        );

        if (validShifts.length === 0) return null;

        const shift = validShifts[Math.floor(Math.random() * validShifts.length)];

        let preferAccidental = 'auto';
        if (shift === 1) preferAccidental = 'sharp';
        if (shift === -1) preferAccidental = 'flat';

        return {
            rootSemitone,
            type,
            inversionId,
            shift,
            preferAccidental,
            isFixedRoot: false
        };
    }
}

export class CircleSequence {
    constructor() {
        this.currentRoot = 0;
        this.isFirst = true;
    }

    reset() {
        this.currentRoot = 0;
        this.isFirst = true;
    }

    getNext() {
        const FIFTH_STEP = 7;

        if (this.isFirst) {
            this.isFirst = false;
        } else {
            this.currentRoot = (this.currentRoot + FIFTH_STEP) % 12;
        }

        return {
            rootSemitone: this.currentRoot,
            isFixedRoot: true,
            shift: 0,
            preferAccidental: 'auto'
        };
    }
}
