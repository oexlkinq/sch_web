<script setup lang="ts">
import { computed, ref } from 'vue';
import { useFloating, size, autoUpdate } from '@floating-ui/vue';

import { escapeRegExp, vClickOutside } from '../utils/utils';

type valueType = string
type datalist = valueType[];
export type selection = {
    index: number,
    value: valueType,
}

const props = withDefaults(defineProps<{
    datalist?: datalist,
    placeholder?: string,
}>(), {
    datalist: () => [] as datalist,
    placeholder: '',
});

const emit = defineEmits<{
    'update:selection': [selection: selection | undefined],
    'user-input': [],
}>();

const query = ref('')

/** список значений, в которых найден запрос от пользователя. зависит от query и props.datalist */
const filtered = computed(() => {
    let tempDatalist = props.datalist.map((value, index) => ({
        index,
        value,
    }))

    if (!query.value) {
        return tempDatalist
    }

    const lowerCaseQuery = query.value.toLocaleLowerCase('ru');

    // фильтр по запросу от пользователя
    tempDatalist = tempDatalist.filter(item => item.value.toLocaleLowerCase('ru').includes(lowerCaseQuery));

    // сортировка по месту вхождения подстроки, чтобы первыми оказались строки, в которых слова начинаются с запроса от пользователя
    const re = new RegExp(`(\\b)${escapeRegExp(query.value)}`, 'i')
    tempDatalist.sort((a, b) => {
        const searchA = a.value.search(re)
        const searchB = b.value.search(re)

        if (searchA >= 0 && searchB >= 0) {
            return searchA - searchB
        }

        if (searchA === -1) {
            return 1
        }

        if (searchB === -1) {
            return -1
        }

        return a.value.localeCompare(b.value, 'ru')
    });

    return tempDatalist;
});


const selection = ref<selection | undefined>()

// функция для смены выделения
function selectIndex(index: number, isTrusted: boolean) {
    const item = props.datalist[index]

    query.value = item

    selection.value = {
        index: index,
        value: item,
    }
    emit('update:selection', selection.value)

    open.value = false

    // смысл isTrusted аналогичен isTrusted из Event
    if (isTrusted) {
        emit('user-input')
    }
}

// функция для сброса выделения
function reset() {
    query.value = ''

    // сбросить текущее выделение
    selection.value = undefined
    emit('update:selection', undefined)
}

// вызывается при изменении запроса в поле ввода
function oninput(event: Event) {
    if (!event.isTrusted) {
        return
    }

    // сбросить текущее выделение
    selection.value = undefined
    emit('update:selection', undefined)

    // обновить запрос (вызовет обновление фильтрованного списка)
    query.value = (event.target as HTMLInputElement).value

    if (event.isTrusted) {
        emit('user-input')
    }
}


const open = ref(false)

const floating = ref<HTMLDivElement>();
const inputEl = ref<HTMLInputElement>();
// создание стиля для блока списка результатов поиска
const { floatingStyles } = useFloating(inputEl, floating, {
    middleware: [
        size({
            apply({ rects }) {
                if (floating.value) {
                    floating.value.style.width = rects.reference.width + 'px';
                }
            }
        })
    ],
    whileElementsMounted: autoUpdate,
});

defineExpose({
    selectIndex,
    reset,
})
</script>

<template>
    <div v-click-outside="() => open = false">
        <input type="text" class="form-control" ref="inputEl" @click="open = true" @input="oninput" :value="query"
            :placeholder="props.placeholder">
        <div ref="floating" class="list-group floating" :style="floatingStyles" v-show="open">
            <button v-for="item in filtered" class="list-group-item" @click="selectIndex(item.index, true)">
                {{ item.value }}
            </button>
        </div>
    </div>
</template>

<style scoped>
.floating {
    z-index: 1;
    max-height: 400px;
    overflow-y: scroll;
}
</style>