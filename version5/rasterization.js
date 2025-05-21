function rasterize() {
    let width = canvas.width;
    let halfWidth = width / 2;
    let width4 = width * 4;

    let height = canvas.height;
    let halfHeight = height / 2;

    let aspect = width / height;
    let screenArea = width * height;
    let sourceWidth = 1920;

    let sourceResolution = new Vector2(sourceWidth, sourceWidth / aspect);
    let targetResolution = new Vector2(width, height);
    let resolutionScaleVec = targetResolution.quotient(sourceResolution);

    let screenScale = new Vector3(resolutionScaleVec.x, resolutionScaleVec.y, 1);
    let origin = camera.origin;
    let translations = camera.translations;
    let rotations = camera.rotations;

    let colorBuffer = new Uint8ClampedArray(width4 * height);
    let depthBuffer = new Float32Array(width * height);

    let canvasOffset = new Vector3(width / 2, height / 2, 0);

    let {
        frustomCulling,
        screenspaceCulling,
        backfaceCulling,
        depthTest,
        compositeMode,
        shadingMode,
    } = globalSettings;

    for (let i = 0; i < objects.length; i++) {
        let object = objects[i];

        let {
            vertices, 
            vertexColors, 
            vertexTextureCoordinates, 
            textureIndex, 
            vertexType, 
            attributeInterpolationMode, 
            coordinateInterpolationMode, 
            colorMode, 
        } = object;

        let verticesLength = vertices.length;
        let newVertices = [];
        let texture = textures[textureIndex];
        
        let step;
        
        if (vertexType == 0) {
            step = 3;
        } else if (vertexType == 1) {
            step = 1;
        }

        for (let j = 0; j < verticesLength; j++) {
            let vertex = vertices[j];

            let translated = vertex.difference(translations);
            let rotated = translated.rotateRad(rotations, origin);
            let zScaled = rotated.scaleZ(zNear, origin);
            let screenScaled = zScaled.product(screenScale);
            let inCanvasCoordinates = screenScaled.sum(canvasOffset);
            let rounded = inCanvasCoordinates.rounded();

            newVertices[j] = rounded;
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

            let {x: x1, y: y1, z: z1} = vert1;
            let {x: x2, y: y2, z: z2} = vert2;
            let {x: x3, y: y3, z: z3} = vert3;

            let minZ = Math.min(z1, z2, z3);

            let minX = Math.min(x1, x2, x3), maxX = Math.max(x1, x2, x3);
            let minY = Math.min(y1, y2, y3), maxY = Math.max(y1, y2, y3);
            
            let boundingWidth = maxX - minX;
            let boundingHeight = maxY - minY;

            const triangleArea = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1);
            const triangleAreaSign = Math.sign(triangleArea);
            const triangleAreaAbs = Math.abs(triangleArea);
            const widthPercent = boundingWidth / width;
            const heightPercent = boundingHeight / height;

            let frustomFlag = false;
            let screenspaceFlag = false;
            let backfaceFlag = false;

            switch (frustomCulling) {
                case 0: {
                    if (!(minZ <= 0 || minX >= width || maxX <= 0 || minY >= height || maxY <= 0)) {
                        frustomFlag = true;
                    }
                    break;
                }
                case 1: {
                    frustomFlag = true;
                    break;
                }
            }

            if (!frustomFlag) {
                continue;
            }

            switch (screenspaceCulling) {
                case 0: {
                    screenspaceFlag = widthPercent >= 0.0001 && heightPercent >= 0.0001;
                    break;
                }
                case 1: {
                    screenspaceFlag = widthPercent >= 0.001 && heightPercent >= 0.001;
                    break;
                }
                case 2: {
                    screenspaceFlag = widthPercent >= 0.01 && heightPercent >= 0.01;
                    break;
                }
                case 3: {
                    screenspaceFlag = widthPercent >= 0.1 && heightPercent >= 0.1;
                    break;
                }
                case 4: {
                    screenspaceFlag = widthPercent >= 1 && heightPercent >= 1;
                    break;
                }
                case 5: {
                    screenspaceFlag = true;
                    break;
                }
            }

            if (!screenspaceFlag) {
                continue;
            }

            switch (backfaceCulling) {
                case 0: {
                    backfaceFlag = triangleAreaSign == 1;
                    break; 
                }
                case 1: {
                    backfaceFlag = triangleAreaSign == -1;
                    break;
                }
                case 2: {
                    backfaceFlag = triangleAreaSign != 0;
                    break;
                }
            }

            if (!backfaceFlag) {
                continue;
            }

            let {r: r1, g: g1, b: b1, a: a1} = vertexColors[vert1Index];
            let {r: r2, g: g2, b: b2, a: a2} = vertexColors[vert2Index];
            let {r: r3, g: g3, b: b3, a: a3} = vertexColors[vert3Index];
            let {x: u1, y: v1} = vertexTextureCoordinates[vert1Index];
            let {x: u2, y: v2} = vertexTextureCoordinates[vert2Index];
            let {x: u3, y: v3} = vertexTextureCoordinates[vert3Index];

            let z1Inverse = 1 / (z1 * triangleAreaAbs);
            let z2Inverse = 1 / (z2 * triangleAreaAbs);
            let z3Inverse = 1 / (z3 * triangleAreaAbs);

            minX = Math.max(minX, 0);
            maxX = Math.min(maxX, width - 1);
            minY = Math.max(minY, 0);
            maxY = Math.min(maxY, height - 1);

            boundingWidth = maxX - minX;
            boundingHeight = maxY - minY;

            const y2y3 = (y2 - y3) * triangleAreaSign;
            const x3x2 = (x3 - x2) * triangleAreaSign;
            const y3y1 = (y3 - y1) * triangleAreaSign;
            const x1x3 = (x1 - x3) * triangleAreaSign;
            const w3StepX = y2y3 + y3y1;
            const w3StepY = x3x2 + x1x3;

            let index1 = (minX + minY * width) * 4;
            let w1_1 = y2y3 * (minX - x3) + x3x2 * (minY - y3);
            let w2_1 = y3y1 * (minX - x3) + x1x3 * (minY - y3);
            let w3_1 = triangleAreaAbs - w1_1 - w2_1;

            for (let ix = 0; ix < boundingWidth; ix++, index1 += 4, w1_1 += y2y3, w2_1 += y3y1, w3_1 -= w3StepX) {
                let index2 = index1;
                let w1_2 = w1_1;
                let w2_2 = w2_1;
                let w3_2 = w3_1;

                for (let iy = 0; iy < boundingHeight; iy++, index2 += width4, w1_2 += x3x2, w2_2 += x1x3, w3_2 -= w3StepY) {
                    if (w1_2 < 0 || w2_2 < 0 || w3_2 < 0) {
                        continue;
                    }

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

                    let useFragmentFlag = true;

                    let depthBufferIndex = index2 / 4;

                    if (colorBuffer[index2 + 3] != 0) {
                        let existingDepth = depthBuffer[depthBufferIndex];

                        switch (depthTest) {
                            case 0: {
                                useFragmentFlag = existingDepth > z;
                                break;
                            }
                            case 1: {
                                useFragmentFlag = existingDepth >= z;
                                break;
                            }
                            case 2: {
                                useFragmentFlag = existingDepth < z;
                                break;
                            }
                            case 3: {
                                useFragmentFlag = existingDepth <= z;
                                break;
                            }
                            case 4: {
                                useFragmentFlag = existingDepth == z;
                                break;
                            }
                            case 5: {
                                useFragmentFlag = existingDepth != z;
                                break;
                            }
                            case 6: {
                                break;
                            }
                        }
                    }

                    if (useFragmentFlag) {
                        depthBuffer[depthBufferIndex] = z;

                        colorBuffer[index2] = r;
                        colorBuffer[index2 + 1] = g;
                        colorBuffer[index2 + 2] = b;
                        colorBuffer[index2 + 3] = a;
                    }
                }
            }
        }
    }
    
    let colorBufferLength = width4 * height;

    switch (compositeMode) {
        case 0: {
            break;
        }
        case 1: {
            for (let i = 0; i < colorBufferLength; i += 4) {
                let a = colorBuffer[i + 3];

                if (a == 0) {
                    continue;
                }

                let r = colorBuffer[i];
                let g = colorBuffer[i + 1];
                let b = colorBuffer[i + 2];

                let z = depthBuffer[i / 4];

                switch (shadingMode) {
                    case 0: {
                        break;
                    }
                    case 1: {
                        let scalar = Math.pow(Math.min(1, -zNear / z), 1.25);

                        r = ~~(r * scalar);
                        g = ~~(g * scalar);
                        b = ~~(b * scalar);

                        break;
                    }
                    case 2: {
                        let scalar = Math.cbrt(depth / -z);

                        r = ~~(r * scalar);
                        g = ~~(g * scalar);
                        b = ~~(b * scalar);

                        break;
                    }
                }

                colorBuffer[i] = r;
                colorBuffer[i + 1] = g;
                colorBuffer[i + 2] = b;
                colorBuffer[i + 3] = a;
            }

            break;
        }
    }

    ctx.putImageData(new ImageData(colorBuffer, width), 0, 0);

    objectiveBenchmarker.add();
    iterationBenchmarker.add();

    let benchmarkerPrecision = 2;

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
