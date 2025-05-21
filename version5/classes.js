class Camera {
    constructor(origin = Vector3.neutral(), translations = Vector3.neutral(), rotations = Vector3.neutral()) {
        this.origin = origin;
        this.translations = translations;
        this.rotations = rotations;

        this.velocity = Vector3.neutral();
        this.acceleration = new Vector3(10, 10, 10);

        this.setup();
        
        this.readingMouse = true;
    }

    toggleReadingMouse() {
        this.readingMouse = !this.readingMouse;
    }

    stopReadingMouse() {
        this.readingMouse = false;
    }

    startReadingMouse() {
        this.readingMouse = true;
    }

    setup() {
        this.pressedKeys = {};

        this.mouseListener = new MouseListener(document.body, 
            {
                mousemove: (e) => {
                    if (!this.readingMouse) {
                        return;
                    }
                    
                    let totalRotation = Math.PI * 2;

                    let locX = e.movementX;
                    let locY = e.movementY;
                    let ratioX = locX / document.body.clientWidth;
                    let ratioY = locY / document.body.clientHeight;

                    let rotationVector = new Vector3(ratioY, ratioX, 0.0).scaled(totalRotation);

                    this.rotations.add(rotationVector);

                    if (this.rotations.x > Math.PI / 2) {
                        this.rotations.x = Math.PI / 2;
                    } else if (this.rotations.x < -Math.PI / 2) {
                        this.rotations.x = -Math.PI / 2;
                    }
                }
            }
        );

        this.keyboardListener = new KeyboardListener(document.body,
            {
                keydown: async (e) => {
                    let code = e.code;

                    if (e.altKey) {
                        e.preventDefault();
                    }

                    if (code == "KeyF") {
                        if (document.fullscreenElement) {
                            await document.exitFullscreen();
                            document.exitPointerLock();
                        } else {
                            await document.body.requestFullscreen();
                            await document.body.requestPointerLock();
                        }
                    } else if (code == "Backquote") {
                        Terminal.toggleVisibility();
                    } else if (code == "Backspace") {
                        this.toggleReadingMouse();
                    }

                    this.pressedKeys[code] = true;
                },
                keyup: (e) => {
                    let code = e.code;

                    if (e.altKey) {
                        e.preventDefault();
                    }

                    this.pressedKeys[code] = false;
                }
            }
        );
    }

    tick() {
        let translations = this.translations;
        let rotations = this.rotations;
        let velocity = this.velocity;
        let acceleration = this.acceleration;
        let pressedKeys = this.pressedKeys;

        let sprintScale = pressedKeys["AltLeft"] ? 2 : 1;

        let warpFactor = 16;
        zNear = zNearDefault * (1 + (1 - sprintScale) / warpFactor);

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
            velocity.add(movementStepZ);
        }
        if (pressedKeys["KeyS"]) {
            velocity.subtract(movementStepZ);
        }
        if (pressedKeys["Space"]) {
            velocity.subtract(movementStepY);
        }
        if (pressedKeys["ShiftLeft"]) {
            velocity.add(movementStepY);
        }

        let totalVelocity = velocity.magnitude();
        if (totalVelocity > velocityMax * sprintScale) {
            velocity.scale(velocityMax * sprintScale / totalVelocity);
        }

        translations.add(velocity);
        velocity.scale(friction);
    }
}

class TriangleObject {
    constructor(structure, location, dimensions, {textureIndex = 0, vertexType = 0, attributeInterpolationMode = 0, coordinateInterpolationMode = 0, colorMode = 0, shadingMode = 0} = {}, {vColorMap = 0, vTxCoordMap = 0} = {}) {
        this.structure = structure;
        this.location = location;
        this.dimensions = dimensions;

        this.textureIndex = textureIndex;
        this.vertexType = vertexType;
        this.attributeInterpolationMode = attributeInterpolationMode;
        this.coordinateInterpolationMode = coordinateInterpolationMode;
        this.colorMode = colorMode;
        this.shadingMode = shadingMode;

        this.initializeBuffers(vColorMap, vTxCoordMap);
    }

    initializeBuffers(vColorMap, vTxCoordMap) {
        this.mapVertices();
        this.mapVertexColors(vColorMap);
        this.mapTextureCoordinates(vTxCoordMap);
    }

    mapVertices() {
        this.vertices = this.structure.map((v) => {
            return v.product(this.dimensions).sum(this.location);
        });
    }

    mapVertexColors(vColorMap) {
        switch (vColorMap) {
            case 0: {
                this.vertexColors = this.structure.map((v) => {
                    let scaled = v.scaled(0.5).sum(Vector3.half()).scaled(255);

                    return new RGBA(scaled.x, scaled.y, scaled.z, 255);
                });

                break;
            }
            case 1: {
                this.vertexColors = this.structure.map((v) => {
                    let offset1 = 0;
                    let offset2 = 25;
                    let offset3 = 50;

                    let scaled = v.scaled(0.5).sum(Vector3.half()).product(this.dimensions);

                    let r = (noise.perlin3(scaled.x + offset1, scaled.y + offset2, scaled.z + offset3) * 0.5 + 0.5) * 255;
                    let g = (noise.perlin3(scaled.x + offset2, scaled.y + offset3, scaled.z + offset1) * 0.5 + 0.5) * 255;
                    let b = (noise.perlin3(scaled.x + offset3, scaled.y + offset1, scaled.z + offset2) * 0.5 + 0.5) * 255;

                    return new RGBA(r, g, b, 255);
                });

                break;
            }
        }
    }

    mapTextureCoordinates(vTxCoordMap) {
        switch (vTxCoordMap) {
            case 0: {
                this.vertexTextureCoordinates = this.structure.map((v) => {

                    let vNorm = v.normalised();

                    let angle1 = Math.atan2(vNorm.y, vNorm.x);
                    let angle2 = Math.asin(vNorm.z);

                    let value1 = angle1 / (2 * Math.PI) + 0.5;
                    let value2 = angle2 / Math.PI + 0.5;

                    if (!value1) {
                        return Vector2.neutral();
                    }

                    let uv = new Vector2(value1, value2);
                        
                    return uv;
                });

                break;
            }
        }
    }
}