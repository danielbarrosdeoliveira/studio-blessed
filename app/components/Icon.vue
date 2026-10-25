<script setup lang="ts">
import { Icon as IconifyIcon } from '@iconify/vue'

const props = defineProps<{
  icon: string
  size?: string | number
  class?: string | string[]
  style?: Record<string, string> | string
}>()
</script>

<template>
  <IconifyIcon v-bind="props" />
</template>
