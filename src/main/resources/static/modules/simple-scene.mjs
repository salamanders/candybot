/* jshint esversion: 11 */
/* jshint quotmark: double */
/* jshint forin: true */

// Example from https://math.hws.edu/graphicsbook/source/threejs/full-window.html

import * as THREE from 'three';
import {MovingStats} from "./moving-stats.mjs";

/** @type {Scene} */
let scene;
/** @type {PerspectiveCamera} */
let camera;
/** @type {WebGLRenderer} */
let renderer;
/** @type {HTMLCanvasElement} The canvas on which the renderer will draw.
 * This will be created by the renderer, and it will be added to the body of the page.
 */
let canvas;
let clock;  // Keeps track of elapsed time of animation.
/** @type {MovingStats} */
let movingStats = new MovingStats('Stats for SimpleScene');

/**  Updates that must complete each frame
 * @type {function[]} */
let blockingUpdates = [];
/** Updates that can run long.  Be careful not to double-up before the previous finishes.
 * @type {function[]} */
let longRunningUpdates = [];

/**
 *  Creates the bouncing balls and the translucent cube in which the balls bounce,
 *  and adds them to the scene.  A light that shines from the direction of the
 *  camera's view is also bundled with the camera and added to the scene.
 */
function createWorld() {
    renderer.setClearColor(0);  // black background
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.1, 100);
    //TODO camera = new THREE.OrthographicCamera(-10,10, -10, 10);

    /* Add the camera and a light to the scene, linked into one object. */

    //let light = new THREE.DirectionalLight();
    //light.position.set(0, 0, 1);
    camera.position.set(25, 40, 50);
    camera.lookAt(scene.position);
    //camera.add(light);
    scene.add(camera);

    /* Create and add the transparent cube to the scene */
    let cube = new THREE.Mesh(
        new THREE.BoxGeometry(20, 20, 20),
        new THREE.MeshPhongMaterial({
            polygonOffset: true,  // will make sure the edges are visible.
            polygonOffsetUnits: 1,
            polygonOffsetFactor: 1,
            color: "white",
            specular: 0x202020,
            transparent: true,
            opacity: 0.3
        })
    );
    scene.add(cube);

    /* Create and add a wireframe cube to the scene, to show the edges of the cube. */
    let edgeGeometry = new THREE.EdgesGeometry(cube.geometry);  // contains edges of cube without diagonal edges
    cube.add(new THREE.LineSegments(edgeGeometry, new THREE.LineBasicMaterial({color: 0xffffff})));
}

export function addTexture(textureSource = null) {
    const planePivot = new THREE.Object3D();
    scene.add(planePivot);
    let texture;

    if(!textureSource) {
        const loader = new THREE.TextureLoader();
        texture = loader.load('https://r105.threejsfundamentals.org/threejs/resources/images/flower-1.jpg');
    } else {
        texture = new THREE.VideoTexture(video);
    }

    texture.magFilter = THREE.NearestFilter;
    const planeMat = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.DoubleSide, //THREE.BackSide
    });
    const planeGeo = new THREE.PlaneGeometry(64, 48);
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    planePivot.add(mesh);

    /* Create and add a wireframe cube to the scene, to show the edges of the cube. */
    let planeEdgeGeometry = new THREE.EdgesGeometry(mesh.geometry);
    mesh.add(new THREE.LineSegments(planeEdgeGeometry, new THREE.LineBasicMaterial({color: 0xffffff})));
}



/**
 *  When an animation is in progress, this function is called just before rendering each
 *  frame of the animation.  In this case, the bouncing balls are moved by an amount
 *
 */
function updateForFrame() {
    let dt = clock.getDelta();  // time since last update

    blockingUpdates.forEach(update => {
        update();
    });
    // TODO: Don't overlap, maybe rate limit
    longRunningUpdates.forEach(update => {
        update();
    })
    movingStats.hit();
}


//--------------------------- animation support -----------------------------------


function doFrame() {
    updateForFrame();
    renderer.render(scene, camera);
    requestAnimationFrame(doFrame);
}

//----------------------- respond to window resizing -------------------------------

/* When the window is resized, we need to adjust the aspect ratio of the camera.
 * We also need to reset the size of the canvas that used by the renderer to
 * match the new size of the window.
 */
function doResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); // For the change in aspect to take effect.
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.info(`doResize() set to ${window.innerWidth}, ${window.innerHeight}.`);
}
/**
 *  Setup after the document has loaded.
 */
export function setup() {
    renderer = new THREE.WebGLRenderer({
        antialias: false
    });

    canvas = renderer.domElement;  // The canvas was created by the renderer.
    renderer.setSize(window.innerWidth, window.innerHeight);  // match size of canvas to window
    window.addEventListener("resize", doResize, false);  // Set up handler for resize event
    document.body.appendChild(canvas);  // The canvas must be added to the body of the page.
    clock = new THREE.Clock(); // For keeping time during the animation.
    createWorld();
    requestAnimationFrame(doFrame);  // Start the animation.
}

