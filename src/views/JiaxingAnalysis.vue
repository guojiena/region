<template>
  <div class="argo-page jiaxing-analysis">
    <aside class="left-panel">
      <div class="panel-header">
        <h3>图层</h3>
      </div>

      <div class="panel-body">
        <LayerSearchButton
          v-for="layer in layers"
          :key="layer.id"
          :layer="layer"
          @search="onLayerSearch"
        />
      </div>

      <div class="panel-footer">
        <h4>人口热力</h4>
        <button class="argo-btn" @click="toggleHeatmap">
          {{ heatmapVisible ? '隐藏热力图' : '显示热力图' }}
        </button>
      </div>
    </aside>

    <main class="main-map">
      <AMapView ref="amapView" :layers-config="layers" />
      <div class="legend-box" v-if="activeLegend">
        <div class="legend-title">图例 — {{ activeLegend.title }}</div>
        <img :src="activeLegend.url" alt="legend" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LayerSearchButton from '@/components/LayerSearchButton.vue'
import AMapView from '@/components/AMapView.vue'

const amapView = ref(null)
const activeLegend = ref(null)
const heatmapVisible = ref(true)

// 与 GeoServer 中 layer 对应的配置 —— 按需修改字段名或 layerName
const layers = [
  { id: 'amenity_jiaxing', title: '兴趣点', workspace: 'region', layerName: 'amenity_jiaxing', displayNameField: 'name' },
  { id: 'boundary_adm6', title: '行政界线', workspace: 'region', layerName: 'boundary_administrative_admin_level_6_jiaxing', displayNameField: 'name' },
  { id: 'highway_primary', title: '主干路', workspace: 'region', layerName: 'highway_primary_Jiaxing', displayNameField: 'name' },
  { id: 'leisure', title: '休闲设施', workspace: 'region', layerName: 'leisure_jiaxing', displayNameField: 'name' },
  { id: 'waterway', title: '水系', workspace: 'region', layerName: 'waterway_jiaxing', displayNameField: 'name' }
]

function onLayerSearch({ layer, legendUrl }) {
  activeLegend.value = { title: layer.title, url: legendUrl }
  amapView.value && amapView.value.showLayer(layer)
}

function toggleHeatmap() {
  heatmapVisible.value = !heatmapVisible.value
  amapView.value && amapView.value.toggleHeatmap(heatmapVisible.value)
}
</script>

<style scoped>
.argo-page { display:flex; height:100vh; font-family:var(--argo-font, Arial); }
.left-panel { width:300px; border-right:1px solid var(--argo-border,#e6e6e6); padding:16px; box-sizing:border-box; background:var(--argo-panel-bg,#fff); }
.panel-header h3 { margin:0 0 12px 0; font-size:16px; }
.panel-body { display:flex; flex-direction:column; gap:8px; overflow:auto; padding-bottom:12px; }
.panel-footer { margin-top:12px; }
.argo-btn { padding:8px 12px; border-radius:4px; border:1px solid #ccc; background:#f6f6f6; cursor:pointer; }
.main-map { flex:1; position:relative; }
.legend-box { position:absolute; right:12px; top:12px; background:#fff; padding:8px; border-radius:6px; box-shadow:0 4px 12px rgba(0,0,0,0.08); z-index:2000; }
.legend-title { font-weight:600; margin-bottom:6px; }
.legend-box img { max-width:200px; display:block; }
</style>
