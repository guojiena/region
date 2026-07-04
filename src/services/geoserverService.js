import axios from 'axios'

const GEOSERVER_BASE = process.env.VUE_APP_GEOSERVER_BASE || 'http://localhost:8080/geoserver'
const GEOSERVER_OWS = `${GEOSERVER_BASE}/ows`

export function getLegendGraphicUrl(layer) {
    const layerName = `${layer.workspace}:${layer.layerName}`
    return `${GEOSERVER_BASE}/wms?REQUEST=GetLegendGraphic&FORMAT=image/png&LAYER=${encodeURIComponent(layerName)}`
}

/**
 * WFS 按 name 模糊查询 (CQL ILIKE)，返回 GeoJSON FeatureCollection
 * layer: { workspace, layerName, displayNameField }
 */
export async function searchFeaturesByName(layer, name) {
    const typeName = `${layer.workspace}:${layer.layerName}`
    const field = layer.displayNameField || 'name'
    const escaped = ('' + name).replace(/'/g, "''")
    const cql = `${field} ILIKE '%${escaped}%'`
    const params = new URLSearchParams({
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName,
        outputFormat: 'application/json',
        cql_filter: cql,
        maxFeatures: 1000
    })
    const url = `${GEOSERVER_OWS}?${params.toString()}`
    const res = await axios.get(url)
    return res.data
}

export async function getFeatureById(layer, id) {
    const typeName = `${layer.workspace}:${layer.layerName}`
    const params = new URLSearchParams({
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName,
        outputFormat: 'application/json',
        featureID: id
    })
    const url = `${GEOSERVER_OWS}?${params.toString()}`
    const res = await axios.get(url)
    return res.data
}

export default { getLegendGraphicUrl, searchFeaturesByName, getFeatureById }