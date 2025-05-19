let canvas;
let ctx;

let loop;
let tickRate = 16;
let tick = 0;

let zNear = -500;
let origin = new Vector3(0, 0, 0);

let type = 1;
// 0 => TRIANGLES, 1 => TRIANGLE_STRIP
let interpolateFlat = false;
let interpolateVertColor = true;

let globalSeed = 0;
let noise = new Noise(globalSeed);

// frequency, roughness, amplitude, persistence, cellSize, octaves, contrast
noise.settings(1, 2.5, 1, 0.25, 32, 5, 1);

let structures = [
    [
        new Vector3(-0.4, +0.0, 0),
        new Vector3(-0.3, -0.2, 0),
        new Vector3(-0.3, +0.2, 0),
        new Vector3(-0.2, -0.3, 0),
        new Vector3(-0.2, +0.3, 0),
        new Vector3(+0.0, -0.3, 0),
        new Vector3(+0.0, +0.3, 0),
        new Vector3(+0.1, -0.2, 0),
        new Vector3(+0.1, +0.2, 0),
        new Vector3(+0.2, -0.1, 0),
        new Vector3(+0.2, +0.1, 0),
        new Vector3(+0.3, -0.2, 0),
        new Vector3(+0.3, +0.2, 0),
        new Vector3(+0.4, -0.2, 0),
        new Vector3(+0.4, +0.2, 0),
    ],
    [
        new Vector3(-0.4, +0.0, 0),
        new Vector3(-0.3, +0.2, 0),
        new Vector3(-0.3, -0.2, 0),
        new Vector3(-0.2, +0.3, 0),
        new Vector3(-0.2, -0.3, 0),
        new Vector3(+0.0, +0.3, 0),
        new Vector3(+0.0, -0.3, 0),
        new Vector3(+0.1, +0.2, 0),
        new Vector3(+0.1, -0.2, 0),
        new Vector3(+0.2, +0.1, 0),
        new Vector3(+0.2, -0.1, 0),
        new Vector3(+0.3, +0.2, 0),
        new Vector3(+0.3, -0.2, 0),
        new Vector3(+0.4, +0.2, 0),
        new Vector3(+0.4, -0.2, 0),
    ],
    createSphereMeshVector3(1, 1, 1, 0, 0, 0, 16384),
];

let dimensions = [
    new Vector3(50, 50, 50).scaled(0),
    new Vector3(50, 50, 50).scaled(0),
    new Vector3(250, 250, 250).scaled(1),
];

let locations = [
    new Vector3(0, 0, 150),
    new Vector3(0, 0, 150),
    new Vector3(0, 0, 500),
];

let strips = structures.map((a, index) => mapStrip(index));

let vertColors = structures.map((a, index) => mapNoiseColor(index));

let texCoordsUV = [
    mapUV(0),
    mapUV(1),
    mapUV(2),
];

let textureIndices = [
    0, 0, 1,
];

let noiseBufferWidth = 512;
let noiseBufferHeight = 512;

let noiseTexture = noise.perlinBuffer(noiseBufferWidth, noiseBufferHeight, 0.5, 0.5);

let textures = [
    new Texture2D(
        fishWidth, fishHeight, 
        fishBuffer,
    ),
    new Texture2D(
        noiseBufferWidth, noiseBufferHeight,
        Array.from(new Array(noiseBufferWidth * noiseBufferHeight)).map((val, index) => {
            let noiseVal = noiseTexture[index] * 0.5 + 0.5;
            
            return RGBA.brightness(noiseVal * 255);
        })
    ),
    new Texture2D(
        pfpWidth, pfpHeight,
        pfpBuffer,
    ),
];

