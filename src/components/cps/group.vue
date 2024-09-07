<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue';
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

defineExpose({
    fetcher: (date: string, week: boolean) => {
        if (!selectedGroup.value) {
            // TODO: подсвечивать поле ввода вместо ошибки
            throw new Error('Необходимо выбрать одну из групп в списке');
        }

        const groupInfo = groups[selectedGroup.value.originalIndex]

        return api.getPairs({
            date,
            week,
            groupId: groupInfo.id,
        });
    },
    titleGenerator: () => {
        if (!selectedGroup.value) {
            console.warn('вызвана генерация заголовка расписания при отсутствии выбранной группы')

            return 'Расписание'
        }

        const groupInfo = groups[selectedGroup.value.originalIndex]

        return `${groupInfo.facultyName}, ${groupInfo.name} группа`
    },
    resetInputs: () => {
        groupSelect.value?.reset()
        facultySelect.value?.reset()
    },
    saveState: () => {
        state.data.facultyIndex = selectedFaculty.value?.originalIndex;
        state.data.groupIndex = selectedGroup.value?.originalIndex;
    },
});

// TODO: добавить событие обновления полей ввода, чтобы чистить переменную schedule снаружи

const datalist = await api.getGroups();

const facultySelect = ref<InstanceType<typeof Select3>>()
const groupSelect = ref<InstanceType<typeof Select3>>()

const selectedFaculty = ref<selection>()
const selectedGroup = ref<selection>()
onMounted(() => {
    if (facultySelect.value && state.data.facultyIndex) {
        facultySelect.value.selectIndex(state.data.facultyIndex, false)
    }
    if (groupSelect.value && state.data.groupIndex) {
        groupSelect.value.selectIndex(state.data.groupIndex, false)
    }
})


const faculties = datalist.map(item => item.faculty);

// список всех доступных групп
const groups = datalist.flatMap((facultyItem, facultyIndex) => {
    return facultyItem.groups.map(group => ({
        id: group.id,
        name: group.name,
        facultyName: facultyItem.faculty,
        facultyIndex,
    }))
})

// список с информацией о группах текущего факультета. зависит от selectedFaculty
const filteredGroupsInfo = computed(() => {
    // если факультет выбран, то взять его список групп
    if (selectedFaculty.value) {
        return groups.filter(group => group.facultyIndex === selectedFaculty.value?.originalIndex)
    }

    // иначе взять все группы из всех факультетов
    return groups
})

// список названий групп текущего факультета. зависит от filteredGroupsInfo
const groupNames = computed(() => {
    return filteredGroupsInfo.value.map((group) => group.name.toLocaleUpperCase('ru'))
})

// следить за обновлениями группы
watch(selectedGroup, () => {
    // если искали по группе не выбрав факультет, найти его по группе
    if (!selectedFaculty.value && selectedGroup.value) {
        const facultyIndex = filteredGroupsInfo.value[selectedGroup.value.originalIndex].facultyIndex
        
        // сменить выбранный факультет. isTrusted = false не позволит сгенерировать событие user-input, что вызовет сброс группы и зациклит обновления
        facultySelect.value?.selectIndex(facultyIndex, false)
    }
});

// вызывается при изменении факультета пользователем
function resetGroup() {
    groupSelect.value?.reset()
}

</script>

<template>
    <div class="col-xs-12 col-md-9">
        <Select3 :datalist="faculties" v-model:selection="selectedFaculty" ref="facultySelect" @user-input="resetGroup"
            placeholder="Институт, факультет, колледж" />
    </div>

    <div class="col-xs-12 col-md-3">
        <Select3 :datalist="groupNames" v-model:selection="selectedGroup" ref="groupSelect" placeholder="Группа" />
    </div>
</template>