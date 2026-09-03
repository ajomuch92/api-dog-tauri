<script setup lang="ts">
import UIkit from 'uikit';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps<{ modelValue: boolean; title?: string; wide?: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>();

const el = ref<HTMLElement | null>(null);
let modal: ReturnType<typeof UIkit.modal> | null = null;

onMounted(() => {
  if (!el.value) return;
  modal = UIkit.modal(el.value, { bgClose: false, escClose: true, stack: true, container: false });
  UIkit.util.on(el.value, 'hidden', () => emit('update:modelValue', false));
  if (props.modelValue) modal.show();
});

watch(
  () => props.modelValue,
  (open) => (open ? modal?.show() : modal?.hide()),
);

onBeforeUnmount(() => {
  modal?.hide();
  modal?.$destroy();
});
</script>

<template>
  <div ref="el" class="uk-modal" :class="{ 'uk-modal-container': wide }">
    <div class="uk-modal-dialog">
      <button class="uk-modal-close-default" type="button" uk-close></button>
      <div v-if="title" class="uk-modal-header">
        <h2 class="uk-modal-title uk-text-default uk-text-bold">{{ title }}</h2>
      </div>
      <div class="uk-modal-body">
        <slot />
      </div>
      <div v-if="$slots.footer" class="uk-modal-footer uk-text-right">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
