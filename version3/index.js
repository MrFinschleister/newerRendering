let canvas;
let ctx;

let loop;
let tickRate = 16;
let tick = 0;
let resetTicks = 1000;

let objectiveBenchmarker;
let iterationBenchmarker;

let zNear = -500;
let velocityMax = 10;
let friction = 0.9;

let origin = new Vector3(0, 0, 0);
let rotations = new Vector3(0, 0, 0);
let translations = new Vector3(0, 0, 0);
let velocity = new Vector3(0, 0, 0);
let acceleration = new Vector3(10, 10, 10);

let vertexType = 1;
// 0 => triangles, 1 => triangle strips
let attributeInterpolationMode = 0;
// 0 => barycentric, 1 => first vertex, 2 => nearest
let coordinateInterpolationMode = 0;
// 0 => uses attribute interpolation mode, 1 => always correct
// ~~~ both modes recenter the coordinates by adding half the canvas dimensions
let colorMode = 0;
// 0 => vertex color, 1 => texture color
let shadingMode = 0;
// 0 => none, 1 => depth darker, 2 => depth lighter

let globalSeed = 0;
let noise = new Noise(globalSeed);

let mouseListener;
let keyboardListener;
let pressedKeys = {};

// frequency, roughness, amplitude, persistence, cellSize, octaves, contrast
noise.settings(1, 2.5, 1, 0.25, 32, 5, 1);

let structures = [
    createSphereMeshVector3(1, 1, 1, 0, 0, 0, 625),
];

let dimensions = [
    new Vector3(250, 250, 250),
];

let locations = [
    new Vector3(0, 0, 500),
];

let strips;

let vertColors;

let texCoordsUV;

let textureIndices = [
    0, 0, 0,
];

let defaultDimensions = new Vector3(250, 250, 250);
let defaultLocation = new Vector3(0, 0, 500);
let defaultTexCoordsUV = [
    new Vector2(1, 0),
    new Vector2(0, 0),
    new Vector2(1, 1),
    new Vector2(0, 1),
];
let defaultTextureIndex = 0;

let noiseBufferWidth = 128;
let noiseBufferHeight = 128;

let noiseTexture = noise.perlinBuffer(noiseBufferWidth, noiseBufferHeight, 0.5, 0.5);

let textures = [
    new Texture2D(
        noiseBufferWidth, noiseBufferHeight,
        Array.from(new Array(noiseBufferWidth * noiseBufferHeight)).map((val, index) => {
            let noiseVal = noiseTexture[index] * 0.5 + 0.5;
            
            return RGBA.brightness(noiseVal * 255);
        })
    ),
];

function mapStrip(index) {
    let dims = dimensions[index] || defaultDimensions;
    let loc = locations[index] || defaultLocation;

    return structures[index].map((v) => v.product(dims).sum(loc));
}

function mapUV(index) {
    return structures[index].map(
        (v) => {
            let x = v.x + 0.5;
            let y = 1 - (v.y + 0.5);
            let z = v.z + 0.5;

            let uv = new Vector2(x, y);

            return uv;
        }
    )
}

function mapNoiseColor(index) {
    let dims = dimensions[index] || defaultDimensions;

    return structures[index].map(
        (v) => {
            let vScaled = v.scaled(0.5).sum(Vector3.half()).product(dims);

            let noiseVal = noise.simplex3(vScaled.x, vScaled.y, vScaled.z) * 0.5 + 0.5;

            return RGBA.value(noiseVal * 255);
        }
    )
}

function mapPositionColor(index) {
    let dims = dimensions[index] || defaultDimensions;

    return structures[index].map(
        (v) => {
            return v.scaled(0.5).sum(Vector3.half()).toVector4().scaled(255).toRGBA();
        }
    )
}

function onload() {
    try {
        Terminal.init();

        setup();
        startLoop();
    } catch (error) {
        alert(error.stack);
    }
}

