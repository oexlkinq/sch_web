<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useFloating, size, autoUpdate } from '@floating-ui/vue';

import { escapeRegExp, vClickOutside } from '../utils/utils';

defineExpose({
    selectIndex,
    reset,
})

type valueType = string
type datalist = valueType[];
export type selection = {
    index: number,
    value: valueType,
}

const props = withDefaults(defineProps<{
    datalist?: datalist,
    placeholder?: string,
    query?: string,
}>(), {
    datalist: () => [] as datalist,
    placeholder: '',
    query: '',
});

const emit = defineEmits<{
    'update:selection': [selection: selection | undefined],
    'update:query': [query: string]
    'user-input': [],
}>();

const query = ref(props.query)
watch(query, () => emit('update:query', query.value))

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
    const re = new RegExp(`(?<=\\s|^)${escapeRegExp(query.value)}`, 'i')
    tempDatalist.sort((a, b) => {
        const searchA = a.value.search(re)
        const searchB = b.value.search(re)

        if (searchA > 0 && searchB > 0) {
            return searchA - searchB
        }

        if (searchA === -1) {
            return 1
        }

        if (searchB === -1) {
            return -1
        }

        return 0
    });

    return tempDatalist;
});


const selection = ref<selection | undefined>()

// функция для смены выделения
function selectIndex(index: number, isTrusted: boolean) {
    const item = props.datalist[index]

    query.value = item

    selection.value = {
        index,
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
function reset(isTrusted = false) {
    query.value = ''

    // сбросить текущее выделение
    selection.value = undefined
    emit('update:selection', undefined)

    if (isTrusted) {
        inputEl.value?.focus()

        emit('user-input')
    }
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
</script>

<template>
    <div v-click-outside="() => open = false" class="wrapper">
        <input type="text" class="form-control" :class="{ clearable: !!query }" ref="inputEl" @focus="open = true"
            @input="oninput" :value="query" :placeholder="props.placeholder">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="reset-input"
            viewBox="0 0 16 16" @click="reset(true)" v-show="!!query">
            <path
                d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708" />
        </svg>
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

.wrapper {
    position: relative;
    display: flex;
    align-items: center;
}

.reset-input {
    background: none;
    outline: none;
    border: none;
    cursor: pointer;
}

.clearable {
    padding-right: 24px;
    margin-right: -26px;
}
</style>