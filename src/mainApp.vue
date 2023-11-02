<script setup lang="ts">
import App from './App.vue';
</script>
<template>
    <Suspense>
        <App />
        
        <template #fallback>
            <div class="center-children">
                <div class="spinner-border"></div>
            </div>
        </template>
    </Suspense>
</template>