import { NOTE_NAMES } from './constants.js';

export class AlterationEngine {

    /**
     * Determines valid semitone shifts for a given natural root
     * based on user settings (allow Naturals / allow Accidentals).
     * 
     * @param {number} rootIndex - The natural root index (0, 2, 4, etc.)
     * @param {boolean} allowNaturals - (White keys)
     * @param {boolean} allowAccidentals - (Black keys)
     * @returns {number[]} Array of valid shifts (e.g., [-1, 0, 1])
     */
    static getValidShifts(rootIndex, allowNaturals, allowAccidentals) {
        const shifts = [];

        // 1. Natural (Shift 0)
        // Always results in a white key.
        if (allowNaturals) {
            shifts.push(0);
        }

        // 2. Accidentals (Shift -1 or +1)
        // We only want shifts that result in BLACK keys for "Accidentals" mode.
        // (e.g., B to Cb is valid theory, but Cb is a white key. We skip it here.)
        if (allowAccidentals) {
            // Check Flat (-1)
            const flatIndex = (rootIndex - 1 + 12) % 12;
            if (this._isBlackKey(flatIndex)) {
                shifts.push(-1);
            }

            // Check Sharp (+1)
            const sharpIndex = (rootIndex + 1) % 12;
            if (this._isBlackKey(sharpIndex)) {
                shifts.push(1);
            }
        }

        return shifts;
    }

    /**
     * Applies the shift and returns the new chromatic index and name label.
     */
    static applyShift(rootIndex, shift) {
        const newIndex = (rootIndex + shift + 12) % 12;

        let suffix = '';
        if (shift === 1) suffix = '#';
        if (shift === -1) suffix = 'b';

        // Get the base letter name (e.g., "C" from index 0)
        // NOTE_NAMES[0] is ['C'], NOTE_NAMES[2] is ['D']...
        const baseName = NOTE_NAMES[rootIndex][0];

        return {
            chromaticIndex: newIndex,
            rootName: baseName + suffix
        };
    }

    static _isBlackKey(index) {
        return [1, 3, 6, 8, 10].includes(index);
    }
}