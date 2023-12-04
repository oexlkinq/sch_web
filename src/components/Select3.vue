<script setup lang="ts" generic="id">
import { computed, ref, watch } from 'vue';
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
    (event: 'update:value', value: string | undefined): void,
}>();


const inputEl = ref<HTMLInputElement>();
const floating = ref<HTMLDivElement>();

const definedDatalist = computed(() => props.datalist || []);

const isIdUpdatedByInput = ref<Boolean>(false);
function onpropsidupdate(){
    if(isIdUpdatedByInput.value){
        isIdUpdatedByInput.value = false;
        return;
    }

    const index = definedDatalist.value.findIndex((v) => v.id === props.id);

    if(index !== -1){
        id.value = definedDatalist.value[index]?.id;
        value.value = definedDatalist.value[index]?.value;
    }else{
        id.value = undefined;
        value.value = undefined;
    }
}

const id = ref<id | undefined>();
const value = ref<string | undefined>();

watch(id, (value) => emits('update:id', value));
watch(value, (value) => {return emits('update:value', value)});

onpropsidupdate();

const props_id = computed(() => props.id);
watch([props_id], onpropsidupdate);

const datalist = computed(() => {
    const lowerCaseQuery = value.value?.toLocaleLowerCase('ru');

    let tempDatalist = definedDatalist.value
        .map((v, i) => ({ id: v.id, value: v.value, index: i }))
        .filter((v) => !lowerCaseQuery || String(v.value).toLocaleLowerCase('ru').includes(lowerCaseQuery));
    //                  ^если поле ввода пустое, то для всех будет true и все варианты останутся в списке

    if(lowerCaseQuery){
        tempDatalist.sort((a, b) => Number(b.value.toLocaleLowerCase('ru').startsWith(lowerCaseQuery)) - Number(a.value.toLocaleLowerCase('ru').startsWith(lowerCaseQuery)));
    }

    return tempDatalist;
});

const opened = ref(false);

function hide() {
    opened.value = false;
}
function selectIndex(index: number) {
    const baseIndex = datalist.value[index].index;

    id.value = definedDatalist.value[baseIndex]?.id;
    value.value = definedDatalist.value[baseIndex]?.value;

    hide();
}

function oninput() {
    // TODO: перебор вариантов списка стрелочками

    // TODO: это действие сбрасывает value, т.к. затрагивает родителя, тот обновляет props.id, что зануляет value
    isIdUpdatedByInput.value = true;
    id.value = undefined;
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
        <input type="text" class="form-control" ref="inputEl" v-model="value" @click="opened = true;" @input="oninput"
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