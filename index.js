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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const Cesium = __importStar(require("cesium"));
Cesium.Ion.defaultAccessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmNTlhMDg1Mi1hMTU3LTQwMWEtYThmMy1hZmRmZmNhMzk1ZmIiLCJpZCI6NzE5MDcsImlhdCI6MTYzNTU2ODQwMn0.LBKVBGjIpqU9rfeIJO4T6j81tG2nXqyFvz9D3JgXHFA';
// For some reason this is omitted from Cesium TypeScript defs: TODO open an
// issue
const createDefaultImageryProviderViewModels = Cesium.createDefaultImageryProviderViewModels;
// The Black Marble model from Cesium
// (https://cesiumjs.org/data-and-assets/imagery/black-marble/) is sometimes
// blocked due to CORS, so load it from GitHub Pages.
var models = createDefaultImageryProviderViewModels().filter(model => model.name !== 'Earth at night');
var model = new Cesium.ProviderViewModel({
    name: 'Black Marble Night Lights',
    iconUrl: 'Widgets/Images/ImageryProviders/earthAtNight.png',
    tooltip: 'Nighttime view of the Earth, collected by the Suomi NPP satellite in 2012',
    creationFunction: function () {
        return new Cesium.TileMapServiceImageryProvider({ url: 'https://fasiha.github.io/nasa-black-marble-tiles', credit: new Cesium.Credit('NASA Night Lights 2012') });
    }
});
models.push(model);
// Create the viewer!
var viewer = new Cesium.Viewer('cesiumContainer', { animation: false, timeline: false, imageryProviderViewModels: models, skyAtmosphere: false });
var imageryLayers = viewer.imageryLayers;
if (window) {
    window.viewer = viewer;
}
// Add our texture-shaded elevation!
function addAdditionalLayerOption(imageryProvider, alpha, contrast, brightness) {
    var layer = imageryLayers.addImageryProvider(imageryProvider);
    layer.alpha = alpha;
    layer.contrast = contrast;
    layer.brightness = brightness;
    return layer;
}
var tmsProvider = new Cesium.TileMapServiceImageryProvider({
    url: 'https://d2i33ldayhex0u.cloudfront.net/world-tex-cgiar-90m',
    credit: new Cesium.Credit('Ahmed Fasih, CGIAR-SRTM 90m'),
    flipXY: true
});
var params = { brightness: 1, contrast: 1, saturation: 1, texBrightness: 1, texContrast: 2, texAlpha: 0.8 };
var tms = addAdditionalLayerOption(tmsProvider, params.texAlpha, params.texContrast, params.texBrightness);
// Create some controls!
var ul = document.createElement('ul');
var maxes = { texAlpha: 1 };
for (const param of Object.keys(params)) {
    const input = document.createElement('input');
    input.type = 'range';
    input.min = '0';
    input.max = '' + ((_a = maxes[param]) !== null && _a !== void 0 ? _a : 3);
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
{
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.id = 'checkbox-texture';
    toggle.name = 'checkbox-texture';
    toggle.checked = true;
    toggle.onchange = e => { tms.show = e.target.checked; };
    const label = document.createElement('label');
    label.htmlFor = toggle.name;
    label.textContent = 'Show texture-shaded elevation?';
    const li = document.createElement('li');
    li.appendChild(toggle);
    li.appendChild(label);
    ul.appendChild(li);
}
{
    function riversLoaded() {
        for (let i = 0; i < viewer.dataSources.length; i++) {
            const src = viewer.dataSources.get(i);
            if (src.name.startsWith('ne_10m_rivers_lake_centerlines_scale_rank')) {
                return src;
            }
        }
        return undefined;
    }
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.id = 'checkbox-rivers';
    toggle.name = 'checkbox-rivers';
    toggle.checked = false;
    toggle.onchange = e => {
        const src = riversLoaded();
        if (src) {
            src.show = e.target.checked;
        }
        else {
            // We want rivers!
            var scene = viewer.scene;
            var pickedName = '';
            Cesium.GeoJsonDataSource.load('ne_10m_rivers_lake_centerlines_scale_rank.json', { credit: 'Natural Earth II' })
                .then(dataSource => {
                const entities = dataSource.entities.values;
                const r = new Set('Gambia,Sénégal,Niger,Benue'.split(','));
                for (const entity of entities) {
                    const polyline = entity.polyline;
                    if (polyline) {
                        polyline.clampToGround = true;
                        const properties = entity.properties;
                        const name = '' + properties['name'];
                        const normalColor = r.has(name) ? Cesium.Color.HOTPINK : Cesium.Color.WHITE;
                        polyline.material = new Cesium.ColorMaterialProperty(new Cesium.CallbackProperty((_time, result) => (pickedName === name ? Cesium.Color.SIENNA : normalColor).clone(result), false));
                        polyline.width = 1 + Math.max(0, 10 - properties['scalerank']) / 4;
                    }
                }
                viewer.dataSources.add(dataSource);
            });
            // We want to see river names!
            var cursor = viewer.entities.add({
                label: {
                    show: false,
                    showBackground: true,
                    font: "14px",
                    horizontalOrigin: Cesium.HorizontalOrigin.LEFT,
                    verticalOrigin: Cesium.VerticalOrigin.TOP,
                    pixelOffset: new Cesium.Cartesian2(15, 0),
                },
            });
            var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
            handler.setInputAction(function (movement) {
                var _a, _b;
                var pickedObject = scene.pick(movement.endPosition);
                var cartesian = viewer.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid);
                if (((_a = pickedObject === null || pickedObject === void 0 ? void 0 : pickedObject.id) === null || _a === void 0 ? void 0 : _a.name) && cartesian) {
                    cursor.position = cartesian;
                    cursor.label.show = true;
                    pickedName = (_b = pickedObject === null || pickedObject === void 0 ? void 0 : pickedObject.id) === null || _b === void 0 ? void 0 : _b.name;
                    cursor.label.text = pickedName;
                }
                else {
                    cursor.label.show = false;
                    pickedName = '';
                }
            }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        }
    };
    const label = document.createElement('label');
    label.htmlFor = toggle.name;
    label.textContent = 'Show rivers? (takes a few seconds)';
    const li = document.createElement('li');
    li.appendChild(toggle);
    li.appendChild(label);
    ul.appendChild(li);
}
{
    // latlon
    var places = {
        Bojador: [26.133333, -14.5],
        Canaries: [27.931944, -15.386667],
        Madeira: [32.694167, -16.778056],
        Azores: [37.741944, -25.697778],
        Lisbon: [38.774167, -9.134167],
        Nouakchott: [18.08581, -15.9785], // via https://en.wikipedia.org/wiki/Nouakchott
    };
    // https://www.4cities4dev.eu/filemanager/Materiali/ING_fotostoria_MAURITANIA_b.pdf mentions salt mining in Nouakchott
    // too
    var canaryCurrentPlaces = viewer.entities.add(new Cesium.Entity());
    var labelParams = {
        font: '14px sans-serif',
        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
    };
    for (var [place, [lat, lon]] of Object.entries(places)) {
        viewer.entities.add({
            parent: canaryCurrentPlaces,
            position: Cesium.Cartesian3.fromDegrees(lon, lat),
            label: Object.assign(Object.assign({}, labelParams), { text: place }),
        });
    }
    viewer.entities.add({
        name: "Canary Current avoidance route",
        parent: canaryCurrentPlaces,
        polyline: {
            positions: Cesium.Cartesian3.fromDegreesArray([
                places.Bojador, places.Canaries, places.Madeira, places.Azores, places.Lisbon
            ].flatMap(([lat, lon]) => [lon, lat])),
            material: Cesium.Color.YELLOW,
            width: 1,
            clampToGround: true,
        },
    });
    /*
    Via:
  
    var flyto = {
      orientation: {heading: viewer.camera.heading, pitch: viewer.camera.pitch, roll: viewer.camera.roll},
      destination:
          Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(viewer.scene.camera.positionCartographic.longitude),
                                        Cesium.Math.toDegrees(viewer.scene.camera.positionCartographic.latitude),
                                        viewer.scene.camera.positionCartographic.height)
    };
    */
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(-19.8, 7.1, 9918918),
        orientation: { heading: Cesium.Math.toRadians(43), pitch: Cesium.Math.toRadians(-79), roll: Cesium.Math.toRadians(350) }
    });
    const toggle = document.createElement('input');
    toggle.type = 'checkbox';
    toggle.id = 'checkbox-canary-current';
    toggle.name = 'checkbox-canary-current';
    toggle.checked = true;
    toggle.onchange = e => { canaryCurrentPlaces.show = e.target.checked; };
    const label = document.createElement('label');
    label.htmlFor = toggle.name;
    label.textContent = 'Show Canary Current avoidance route?';
    const li = document.createElement('li');
    li.appendChild(toggle);
    li.appendChild(label);
    ul.appendChild(li);
}
(_b = document.querySelector('#controls')) === null || _b === void 0 ? void 0 : _b.appendChild(ul);
