import { RandomSequence, CircleSequence } from './sequence-logic.js';
import { AlterationEngine } from './alteration-engine.js';
import { InversionEngine } from './inversion-engine.js';
import { ChordGenerator } from './chord-generator.js';

export class TaskGenerator {
    constructor() {
        this.strategies = {
            random: new RandomSequence(),
            circle: new CircleSequence()
        };

        this.currentMode = 'random';
        this.chordGen = new ChordGenerator();
    }

    setMode(mode) {
        if (!this.strategies[mode]) return;
        this.currentMode = mode;
        if (this.strategies[mode].reset) this.strategies[mode].reset();
    }

    generateTask(options, excludedIds = new Set()) {
        const strategy = this.strategies[this.currentMode];
        const MAX_RETRIES = 40;

        if (options.enabledTypes.length === 0) return { error: 'no-types' };
        if (!options.useNaturals && !options.useAccidentals) return { error: 'no-roots' };
        if (options.enabledInversions.length === 0) return { error: 'no-inversions' };

        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const base = strategy.getNext(options);
            if (!base) return { error: 'completed' };

            const validShifts = AlterationEngine.getValidShifts(
                base.rootSemitone,
                options.useNaturals,
                options.useAccidentals
            );

            const shift = base.shift ?? 0;
            if (!base.isFixedRoot && !validShifts.includes(shift)) continue;
            if (base.isFixedRoot && shift !== 0) continue;

            const finalRootSemitone = base.isFixedRoot
                ? base.rootSemitone
                : AlterationEngine.applyShift(base.rootSemitone, shift);

            const id = `${finalRootSemitone}|${base.type}`;
            if (excludedIds.has(id)) continue;

            const rootChord = this.chordGen.generateRootChord(finalRootSemitone, base.type);
            if (!rootChord) continue;

            const inversionId = base.inversionId ?? 0;
            if (!options.enabledInversions.includes(inversionId)) continue;

            const invResult = InversionEngine.calculateTarget(
                finalRootSemitone,
                rootChord.intervals,
                inversionId
            );

            return {
                id,
                rootSemitone: finalRootSemitone,
                preferAccidental: base.preferAccidental ?? 'auto',
                type: base.type,
                typeLabel: rootChord.typeLabel,
                inversionId,
                inversionName: invResult.inversionName,
                targetIndices: invResult.targetIndices,
                targetBassIndex: invResult.targetBassIndex
            };
        }

        return { error: 'completed' };
    }
}
