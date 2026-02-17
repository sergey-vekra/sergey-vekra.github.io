import { CHORD_TYPES } from './constants.js';
import * as Audio from './audio.js';
import * as Piano from './piano.js';
import { ChordGenerator } from './chord-generator.js';
import { InversionEngine } from './inversion-engine.js';
import { AlterationEngine } from './alteration-engine.js'; // Import New Engine

/** STATE */
const chordGen = new ChordGenerator();
let currentTask = { rootName: null, rootIndex: null, type: null, inversion: 0, id: null, targetIndices: [], targetBassIndex: 0 };
let pressedNotes = new Set();
let excludedChords = new Set();
let isFrozen = false;
let lastToggledMidi = -1;
let dragTimeout = null;

/** DOM ELEMENTS */
const displayEl = document.getElementById('display-chord');
const statusEl = document.getElementById('status-msg');
const excludedListEl = document.getElementById('excluded-list');
const exclusionZoneEl = document.getElementById('exclusion-zone');
const modeSelectEl = document.getElementById('opt-mode');

/** GAME LOGIC */
function generateChord() {
    pressedNotes.clear();
    Piano.updateKeysVisual(pressedNotes);
    isFrozen = false;
    statusEl.textContent = "Select 3 keys";
    statusEl.style.color = "#cbd5e1";

    // 1. Gather Options
    const useNaturals = document.getElementById('opt-root-naturals').checked;
    const useAccidentals = document.getElementById('opt-root-accidentals').checked;

    // Validation
    if (!useNaturals && !useAccidentals) {
        displayEl.innerHTML = "<span style='font-size:1.5rem'>Select Roots</span>";
        return;
    }

    const genOptions = {
        useNaturals,
        useAccidentals,
        enabledTypes: []
    };

    if (document.getElementById('opt-major').checked) genOptions.enabledTypes.push('Major');
    if (document.getElementById('opt-minor').checked) genOptions.enabledTypes.push('Minor');
    if (document.getElementById('opt-dim').checked) genOptions.enabledTypes.push('Diminished');
    if (document.getElementById('opt-aug').checked) genOptions.enabledTypes.push('Augmented');

    const enabledInversions = [];
    if (document.getElementById('opt-inv-root').checked) enabledInversions.push(0);
    if (document.getElementById('opt-inv-1st').checked) enabledInversions.push(1);
    if (document.getElementById('opt-inv-2nd').checked) enabledInversions.push(2);

    if (enabledInversions.length === 0 || genOptions.enabledTypes.length === 0) {
        displayEl.innerHTML = "<span style='font-size:1.5rem'>Select options</span>";
        return;
    }

    // 2. Get Base Chord (Natural or Circle-Precalculated)
    const baseSelection = chordGen.getNextChord(genOptions, excludedChords);

    if (baseSelection.error) {
        handleGenError(baseSelection.error);
        return;
    }

    // 3. Apply Alteration Engine (Only if not precalculated by Circle mode)
    let finalRootIndex = baseSelection.rootIndex;
    let finalRootName = baseSelection.rootName;

    if (!baseSelection.isPrecalculated) {
        // Calculate valid shifts (0, -1, 1) based on settings
        const validShifts = AlterationEngine.getValidShifts(
            baseSelection.rootIndex,
            useNaturals,
            useAccidentals
        );

        if (validShifts.length === 0) {
            // Should not happen if inputs are validated, but safe fallback
            generateChord();
            return;
        }

        // Randomly pick a shift
        const shift = validShifts[Math.floor(Math.random() * validShifts.length)];

        // Apply the shift
        const altered = AlterationEngine.applyShift(baseSelection.rootIndex, shift);
        finalRootIndex = altered.chromaticIndex;
        finalRootName = altered.rootName;
    }

    // 4. Construct ID for exclusion check
    // We construct the ID now that we have the final modified root name
    const finalId = `${finalRootName}|${baseSelection.type}`;
    if (excludedChords.has(finalId)) {
        // If the resulting accidentals made a chord we already excluded, try again
        generateChord();
        return;
    }

    // 5. Apply Inversion Engine
    const invId = InversionEngine.selectRandomInversion(enabledInversions);
    const typeData = CHORD_TYPES[baseSelection.type];

    const invResult = InversionEngine.calculateTarget(
        finalRootIndex,
        typeData.intervals,
        invId
    );

    // 6. Update State
    currentTask = {
        rootName: finalRootName,
        rootIndex: finalRootIndex,
        type: baseSelection.type,
        inversion: invId,
        id: finalId,
        label: baseSelection.label,
        targetIndices: invResult.targetIndices,
        targetBassIndex: invResult.targetBassIndex,
        inversionName: invResult.inversionName
    };

    // 7. Render
    const prettyName = currentTask.rootName
        .replace('#', '♯')
        .replace('b', '♭');

    let displayHTML = `${prettyName}${currentTask.label}`;
    displayHTML += `<br><div class='sub-text'>${currentTask.inversionName}</div>`;
    displayEl.innerHTML = displayHTML;
}

