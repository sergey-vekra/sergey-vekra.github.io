import { NOTE_NAMES, CHORD_TYPES, CIRCLE_OF_FIFTHS, NATURAL_INDICES } from './constants.js';

export class ChordGenerator {
    constructor() {
        this.mode = 'random';
        this.circleIndex = -1;
    }

    setMode(mode) {
        this.mode = mode;
        this.circleIndex = -1;
    }

    /**
     * Returns a Base Task. 
     * In Random Mode: Returns a NATURAL root (shift 0).
     * In Circle Mode: Returns the FINAL root (pre-calculated).
     */
    getNextChord(options, excludedIds) {
        // 1. Validate Types exist
        if (options.enabledTypes.length === 0) return { error: 'no-types' };

        // 2. Route based on Mode
        if (this.mode === 'circle') {
            return this._getNextCircleChord(options, excludedIds);
        } else {
            return this._getRandomNaturalChord(options, excludedIds);
        }
    }

    _getRandomNaturalChord(options, excludedIds) {
        // Build pool from NATURALS only (Indices 0, 2, 4, 5, 7, 9, 11)
        const pool = [];

        NATURAL_INDICES.forEach(rootIdx => {
            const names = NOTE_NAMES[rootIdx];
            const rootName = names[0]; // "C", "D", etc.

            options.enabledTypes.forEach(type => {
                // We use a partial ID here because the accidental isn't decided yet
                // But for exclusion purposes, we might need to check later.
                // For now, we generate the base.
                pool.push({
                    rootName,
                    rootIndex: rootIdx,
                    type,
                    label: CHORD_TYPES[type].label,
                    isPrecalculated: false // Flags Main to use Alteration Engine
                });
            });
        });

        if (pool.length === 0) return { error: 'completed' };
        return this._selectRandom(pool);
    }

    _getNextCircleChord(options, excludedIds) {
        // ... (Keep existing Circle Logic) ...
        // This logic is specific so we keep it returning exact roots
        for (let i = 0; i < 12; i++) {
            this.circleIndex = (this.circleIndex + 1) % CIRCLE_OF_FIFTHS.length;
            const rootIdx = CIRCLE_OF_FIFTHS[this.circleIndex];
            const isBlackKey = [1, 3, 6, 8, 10].includes(rootIdx);

            if (isBlackKey && !options.useAccidentals) continue;
            if (!isBlackKey && !options.useNaturals) continue;

            const names = NOTE_NAMES[rootIdx];
            // If black key, prefer Flat name for simplicity or random?
            // Let's pick name based on simple logic or random
            const rootName = names[Math.floor(Math.random() * names.length)];

            const type = options.enabledTypes[Math.floor(Math.random() * options.enabledTypes.length)];
            const id = `${rootName}|${type}`;

            if (excludedIds.has(id)) continue;

            return {
                rootName,
                rootIndex: rootIdx,
                type,
                id,
                label: CHORD_TYPES[type].label,
                isPrecalculated: true // Flags Main to SKIP Alteration Engine
            };
        }
        return { error: 'completed' };
    }

    _selectRandom(pool) {
        return pool[Math.floor(Math.random() * pool.length)];
    }
}