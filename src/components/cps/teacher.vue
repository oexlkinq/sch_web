<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';
import Select3, { selection } from '../Select3.vue';
import { Api } from '../../utils/api';
import { stateType } from '../../App.vue';

const api = inject<Api>('api');
if (!api) {
    throw new Error('Api is undefined');
}
const state = inject<stateType>('state')
if (!state) {
    throw new Error('State is undefined')
}

const teacherSelect = ref<InstanceType<typeof Select3>>()
const selectedTeacher = ref<selection>();
onMounted(() => {
    if(teacherSelect.value && state.data.teacherIndex){
        teacherSelect.value.selectIndex(state.data.teacherIndex, false)
    }
})

defineExpose({
    fetcher(date: string, week: boolean) {
        if (!selectedTeacher.value) {
            throw new Error('Необходимо выбрать одного из преподавателей в списке');
        }

        const teacher = teachers[selectedTeacher.value.index]

        return api.getPairs({
            date,
            week,
            teacherId: teacher.id,
        });
    },
    titleGenerator() {
        if(!selectedTeacher.value){
            console.warn('вызвана генерация заголовка расписания при отсутствии выбранного преподавателя')

            return 'Расписание'
        }

        const teacher = teachers[selectedTeacher.value.index]

        return `Преподаватель <a href="${datalist.find(v => v.id === teacher.id)?.url}" target="_blank" style="font-size: 24px;">${teacher.name}`;
    },
    resetInputs() {
        teacherSelect.value?.reset()
    },
    saveState() {
        state.data.teacherIndex = selectedTeacher.value?.index;
    },
});


const datalist = await api.getTeachers();
const teachers = datalist.map((teacher, originalIndex) => ({
    id: teacher.id,
    name: teacher.name,
    originalIndex,
}));
const teacherNames = teachers.map(teacher => teacher.name)
</script>

<template >
    <div class="col-xs-12 col-md-6 col-lg-12">
        <Select3 :datalist="teacherNames" v-model:selection="selectedTeacher" placeholder="ФИО преподавателя" ref="teacherSelect"/>
    </div>
</template>