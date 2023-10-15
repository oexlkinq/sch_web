<script setup lang="ts">
import App from './App.vue';
</script>
<template>
    <Suspense>
        <App />
        <template #fallback>
            Loading...
        </template>
    </Suspense>
</template>