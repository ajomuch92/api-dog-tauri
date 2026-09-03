<script setup lang="ts">
import { ref, watch } from 'vue';
import EndpointListItem from './EndpointListItem.vue';
import type { TreeNode } from '@/utils/tree';
import type { Folder } from '@/types/apidog';

const props = defineProps<{ node: TreeNode; depth: number; selectedId: number | null; forceOpen: boolean }>();
const emit = defineEmits<{
  (e: 'select', id: number): void;
  (e: 'create-endpoint', folderId: number): void;
  (e: 'edit-folder', folder: Folder): void;
  (e: 'delete-folder', folder: Folder): void;
}>();

// Todas las carpetas inician colapsadas; se abren al hacer clic o
// automáticamente cuando hay filtros activos (forceOpen).
const open = ref(props.forceOpen);
watch(() => props.forceOpen, (v) => v && (open.value = true));

const isVirtual = () => props.node.folder.id === 0;
</script>

<template>
  <div class="tree-node" :style="{ '--depth': depth }">
    <div class="tree-folder" @click="open = !open">
      <span :uk-icon="`icon: ${open ? 'chevron-down' : 'chevron-right'}; ratio: 0.8`" class="tree-caret"></span>
      <span uk-icon="icon: folder; ratio: 0.8" class="uk-margin-small-right uk-text-muted"></span>
      <span class="uk-text-truncate tree-folder-name">{{ node.folder.name }}</span>
      <span class="uk-badge tree-count">{{ node.count }}</span>
      <span class="tree-actions" @click.stop>
        <button class="uk-icon-link" uk-icon="icon: plus; ratio: 0.75" uk-tooltip="Nuevo endpoint aquí" @click="emit('create-endpoint', node.folder.id)"></button>
        <template v-if="!isVirtual()">
          <button class="uk-icon-link" uk-icon="icon: pencil; ratio: 0.75" uk-tooltip="Renombrar carpeta" @click="emit('edit-folder', node.folder)"></button>
          <button class="uk-icon-link uk-text-danger" uk-icon="icon: trash; ratio: 0.75" uk-tooltip="Eliminar carpeta" @click="emit('delete-folder', node.folder)"></button>
        </template>
      </span>
    </div>
    <div v-show="open" class="tree-children">
      <EndpointTreeNode
        v-for="child in node.children"
        :key="child.folder.id"
        :node="child"
        :depth="depth + 1"
        :selected-id="selectedId"
        :force-open="forceOpen"
        @select="emit('select', $event)"
        @create-endpoint="emit('create-endpoint', $event)"
        @edit-folder="emit('edit-folder', $event)"
        @delete-folder="emit('delete-folder', $event)"
      />
      <EndpointListItem
        v-for="ep in node.endpoints"
        :key="ep.id"
        :endpoint="ep"
        :active="ep.id === selectedId"
        @select="emit('select', ep.id)"
      />
    </div>
  </div>
</template>
