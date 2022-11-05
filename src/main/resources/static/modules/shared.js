/* jshint esversion: 11 */
/* jshint quotmark: double */
/* jshint forin: true */


export async function blockUntilDOMReady() {
    return new Promise(resolve => {
        // Block on document being fully ready, in case we need to build a login button
        if (document.readyState === 'complete') {
            console.info(`document.readyState=${document.readyState}`);
            resolve();
            return;
        }
        const onReady = () => {
            console.info(`blockUntilDOMReady:done`);
            resolve();
            document.removeEventListener('DOMContentLoaded', onReady, true);
            window.removeEventListener('load', onReady, true);
        };
        document.addEventListener('DOMContentLoaded', onReady, true);
        window.addEventListener('load', onReady, true);
    });
}

/**
 * fetch handler
 * @param {Response} response
 * @return {{ok}|*}
 */
function handleErrors(response) {
    if (!response.ok) {
        console.error(response.statusText);
    }
    return response;
}

/**
 *
 * @param message
 * @return {Promise<Response | void>}
 */
export async function signal(message) {
    console.warn(`Sending signal: /motor/${message}`);
    return fetch('/motor', {
        method: 'POST', headers: {
            'Accept': 'application/json', 'Content-Type': 'application/json'
        }, body: JSON.stringify({action: message})
    })
        .then(handleErrors)
        .catch(error => console.error(error));
}