function mapStrip(index) {
    let dims = dimensions[index];
    let locs = locations[index];

    return structures[index].map((v) => v.product(dims).sum(locs));
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
    let dims = dimensions[index];

    return structures[index].map(
        (v) => {
            let vScaled = v.scaled(0.5).sum(Vector3.half()).product(dims);

            let noiseVal = noise.simplex3(vScaled.x, vScaled.y, vScaled.z) * 0.5 + 0.5;

            return RGBA.value(noiseVal * 255);
        }
    )
}

function onload() {
    try {
        setup();
        startLoop();
    } catch (error) {
        alert(error.stack);
    }
}

function setup() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
}

function startLoop() {
    loop = setInterval(function() {
        try {
            update();
            draw();

            tick++;
        } catch (error) {
            alert(error.stack);
        }
    }, tickRate);
}

function update() {
    let rotStep = new Vector3(0.0, 0.01, 0.0);
    let rotSpeed = 5;

    let rot = rotStep.scaled(rotSpeed);

    for (let i = 0; i < strips.length; i++) {
        let vertices = strips[i];
        let location = locations[i];

        strips[i] = vertices.map((v) => v.rotateRad(rot, location));
    }
}

function draw() {
    let width = canvas.width;
    let width4 = width * 4;
    let height = canvas.height;

    let colorBuffer = new Uint8ClampedArray(width4 * height);
    let zBuffer = new Uint16Array(width * height);

    let rotations = new Vector3(0, 0, 0);
    let translations = new Vector3(0, 0, 0);
    let canvasOffset = new Vector3(width / 2, height / 2, 0);

    let step;

    if (type == 0) {
        step = 3;
    } else if (type == 1) {
        step = 1;
    }

    let texCoordsUVLength = texCoordsUV.length;
    let textureIndicesLength = textureIndices.length;
    let vertColorsLength = vertColors.length;

    for (let i = 0; i < strips.length; i++) {
        let vertices = strips[i];
        let texCoords = texCoordsUV[i % texCoordsUVLength];
        let textureIndex = textureIndices[i % textureIndicesLength];
        let texture = textures[textureIndex] || textures[0];
        let colors = vertColors[i % vertColorsLength];

        let texCoordsLength = texCoords.length;
        let colorsLength = colors.length;

        let newVertices = [];

        for (let i = 0; i < vertices.length; i++) {
            let vertex = vertices[i];

            let rotated = vertex.rotateRad(rotations, origin);
            let translated = rotated.sum(translations);
            let scaled = translated.scaleZ(zNear);
            let inCanvasCoordinates = scaled.sum(canvasOffset);

            newVertices[i] = inCanvasCoordinates;
        }

        for (let j = 0; j < newVertices.length - 2; j += step) {
            let vert1Index = j;
            let vert2Index;
            let vert3Index;

            if (type == 0) {
                vert2Index = j + 1;
                vert3Index = j + 2;
            } else if (type == 1) {
                if (j & 1) {
                    vert2Index = j + 1;
                    vert3Index = j + 2;
                } else {
                    vert2Index = j + 2;
                    vert3Index = j + 1;
                }
            }

            let vert1 = newVertices[vert1Index];
            let vert2 = newVertices[vert2Index];
            let vert3 = newVertices[vert3Index];
            
            let x1 = Math.round(vert1.x), y1 = Math.round(vert1.y), z1 = Math.round(vert1.z);
            let x2 = Math.round(vert2.x), y2 = Math.round(vert2.y), z2 = Math.round(vert2.z);
            let x3 = Math.round(vert3.x), y3 = Math.round(vert3.y), z3 = Math.round(vert3.z);
            let minX = Math.min(x1, x2, x3), maxX = Math.max(x1, x2, x3);
            let minY = Math.min(y1, y2, y3), maxY = Math.max(y1, y2, y3);
            let minZ = Math.min(z1, z2, z3), maxZ = Math.max(z1, z3, z3);

            if (minZ <= 0 || minX >= width || maxX <= 0 || minY >= height || maxY <= 0) {
                continue;
            }

            let tx1 = texCoords[vert1Index % texCoordsLength];
            let tx2 = texCoords[vert2Index % texCoordsLength];
            let tx3 = texCoords[vert3Index % texCoordsLength];
            let color1 = colors[vert1Index % colorsLength].toVector4();
            let color2 = colors[vert2Index % colorsLength].toVector4();
            let color3 = colors[vert3Index % colorsLength].toVector4();

            let z1_2 = zInverse(z1);
            let u1 = tx1.x, v1 = tx1.y;
            let z2_2 = zInverse(z2);
            let u2 = tx2.x, v2 = tx2.y;
            let z3_2 = zInverse(z3);
            let u3 = tx3.x, v3 = tx3.y;

            const normal = vert2.difference(vert1).crossProd(vert3.difference(vert1));
            const windingOrder = normal.dotProd(Vector3.forward());

            const area = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);

            if (windingOrder > 0) {
                minX = Math.max(minX, 0), maxX = Math.min(maxX, width - 1);
                minY = Math.max(minY, 0), maxY = Math.min(maxY, height - 1);

                const rangeX = maxX - minX;
                const rangeY = maxY - minY;

                const part1 = y2 - y3;
                const part2 = x3 - x2;
                const part3 = y3 - y1;
                const part4 = x1 - x3;

                let currSegmentX = minX - x3;
                let currSegmentY = minY - y3;
                let index1 = (minX + minY * width) * 4;

                for (let x = 0; x < rangeX; x++) {
                    let index2 = index1;
                    let currSegmentY1 = currSegmentY;

                    for (let y = 0; y < rangeY; y++) {

                        let w1 = part1 * currSegmentX + part2 * currSegmentY1;
                        let w2 = part3 * currSegmentX + part4 * currSegmentY1;
                        let w3 = area - w1 - w2;

                        if (w1 >= 0 && w2 >= 0 && w3 >= 0) {
                            w1 *= z1_2 / area;
                            w2 *= z2_2 / area;
                            w3 *= z3_2 / area;

                            if (interpolateFlat) {
                                if (w1 >= w2) {
                                    if (w1 >= w3) {
                                        w1 = 1;
                                        w2 = 0;
                                        w3 = 0;
                                    } else {
                                        w1 = 0;
                                        w2 = 0;
                                        w3 = 1;
                                    }
                                } else {
                                    if (w2 >= w3) {
                                        w1 = 0;
                                        w2 = 1;
                                        w3 = 0;
                                    } else {
                                        w1 = 0;
                                        w2 = 0;
                                        w3 = 1;
                                    }
                                }
                            }

                            let z = 1 / (w1 + w2 + w3);

                            let color;
                            
                            if (interpolateVertColor) {
                                let c1Scaled = color1.scaled(w1);
                                let c2Scaled = color2.scaled(w2);
                                let c3Scaled = color3.scaled(w3);
                                
                                color = c1Scaled.sum(c2Scaled).sum(c3Scaled).scaled(z).toRGBA();
                            } else {
                                let u = (u1 * w1 + u2 * w2 + u3 * w3) * z;
                                let v = (v1 * w1 + v2 * w2 + v3 * w3) * z;
                                let uv = new Vector2(u, v);

                                color = texture.uv(uv);
                            }

                            let cR = color.r, cG = color.g, cB = color.b, cA = color.a;

                            if (colorBuffer[index2 + 3] == 0 || zBuffer[index2 / 4] > z) {
                                colorBuffer[index2] = cR;
                                colorBuffer[index2 + 1] = cG;
                                colorBuffer[index2 + 2] = cB;
                                colorBuffer[index2 + 3] = cA;
    
                                zBuffer[index2 / 4] = z;
                            }
                        }

                        currSegmentY1++;
                        index2 += width4;
                    }

                    currSegmentX++;
                    index1 += 4;
                }
            }
        }
    }

    ctx.putImageData(new ImageData(colorBuffer, width), 0, 0);
}

function zInverse(z) {
    return 1 / z;
}