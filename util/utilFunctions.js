function extendArray(source, targetLength) {
    let newArr = [];

    let sourceLength = source.length;

    for (let i = 0; i < targetLength; i++) {
        newArr[i] = source[i % sourceLength];
    }

    return newArr;
}

function padArrayStart(source, targetLength, filler) {
    let newArr = [];

    let sourceLength = source.length;
    let diff = targetLength - sourceLength;

    for (let i = 0; i < targetLength; i++) {
        if (i >= diff) {
            newArr[i] = source[i - diff];
        } else {
            newArr[i] = filler;
        }
    }

    return newArr;
}

function padArrayEnd(source, targetLength, filler) {
    let newArr = [];

    let sourceLength = source.length;

    for (let i = 0; i < targetLength; i++) {
        if (i < sourceLength) {
            newArr[i] = source[i];
        } else {
            newArr[i] = filler;
        }
    }

    return newArr;
}

function resizeArray(source, width, height) {
    let newArray = [];

    for (let i = 0; i < width; i++) {
        newArray[i] = [];

        for (let j = 0; j < height; j++) {
            let index = i + j * width;

            newArray[i][j] = source[index];
        }
    }

    return newArray;
}

function fRandom(limit) {
    return Math.floor(Math.random() * limit);
}

function splitStringArray(string, delimiters) {
    const regex = new RegExp(`[${delimiters.join('')}]`);

    return string.split(regex);
}

function removeNewLines(string) {
    return string.split(/[\n]/).join(" ");
}

function isAlpha(string) {
    return /^[a-zA-Z]+$/.test(string);   
}

function isBasicCharacter(string) {
    return /^[a-zA-Z ,.!?]+$/.test(string);
}

function isNotCaps(string) {
    return !/^[A-Z]+$/.test(string);
}

function isCaps(string) {
    return /^[A-Z]+$/.test(string);
}

function isNumber(string) {
    return !isNaN(parseFloat(string)) && !isNaN(Number(string));
}

function isNotNumber(string) {
    return isNaN(parseFloat(string)) && isNaN(Number(string));
}

function createRectangleMeshX(quads, height, depth, offsetX, offsetY, offsetZ) {
    let positions = [];

    let startY = offsetY - height / 2;
    let startZ = offsetZ - depth / 2;

    let stepY = height / quads;
    let stepZ = depth / quads;

    let vertices = [];
    let indices = []

    for (let z = 0; z <= quads; z++) {
        let w = startZ + z * stepZ;
        for (let y = 0; y <= quads; y++) {
            let u = startY + x * stepY;
            vertices.push([offsetX, u, w]);
        }
    }

    let rowSize = (quads + 1);

    for (let z = 0; z < quads; z++) {
        let rowOffset0 = (z + 0) * rowSize;
        let rowOffset1 = (z + 1) * rowSize;
        
        for (let y = 0; y < quads; y++) {
            let offset0 = rowOffset0 + y;
            let offset1 = rowOffset1 + y;

            indices.push(offset0, offset0 + 1, offset1);
            indices.push(offset1, offset0 + 1, offset1 + 1);
        }
    }

    for (let i = 0; i < indices.length - 1; i++) {
        let index = indices[i];
        positions.push(vertices[index]);
    }

    return positions.flat();
}

function createCubeMeshVector3(width, height, depth, centerX, centerY, centerZ) {
    let dimVec = new Vector3(width / 2, height / 2, depth / 2);
    let cenVec = new Vector3(centerX, centerY, centerZ);

    let pointConfig = [
        new Vector3( +1, -1, +1), // + + - 
        new Vector3( -1, -1, +1), // - + -
        new Vector3( +1, +1, +1), // + - -
        new Vector3( -1, +1, +1), // - - -

        new Vector3( +1, -1, -1), // + + +
        new Vector3( -1, -1, -1), // - + + 
        new Vector3( +1, +1, -1), // + - +
        new Vector3( -1, +1, -1), // - - +
    ].map(v => v.product(dimVec).sum(cenVec));

    let facesConfig = [3, 7, 1, 5, 4, 7, 6, 3, 2, 1, 0, 4, 2, 6];

    let positions = facesConfig.map(a => pointConfig[a]);

    return positions;
}

function createSphereMeshVector3(width, height, depth, centerX, centerY, centerZ, faces) {
    let positions = [];
    let vertices = [];

    let numVertices = Math.floor(Math.sqrt(faces));

    let rX = width / 2;
    let rY = height / 2;
    let rZ = depth / 2;

    for (let x = 0; x <= numVertices; x++) {
        for (let y = 0; y <= numVertices; y++) {
            let theta = 2 * Math.PI * (x / numVertices);
            let phi = Math.PI / 2 - Math.PI * (y / numVertices);

            let newX = centerX + rX * Math.cos(phi) * Math.cos(theta);
            let newY = centerY + rY * Math.cos(phi) * Math.sin(theta);
            let newZ = centerZ + rZ * Math.sin(phi);
            
            vertices.push(new Vector3(newX, newY, newZ));
        }
    }

    for (let i = numVertices; i < vertices.length; i++) {
        positions.push(vertices[i]);
        positions.push(vertices[i - numVertices]);
    }

    return positions;
}

