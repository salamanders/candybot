import {blockUntilDOMReady, signal} from "./shared.js";

await blockUntilDOMReady();

['forward_l', 'forward_r', 'backward_l', 'backward_r', 'float'].forEach((buttonName) => {
    document.body.appendChild(Object.assign(document.createElement('button'), {
        id: buttonName,
        innerHTML: buttonName.toUpperCase(),
        onclick: () => signal(buttonName)
    }));
});