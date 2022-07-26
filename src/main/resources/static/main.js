/*jshint esversion: 8 */

import { startPoseRecognition, openServerCommunication } from './modules/simple-pose.js';

openServerCommunication();

await startPoseRecognition();