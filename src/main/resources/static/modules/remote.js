import {blockUntilDOMReady, signal} from "./shared.js";


await blockUntilDOMReady();

['stop', 'float', 'forward', 'backward'].forEach((buttonName) => {
    document.body.appendChild(Object.assign(document.createElement('button'), {
        id: buttonName,
        innerHTML: buttonName.toUpperCase(),
        onclick: () => signal(buttonName)
    }));
});