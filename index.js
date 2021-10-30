"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Cesium = __importStar(require("cesium"));
Cesium.Ion.defaultAccessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmNTlhMDg1Mi1hMTU3LTQwMWEtYThmMy1hZmRmZmNhMzk1ZmIiLCJpZCI6NzE5MDcsImlhdCI6MTYzNTU2ODQwMn0.LBKVBGjIpqU9rfeIJO4T6j81tG2nXqyFvz9D3JgXHFA';
var viewer = new Cesium.Viewer('cesiumContainer', { animation: false, timeline: false });
var imageryLayers = viewer.imageryLayers;
function addAdditionalLayerOption(name, imageryProvider, alpha, contrast) {
    var layer = imageryLayers.addImageryProvider(imageryProvider);
    layer.alpha = Cesium.defaultValue(alpha, 0.5);
    layer.contrast = Cesium.defaultValue(contrast, 1.0);
    // layer.show = true;
    // layer.name = name;
    // Cesium.knockout.track(layer, ['alpha', 'show', 'name']);
    return layer;
}
var tmsProvider = new Cesium.TileMapServiceImageryProvider({
    url: 'https://d2i33ldayhex0u.cloudfront.net/world-tex-cgiar-90m',
    credit: new Cesium.Credit('Ahmed Fasih, CGIAR-SRTM 90m'),
    flipXY: true
});
var tms = addAdditionalLayerOption('TMS', tmsProvider, 0.75, 1.4);
var ul = document.createElement('ul');
var params = {
    brightness: 1,
    contrast: 1,
    saturation: 1,
    texBrightness: 1,
    texContrast: 2,
    texAlpha: 0.8
};
for (const param of Object.keys(params)) {
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '3';
    input.step = '0.02';
    input.value = '' + params[param];
    input.id = 'input-' + param;
    input.dataset['param'] = param;
    input.oninput = e => {
        const target = e.target;
        const value = target.value;
        const param = target.dataset['param'];
        const span = document.querySelector(`#description-${param}`);
        if (span) {
            span.innerHTML = `${param} ${value}`;
        }
        if (param === 'texAlpha') {
            tms.alpha = parseFloat(value);
        }
        else if (param === 'texContrast') {
            tms.contrast = parseFloat(value);
        }
        else if (param === 'texBrightness') {
            tms.brightness = parseFloat(value);
        }
        else {
            imageryLayers.get(0)[param] = parseFloat(value);
        }
    };
    const span = document.createElement('span');
    span.innerText = `${param} ${params[param]}`;
    span.id = 'description-' + param;
    const li = document.createElement('li');
    li.appendChild(input);
    li.appendChild(span);
    ul.appendChild(li);
}
document.body.appendChild(ul);
