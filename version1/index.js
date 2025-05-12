let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

let loop;
let tickRate = 16;
let tick = 0;

let zNear = 500;
let origin = new Vector3(0, 0, 0);

let dimX = 500;
let cubeHeight = 50;
let dimZ = 100;

let centerX = 0;
let centerY = 0;
let centerZ = 150;

let type = "TRIANGLE_STRIP";

let structures = [
    [
        new Vector3(0, +0.0, -0.4),
        new Vector3(0, -0.2, -0.3),
        new Vector3(0, +0.2, -0.3),
        new Vector3(0, -0.3, -0.2),
        new Vector3(0, +0.3, -0.2),
        new Vector3(0, -0.3, +0.0),
        new Vector3(0, +0.3, +0.0),
        new Vector3(0, -0.2, +0.1),
        new Vector3(0, +0.2, +0.1),
        new Vector3(0, -0.1, +0.2),
        new Vector3(0, +0.1, +0.2),
        new Vector3(0, -0.2, +0.3),
        new Vector3(0, +0.2, +0.3),
        new Vector3(0, -0.2, +0.4),
        new Vector3(0, +0.2, +0.4),
    ],
    [
        new Vector3(0, +0.0, -0.4),
        new Vector3(0, +0.2, -0.3),
        new Vector3(0, -0.2, -0.3),
        new Vector3(0, +0.3, -0.2),
        new Vector3(0, -0.3, -0.2),
        new Vector3(0, +0.3, +0.0),
        new Vector3(0, -0.3, +0.0),
        new Vector3(0, +0.2, +0.1),
        new Vector3(0, -0.2, +0.1),
        new Vector3(0, +0.1, +0.2),
        new Vector3(0, -0.1, +0.2),
        new Vector3(0, +0.2, +0.3),
        new Vector3(0, -0.2, +0.3),
        new Vector3(0, +0.2, +0.4),
        new Vector3(0, -0.2, +0.4),
    ],
];

let dimensions = [
    new Vector3(dimX, cubeHeight, dimZ),
    new Vector3(dimX, cubeHeight, dimZ),
];

let locations = [
    new Vector3(centerX, centerY, centerZ),
    new Vector3(centerX, centerY, centerZ),
];

let strips = structures.map(
    (vertices, index) => vertices.map(
        (v) => v.product(dimensions[index]).sum(locations[index])
    )
);

let texCoordsUV = structures.map(
    (vertices) => vertices.map(
        (v) => {
            let x = v.z + 0.5;
            let y = 1 - (v.y + 0.5);

            return new Vector2(x, y);
        }
    )
);

let textureIndices = [
    0, 0
]

let textures = [
    new Texture2D(
        32, 16, 
        [156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,0,0,0,255,0,0,0,255,0,0,0,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,0,0,0,255,245,245,245,255,245,245,245,255,245,245,245,255,0,0,0,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,0,0,0,255,245,245,245,255,0,0,0,255,245,245,245,255,0,0,0,255,156,7,7,255,156,7,7,255,156,7,7,255,0,0,0,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,0,0,0,255,0,0,0,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,0,0,0,255,245,245,245,255,245,245,245,255,245,245,245,255,0,0,0,255,156,7,7,255,156,7,7,255,156,7,7,255,0,0,0,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,0,0,0,255,0,0,0,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,0,0,0,255,0,0,0,255,0,0,0,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,0,0,0,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,0,0,0,255,0,0,0,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,0,0,0,255,156,7,7,255,156,7,7,255,0,0,0,255,0,0,0,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,0,0,0,255,0,0,0,255,0,0,0,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255,156,7,7,255]
    ),
    new Texture2D(
        1, 1, 
        [0, 0, 0, 255]
    ),
];

function onload() {
    try {
        setup();
        startLoop();

    } catch (error) {
        alert(error.stack);
    }
}