function setup() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    mouseListener = new MouseListener(document.body, 
        {
            mousemove: (e) => {
                let totalRotation = Math.PI * 2;

                let locX = e.movementX;
                let locY = e.movementY;
                let ratioX = -locX / document.body.clientWidth;
                let ratioY = -locY / document.body.clientHeight;

                let rotationVector = new Vector3(ratioY, ratioX, 0.0).scaled(totalRotation);

                rotations.add(rotationVector);
            }
        }
    );

    keyboardListener = new KeyboardListener(document.body,
        {
            keydown: (e) => {
                pressedKeys[e.code] = true;
            },
            keyup: (e) => {
                pressedKeys[e.code] = false;
            }
        }
    );

    document.body.addEventListener('fullscreenchange', (e) => {
        if (document.fullscreenElement){
            canvas.width = window.screen.width;
            canvas.height = window.screen.height;

            Terminal.hide();
        } else {
            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            Terminal.show();
        }
    })

    let numSpheres = 0;
    let numFaces = 144;
    let rangeX = 10000;
    let rangeY = 10000;
    let rangeZ = 10000;

    let dims = new Vector3(250, 250, 250);

    for (let i = 0; i < numSpheres; i++) {
        let sphereStructure = createSphereMeshVector3(1, 1, 1, 0, 0, 0, numFaces);
        let loc = new Vector3(Math.random() * rangeX - rangeX / 2, Math.random() * rangeY - rangeY / 2, Math.random() * rangeZ - rangeZ / 2);

        structures.push(sphereStructure);
        dimensions.push(dims.clone());
        locations.push(loc);
    }

    strips = structures.map((a, index) => mapStrip(index));
    vertColors = structures.map((a, index) => mapPositionColor(index));
    texCoordsUV = structures.map((a, index) => mapUV(index));

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    objectiveBenchmarker = new Benchmarker("Objective Time");
    iterationBenchmarker = new Benchmarker("Iteration Time");
}

function startLoop() {
    loop = setInterval(function() {
        try {
            iterationBenchmarker.updateCurrentTime();

            update();
            draw();

            tick++;
        } catch (error) {
            alert(error.stack);
        }
    }, tickRate);
}

function update() {
    let sprintScale = pressedKeys["AltLeft"] ? 2 : 1;

    let movementStepX = acceleration.vectorX().rotateRad(rotations.vectorY().scaled(-1), Vector3.neutral()).scaled(sprintScale);
    let movementStepY = acceleration.vectorY().scaled(sprintScale);
    let movementStepZ = acceleration.vectorZ().rotateRad(rotations.vectorY().scaled(-1), Vector3.neutral()).scaled(sprintScale);

    if (pressedKeys["KeyA"]) {
        velocity.subtract(movementStepX);
    }
    if (pressedKeys["KeyD"]) {
        velocity.add(movementStepX);
    }
    if (pressedKeys["KeyW"]) {
        velocity.subtract(movementStepZ);
    }
    if (pressedKeys["KeyS"]) {
        velocity.add(movementStepZ);
    }
    if (pressedKeys["Space"]) {
        velocity.subtract(movementStepY);
    }
    if (pressedKeys["ShiftLeft"]) {
        velocity.add(movementStepY);
    }
    if (pressedKeys["KeyF"]) {
        document.body.requestFullscreen();
        document.body.requestPointerLock();
    }

    let totalVelocity = velocity.magnitude();
    if (totalVelocity > velocityMax * sprintScale) {
        velocity.scale(velocityMax * sprintScale / totalVelocity);
    }

    translations.add(velocity);
    velocity.scale(friction);

    let rotStep = new Vector3(0.01, 0.01, 0.01);
    let rotSpeed = 0;

    let rot = rotStep.scaled(rotSpeed);

    if (rot.magnitude() == 0) {
        return;
    }

    for (let i = 0; i < strips.length; i++) {
        let vertices = strips[i];
        let location = locations[i] || defaultLocation;

        let newStrip = [];

        for (let j = 0; j < vertices.length; j++) {
            let vertex = vertices[j];

            newStrip[j] = vertex.rotateRad(rot, location);
        }

        strips[i] = newStrip;
    }
}

