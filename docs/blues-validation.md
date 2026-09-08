# Blues de Bolso - 2026-09-07

The active UI is now an untimed, monophonic blues notebook. The earlier songLibrary is retained as legacy material but is not used by this experience.

## Teaching material

The five studies in src/lib/blues.ts are original beginner arrangements, not copied tabs or transcriptions of commercial recordings. The reference links are attached to each study in the library:

- My first blues: https://www.guitarlessons.com/guitar-lessons/blues-guitar-quick-start-series/the-12-bar-blues-progression/
- Shuffle: https://www.guitarlessons.com/guitar-lessons/blues-guitar-quick-start-series/the-basic-12-bar-blues-riff/
- Pentatonic conversation: https://www.justinguitar.com/modules/essential-blues-lead-guitar
- Seventh-chord arpeggios: https://www.guitarlessons.com/guitar-lessons/blues-guitar-quick-start-series/dominant-seventh-blues-chords/
- Turnaround: https://www.guitarlessons.com/guitar-lessons/blues-guitar-quick-start-series/turnaround-blues-guitar-licks/

The exercises use individual notes, frets 0-4 and standard tuning. Chord labels describe harmonic context; they do not claim simultaneous chord recognition. No imported songs, score penalties or tempo gates are active.

## Detection

Pitchy (McLeod Pitch Method): https://github.com/ianprime0509/pitchy

4096-sample windows, actual AudioContext sample rate, analysis about every 45 ms. Practice uses fresh raw observations, requires 110 ms of consistent pitch, includes octave, and allows up to 25 cents of deviation. Sustain cannot advance the next step repeatedly. Repeated identical notes require silence of at least 140 ms or a clear amplitude attack. Tuner display uses the stabilizer but held values do not authorize peg adjustments. Semitone changes are no longer blended as one note.

Pitch alone cannot identify which physical string produced an overlapping note. Red lines indicate possible positions, not asserted physical-string identification. Acoustic chords are not validated by this monophonic mode.

## Verification

- Detector smoke at 44100 and 48000 Hz across all pitches in the five studies: less than 3 cents error on the tested synthetic harmonic signals.
- End-to-end detector/follower tests complete every study, reject wrong octaves and +/-35-cent notes, and suppress duplicate sustained hits.
- Mounted React smoke tests: advance, sustain, wrong-note feedback, recovery, pause, restart, completion, tuner and help dialog.
- Browser Web Audio smoke with a temporary synthetic MediaStream: E2 82.41 Hz reads centered; +/-30 cents gives the appropriate direction; E3 with E2 selected gives a check-string message. Practice rejects E3, accepts E2, holds one advancement throughout sustain, and accepts B2 next.
- Desktop and 390px viewport screenshots inspected. Six equal-height tablature rows; no horizontal page overflow. Fonts and drawing are bundled locally.

These are synthetic-audio and UI tests, not a calibration against this user's physical guitar and microphone. Real-room noise, overlapping strings and dominant harmonics remain conditions to evaluate on hardware.

## Running

`npm run dev -- --port 5173` serves the notebook locally.
`npm test` runs unit, signal and mounted application tests.
`npm run build` produces the static web app.
`node scripts/package-windows.mjs` stages only dist, Electron entry files and package metadata, avoiding recursive inclusion of earlier delivery folders.