function setup() {
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

    if (type == "TRIANGLES") {
        step = 3;
    } else if (type == "TRIANGLE_STRIP") {
        step = 1;
    }

    let texCoordsUVLength = texCoordsUV.length;
    let textureIndicesLength = textureIndices.length;

    for (let i = 0; i < strips.length; i++) {
        let vertices = strips[i];
        let texCoords = texCoordsUV[i % texCoordsUVLength];
        let textureIndex = textureIndices[i % textureIndicesLength];
        let texture = textures[textureIndex];

        let texCoordsLength = texCoords.length;

        let newVertices = [];

        // project onto the screen

        for (let i = 0; i < vertices.length; i++) {
            let vertex = vertices[i];

            let rotated = vertex.rotateRad(rotations, origin);
            let translated = rotated.sum(translations);
            let scaled = vertex.scaleZ(zNear);
            let inCanvasCoordinates = scaled.sum(canvasOffset);

            newVertices[i] = inCanvasCoordinates;
        }

        // rasterize

        for (let j = 0; j < newVertices.length - 2; j += step) {
            let vert1Index = j;
            let vert2Index;
            let vert3Index;

            if (type == "TRIANGLES") {
                vert2Index = j + 1;
                vert3Index = j + 2;
            } else if (type == "TRIANGLE_STRIP") {
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
            let tx1 = texCoords[vert1Index % texCoordsLength];
            let tx2 = texCoords[vert2Index % texCoordsLength];
            let tx3 = texCoords[vert3Index % texCoordsLength];
            
            let x1 = Math.round(vert1.x), y1 = Math.round(vert1.y), z1 = Math.round(vert1.z);
            let z1_2 = zInverse(z1);
            let u1 = tx1.x, v1 = tx1.y;

            let x2 = Math.round(vert2.x), y2 = Math.round(vert2.y), z2 = Math.round(vert2.z);
            let z2_2 = zInverse(z2);
            let u2 = tx2.x, v2 = tx2.y;
            
            let x3 = Math.round(vert3.x), y3 = Math.round(vert3.y), z3 = Math.round(vert3.z);
            let z3_2 = zInverse(z3);
            let u3 = tx3.x, v3 = tx3.y;

            // find the box that surrounds all of the vertices
        
            let minX = Math.min(x1, x2, x3), maxX = Math.max(x1, x2, x3);
            let minY = Math.min(y1, y2, y3), maxY = Math.max(y1, y2, y3);
            let minZ = Math.min(z1, z2, z3), maxZ = Math.max(z1, z3, z3);

            if (maxZ < 0 || minX >= width || maxX < 0 || minY >= height || maxY < 0) {
                continue;
            }

            minX = Math.max(minX, 0), maxX = Math.min(maxX, width);
            minY = Math.max(minY, 0), maxY = Math.min(maxY, height);

            // find the triangle's winding order

            const normal = vert2.difference(vert1).crossProd(vert3.difference(vert1));
            const windingOrder = normal.dotProd(new Vector3(0, 0, 1));

            // find the triangles area

            const area = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);

            // check for backface and out-of-view culling

            if (windingOrder > 0) {
                
                // lock back into the screen

                if (minX < 0) {
                    minX = 0
                }
                if (maxX >= width) {
                    maxX = width - 1
                }
                if (minY < 0) {
                    minY = 0
                }
                if (maxY >= height) {
                    maxY = height - 1
                }

                // find the range (width and height) of the box around the vertices to simplify the loops

                const rangeX = maxX - minX;
                const rangeY = maxY - minY;

                // precalculate a few of the formula components

                // ~~~ these are actually just the sides of the triangle
                const part1 = y2 - y3;
                const part2 = x3 - x2;
                const part3 = y3 - y1;
                const part4 = x1 - x3;

                // ~~~ these are variable sides from the targeted pixel to vert3
                let dcx = minX - x3;
                let dcy = minY - y3;

                // ~~~ you can tell what this one is
                let index1 = (minX + minY * width) * 4;

                // iterate through each pixel of the box around the vertices

                for (let x = 0; x < rangeX; x++) {
                    let index2 = index1;
                    let dcy1 = dcy;

                    for (let y = 0; y < rangeY; y++) {
                        // find the weights to each vertex with barycentric coordinates

                        let w1 = part1 * dcx + part2 * dcy1;
                        let w2 = part3 * dcx + part4 * dcy1;
                        let w3 = area - w1 - w2;

                        // if these weights are all above zero, continue

                        if (w1 >= 0 && w2 >= 0 && w3 >= 0) {

                            // adjust the weights slightly for other formulas

                            w1 *= z1_2 / area;
                            w2 *= z2_2 / area;
                            w3 *= z3_2 / area;

                            // find the z value using vertex z inverses and the new weights

                            let z = 1 / (w1 + w2 + w3);

                            // interpolate the texture coordinates using the new weights and recently found z value

                            let u = (u1 * w1 + u2 * w2 + u3 * w3) * z;
                            let v = (v1 * w1 + v2 * w2 + v3 * w3) * z;
                            
                            let color = texture.uv(new Vector2(u, v));

                            let cR = color.r, cG = color.g, cB = color.b, cA = color.a;

                            // do a color buffer and depth test to see if the fragment turns into a pixel
                            // ~~~ I'm not sure how to avoid double writing, sadly

                            // we have to pull the color before this because I eventually want to add color merging with transparency and such

                            if (colorBuffer[index2 + 3] == 0 || zBuffer[index2 / 4] > z) {
                                colorBuffer[index2] = cR;
                                colorBuffer[index2 + 1] = cG;
                                colorBuffer[index2 + 2] = cB;
                                colorBuffer[index2 + 3] = cA;
    
                                zBuffer[index2 / 4] = z;
                            }
                        }

                        dcy1++;
                        index2 += width4;
                    }

                    dcx++;
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