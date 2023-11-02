<script setup lang="ts">
import { inject, ref } from 'vue';
import Select3 from '../Select3.vue';
import { Api } from '../../utils/api';
import { getNumFromLS } from '../../utils/utils';

const api = inject<Api>('api');
if (!api) {
    throw new Error('Api is undefined');
}


const teacherId = ref(getNumFromLS('teacherId', undefined));
const teacherName = ref<string>();

defineExpose({
    fetcher(date: string, week: boolean) {
        if (teacherId.value === undefined) {
            throw new Error('Не выбран преподаватель');
        }

        return api.getPairs({
            date,
            week,
            teacherId: teacherId.value,
        });
    },
    titleGenerator() {
        return `Преподаватель ${teacherName.value}`;
    },
    resetInputs() {
        teacherId.value = undefined;
    },
    saveState() {
        localStorage.teacherId = teacherId.value;
    },
});


const datalist = await api.getTeachers();
const teachers = datalist.map(teacher => ({ id: teacher.id, value: teacher.name }));
</script>

<template >
    <div class="col-xs-12 col-md-6 col-lg-12">
        <Select3 :datalist="teachers" v-model:id="teacherId" v-model:value="teacherName" placeholder="ФИО преподавателя" />
    </div>
</template>