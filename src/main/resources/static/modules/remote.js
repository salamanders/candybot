import {blockUntilDOMReady, signal} from "./shared.js";

await blockUntilDOMReady();

['forward_l', 'forward_r', 'backward_l', 'backward_r', 'float'].forEach((buttonId) => {
    document.getElementById(buttonId).onclick =  () => signal(buttonId);
});