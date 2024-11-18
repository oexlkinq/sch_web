<script setup lang="ts">
import { inject, onMounted, ref } from 'vue';
import Select3, { selection } from '../Select3.vue';
import { api } from '../../utils/api';
import { stateType } from '../../App.vue';

defineExpose({
    fetcher(date: string, week: boolean) {
        if (!api) {
            throw new Error('Приложение загружается. Попробуйте ещё раз позже')
        }

        if (searchMode.value) {
            if (!query.value) {
                throw new Error('Запрос пуст')
            }

            return api.pairs.get({
                date: new Date(date),
                week,
                query: query.value,
            })
        } else {
            if (!selectedTeacher.value) {
                throw new Error('Необходимо выбрать одного из преподавателей в списке');
            }

            const teacher = teachers[selectedTeacher.value.index]

            return api.pairs.get({
                date: new Date(date),
                week,
                teacherId: teacher.id,
            });
        }
    },
    titleGenerator() {
        if (searchMode.value) {
            if (!query.value) {
                console.warn('вызвана генерация заголовка расписания при отсутствии поискового запроса')

                return 'Результаты поиска'
            }

            return `Результаты поиска по "${query.value}"`
        } else {
            if (!selectedTeacher.value) {
                console.warn('вызвана генерация заголовка расписания при отсутствии выбранного преподавателя')

                return 'Расписание'
            }

            const teacher = teachers[selectedTeacher.value.index]

            return `Преподаватель <a href="${datalist.find(v => v.id === teacher.id)?.url}" target="_blank" style="font-size: 24px;">${teacher.name}`;
        }
    },
    resetInputs() {
        teacherSelect.value?.reset()
    },
    saveState() {
        if (!state) {
            throw new Error('Приложение загружается. Попробуйте ещё раз позже')
        }

        state.data.teacherIndex = selectedTeacher.value?.index;
        state.data.searchMode = searchMode.value
        state.data.searchQuery = query.value
    },
});

const state = await inject<stateType>('state')
if (!state) {
    throw new Error('State is undefined')
}

const teacherSelect = ref<InstanceType<typeof Select3>>()
const selectedTeacher = ref<selection>();
onMounted(() => {
    if (teacherSelect.value && state.data.teacherIndex) {
        teacherSelect.value.selectIndex(state.data.teacherIndex, false)
    }
})

const searchMode = ref(state.data.searchMode)
const query = ref(state.data.searchQuery)


const datalist = await api.teachers.get();
const teachers = datalist.map((teacher, originalIndex) => ({
    id: teacher.id,
    name: teacher.name,
    originalIndex,
}));
const teacherNames = teachers.map(teacher => teacher.name)
</script>

<template>
    <div class="row align-items-center">
        <div class="col-xs-12 col-lg-9">
            <Select3 v-show="searchMode" placeholder="Поисковый запрос" v-model:query="query" />
            <Select3 v-show="!searchMode" :datalist="teacherNames" v-model:selection="selectedTeacher"
                placeholder="ФИО преподавателя" ref="teacherSelect" />
        </div>
        <div class="col-xs-12 col-lg-3">
            <label class="checkbox-label"><input type="checkbox" v-model="searchMode" class="checkbox">Свободный
                поиск</label>
        </div>
    </div>
</template>