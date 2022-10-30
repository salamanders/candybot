import {blockUntilDOMReady, signal} from "./shared.js";


await blockUntilDOMReady();

['open_hold_close', 'stop', 'hold', 'float', 'forward', 'backward', 'wait'].forEach((buttonName) => {
    document.body.appendChild(Object.assign(document.createElement('button'), {
        id: buttonName,
        innerHTML: buttonName.toUpperCase(),
        onclick: () => signal(buttonName)
    }));
});