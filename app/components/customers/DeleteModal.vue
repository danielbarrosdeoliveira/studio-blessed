<script setup lang="ts">
withDefaults(
  defineProps<{
    count?: number
  }>(),
  {
    count: 0
  }
)

const open = ref(false)

async function onSubmit() {
  await new Promise((resolve) => setTimeout(resolve, 1000))
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Apagar ${count} cliente${count > 1 ? 's' : ''}?`"
    :description="`Tem certeza?, Essa ação não pode ser desfeita!`"
  >
    <slot />

    <template #body>
      <div class="flex justify-end gap-2">
        <UButton label="Cancel" color="neutral" variant="subtle" @click="open = false" />
        <UButton label="Delete" color="error" variant="solid" loading-auto @click="onSubmit" />
      </div>
    </template>
  </UModal>
</template>
