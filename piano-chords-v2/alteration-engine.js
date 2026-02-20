export class AlterationEngine {
    static getValidShifts(rootSemitone, allowNaturals, allowAccidentals) {
        const shifts = [];

        if (allowNaturals) shifts.push(0);

        if (allowAccidentals) {
            const flatIndex = (rootSemitone - 1 + 12) % 12;
            if (this._isBlackKey(flatIndex)) shifts.push(-1);

            const sharpIndex = (rootSemitone + 1) % 12;
            if (this._isBlackKey(sharpIndex)) shifts.push(1);
        }

        return shifts;
    }

    static applyShift(rootSemitone, shift) {
        return (rootSemitone + shift + 12) % 12;
    }

    static _isBlackKey(index) {
        return [1, 3, 6, 8, 10].includes(index);
    }
}
