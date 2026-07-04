<template>
  <div class="layer-item">
    <button class="layer-btn" @click="open">{{ layer.title }}</button>

    <div v-if="showModal" class="modal-wrap" @click.self="close">
      <div class="modal">
        <div class="modal-head">
          <h3>按名称搜索 — {{ layer.title }}</h3>
        </div>

        <div class="modal-body">
          <input v-model="query" @keyup.enter="doSearch" placeholder="输入名称 (name) 搜索" class="input" />
          <div class="actions">
            <button class="btn primary" @click="doSearch">搜索</button>
            <button class="btn" @click="close">关闭</button>
          </div>

          <div v-if="results && results.features?.length" class="results">
            <div class="result-count">找到 {{ results.features.length }} 条</div>
            <ul class="result-list">
              <li v-for="(f, idx) in results.features" :key="idx">
                <a href="#" @click.prevent="selectFeature(f)">{{ getDisplayName(f) }}</a>
              </li>
            </ul>
          </div>
          <div v-else-if="searched" class="no-result">未找到匹配项</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { searchFeaturesByName, getLegendGraphicUrl } from '@/services/geoserverService'

const props = defineProps({ layer: { type: Object, required: true } })
const emits = defineEmits(['search'])

const showModal = ref(false)
const query = ref('')
const results = ref(null)
const searched = ref(false)

function open() {
  showModal.value = true
  results.value = null
  query.value = ''
  searched.value = false
}

function close() { showModal.value = false }

function getDisplayName(feature) {
  const field = props.layer.displayNameField || 'name'
  return feature.properties?.[field] || feature.id || '无名'
}

async function doSearch() {
  if (!query.value) return
  results.value = null
  searched.value = false
  try {
    const geojson = await searchFeaturesByName(props.layer, query.value)
    results.value = geojson
    searched.value = true
    const legendUrl = getLegendGraphicUrl(props.layer)
    emits('search', { layer: props.layer, legendUrl })
    window.dispatchEvent(new CustomEvent('jiaxing:search-results', { detail: { layer: props.layer, geojson } }))
  } catch (err) {
    console.error(err)
    searched.value = true
  }
}

function selectFeature(feature) {
  window.dispatchEvent(new CustomEvent('jiaxing:feature-selected', { detail: { layer: props.layer, feature } }))
  close()
}
</script>

<style scoped>
.layer-item { width:100%; }
.layer-btn { width:100%; padding:8px 10px; text-align:left; border-radius:6px; border:1px solid #e0e0e0; background:#fff; cursor:pointer; }
.modal-wrap { position:fixed; left:0; top:0; right:0; bottom:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; z-index:3000; }
.modal { width:460px; background:#fff; border-radius:8px; padding:16px; box-shadow:0 8px 30px rgba(0,0,0,0.12); }
.modal-head h3 { margin:0; }
.input { width:100%; padding:8px; margin:10px 0; border:1px solid #ddd; border-radius:4px; }
.actions { display:flex; gap:8px; justify-content:flex-end; margin-bottom:8px; }
.btn { padding:6px 10px; border-radius:4px; border:1px solid #ccc; background:#f5f5f5; cursor:pointer; }
.btn.primary { background:#1890ff; color:#fff; border:0; }
.results { margin-top:6px; }
.result-list { list-style:none; padding:0; margin:0; max-height:240px; overflow:auto; }
.result-list li { padding:6px 0; border-bottom:1px dashed #f0f0f0; }
.no-result { color:#888; margin-top:8px; }
</style>