import axios from 'axios'

const POP_API = import.meta.env.VITE_POPULATION_API || ''
const GEOSERVER_OWS = (import.meta.env.VITE_GEOSERVER_BASE || 'http://localhost:8080/geoserver') + '/ows'

/**
 * 返回 heatmap 所需的数据格式：[{lng,lat,count}, ...]
 * 优先使用 VITE_POPULATION_API；若未配置则尝试 WFS 获取 region:jx_population_points（请按实际替换）
 */
export async function fetchPopulationPoints() {
  if (POP_API) {
    try {
      const res = await axios.get(POP_API)
      return res.data
    } catch (e) {
      console.warn('population api failed', e)
    }
  }

  try {
    const params = new URLSearchParams({
      service: 'WFS',
      version: '1.0.0',
      request: 'GetFeature',
      typeName: 'region:jx_population_points',
      outputFormat: 'application/json',
      srsName: 'EPSG:4326',
      maxFeatures: 5000
    })
    const url = `${GEOSERVER_OWS}?${params.toString()}`
    const res = await axios.get(url)
    const fc = res.data
    const out = []
    if (fc && fc.features) {
      fc.features.forEach(f => {
        const geom = f.geometry
        const props = f.properties || {}
        const count = props.count || props.population || 1
        if (geom && geom.type === 'Point') out.push({ lng: geom.coordinates[0], lat: geom.coordinates[1], count })
      })
    }
    return out
  } catch (e) {
    console.warn('geoserver population fetch failed', e)
    return []
  }
}
