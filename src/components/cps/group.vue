<script setup lang="ts">
import { computed, inject, onMounted, ref, watch } from 'vue';
import Select3, { selection } from '../Select3.vue';
import { api } from '../../utils/api';
import { stateType } from '../../App.vue';


defineExpose({
    fetcher: (date: string, week: boolean) => {
        if (!api) {
            throw new Error('Приложение загружается. Попробуйте ещё раз позже')
        }

        if (!selectedGroup.value) {
            // TODO: подсвечивать поле ввода вместо ошибки
            throw new Error('Необходимо выбрать одну из групп в списке');
        }

        const groupInfo = filteredGroupsInfo.value[selectedGroup.value.index]

        return api.pairs.get({
            date: new Date(date),
            week,
            groupId: groupInfo.id,
        });
    },
    titleGenerator: () => {
        if (!selectedGroup.value) {
            console.warn('вызвана генерация заголовка расписания при отсутствии выбранной группы')

            return 'Расписание'
        }

        const groupInfo = filteredGroupsInfo.value[selectedGroup.value.index]

        return `${groupInfo.facultyName}, ${groupInfo.name} группа`
    },
    resetInputs: () => {
        groupSelect.value?.reset()
        facultySelect.value?.reset()
    },
    saveState: () => {
        if (!state) {
            throw new Error('Приложение загружается. Попробуйте ещё раз позже')
        }

        state.data.facultyIndex = selectedFaculty.value?.index;
        state.data.groupIndex = selectedGroup.value?.index;
    },
});


const state = await inject<stateType>('state')
if (!state) {
    throw new Error('State is undefined')
}

// TODO: добавить событие обновления полей ввода, чтобы чистить переменную schedule снаружи

const datalist = await api.groups.get();

const facultySelect = ref<InstanceType<typeof Select3>>()
const groupSelect = ref<InstanceType<typeof Select3>>()

const selectedFaculty = ref<selection>()
const selectedGroup = ref<selection>()
onMounted(() => {
    // применить группу из памяти
    if (groupSelect.value && state.data.groupIndex) {
        const groupSelectRef = groupSelect.value
        const groupIndex = state.data.groupIndex

        // следить за обновлением факультета и сменить выделение после его применения ниже, чтобы groupIndex указывал на группу из списка выбранного факультета
        watch(selectedFaculty, () => {
            groupSelectRef.selectIndex(groupIndex, false)
        }, { once: true, flush: 'post' })
    }
    // применить факультет из памяти
    if (facultySelect.value && state.data.facultyIndex) {
        facultySelect.value.selectIndex(state.data.facultyIndex, false)
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
    // по умолчанию брать все группы из всех факультетов
    let list = groups.map((group, originalIndex) => ({ ...group, originalIndex }))

    // если факультет выбран, то взять его список групп
    if (selectedFaculty.value) {
        list = list.filter(group => group.facultyIndex === selectedFaculty.value?.index)
    }

    return list
})

// список названий групп текущего факультета. зависит от filteredGroupsInfo
const groupNames = computed(() => {
    return filteredGroupsInfo.value.map((group) => group.name.toLocaleUpperCase('ru'))
})

// следить за обновлениями группы
watch(selectedGroup, () => {
    // если искали по группе не выбрав факультет, найти его по группе
    if (!selectedFaculty.value && selectedGroup.value) {
        const facultyIndex = filteredGroupsInfo.value[selectedGroup.value.index].facultyIndex
        const groupIndex = selectedGroup.value.index

        // как только найденный факультет будет применён, список групп изменится. найти новый индекс по имени группы и применить его
        watch(selectedFaculty, () => {
            const newGroupIndex = filteredGroupsInfo.value.findIndex(group => group.originalIndex === groupIndex)

            if (newGroupIndex === -1) {
                groupSelect.value?.reset()
            } else {
                groupSelect.value?.selectIndex(newGroupIndex, false)
            }
        }, { once: true, flush: 'post' })

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
    <div class="row align-items-center">
        <div class="col-xs-12 col-lg-9">
            <Select3 :datalist="faculties" v-model:selection="selectedFaculty" ref="facultySelect" @user-input="resetGroup"
                placeholder="Институт, факультет, колледж" />
        </div>
    
        <div class="col-xs-12 col-lg-3">
            <Select3 :datalist="groupNames" v-model:selection="selectedGroup" ref="groupSelect" placeholder="Группа" />
        </div>
    </div>
</template>