/* jshint esversion: 8 */
/* jshint undef: true, unused: true */

import {blockUntilDOMReady, signal} from './shared.js';

await blockUntilDOMReady();

const replaySeqHolder = document.getElementById('replay_seq');

Array.from(document.querySelectorAll(".navButton")).forEach(button => button.onclick = async () => {
    replaySeqHolder.innerHTML += button.innerHTML;
    await signal(button.id);
});

document.getElementById('center_middle').onclick = () => {
    console.info('Halt and catch fire.');
    signal('center_middle').then(()=>console.log('ignoring response.'));
    replaySeqHolder.innerHTML = '';
};

/**
 *
 * @param {string} qualifiedName
 * @param {string} text
 * @return {*}
 */
function findElementWithText(qualifiedName, text) {
    const tags = document.getElementsByTagName(qualifiedName);
    for (let i = 0; i < tags.length; i++) {
        if (tags[i].textContent === text) {
            return(tags[i]);
        }
    }
    console.error(`nothing found from findElementWithText('${qualifiedName}','${text}')`)
}

/**
 *
 * @param {string} commands
 */
async function replayNext(commands) {
    if (commands.length < 1) {
        return;
    }
    const command = commands.charAt(0);
    const button = findElementWithText('button', command);
    await signal(button.id);
    await replayNext(commands.substring(1));
}

document.getElementById('replay').onclick = async () => {
    console.info(`starting replay of '${replaySeqHolder.innerHTML}'`);
    await replayNext(replaySeqHolder.innerHTML);
    console.info("Finished replay")
};