function createIcosphereMesh(width, height, depth, centerX, centerY, centerZ, bisections) {
    let dimVec = new Vector3(width / 2, height / 2, depth / 2);
    let cenVec = new Vector3(centerX, centerY, centerZ);

    let a = 0.525731112119133606;
    let c = 0.850650808352039932;

    let vertices = [
        new Vector3(0, c, -a), new Vector3(0, c, a),
        new Vector3(-c, a, 0), new Vector3(c, a, 0),
        new Vector3(-a, 0, -c), new Vector3(a, 0, -c),
        new Vector3(-a, 0, c), new Vector3(a, 0, c), 
        new Vector3(-c, -a, 0), new Vector3(c, -a, 0),
        new Vector3(0, -c, -a), new Vector3(0, -c, a),
    ];

    let indices = [
        [0, 1, 2], [0, 3, 1],
        [0, 2, 4], [0, 5, 3], [0, 4, 5],
        [1, 6, 2], [1, 3, 7], [1, 7, 6],
        [3, 5, 9], [2, 8, 4], 
        [3, 9, 7], [2, 6, 8],
        [11, 7, 9], [11, 8, 6], [11, 6, 7],
        [10, 9, 5], [10, 4, 8], [10, 5, 4],
        [11, 9, 10], [11, 10, 8],
    ];

    let faces = indices.map((a) => a.map((i) => vertices[i]));

    for (let i = 0; i < bisections; i++) {
        let faces2 = [];

        for (let j = 0; j < faces.length; j++) {
            let triangle = faces[j];

            let a = triangle[0].average(triangle[1]).normalised();
            let b = triangle[1].average(triangle[2]).normalised();
            let c = triangle[2].average(triangle[0]).normalised();

            faces2.push([triangle[0], a, c]);
            faces2.push([triangle[1], b, a]);
            faces2.push([triangle[2], c, b]);
            faces2.push([a, b, c]);
        }

        faces = faces2;
    }

    return faces.flat().map((v) => v.normalised().product(dimVec).sum(cenVec));
}

function createCubeMeshTriangles(width, height, depth, centerX, centerY, centerZ) {
    let dimVec = new Vector3(width / 2, height / 2, depth / 2);
    let cenVec = new Vector3(centerX, centerY, centerZ);

    let vertices = [
        new Vector3( +1, -1, +1), // + + - 
        new Vector3( -1, -1, +1), // - + -
        new Vector3( +1, +1, +1), // + - -
        new Vector3( -1, +1, +1), // - - -

        new Vector3( +1, -1, -1), // + + +
        new Vector3( -1, -1, -1), // - + + 
        new Vector3( +1, +1, -1), // + - +
        new Vector3( -1, +1, -1), // - - +
    ];

    let indices = [
        [0, 1, 2], [1, 3, 2], // front
        [4, 6, 5], [5, 6, 7], // back
        [0, 4, 1], [1, 4, 5], // top
        [2, 3, 6], [3, 7, 6], // bottom
        [0, 2, 4], [4, 2, 6], // right
        [1, 5, 3], [5, 7, 3], // left
    ]

    let faces = indices.map((a) => a.map((i) => vertices[i]));

    return faces.flat().map((v) => v.product(dimVec).sum(cenVec));
}

function createCubeMeshStrip(width, height, depth, centerX, centerY, centerZ) {
    let dimVec = new Vector3(width / 2, height / 2, depth / 2);
    let cenVec = new Vector3(centerX, centerY, centerZ);

    let pointConfig = [
        new Vector3( +1, -1, +1), // + + - 
        new Vector3( -1, -1, +1), // - + -
        new Vector3( +1, +1, +1), // + - -
        new Vector3( -1, +1, +1), // - - -

        new Vector3( +1, -1, -1), // + + +
        new Vector3( -1, -1, -1), // - + + 
        new Vector3( +1, +1, -1), // + - +
        new Vector3( -1, +1, -1), // - - +
    ].map(v => v.product(dimVec).sum(cenVec));

    let facesConfig = [3, 7, 1, 5, 4, 7, 6, 3, 2, 1, 0, 4, 2, 6];

    let positions = facesConfig.map(a => pointConfig[a]);

    return positions;
}

function createBisectedCubeMesh(width, height, depth, centerX, centerY, centerZ, bisections) {
    let dimVec = new Vector3(width / 2, height / 2, depth / 2);
    let cenVec = new Vector3(centerX, centerY, centerZ);

    let vertices = [
        new Vector3( +1, -1, +1), // + + - 
        new Vector3( -1, -1, +1), // - + -
        new Vector3( +1, +1, +1), // + - -
        new Vector3( -1, +1, +1), // - - -

        new Vector3( +1, -1, -1), // + + +
        new Vector3( -1, -1, -1), // - + + 
        new Vector3( +1, +1, -1), // + - +
        new Vector3( -1, +1, -1), // - - +
    ];

    let indices = [
        [0, 1, 2], [1, 3, 2], // front
        [4, 6, 5], [5, 6, 7], // back
        [0, 4, 1], [1, 4, 5], // top
        [2, 3, 6], [3, 7, 6], // bottom
        [0, 2, 4], [4, 2, 6], // right
        [1, 5, 3], [5, 7, 3], // left
    ]

    let faces = indices.map((a) => a.map((i) => vertices[i]));

    for (let i = 0; i < bisections; i++) {
        let faces2 = [];

        for (let j = 0; j < faces.length; j++) {
            let triangle = faces[j];

            let a = triangle[0].average(triangle[1]);
            let b = triangle[0].average(triangle[2]);
            let c = triangle[1].average(triangle[2]);

            faces2.push([triangle[0], a, b]);
            faces2.push([triangle[1], c, a]);
            faces2.push([triangle[2], b, c])
            faces2.push([a, c, b]);
        }

        faces = faces2;
    }

    return faces.flat().map((v) => v.product(dimVec).sum(cenVec));
}