function draw() {
    let width = canvas.width;
    let widthMin1 = width - 1;
    let halfWidth = width / 2;
    let width4 = width * 4;
    let height = canvas.height;
    let heightMin1 = height - 1;
    let halfHeight = height / 2;

    let colorBuffer = new Uint8ClampedArray(width4 * height);
    let depthBuffer = new Uint16Array(width * height);

    let canvasOffset = new Vector3(width / 2, height / 2, 0);

    let step;

    if (vertexType == 0) {
        step = 3;
    } else if (vertexType == 1) {
        step = 1;
    }

    let stripsLength = strips.length;
    let vertColorsLength = vertColors.length;

    for (let i = 0; i < stripsLength; i++) {
        let vertices = strips[i];
        let texCoords = texCoordsUV[i] || defaultTexCoordsUV;
        let textureIndex = textureIndices[i] || defaultTextureIndex;
        let texture = textures[textureIndex];
        let colors = vertColors[i % vertColorsLength];

        let verticesLength = vertices.length;

        let newVertices = [];

        for (let j = 0; j < verticesLength; j++) {
            let vertex = vertices[j];

            let fullyTransformed = vertex.sum(translations).rotateRad(rotations, origin).scaleZ(zNear).sum(canvasOffset);

            newVertices[j] = fullyTransformed;
        }

        for (let j = 0; j < verticesLength - 2; j += step) {
            let vert1Index = j;
            let vert2Index;
            let vert3Index;

            switch (vertexType) {
                case 0: {
                    vert2Index = j + 1;
                    vert3Index = j + 2;

                    break;
                }
                case 1: {
                    if (j & 1) {
                        vert2Index = j + 1;
                        vert3Index = j + 2;
                    } else {
                        vert2Index = j + 2;
                        vert3Index = j + 1;
                    }

                    break;
                }
            }

            let vert1 = newVertices[vert1Index];
            let vert2 = newVertices[vert2Index];
            let vert3 = newVertices[vert3Index];

            let {x: x1, y: y1, z: z1} = vert1.rounded();
            let {x: x2, y: y2, z: z2} = vert2.rounded();
            let {x: x3, y: y3, z: z3} = vert3.rounded();

            let minZ = Math.min(z1, z2, z3);

            if (minZ <= 0) {
                continue;
            }

            let minX = Math.min(x1, x2, x3), maxX = Math.max(x1, x2, x3);
            let minY = Math.min(y1, y2, y3), maxY = Math.max(y1, y2, y3);

            if (minX >= width || maxX <= 0 || minY >= height || maxY <= 0) {
                continue;
            }

            const area = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);

            if (area > 0) {
                let {r: r1, g: g1, b: b1, a: a1} = colors[vert1Index];
                let {r: r2, g: g2, b: b2, a: a2} = colors[vert2Index];
                let {r: r3, g: g3, b: b3, a: a3} = colors[vert3Index];
                let {x: u1, y: v1} = texCoords[vert1Index];
                let {x: u2, y: v2} = texCoords[vert2Index];
                let {x: u3, y: v3} = texCoords[vert3Index];

                let z1Inverse = 1 / z1 / area;
                let z2Inverse = 1 / z2 / area;
                let z3Inverse = 1 / z3 / area;

                minX = Math.max(minX, 0);
                maxX = Math.min(maxX, widthMin1);
                minY = Math.max(minY, 0);
                maxY = Math.min(maxY, heightMin1);

                const rangeX = maxX - minX;
                const rangeY = maxY - minY;

                const y2y3 = y2 - y3;
                const x3x2 = x3 - x2;
                const y3y1 = y3 - y1;
                const x1x3 = x1 - x3;
                const w3StepX = y2y3 + y3y1;
                const w3StepY = x3x2 + x1x3;

                let index1 = (minX + minY * width) * 4;

                let w1_1 = y2y3 * (minX - x3) + x3x2 * (minY - y3);
                let w2_1 = y3y1 * (minX - x3) + x1x3 * (minY - y3);
                let w3_1 = area - w1_1 - w2_1;

                for (let ix = 0; ix < rangeX; ix++) {
                    let index2 = index1;
                    let w1_2 = w1_1;
                    let w2_2 = w2_1;
                    let w3_2 = w3_1;

                    for (let iy = 0; iy < rangeY; iy++) {
                        if (w1_2 >= 0 && w2_2 >= 0 && w3_2 >= 0) {
                            let x, y, z;

                            let r, g, b, a;

                            switch (attributeInterpolationMode) {
                                case 0: {
                                    let w1 = w1_2 * z1Inverse;
                                    let w2 = w2_2 * z2Inverse;
                                    let w3 = w3_2 * z3Inverse;

                                    z = 1 / (w1 + w2 + w3);

                                    w1 *= z;
                                    w2 *= z;
                                    w3 *= z;

                                    x = x1 * w1 + x2 * w2 + x3 * w3;
                                    y = y1 * w1 + y2 * w2 + y3 * w3;

                                    switch (colorMode) {
                                        case 0: {
                                            r = ~~(r1 * w1 + r2 * w2 + r3 * w3);
                                            g = ~~(g1 * w1 + g2 * w2 + g3 * w3);
                                            b = ~~(b1 * w1 + b2 * w2 + b3 * w3);
                                            a = ~~(a1 * w1 + a2 * w2 + a3 * w3);

                                            break;
                                        }
                                        case 1: {
                                            let u = u1 * w1 + u2 * w2 + u3 * w3; 
                                            let v = v1 * w1 + v2 * w2 + v3 * w3;

                                            ({r, g, b, a} = texture.uvComponents(u, v));

                                            break;
                                        }
                                    }

                                    break;
                                }
                                case 1: { 
                                    z = z1;
                                    x = x1;
                                    y = y1;

                                    switch (colorMode) {
                                        case 0: {
                                            r = r1;
                                            g = g1;
                                            b = b1;
                                            a = a1;

                                            break;
                                        }
                                        case 1: {
                                            ({r, g, b, a} = texture.uvComponents(u1, v1));
                                            
                                            break;
                                        }
                                    }

                                    break;
                                }
                                case 2: { 
                                    let w1 = w1_2 * z1Inverse;
                                    let w2 = w2_2 * z2Inverse;
                                    let w3 = w3_2 * z3Inverse;

                                    if (w1 > w2 && w1 > w3) {
                                        z = z1;
                                        x = x1;
                                        y = y1;

                                        switch (colorMode) {
                                            case 0: {
                                                r = r1;
                                                g = g1;
                                                b = b1;
                                                a = a1;

                                                break;
                                            }
                                            case 1: {
                                                ({r, g, b, a} = texture.uvComponents(u1, v1));
                                                
                                                break;
                                            }
                                        }
                                    } else if (w2 > w3) {
                                        z = z2;
                                        x = x2;
                                        y = y2;

                                        switch (colorMode) {
                                            case 0: { 
                                                r = r2;
                                                g = g2;
                                                b = b2;
                                                a = a2;

                                                break;
                                            }
                                            case 1: {
                                                ({r, g, b, a} = texture.uvComponents(u2, v2));
                                                
                                                break;
                                            }
                                        }
                                    } else {
                                        z = z3;
                                        x = x3;
                                        y = y3;

                                        switch (colorMode) {
                                            case 0: {
                                                r = r3;
                                                g = g3;
                                                b = b3;
                                                a = a3;

                                                break;
                                            }
                                            case 1: {
                                                ({r, g, b, a} = texture.uvComponents(u3, v3));
                                                
                                                break;
                                            }
                                        }
                                    }

                                    break;
                                }
                            }

                            switch (coordinateInterpolationMode) {
                                case 0: {
                                    x -= halfWidth;
                                    y -= halfHeight

                                    z = z;

                                    break;
                                }
                                case 1: {
                                    let w1 = w1_2 * z1Inverse;
                                    let w2 = w2_2 * z2Inverse;
                                    let w3 = w3_2 * z3Inverse;

                                    z = ~~(1 / (w1 + w2 + w3));

                                    x = (x1 * w1 + x2 * w2 + x3 * w3) * z - halfWidth;
                                    y = (y1 * w1 + y2 * w2 + y3 * w3) * z - halfHeight;

                                    break;
                                }   
                            }

                            switch (shadingMode) {
                                case 0: {
                                    break;
                                }
                                case 1: {
                                    let depth = Math.sqrt(x * x + y * y + z * z);

                                    let scalar = Math.pow(Math.min(1, zNear / depth), 1.25);

                                    r = ~~(r * scalar);
                                    g = ~~(g * scalar);
                                    b = ~~(b * scalar);

                                    break;
                                }
                                case 2: {
                                    let depth = Math.sqrt(x * x + y * y + z * z);
                                    
                                    let scalar = Math .cbrt(depth / zNear);

                                    r = ~~(r * scalar);
                                    g = ~~(g * scalar);
                                    b = ~~(b * scalar);

                                    break;
                                }
                            }

                            let useFragmentFlag = true;

                            if (colorBuffer[index2 + 3] != 0) {
                                if (depthBuffer[index2 / 4] < z) {
                                    useFragmentFlag = false;
                                }
                            }

                            if (useFragmentFlag) {
                                depthBuffer[index2 / 4] = z;

                                colorBuffer[index2] = r;
                                colorBuffer[index2 + 1] = g;
                                colorBuffer[index2 + 2] = b;
                                colorBuffer[index2 + 3] = a;
                            }
                        }

                        index2 += width4;

                        w1_2 += x3x2;
                        w2_2 += x1x3;
                        w3_2 -= w3StepY;
                    }

                    index1 += 4;

                    w1_1 += y2y3;
                    w2_1 += y3y1;
                    w3_1 -= w3StepX;
                }
            }
        }
    }

    ctx.putImageData(new ImageData(colorBuffer, width), 0, 0);

    objectiveBenchmarker.add();
    iterationBenchmarker.add();

    let benchmarkerPrecision = 2;

    Terminal.clear();
    Terminal.print(objectiveBenchmarker.toString(benchmarkerPrecision));
    Terminal.print(iterationBenchmarker.toString(benchmarkerPrecision));
    Terminal.newLine();
    Terminal.print("FPS (current): " + Math.round(1000 / objectiveBenchmarker.averageRelativeTime()));
    Terminal.print("FPS (possible): " + Math.round(1000 / iterationBenchmarker.averageRelativeTime()));

    if (tick >= resetTicks) {
        tick = 0;
        
        objectiveBenchmarker.reset();
        iterationBenchmarker.reset();
    }
}