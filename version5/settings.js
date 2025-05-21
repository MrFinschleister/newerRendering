let zNearDefault = -500;
let zNear = zNearDefault;
let resolutionScale = 1;

let settings = {
    vertexType: {
        triangles: 0,
        strip: 1,
    },

    attributeInterpolation: {
        smooth: 0,
        first: 1,
        nearest: 2,
    },
    
    coordinateInterpolation: {
        attribute: 0,
        correct: 1,
    },

    color: {
        vertex: 0,
        texture: 1,
    },

    shading: {
        none: 0,
        depth_darker: 1,
        depth_lighter: 2,
    },

    frustomCulling: {
        screen: 0,
        none: 1,
    },

    backfaceCulling: {
        counterclockwise: 0,
        clockwise: 1,
        none: 2,
    },

    screenspaceCulling: {
        millionth: 0,
        hundredthousandth: 1,
        tenthousandth: 2,
        thousandth: 3,
        hundredth: 4,
        none: 5,
    },

    depthTest: {
        less: 0,
        lequals: 1,
        greater: 2,
        gequals: 3,
        equals: 4,
        notequals: 5,
        none: 6,
    },

    composite: {
        none: 0,
        all: 1,
    }
};

let settingsPresets = {
    basic: {
        attributeInterpolationMode: settings.attributeInterpolation.smooth,
        coordinateInterpolationMode: settings.coordinateInterpolation.attribute,
        colorMode: settings.color.vertex,
    },
    nearest: {
        attributeInterpolationMode: settings.attributeInterpolation.nearest,
        coordinateInterpolationMode: settings.coordinateInterpolation.attribute,
        colorMode: settings.color.vertex,
    },
    noise: {
        attributeInterpolationMode: settings.attributeInterpolation.smooth,
        coordinateInterpolationMode: settings.coordinateInterpolation.attribute,
        colorMode: settings.color.vertex,
    },
    first: {
        attributeInterpolationMode: settings.attributeInterpolation.first,
        coordinateInterpolationMode: settings.coordinateInterpolation.attribute,
        colorMode: settings.color.vertex,
    }
}

let mappingPresets = {
    basic: {
        vColorMap: 0,
        vTxCoordMap: 0,
    },
    nearest: {
        vColorMap: 0,
        vTxCoordMap: 0,
    },
    noise: {
        vColorMap: 1,
        vTxCoordMap: 0,
    },
    first: {
        vColorMap: 0,
        vTxCoordMap: 0,
    }
}

let globalSettings = {
    frustomCulling: settings.frustomCulling.screen,
    screenspaceCulling: settings.screenspaceCulling.none,
    backfaceCulling: settings.backfaceCulling.counterclockwise,
    depthTest: settings.depthTest.less,
    compositeMode: settings.composite.none,
    shadingMode: settings.shading.none,
}