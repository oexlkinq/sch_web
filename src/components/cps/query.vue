<script setup lang="ts">
import { inject, ref } from 'vue';
import { Api } from '../../utils/api';

const api = inject<Api>('api');
if (!api) {
    throw new Error('Api is undefined');
}


const query = ref<string | undefined>(localStorage.query as string);

defineExpose({
    fetcher(date: string, week: boolean) {
        if (query.value === undefined) {
            throw new Error('Не указан поисковый запрос');
        }

        return api.getPairs({
            date,
            week,
            query: query.value,
        });
    },
    titleGenerator() {
        return `Результаты поиска для "${query.value}"`;
    },
    resetInputs() {
        query.value = undefined;
    },
    saveState() {
        localStorage.query = query.value;
    },
});

</script>

<template >
    <div class="col-xs-12 col-md-6 col-lg-12">
        <input class="form-control" placeholder="Поисковый запрос" v-model="query">
    </div>
</template>