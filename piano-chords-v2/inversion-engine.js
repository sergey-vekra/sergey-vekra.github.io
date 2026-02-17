import { INVERSIONS } from './constants.js';

export class InversionEngine {

    /**
     * Selects a random inversion ID from a list of allowed options.
     * @param {number[]} allowedIds - Array of allowed inversion IDs (e.g. [0, 2])
     * @returns {number} - The selected ID
     */
    static selectRandomInversion(allowedIds) {
        if (!allowedIds || allowedIds.length === 0) return 0;
        return allowedIds[Math.floor(Math.random() * allowedIds.length)];
    }

    /**
     * Calculates the target pitch classes and bass note for a specific chord configuration.
     * Used for validation (did the user hit the right notes?).
     * 
     * @param {number} rootIndex - The chromatic index of the root (0-11)
     * @param {number[]} intervals - The relative intervals of the chord (e.g., [0, 4, 7])
     * @param {number} inversionId - 0, 1, or 2
     */
    static calculateTarget(rootIndex, intervals, inversionId) {
        const invData = INVERSIONS[inversionId];

        // 1. Calculate all pitch classes involved (0-11)
        const targetIndices = intervals.map(iv => (rootIndex + iv) % 12);

        // 2. Identify the bass note index based on inversion
        // Triads: 0=Root, 1=3rd, 2=5th
        const bassInterval = intervals[invData.bassIdx];
        const targetBassIndex = (rootIndex + bassInterval) % 12;

        return {
            inversionName: invData.name,
            targetIndices: targetIndices,
            targetBassIndex: targetBassIndex
        };
    }

    /**
     * Generates specific MIDI notes for a voicing.
     * Used for "Show Answer".
     * 
     * @param {number} rootMidi - The specific MIDI note of the root (e.g., 60)
     * @param {number[]} intervals - Relative intervals
     * @param {number} inversionId - 0, 1, or 2
     * @returns {number[]} - Array of specific MIDI notes
     */
    static generateVoicing(rootMidi, intervals, inversionId) {
        // Start with basic root position notes
        let chordMidi = intervals.map(iv => rootMidi + iv);

        // Apply Inversion Shifting (move lower notes up an octave)
        if (inversionId === 1) {
            // Move Root up
            chordMidi[0] += 12;
        } else if (inversionId === 2) {
            // Move Root and 3rd up
            chordMidi[0] += 12;
            chordMidi[1] += 12;
        }

        // Constraints: Keep notes within playable range (Visual/Audio preference)
        // If the resulting chord is too high (e.g., above B4), drop the whole thing an octave
        const MAX_MIDI = 71;
        if (Math.max(...chordMidi) > MAX_MIDI) {
            chordMidi = chordMidi.map(n => n - 12);
        }

        return chordMidi;
    }
}