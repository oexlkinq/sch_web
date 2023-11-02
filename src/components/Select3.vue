<script setup lang="ts" generic="id">
import { computed, ref } from 'vue';
import { useFloating, size, autoUpdate } from '@floating-ui/vue';

import { vClickOutside } from '../utils/utils';

type datalist = { id: id, value: string }[];

const props = withDefaults(defineProps<{
    datalist?: datalist,
    id?: id,
    placeholder?: string,
}>(), {
    datalist: () => [] as datalist,
    placeholder: '',
});

const emits = defineEmits<{
    (event: 'update:id', id: id | undefined): void,
    (event: 'update:value', value: string): void,
}>();


const inputEl = ref<HTMLInputElement>();
const floating = ref<HTMLDivElement>();

const value = ref<string>('');
const bindIdIndex = props.datalist.findIndex((v) => v.id === props.id);
if(bindIdIndex !== -1){
    emits('update:value', props.datalist[bindIdIndex].value);

    value.value = String(props.datalist[bindIdIndex].value);
}

const datalist = computed(() => {
    return props.datalist.filter((v) => {
        // если поле ввода пустое, то в предлагаемом списке должны оказаться все варианты
        if (!value.value || String(v.value).toLocaleLowerCase().includes(value.value.toLocaleLowerCase())) {
            return true;
        }
    });
});


const opened = ref(false);

function hide() {
    opened.value = false;
    // inputEl.value?.blur();
}
function selectIndex(index: number) {
    emits('update:id', datalist.value[index].id);
    emits('update:value', datalist.value[index].value);

    value.value = String(datalist.value[index].value);

    hide();
}
function oninput(event: KeyboardEvent) {
    // TODO: перебор вариантов списка стрелочками
    // if (event.key === 'ArrowDown'){
    //     floating.value?.focus();

    //     return;
    // }

    if (event.key === 'Enter') {
        hide();

        return;
    }

    const index = datalist.value.findIndex((v) => value.value === String(v.value));
    if (index !== -1) {
        emits('update:id', datalist.value[index].id);
        emits('update:value', datalist.value[index].value);
    } else {
        emits('update:id', undefined);
        emits('update:value', value.value);
    }
}


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
    <div v-click-outside="hide">
        <input type="text" class="form-control" ref="inputEl" v-model="value" @click="opened = true;" @keyup="oninput"
            :placeholder="props.placeholder">
        <div ref="floating" class="list-group floating" :style="floatingStyles" v-show="opened">
            <button v-for="(data, i) in datalist" class="list-group-item" @click="selectIndex(i)">{{ data.value
            }}</button>
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