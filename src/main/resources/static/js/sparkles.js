/* jshint esversion: 11 */

// Code entirely from https://github.com/ethanhjennings/webgl-fire-particles
let fireParticles = [];
let sparkParticles = [];
const textureList = ["thicker_gradient.png"];
const images = [];
const textures = [];
let currentTextureIndex = 0;
const currentlyPressedKeys = {};
let mouseDown = false;
let mousePos = {};
let particleDiscrepancy = 0;
let lastParticleTime = performance.now();
let sparkParticleDiscrepancy = 0;
/** @type {WebGLContext} */
let gl = null;
let rectArray = [];
let colorArray = [];
let rects = [];
noise.seed(Math.random());

const options = {
    // some of these options are not actually available in the UI to save visual space
    fireEmitPositionSpread: { x: 20, y: 20 },

    fireEmitRate: 20,
    fireEmitRateSlider: { min: 1, max: 5000 },

    fireSize: 10.0,
    fireSizeSlider: { min: 2.0, max: 100.0 },

    fireSizeVariance: 100.0,
    fireSizeVarianceSlider: { min: 0.0, max: 100.0 },

    fireEmitAngleVariance: 0.42,
    fireEmitAngleVarianceSlider: { min: 0.0, max: Math.PI / 2 },

    fireSpeed: 200.0,
    fireSpeedSlider: { min: 20.0, max: 500 },

    fireSpeedVariance: 80.0,
    fireSpeedVarianceSlider: { min: 0.0, max: 100.0 },

    fireDeathSpeed: 0.003,
    fireDeathSpeedSlider: { min: 0.001, max: 0.05 },

    fireTriangleness: 0.00015,
    fireTrianglenessSlider: { min: 0.0, max: 0.0003 },

    fireTextureHue: 25.0,
    fireTextureHueSlider: { min: -180, max: 180 },

    fireTextureHueVariance: 180.0,
    fireTextureHueVarianceSlider: { min: 0.0, max: 180 },

    fireTextureColorize: true,
    wind: false,
    omnidirectionalWind: false,

    windStrength: 20.0,
    windStrengthSlider: { min: 0.0, max: 60.0 },

    windTurbulance: 0.0003,
    windTurbulanceSlider: { min: 0.0, max: 0.001 },

    sparks: true,

    sparkEmitRate: 6.0,
    sparkEmitSlider: { min: 0.0, max: 10.0 },

    sparkSize: 10.0,
    sparkSizeSlider: { min: 5.0, max: 100.0 },

    sparkSizeVariance: 20.0,
    sparkSizeVarianceSlider: { min: 0.0, max: 100.0 },

    sparkSpeed: 400.0,
    sparkSpeedSlider: { min: 20.0, max: 700.0 },

    sparkSpeedVariance: 80.0,
    sparkSpeedVarianceSlider: { min: 0.0, max: 100.0 },

    sparkDeathSpeed: 0.0085,
    sparkDeathSpeedSlider: { min: 0.002, max: 0.05 },

};



function loadTexture(textureName, index) {
    textures[index] = gl.createTexture();
    images[index] = new Image();
    images[index].onload = () => { handleTextureLoaded(images[index], index, textureName); };
    images[index].onerror = () => { alert(`ERROR: texture ${textureName} can't be loaded!`); console.error(`ERROR: texture ${textureName} can't be loaded!`); };
    images[index].src = textureName;
    console.log(`starting to load ${textureName}`);
}

function handleTextureLoaded(image, index, textureName) {
    console.log(`loaded texture ${textureName}`);
    gl.bindTexture(gl.TEXTURE_2D, textures[index]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);

    // load the next texture
    if (index < textureList.length - 1)
        loadTexture(`textures/${textureList[index + 1]}`, index + 1);

}

function loadAllTextures() {
    /*
    const fireTextureCombobox = document.getElementById("fireTexture");
    fireTextureCombobox.onchange = () => {
        const image = document.getElementById("fireTextureVal");
        const newIndex = fireTextureCombobox.selectedIndex;
        image.src = `textures/${textureList[newIndex]}`;
        currentTextureIndex = newIndex;
    };
    for (let i = 0; i < textureList.length; i++) {
        fireTextureCombobox.options.add(new Option(textureList[i], i));
    }
    fireTextureCombobox.selectedIndex = 2;
    */
    loadTexture(`textures/${textureList[0]}`, 0);
}



function createFireParticle(emitCenter) {
    const activeMultiplier = mousePos.isActive ? 10 : 1;
    const size = randomSpread(options.fireSize, options.fireSize * (options.fireSizeVariance / 100.0) * activeMultiplier);
    const speed = randomSpread(options.fireSpeed, options.fireSpeed * (options.fireSpeedVariance / 100.0) * activeMultiplier);
    let color = {};
    if (!options.fireTextureColorize)
        color = { r: 1.0, g: 1.0, b: 1.0, a: 0.5 };
    else {
        const hue = randomSpread(options.fireTextureHue, options.fireTextureHueVariance);
        color = HSVtoRGB(convertHue(hue), 1.0, 1.0);
        color.a = 0.5;
    }
    const particle = {
        pos: random2DVec(emitCenter, options.fireEmitPositionSpread),
        vel: scaleVec(randomUnitVec(Math.PI / 2, options.fireEmitAngleVariance), speed),
        size: {
            width: size,
            height: size
        },
        color,
    };
    fireParticles.push(particle);
}

