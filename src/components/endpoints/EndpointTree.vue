<script setup lang="ts">
import EndpointTreeNode from './EndpointTreeNode.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import type { TreeNode } from '@/utils/tree';
import type { Folder } from '@/types/apidog';

defineProps<{ tree: TreeNode[]; selectedId: number | null; forceOpen: boolean }>();
const emit = defineEmits<{
  (e: 'select', id: number): void;
  (e: 'create-endpoint', folderId: number): void;
  (e: 'edit-folder', folder: Folder): void;
  (e: 'delete-folder', folder: Folder): void;
}>();
</script>

<template>
  <div class="endpoint-tree">
    <EmptyState v-if="!tree.length" icon="code" title="Sin endpoints" hint="Crea uno con el botón + o ajusta los filtros." />
    <EndpointTreeNode
      v-for="node in tree"
      :key="node.folder.id"
      :node="node"
      :depth="0"
      :selected-id="selectedId"
      :force-open="forceOpen"
      @select="emit('select', $event)"
      @create-endpoint="emit('create-endpoint', $event)"
      @edit-folder="emit('edit-folder', $event)"
      @delete-folder="emit('delete-folder', $event)"
    />
  </div>
</template>