// ... (Rest of file: handleKeyInteraction, checkAnswer, etc. remains identical) ...
function handleGenError(error) {
    if (error === 'no-roots') displayEl.innerHTML = "<span style='font-size:1.5rem'>Select Roots</span>";
    else if (error === 'no-types') displayEl.innerHTML = "<span style='font-size:1.5rem'>Select Types</span>";
    else if (error === 'completed') {
        displayEl.textContent = "All Done!";
        statusEl.textContent = "You've mastered all selected chords!";
        statusEl.style.color = "var(--key-success)";
    }
}

async function handleKeyInteraction(midiVal) {
    if (isFrozen) return;
    await Audio.initAudio();

    if (midiVal === lastToggledMidi) return;
    lastToggledMidi = midiVal;
    clearTimeout(dragTimeout);
    dragTimeout = setTimeout(() => { lastToggledMidi = -1; }, 150);

    Audio.playTone(midiVal, "8n");

    if (pressedNotes.has(midiVal)) {
        pressedNotes.delete(midiVal);
    } else {
        pressedNotes.add(midiVal);
    }

    Piano.updateKeysVisual(pressedNotes);
    checkAnswer();
}

function checkAnswer() {
    if (pressedNotes.size !== 3) return;

    const pressedMidiSorted = Array.from(pressedNotes).sort((a, b) => a - b);
    const pressedIndices = pressedMidiSorted.map(m => m % 12);
    const targetIndicesSorted = [...currentTask.targetIndices].sort((a, b) => a - b);

    const hasCorrectNotes = JSON.stringify(pressedIndices.sort((a, b) => a - b)) === JSON.stringify(targetIndicesSorted);

    if (!hasCorrectNotes) {
        failSequence("Try again");
        return;
    }

    const lowestPressedIndex = pressedMidiSorted[0] % 12;
    if (lowestPressedIndex !== currentTask.targetBassIndex) {
        statusEl.textContent = "Right notes, wrong inversion. Check bass.";
        statusEl.style.color = "var(--key-warn)";
        Piano.updateKeysVisual(pressedNotes, pressedMidiSorted);
        setTimeout(() => Piano.updateKeysVisual(pressedNotes), 500);
        return;
    }

    successSequence();
}

function successSequence() {
    isFrozen = true;
    statusEl.textContent = "Correct!";
    statusEl.style.color = "var(--key-success)";

    Piano.setKeysStatus(Array.from(pressedNotes), 'correct');
    Audio.playChord(Array.from(pressedNotes));

    setTimeout(() => { generateChord(); }, 1200);
}

function failSequence(msg) {
    statusEl.textContent = msg;
    statusEl.style.color = "var(--key-error)";
    const currentNotes = Array.from(pressedNotes);
    Piano.setKeysStatus(currentNotes, 'wrong');
    setTimeout(() => { Piano.updateKeysVisual(pressedNotes); }, 300);
}

function showAnswer() {
    if (currentTask.rootIndex === null || !currentTask.type) return;
    pressedNotes.clear();

    const typeData = CHORD_TYPES[currentTask.type];
    const rootMidi = 48 + currentTask.rootIndex;

    const voicing = InversionEngine.generateVoicing(
        rootMidi,
        typeData.intervals,
        currentTask.inversion
    );

    voicing.forEach(n => pressedNotes.add(n));
    Piano.updateKeysVisual(pressedNotes);
    checkAnswer();
}

function excludeCurrentChord() {
    if (currentTask.rootIndex === null) return;
    excludedChords.add(currentTask.id);
    renderExcludedList();
    generateChord();
}

function restoreChord(id) {
    excludedChords.delete(id);
    renderExcludedList();
    if (displayEl.textContent === "All Done!") generateChord();
}

function renderExcludedList() {
    excludedListEl.innerHTML = '';
    if (excludedChords.size > 0) {
        exclusionZoneEl.style.display = 'block';
        excludedChords.forEach(id => {
            const [rootName, type] = id.split('|');
            const lbl = CHORD_TYPES[type].label;
            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.innerHTML = `<span>${rootName}${lbl}</span>`;
            tag.onclick = () => restoreChord(id);
            excludedListEl.appendChild(tag);
        });
    } else {
        exclusionZoneEl.style.display = 'none';
    }
}

modeSelectEl.addEventListener('change', (e) => {
    chordGen.setMode(e.target.value);
    generateChord();
});

document.getElementById('btn-skip').addEventListener('click', generateChord);
document.getElementById('btn-show').addEventListener('click', showAnswer);
document.getElementById('btn-exclude').addEventListener('click', excludeCurrentChord);

document.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', () => {
        const row = cb.closest('.option-row');
        if (row) {
            const checkedInRow = row.querySelectorAll('input:checked');
            if (checkedInRow.length === 0) cb.checked = true;
        }
        generateChord();
    });
});

Piano.initPiano('piano', handleKeyInteraction);
generateChord();