function createSparkParticle(emitCenter) {
    const size = randomSpread(options.sparkSize, options.sparkSize * (options.sparkSizeVariance / 100.0));
    const origin = clone2DVec(emitCenter);
    const speed = randomSpread(options.sparkSpeed, options.sparkSpeed * options.sparkSpeedVariance / 100.0);
    const particle = {
        origin,
        pos: random2DVec(emitCenter, options.fireEmitPositionSpread),
        vel: scaleVec(randomUnitVec(Math.PI / 2, options.fireEmitAngleVariance * 2.0), speed),
        size: {
            width: size,
            height: size
        },
        color: { r: 1.0, g: 0.8, b: 0.3, a: 1.0 }
    };
    sparkParticles.push(particle);
}

function handleKeyDown({ keyCode }) {
    currentlyPressedKeys[keyCode] = true;
}

function handleKeyUp({ keyCode }) {
    currentlyPressedKeys[keyCode] = false;
}

function canvasCoordinates(canvas, { x, y }) {
    const rect = canvas.getBoundingClientRect();
    return { x: x - rect.left, y: y - rect.top };
}

function handleMouseDown({ clientX, clientY }) {
    mouseDown = true;
    mousePos = canvasCoordinates(canvas, { x: clientX, y: clientY });
}

function handleMouseMove({ clientX, clientY }) {
    mousePos = canvasCoordinates(canvas, { x: clientX, y: clientY });
    mousePos.isActive = mousePos.y < 250;
    //console.log(`mousePos: ${mousePos.x}, ${mousePos.y}`);
}

function handleMouseUp(event) {
    mouseDown = false;
}

async function loadShader(gl, url, shaderType) {
    const shaderSource =
        await fetch(url).then((response) => {
            if (response.ok) {
                return response.text();
            }
            throw new Error(`Web request to fetch shader failed at ${url}`);
        });

    let shader = gl.createShader(shaderType);
    gl.shaderSource(shader, shaderSource);
    gl.compileShader(shader);

    let compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (!compiled) {
        lastError = gl.getShaderInfoLog(shader);
        throw new Error(`*** Error compiling shader '${shader}':${lastError}`);
        //gl.deleteShader(shader);
        //return null;
    }

    return shader;
}

async function sparkles() {

    // Get A WebGL context
    canvas = document.getElementById("canvas");
    gl = getWebGLContext(canvas);
    if (!gl) {
        return;
    }

    loadAllTextures();

    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array([255, 0, 0, 255])); // red

    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    vertexBuffer = gl.createBuffer();
    colorBuffer = gl.createBuffer();
    squareTextureCoordinateVertices = gl.createBuffer();

    // setup GLSL program
    const vertexShader = await loadShader(gl, "js/vertex-shader.js", gl.VERTEX_SHADER);
    const fragmentShader = await loadShader(gl, "js/fragment-shader.js", gl.FRAGMENT_SHADER);

    const program = createProgram(gl, [vertexShader, fragmentShader]);
    gl.useProgram(program);

    // look up where the vertex data needs to go.
    positionAttrib = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttrib);
    colorAttrib = gl.getAttribLocation(program, "a_color");
    gl.enableVertexAttribArray(colorAttrib);
    textureCoordAttribute = gl.getAttribLocation(program, "a_texture_coord");
    gl.enableVertexAttribArray(textureCoordAttribute);

    // lookup uniforms
    resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    textureSamplerLocation = gl.getUniformLocation(program, "u_sampler")

    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    canvas.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
    gl.enable(gl.BLEND);

    animloop();
}

// main program loop
function animloop() {
    requestAnimFrame(animloop);
    logic();
    render();
}

function keyCodePressed(charVal) {
    return currentlyPressedKeys[charVal.charCodeAt(0)];
}



