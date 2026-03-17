import { reactive } from 'vue'

let instance = null

export function dragModel() {
    if (instance) return instance

    const state = reactive({
        isDragging: false,
        draggedItem: null,
        sourceType: null,  // 'stuff', 'action', 'project'
        droppedExternally: false,
    })

    function startDrag(item, sourceType) {
        state.isDragging = true
        state.draggedItem = item
        state.sourceType = sourceType
        state.droppedExternally = false
    }

    function markExternalDrop() {
        state.droppedExternally = true
    }

    function endDrag() {
        state.isDragging = false
        state.draggedItem = null
        state.sourceType = null
    }

    instance = { state, startDrag, endDrag, markExternalDrop }
    return instance
}
