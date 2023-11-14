<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue';
import Select3 from '../Select3.vue';
import { Api } from '../../utils/api';
import { getNumFromLS } from '../../utils/utils';

const api = inject<Api>('api');
if (!api) {
    throw new Error('Api is undefined');
}

// TODO: добавить событие обновления полей ввода, чтобы чистить переменную schedule снаружи

const facultyIndex = ref(getNumFromLS('facultyIndex', undefined));
const facultyTitle = ref<string>();

const groupId = ref(getNumFromLS('groupId', undefined));
const groupTitle = ref<string>();

watch(groupId, () => {
    if(facultyIndex.value === undefined && groupId.value){
        const found = datalist.findIndex(v => {
            console.log(v.groups.some(v => v.id === groupId.value));
            return v.groups.some(v => v.id === groupId.value);
        });
        console.log(found);
        
        facultyIndex.value = (found === -1) ? undefined : found;
    }
});

watch(facultyIndex, (value) => {
    if(value === undefined){
        groupId.value = undefined;
    }
});


const fetcher = (date: string, week: boolean) => {
    if (groupId.value === undefined) {
        throw new Error('Необходимо выбрать одну из групп в списке');
    }

    return api.getPairs({
        date,
        week,
        groupId: groupId.value,
    });
};

const titleGenerator = () => {
    return ((facultyTitle.value) ? `${facultyTitle.value}, ` : '') + `${groupTitle.value?.toLocaleUpperCase()} группа`;
};

const resetInputs = () => {
    facultyIndex.value = undefined;
    facultyTitle.value = undefined;
    groupId.value = undefined;
};

const saveState = () => {
    localStorage.facultyIndex = facultyIndex.value;
    localStorage.groupId = groupId.value;
};

defineExpose({
    fetcher,
    titleGenerator,
    resetInputs,
    saveState,
});


const datalist = await api.getGroups();

const faculties = datalist.map((v, i) => ({ id: i, value: v.faculty }));
const groups = computed(() => {
    let groups;
    if (facultyIndex.value !== undefined) {
        groups = datalist[facultyIndex.value].groups;
    } else {
        groups = datalist.flatMap((fac) => fac.groups);
    }

    return groups.map((group) => ({ id: group.id, value: group.name.toLocaleUpperCase() }));
});
</script>

<template>
    <div class="col-xs-12 col-md-9">
        <Select3 :datalist="faculties" v-model:id="facultyIndex" v-model:value="facultyTitle"
            placeholder="Институт, факультет, колледж" />
    </div>

    <div class="col-xs-12 col-md-3">
        <Select3 :datalist="groups" v-model:id="groupId" v-model:value="groupTitle" placeholder="Группа" />
    </div>
</template>