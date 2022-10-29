import {blockUntilDOMReady, handleErrors} from "./polyfill.js";


function signalRemote(message) {
    console.warn(`Sending signal: /remote/${message}`);
    fetch('/remote', {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({action: message})
    })
        .then(handleErrors)
        .then(response => console.info("ok", response.text()))
        .catch(error => console.error(error));
}

await blockUntilDOMReady();

['stop', 'float', 'forward', 'backward'].forEach((buttonName) => {
    document.body.appendChild(Object.assign(document.createElement('button'), {
        id: buttonName,
        innerHTML: buttonName.toUpperCase(),
        onclick: () => signalRemote(buttonName)
    }));
});