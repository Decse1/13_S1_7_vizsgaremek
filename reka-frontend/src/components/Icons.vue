<script setup>
import { PlusIcon, PencilIcon, TrashIcon, ChevronLeftIcon } from '@heroicons/vue/24/outline'

defineProps({
  name: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: '1.5rem'
  }
})
</script>

<template>
  <PlusIcon v-if="name === 'plus'" :style="{ width: size, height: size }" />
  <PencilIcon v-if="name === 'pencil'" :style="{ width: size, height: size }" />
  <TrashIcon v-if="name === 'trash'" :style="{ width: size, height: size }" />
  <ChevronLeftIcon v-if="name === 'chevronleft'" :style="{ width: size, height: size }" />
  <!-- Add more icons as needed -->
</template>
