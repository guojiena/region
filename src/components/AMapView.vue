<template>
  <div class="amap-root" ref="mapContainer"></div>
</template>

<script setup>
import { onMounted, ref, defineExpose } from 'vue'
import { fetchPopulationPoints } from '@/services/populationService'

const props = defineProps({ layersConfig: { type: Array, default: () => [] } })
const mapContainer = ref(null)
let map = null
let heatmap = null
let overlays = []
const AMapKey = process.env.VUE_APP_AMAP_KEY

function loadAMapScript() {
  return new Promise((resolve, reject) => {
    if (window.AMap) return resolve(window.AMap)
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMapKey}&plugin=AMap.Heatmap`
    script.async = true
    script.onload = () => resolve(window.AMap)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function clearOverlays() { overlays.forEach(o => { try { o.setMap(null) } catch {} }); overlays = [] }

function drawGeoJSONFeature(feature) {
  if (!window.AMap || !map) return
  const geom = feature.geometry
  const props = feature.properties || {}
  if (!geom) return
  const type = geom.type
  if (type === 'Point') {
    const [lng, lat] = geom.coordinates
    const marker = new AMap.Marker({ position: [lng, lat] })
    marker.on('click', () => {
      const info = new AMap.InfoWindow({ content: renderPropsHTML(props) })
      info.open(map, [lng, lat])
    })
    marker.setMap(map)
    overlays.push(marker)
  } else if (type === 'LineString') {
    const path = geom.coordinates.map(c => ({ lng: c[0], lat: c[1] }))
    const pl = new AMap.Polyline({ path, strokeColor: '#3388ff', strokeWeight: 4 })
    pl.setMap(map)
    overlays.push(pl)
  } else if (type === 'Polygon') {
    const ring = geom.coordinates[0].map(c => ({ lng: c[0], lat: c[1] }))
    const polygon = new AMap.Polygon({ path: ring, strokeColor: '#3388ff', fillColor: 'rgba(51,136,255,0.12)' })
    polygon.setMap(map)
    overlays.push(polygon)
  } else if (type === 'MultiPolygon') {
    geom.coordinates.forEach(poly => {
      const ring = poly[0].map(c => ({ lng: c[0], lat: c[1] }))
      const polygon = new AMap.Polygon({ path: ring, strokeColor: '#3388ff', fillColor: 'rgba(51,136,255,0.12)' })
      polygon.setMap(map)
      overlays.push(polygon)
    })
  } else if (type === 'MultiLineString') {
    geom.coordinates.forEach(line => {
      const path = line.map(c => ({ lng: c[0], lat: c[1] }))
      const pl = new AMap.Polyline({ path, strokeColor: '#3388ff', strokeWeight: 3 })
      pl.setMap(map)
      overlays.push(pl)
    })
  } else if (type === 'MultiPoint') {
    geom.coordinates.forEach(pt => {
      const marker = new AMap.Marker({ position: [pt[0], pt[1]] })
      marker.setMap(map)
      overlays.push(marker)
    })
  }
}

function renderPropsHTML(props) {
  let html = '<div style="min-width:180px;"><h4>属性</h4><table style="width:100%;">'
  for (const k in props) {
    if (k === 'geometry') continue
    html += `<tr><td style="font-weight:600;padding:4px;border-bottom:1px solid #eee;width:35%">${k}</td><td style="padding:4px;border-bottom:1px solid #eee">${props[k]}</td></tr>`
  }
  html += '</table></div>'
  return html
}

async function createHeatmapFromAPI() {
  try {
    const data = await fetchPopulationPoints()
    if (!data || !data.length) return
    if (!window.AMap) return
    // AMap v2 Heatmap 使用 plugin('AMap.Heatmap') 已在 script url 中引入
    await AMap.plugin('AMap.Heatmap')
    if (heatmap) { heatmap.setMap(null); heatmap = null }
    heatmap = new AMap.Heatmap(map, { radius: 25, gradient: {0.1:'#00f',0.3:'#0ff',0.5:'#0f0',0.7:'#ff0',1.0:'#f00'} })
    const dataset = { data } // data: [{lng,lat,count}]
    heatmap.setDataSet(dataset)
  } catch (e) { console.warn('heatmap error', e) }
}

function extractAllCoords(geometry) {
  const out = []
  if (!geometry) return out
  const t = geometry.type
  if (t === 'Point') out.push(geometry.coordinates)
  else if (t === 'LineString' || t === 'MultiPoint') geometry.coordinates.forEach(c => out.push(c))
  else if (t === 'Polygon') geometry.coordinates[0].forEach(c => out.push(c))
  else if (t === 'MultiPolygon') geometry.coordinates.forEach(poly => poly[0].forEach(c => out.push(c)))
  return out
}

onMounted(async () => {
  await loadAMapScript()
  map = new AMap.Map(mapContainer.value, { center: [120.75, 30.75], zoom: 10, viewMode: '2D' })
  try { await createHeatmapFromAPI() } catch (e) { console.warn(e) }

  // 全部搜索结果 -> 绘制
  window.addEventListener('jiaxing:search-results', (e) => {
    const { geojson } = e.detail
    clearOverlays()
    if (geojson && geojson.features && geojson.features.length) {
      geojson.features.forEach(f => drawGeoJSONFeature(f))
      // fit to bounds (rough)
      const coords = extractAllCoords(geojson.features[0].geometry)
      if (coords.length) {
        const lons = coords.map(c => c[0]), lats = coords.map(c => c[1])
        const minLon = Math.min(...lons), maxLon = Math.max(...lons)
        const minLat = Math.min(...lats), maxLat = Math.max(...lats)
        map.setBounds([[minLon, minLat], [maxLon, maxLat]])
      }
    }
  })

  // 单条要素选择 -> 绘制并 zoom center
  window.addEventListener('jiaxing:feature-selected', (e) => {
    const { feature } = e.detail
    clearOverlays()
    if (feature && feature.type === 'Feature') {
      drawGeoJSONFeature(feature)
      if (feature.geometry.type === 'Point') {
        const [lng, lat] = feature.geometry.coordinates
        map.setZoomAndCenter(17, [lng, lat])
      }
    } else if (feature && feature.features) {
      feature.features.forEach(f => drawGeoJSONFeature(f))
    }
  })
})

function clearOverlays() { overlays.forEach(o => { try { o.setMap(null) } catch {} }); overlays = [] }

function showLayer(layer) { clearOverlays() }

async function toggleHeatmap(show) {
  if (show) {
    if (!heatmap) await createHeatmapFromAPI()
    heatmap && heatmap.setMap(map)
  } else {
    heatmap && heatmap.setMap(null)
  }
}

defineExpose({ showLayer, toggleHeatmap })
</script>

<style scoped>
.amap-root { width:100%; height:100vh; }
</style>