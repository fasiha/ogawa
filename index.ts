import * as Cesium from 'cesium';
Cesium.Ion.defaultAccessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmNTlhMDg1Mi1hMTU3LTQwMWEtYThmMy1hZmRmZmNhMzk1ZmIiLCJpZCI6NzE5MDcsImlhdCI6MTYzNTU2ODQwMn0.LBKVBGjIpqU9rfeIJO4T6j81tG2nXqyFvz9D3JgXHFA';

// For some reason this is omitted from Cesium TypeScript defs: TODO open an
// issue
const createDefaultImageryProviderViewModels =
    (Cesium as (typeof Cesium) & {
      createDefaultImageryProviderViewModels: () => Cesium.ProviderViewModel[]
    }).createDefaultImageryProviderViewModels;

// The Black Marble model from Cesium
// (https://cesiumjs.org/data-and-assets/imagery/black-marble/) is sometimes
// blocked due to CORS, so load it from GitHub Pages.
var models = createDefaultImageryProviderViewModels().filter(
    model => model.name !== 'Earth at night');
var model = new Cesium.ProviderViewModel({
  name: 'Black Marble Night Lights',
  iconUrl: 'Widgets/Images/ImageryProviders/earthAtNight.png',
  tooltip:
      'Nighttime view of the Earth, collected by the Suomi NPP satellite in 2012',
  creationFunction: function() {
    return new Cesium.TileMapServiceImageryProvider({
      url: 'https://fasiha.github.io/nasa-black-marble-tiles',
      credit: new Cesium.Credit('NASA Night Lights 2012')
    });
  }
});
models.push(model);

// Create the viewer!
var viewer = new Cesium.Viewer(
    'cesiumContainer',
    {animation: false, timeline: false, imageryProviderViewModels: models});
var imageryLayers = viewer.imageryLayers;

// Add our texture-shaded elevation!
function addAdditionalLayerOption(
    name: string, imageryProvider: Cesium.TileMapServiceImageryProvider,
    alpha: number, contrast: number) {
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

// Create some controls!
var ul = document.createElement('ul');
var params = {
  brightness: 1,
  contrast: 1,
  saturation: 1,
  texBrightness: 1,
  texContrast: 2,
  texAlpha: 0.8
};
type Param = keyof typeof params;
var maxes: Partial<{[k in Param]: number}> = {texAlpha: 1};
for (const param of (Object.keys(params) as Param[])) {
  const input = document.createElement('input');
  input.type = 'range';
  input.min = '0';
  input.max = '' + (maxes[param] ?? 3);
  input.step = '0.02';
  input.value = '' + params[param];
  input.id = 'input-' + param;
  input.dataset['param'] = param;
  input.oninput = e => {
    const target: HTMLInputElement = e.target as any;
    const value = target.value;
    const param: Param = target.dataset['param'] as any;
    const span = document.querySelector(`#description-${param}`);
    if (span) {
      span.innerHTML = `${param} ${value}`;
    }
    if (param === 'texAlpha') {
      tms.alpha = parseFloat(value);
    } else if (param === 'texContrast') {
      tms.contrast = parseFloat(value);
    } else if (param === 'texBrightness') {
      tms.brightness = parseFloat(value);
    } else {
      imageryLayers.get(0)[param] = parseFloat(value);
    }
  };

  const span = document.createElement('span');
  span.innerText = `${param} ${params[param]}`;
  span.id = 'description-' + param;

  const li = document.createElement('li');
  li.appendChild(input)
  li.appendChild(span);
  ul.appendChild(li)
}
document.querySelector('#controls')?.appendChild(ul)