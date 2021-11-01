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
var models = createDefaultImageryProviderViewModels().filter(model => model.name !== 'Earth at night');
var model = new Cesium.ProviderViewModel({
  name: 'Black Marble Night Lights',
  iconUrl: 'Widgets/Images/ImageryProviders/earthAtNight.png',
  tooltip: 'Nighttime view of the Earth, collected by the Suomi NPP satellite in 2012',
  creationFunction: function() {
    return new Cesium.TileMapServiceImageryProvider(
        {url: 'https://fasiha.github.io/nasa-black-marble-tiles', credit: new Cesium.Credit('NASA Night Lights 2012')});
  }
});
models.push(model);

// Create the viewer!
var viewer = new Cesium.Viewer(
    'cesiumContainer', {animation: false, timeline: false, imageryProviderViewModels: models, skyAtmosphere: false});
var imageryLayers = viewer.imageryLayers;
if (window) {
  (window as any).viewer = viewer;
}

// We want rivers!
var scene = viewer.scene;
var pickedName = '';
Cesium.GeoJsonDataSource.load('ne_10m_rivers_lake_centerlines_scale_rank.json', {credit: 'Natural Earth II'})
    .then(dataSource => {
      const entities = dataSource.entities.values;
      const r = new Set('Gambia,Sénégal,Niger,Benue'.split(','));
      for (const entity of entities) {
        const polyline = entity.polyline;
        if (polyline) {
          polyline.clampToGround = true as any;
          const properties: Record<string, any> = entity.properties as any;
          const name = '' + properties['name'];
          const normalColor = r.has(name) ? Cesium.Color.HOTPINK : Cesium.Color.WHITE;
          polyline.material = new Cesium.ColorMaterialProperty(new Cesium.CallbackProperty(
              (_time, result) => (pickedName === name ? Cesium.Color.SIENNA : normalColor).clone(result), false));
          polyline.width = 1 + Math.max(0, 10 - properties['scalerank']) / 4 as any;
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
handler.setInputAction(function(movement) {
  var pickedObject = scene.pick(movement.endPosition);
  var cartesian = viewer.camera.pickEllipsoid(movement.endPosition, scene.globe.ellipsoid);
  if (pickedObject?.id?.name && cartesian) {
    cursor.position = cartesian as any;
    (cursor as any).label.show = true;
    pickedName = pickedObject?.id?.name;
    (cursor as any).label.text = pickedName as any;
  } else {
    (cursor as any).label.show = false;
    pickedName = '';
  }
}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

// Add our texture-shaded elevation!
function addAdditionalLayerOption(imageryProvider: Cesium.TileMapServiceImageryProvider, alpha: number,
                                  contrast: number, brightness: number) {
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

var params = {brightness: 1, contrast: 1, saturation: 1, texBrightness: 1, texContrast: 2, texAlpha: 0.8};

var tms = addAdditionalLayerOption(tmsProvider, params.texAlpha, params.texContrast, params.texBrightness);

// Create some controls!
var ul = document.createElement('ul');
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