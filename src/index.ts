// TODO: FIX WORD LISTS, THEY DO NOT ALIGN

// Different file types & resources
import './styles.css';

// JS & Modules
import { WORD_LIST } from "./wordList";
import { VALID_GUESSES } from "./validGuesses";
import { check } from './wordle';
var alphabet = require('alphabet');

interface WordleGame {
    row: number;
    col: number;
    secretWord: string;
    wordLength: number;
    maxTries: number;
    currentInput: string;
    win: boolean;
    end: boolean;
    stateHistory: string[];
    playHistory: number[];
}

interface Stats {
    played: number,
    winPercent: number,
    inThreePercent: number,
}

var game: WordleGame = {
    row: 0,
    col: 0,
    secretWord: generateSecretWord(), //faffs (test word)
    wordLength: 5,
    maxTries: 6,
    currentInput: '',
    win: false,
    end: false,
    stateHistory: [],
    playHistory: getPlayHistory(),
};

document.addEventListener('keyup', (e) => {
    if (alphabet.includes(e.key)) {
        input(e.key.toUpperCase());
    } else if (e.key === 'Enter' && game.col === 5) {
        submit();
    } else if (e.key === 'Backspace') {
        backspace();
    }
});

window.onbeforeunload = () => {
    syncPlayHistory();
}

document.getElementById('resetButton').addEventListener('click', () => {
    let board: HTMLElement = document.getElementById('board');
    console.log('Resetting...');

    game.row = 0;
    game.col = 0;
    game.currentInput = '';
    game.secretWord = generateSecretWord();
    game.win = false;
    game.end = false;
    game.stateHistory = [];

    // x, y: indexes (as in "var i" for a loop that does not have another loop)
    for (var x = 0; x < board.childNodes.length; x++) {
        let row = board.childNodes.item(x);
        for (var y = 0; y < row.childNodes.length; y++) {
            var col = row.childNodes.item(y)
            col.firstChild.textContent = '';
            // @ts-expect-error
            col.className = 'input';
        }
    }
});

document.getElementById('shareButton').addEventListener('click', () => {
    if (game.end) {
        var shareString: string = `MyWordle ${game.stateHistory.length}/${game.maxTries}\n`;
        // x, y: indexes (as in "var i" for a loop that does not have another loop)
        for (var x = 0; x < game.stateHistory.length; x++) {
            var state: string = game.stateHistory[x];
            for (var y = 0; y < game.stateHistory[x].length; y++) {
                var char: string = state[y];
                if (char === '0') {
                    shareString += '🟩';
                } else if (char === '1') {
                    shareString += '🟨';
                } else {
                    shareString += '⬛';
                }
            }
            if (x < game.stateHistory.length - 1) {
                shareString += '\n';
            }
        }
        navigator.clipboard.writeText(shareString);
        showMessage('Record copied to clipboard!');
    }
})

document.getElementById('statsButton').addEventListener('click', () => {
    var played: number = game.playHistory.length;
    var winNumber: number = 0;
    var inThreeNumber: number = 0;
    game.playHistory.forEach((play) => {
        if (play !== -1) {
            winNumber++;
        }
        if (play <= 3 && play !== -1) {
            inThreeNumber++;
        }
    });
    var stats: Stats = {
        played: played,
        winPercent: Math.round(winNumber / played * 100),
        inThreePercent: Math.round(inThreeNumber / played * 100)
    }
    showMessage(`${stats.played} played\t${stats.winPercent}% won\t${stats.inThreePercent}% in three`)
})

document.getElementById('keyboard').childNodes.forEach((row) => {
    row.childNodes.forEach((key) => {
        key.addEventListener('click', (e) => {
            // @ts-expect-error
            var virtKey: string = e.target.firstChild.textContent;
            if (virtKey !== '+' && virtKey !== '-') {
                input(virtKey.toUpperCase());
            } else if (virtKey === '+' && game.col === 5) {
                submit();
            } else if (virtKey === '-') {
                backspace();
            }
        });
    });
});

function input(letter: string) {
    let board: HTMLElement = document.getElementById('board');
    if (game.col < game.wordLength) {
        board.childNodes.item(game.row).childNodes.item(game.col).firstChild.textContent = letter;

        game.col++;
        game.currentInput += letter.toLowerCase();
    } else {
        console.log('Max word length reached!');
    }
}

function backspace() {
    let board: HTMLElement = document.getElementById('board');
    if (game.col > 0) {
        board.childNodes.item(game.row).childNodes.item(game.col - 1).firstChild.textContent = '';

        game.col--;
        game.currentInput = game.currentInput.substring(0, game.currentInput.length - 1);
    }
}

function submit() {
    console.log('Submitting', game.currentInput);
    var valid: boolean = false;
    var state: string = ''; // 0: match full; 1: match partial; 2: match none

    if (VALID_GUESSES.includes(game.currentInput)) {
        valid = true;
        console.log('Valid input', game.currentInput);

        state = check(game.currentInput, game.secretWord).join('');

        game.stateHistory.push(state);

        if (state === '00000') {
            flip(state);
            game.win = true;
            end();
        } else {
            nextRow(state);
        }
    } else {
        showMessage('That is not an accepted word.');
    }

    console.log('State:', state);
}

function flip(state: string) {
    let board: HTMLElement = document.getElementById('board');
    console.log('State:', state);

    for (var i = 0; i < state.length; i++) {
        if (state[i] === '0') {
            // @ts-expect-error
            board.childNodes.item(game.row).childNodes.item(i).classList.add('state-0');
        } else if (state[i] === '1') {
            // @ts-expect-error
            board.childNodes.item(game.row).childNodes.item(i).classList.add('state-1');
        } else {
            // @ts-expect-error
            board.childNodes.item(game.row).childNodes.item(i).classList.add('state-2');
        }
    }
}

function nextRow(state: string) {
    flip(state);
    game.row++;
    game.col = 0;
    game.currentInput = '';
    if (game.row >= game.maxTries) {
        end();
    } else {
        console.log(game);
    }
}

function end() {
    game.end = true;
    console.log(game);

    if (game.win) {
        game.playHistory.push(game.stateHistory.length);
    } else {
        game.playHistory.push(-1);
    }
    syncPlayHistory();
}

function getPlayHistory(): number[] {
    return JSON.parse(window.localStorage.getItem('playHistory')) || [];
}

function syncPlayHistory() {
    window.localStorage.setItem('playHistory', JSON.stringify(game.playHistory));
}

function generateSecretWord(): string {
    var random: number = Math.floor(Math.random() * WORD_LIST.length);
    return WORD_LIST[random];
}

function showMessage(message: string) {
    document.getElementById('message').firstChild.textContent = message;
    // @ts-expect-error
    document.getElementById('message').firstChild.className = 'showing';
    document.getElementById('message').classList.remove('hidden');
    document.getElementById('message').classList.add('showing');
    setTimeout(() => {
        // @ts-expect-error
        document.getElementById('message').firstChild.className = 'hidden';
        document.getElementById('message').classList.remove('showing');
        document.getElementById('message').classList.add('hidden');
    }, message.length * 150);
}

console.log(game);