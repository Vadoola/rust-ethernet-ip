<template>
  <button
    @click="$emit('click')"
    class="card text-left hover:shadow-md transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
  >
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
          <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="icon === 'eye'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path v-else-if="icon === 'edit'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            <path v-else-if="icon === 'layers'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            <path v-else-if="icon === 'zap'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
      <div class="ml-4">
        <h4 class="text-sm font-medium text-gray-900">{{ title }}</h4>
        <p class="text-xs text-gray-500">{{ description }}</p>
      </div>
    </div>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
  icon: string
}>()

defineEmits<{
  click: []
}>()
</script>
