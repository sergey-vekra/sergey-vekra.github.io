import { CHORD_TYPES } from './constants.js';
import * as Audio from './audio.js';
import * as Piano from './piano.js';
import { TaskGenerator } from './task-generator.js';
import { InversionEngine } from './inversion-engine.js';
import { semitoneToLabel, prettyAccidentals } from './note-utils.js';

const taskGen = new TaskGenerator();

let currentTask = null;
let pressedNotes = new Set();
let excludedChords = new Set();
let isFrozen = false;
let lastToggledMidi = -1;
let dragTimeout = null;

const displayEl = document.getElementById('display-chord');
const statusEl = document.getElementById('status-msg');
const excludedListEl = document.getElementById('excluded-list');
const exclusionZoneEl = document.getElementById('exclusion-zone');
const modeSelectEl = document.getElementById('opt-mode');

function gatherOptions() {
    const options = {
        useNaturals: document.getElementById('opt-root-naturals').checked,
        useAccidentals: document.getElementById('opt-root-accidentals').checked,
        enabledTypes: [],
        enabledInversions: []
    };

    if (document.getElementById('opt-major').checked) options.enabledTypes.push('Major');
    if (document.getElementById('opt-minor').checked) options.enabledTypes.push('Minor');
    if (document.getElementById('opt-dim').checked) options.enabledTypes.push('Diminished');
    if (document.getElementById('opt-aug').checked) options.enabledTypes.push('Augmented');

    if (document.getElementById('opt-inv-root').checked) options.enabledInversions.push(0);
    if (document.getElementById('opt-inv-1st').checked) options.enabledInversions.push(1);
    if (document.getElementById('opt-inv-2nd').checked) options.enabledInversions.push(2);

    return options;
}

function generateChord() {
    pressedNotes.clear();
    Piano.updateKeysVisual(pressedNotes);
    isFrozen = false;
    statusEl.textContent = "Select 3 keys";
    statusEl.style.color = "#cbd5e1";

    const options = gatherOptions();
    const result = taskGen.generateTask(options, excludedChords);

    if (result.error) {
        handleGenError(result.error);
        currentTask = null;
        return;
    }

    currentTask = result;

    const label = semitoneToLabel(currentTask.rootSemitone, currentTask.preferAccidental);
    const prettyName = prettyAccidentals(label);

    let displayHTML = `${prettyName}${currentTask.typeLabel}`;
    displayHTML += `<br><div class='sub-text'>${currentTask.inversionName}</div>`;
    displayEl.innerHTML = displayHTML;
}

function handleGenError(error) {
    if (error === 'no-roots') displayEl.innerHTML = "<span style='font-size:1.5rem'>Select Roots</span>";
    else if (error === 'no-types') displayEl.innerHTML = "<span style='font-size:1.5rem'>Select Types</span>";
    else if (error === 'no-inversions') displayEl.innerHTML = "<span style='font-size:1.5rem'>Select Inv</span>";
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

    await Audio.playTone(midiVal, "8n");

    if (pressedNotes.has(midiVal)) pressedNotes.delete(midiVal);
    else pressedNotes.add(midiVal);

    Piano.updateKeysVisual(pressedNotes);

    if (currentTask) checkAnswer();
}

function checkAnswer() {
    if (pressedNotes.size !== 3) return;

    const pressedMidiSorted = Array.from(pressedNotes).sort((a, b) => a - b);
    const pressedIndices = pressedMidiSorted.map(m => m % 12);
    const targetIndicesSorted = [...currentTask.targetIndices].sort((a, b) => a - b);

    const hasCorrectNotes =
        JSON.stringify(pressedIndices.sort((a, b) => a - b)) === JSON.stringify(targetIndicesSorted);

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

async function successSequence() {
    isFrozen = true;
    statusEl.textContent = "Correct!";
    statusEl.style.color = "var(--key-success)";

    Piano.setKeysStatus(Array.from(pressedNotes), 'correct');
    await Audio.playChord(Array.from(pressedNotes));

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
    if (!currentTask) return;
    pressedNotes.clear();

    const typeData = CHORD_TYPES[currentTask.type];
    const rootMidi = 48 + currentTask.rootSemitone;

    const voicing = InversionEngine.generateVoicing(
        rootMidi,
        typeData.intervals,
        currentTask.inversionId
    );

    voicing.forEach(n => pressedNotes.add(n));
    Piano.updateKeysVisual(pressedNotes);
    checkAnswer();
}

function excludeCurrentChord() {
    if (!currentTask) return;
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
            const [rootSemitoneStr, type] = id.split('|');
            const rootSemitone = Number(rootSemitoneStr);

            const lbl = CHORD_TYPES[type].label;
            const rootLabel = prettyAccidentals(semitoneToLabel(rootSemitone, 'auto'));

            const tag = document.createElement('div');
            tag.className = 'tag';
            tag.innerHTML = `<span>${rootLabel}${lbl}</span>`;
            tag.onclick = () => restoreChord(id);
            excludedListEl.appendChild(tag);
        });
    } else {
        exclusionZoneEl.style.display = 'none';
    }
}

modeSelectEl.addEventListener('change', (e) => {
    taskGen.setMode(e.target.value);
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