// calculate new positions for all the particles
function logic() {
    const activeMultiplier = mousePos.isActive ? 10 : 1;
    const currentParticleTime = performance.now();
    let timeDifference = currentParticleTime - lastParticleTime;

    // we don't want to generate a ton of particles if the browser was minimized or something
    if (timeDifference > 100)
        timeDifference = 100;

    // update fire particles

    particleDiscrepancy += activeMultiplier * options.fireEmitRate * (timeDifference) / 1000.0;
    while (particleDiscrepancy > 0 && mouseDown) {
        createFireParticle(mousePos);
        particleDiscrepancy -= 1.0;
    }

    particleAverage = { x: 0, y: 0 };
    const numParts = fireParticles.length;
    for (let i = 0; i < numParts; i++) {
        particleAverage.x += fireParticles[i].pos.x / numParts;
        particleAverage.y += fireParticles[i].pos.y / numParts;
    }


    for (let i = 0; i < fireParticles.length; i++) {
        const x = fireParticles[i].pos.x;
        const y = fireParticles[i].pos.y;

        // apply wind to the velocity
        if (options.wind) {
            if (options.omnidirectionalWind)
                fireParticles[i].vel = addVecs(fireParticles[i].vel, scaleVec(unitVec((noise.simplex3(x / 500, y / 500, lastParticleTime * options.windTurbulance) + 1.0) * Math.PI), options.windStrength));
            else
                fireParticles[i].vel = addVecs(fireParticles[i].vel, scaleVec(unitVec((noise.simplex3(x / 500, y / 500, lastParticleTime * options.windTurbulance) + 1.0) * Math.PI * 0.5), options.windStrength));
        }
        // move the particle
        fireParticles[i].pos = addVecs(fireParticles[i].pos, scaleVec(fireParticles[i].vel, timeDifference / 1000.0));

        fireParticles[i].color.a -= options.fireDeathSpeed + Math.abs(particleAverage.x - fireParticles[i].pos.x) * options.fireTriangleness;//;Math.abs((fireParticles[i].pos.x-canvas.width/2)*options.fireTriangleness);

        if (fireParticles[i].pos.y <= -fireParticles[i].size.height * 2 || fireParticles[i].color.a <= 0)
            markForDeletion(fireParticles, i);
    }
    fireParticles = deleteMarked(fireParticles);

    // update spark particles
    sparkParticleDiscrepancy += activeMultiplier * options.sparkEmitRate * (timeDifference) / 1000.0;
    while (sparkParticleDiscrepancy > 0) {
        createSparkParticle(mousePos);
        sparkParticleDiscrepancy -= 1.0;
    }

    for (var i = 0; i < sparkParticles.length; i++) {

        var x = sparkParticles[i].pos.x;
        var y = sparkParticles[i].pos.y;
        sparkParticles[i].vel = addVecs(sparkParticles[i].vel, scaleVec(unitVec((noise.simplex3(x / 500, y / 500, lastParticleTime * 0.0003) + 1.0) * Math.PI * 0.5), 20.0));
        sparkParticles[i].pos = addVecs(sparkParticles[i].pos, scaleVec(sparkParticles[i].vel, timeDifference / 1000.0));

        sparkParticles[i].color.a -= options.sparkDeathSpeed;

        if (sparkParticles[i].pos.y <= -sparkParticles[i].size.height * 2 || sparkParticles[i].color.a <= 0)
            markForDeletion(sparkParticles, i);
    }
    sparkParticles = deleteMarked(sparkParticles);

    //document.getElementById("numParticles").innerHTML = ` particles: ${fireParticles.length + sparkParticles.length}`;

    lastParticleTime = currentParticleTime;
}

function render() {

    gl.clear(gl.COLOR_BUFFER_BIT);

    // set the resolution
    gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
    gl.uniform1i(textureSamplerLocation, 0);

    drawRects(fireParticles);
    if (options.sparks)
        drawRects(sparkParticles);
}


function concat_inplace(index, arr1, arr2) {
    for (let i = 0; i < arr2.length; i++) {
        arr1[index] = arr2[i];
        index += 1;
    }
    return index;
}


function drawRects(rects, textureIndex) {
    let index = 0;
    let colorIndex = 0;
    let texIndex = 0;
    rectArray = [];
    colorArray = [];
    textureCoordinates = [];
    for (let i = 0; i < rects.length; i++) {
        const x1 = rects[i].pos.x - rects[i].size.width / 2;
        const x2 = rects[i].pos.x + rects[i].size.width / 2;
        const y1 = rects[i].pos.y - rects[i].size.height / 2;
        const y2 = rects[i].pos.y + rects[i].size.height / 2;
        index = concat_inplace(index, rectArray, [
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2]);
        texIndex = concat_inplace(texIndex, textureCoordinates, [
            0.0, 0.0,
            1.0, 0.0,
            0.0, 1.0,
            0.0, 1.0,
            1.0, 0.0,
            1.0, 1.0
        ]);
        for (let ii = 0; ii < 6; ii++) {
            colorIndex = concat_inplace(colorIndex, colorArray, [
                rects[i].color.r,
                rects[i].color.g,
                rects[i].color.b,
                rects[i].color.a
            ]);
        }
    }

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textures[currentTextureIndex]);

    gl.bindBuffer(gl.ARRAY_BUFFER, squareTextureCoordinateVertices);
    gl.vertexAttribPointer(textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates),
        gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.vertexAttribPointer(positionAttrib, 2, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(rectArray), gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.vertexAttribPointer(colorAttrib, 4, gl.FLOAT, false, 0, 0);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colorArray), gl.STATIC_DRAW);

    gl.drawArrays(gl.TRIANGLES, 0, rects.length * 6);
}
