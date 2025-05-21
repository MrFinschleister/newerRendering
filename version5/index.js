let canvas;
let ctx;

let objectiveBenchmarker;
let iterationBenchmarker;
let camera;
let noiseTexture;

let loop;
let tickRate = 16;
let tick = 0;
let resetTicks = 100;

let velocityMax = 10;
let friction = 0.9;

let noise = new Noise(0);
noise.settings(1, 2.5, 1, 0.25, 32, 5, 1);
// frequency, roughness, amplitude, persistence, cellSize, octaves, contrast

let objects = [
    new TriangleObject(
        createIcosphereMesh(1, 1, 1, 0, 0, 0, 3),
        new Vector3(-250, 0, 1000),
        new Vector3(250),
        settingsPresets.basic,
        mappingPresets.basic,
    ),
    new TriangleObject(
        createBisectedCubeMesh(1, 1, 1, 0, 0, 0, 4),
        new Vector3(250, 0, 1000),
        new Vector3(250),
        settingsPresets.basic,
        mappingPresets.basic,
    ),

    new TriangleObject(
        createBisectedCubeMesh(1, 1, 1, 0, 0, 0, 4),
        new Vector3(-1000, 0, 250),
        new Vector3(250),
        settingsPresets.nearest,
        mappingPresets.nearest,
    ),
    new TriangleObject(
        createIcosphereMesh(1, 1, 1, 0, 0, 0, 3),
        new Vector3(-1000, 0, -250),
        new Vector3(250),
        settingsPresets.nearest,
        mappingPresets.nearest,
    ),

    new TriangleObject(
        createBisectedCubeMesh(1, 1, 1, 0, 0, 0, 4),
        new Vector3(1000, 0, -250),
        new Vector3(250),
        settingsPresets.first,
        mappingPresets.first,
    ),
    new TriangleObject(
        createIcosphereMesh(1, 1, 1, 0, 0, 0, 3),
        new Vector3(1000, 0, 250),
        new Vector3(250),
        settingsPresets.first,
        mappingPresets.first,
    ),

    new TriangleObject(
        createBisectedCubeMesh(1, 1, 1, 0, 0, 0, 5),
        new Vector3(-250, 0, -1000),
        new Vector3(250),
        settingsPresets.noise,
        mappingPresets.noise,
    ),
    new TriangleObject(
        createIcosphereMesh(1, 1, 1, 0, 0, 0, 4),
        new Vector3(250, 0, -1000),
        new Vector3(250),
        settingsPresets.noise,
        mappingPresets.noise,
    ),
];

let textures = [];

function setCanvasDimensions(width, height) {
    canvas.width = width * resolutionScale;
    canvas.height = height * resolutionScale;
}

function changeResolution(newResolutionScale) {
    resolutionScale = newResolutionScale;
    setCanvasDimensions(canvas.clientWidth, canvas.clientHeight);
}

function changeZNear(newZNear) {
    zNearDefault = newZNear;
}

function onload() {
    try {
        Terminal.init();
        Terminal.hide();

        setup();
        startLoop();
    } catch (error) {
        alert(error.stack);
    }
}

function setup() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    document.body.addEventListener("fullscreenchange", (e) => {
        setCanvasDimensions(canvas.clientWidth, canvas.clientHeight);
    });

    setCanvasDimensions(canvas.clientWidth, canvas.clientHeight);

    camera = new Camera();

    initTextures();
    initObjects();

    objectiveBenchmarker = new Benchmarker("Objective Time");
    iterationBenchmarker = new Benchmarker("Iteration Time");
}

function initTextures() {
    let noiseBufferWidth = 256;
    let noiseBufferHeight = 256;

    noiseTexture = noise.perlinBuffer(noiseBufferWidth, noiseBufferHeight, 0.5, 0.5)

    textures = [
        new Texture2D(
            noiseBufferWidth, noiseBufferHeight,
            Array.from(new Array(noiseBufferWidth * noiseBufferHeight)).map((val, index) => {
                let noiseVal = noiseTexture[index] * 0.5 + 0.5;
                
                return RGBA.brightness(noiseVal * 255);
            })
        ),
    ];
}

function initObjects() {
    let numObjects = 0;
    let numFaces = 9;
    let numBisections = 0;
    let rangeX = 25000;
    let rangeY = 25000;
    let rangeZ = 25000;

    let dims = new Vector3(250, 250, 250);

    for (let i = 0; i < numObjects; i++) {
        let rand = Math.floor(Math.random() * 3);

        let textureIndex = 0;
        let attributeInterpolationMode;
        let coordinateInterpolationMode = settings.coordinateInterpolation.attribute;
        let colorMode = settings.color.vertex;
        let shadingMode = settings.shading.none;

        let objectStructure;
        let vertexType;

        if (rand == 0) {
            objectStructure = createIcosphereMesh(1, 1, 1, 0, 0, 0, numBisections);
            vertexType = 0;
            attributeInterpolationMode = settings.attributeInterpolation.nearest;
        } else if (rand == 1) {
            objectStructure = createCubeMeshTriangles(1, 1, 1, 0, 0, 0);
            vertexType = 0;
            attributeInterpolationMode = settings.attributeInterpolation.smooth;
        } else if (rand == 2) {
            objectStructure = createSphereMeshVector3(1, 1, 1, 0, 0, 0, numFaces);
            vertexType = 1;
            attributeInterpolationMode = settings.attributeInterpolation.first;
        }

        let loc = new Vector3(Math.random() * rangeX - rangeX / 2, Math.random() * rangeY - rangeY / 2, Math.random() * rangeZ - rangeZ / 2);

        let data = {
            textureIndex: textureIndex,
            vertexType: vertexType,
            attributeInterpolationMode: attributeInterpolationMode,
            coordinateInterpolationMode: coordinateInterpolationMode,
            colorMode: colorMode,
            shadingMode: shadingMode,
        }

        let newTriangleObject = new TriangleObject(objectStructure, loc, dims.clone(), data);

        objects.push(newTriangleObject);
    }
}

function startLoop() {
    loop = setInterval(function() {
        try {            
            iterationBenchmarker.updateCurrentTime();

    	    Terminal.clear();

            update();
            rasterize();

            tick++;
        } catch (error) {
            alert(error.stack);
        }
    }, tickRate);
}

function update() {
    camera.tick();
}