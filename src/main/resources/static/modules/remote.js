/* jshint esversion: 8 */
/* jshint undef: true, unused: true */

import {blockUntilDOMReady, signal} from './shared.js';

await blockUntilDOMReady();

Array.from(document.getElementsByTagName('button')).forEach(
  button => button.onclick = () => signal(button.id)
);