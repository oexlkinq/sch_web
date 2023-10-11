<script setup lang="ts">
import { computed, ref } from 'vue';
import { useFloating, size, autoUpdate } from '@floating-ui/vue';

type strnum = string | number;
type datalist = { [key: strnum]: strnum }[];

const props = withDefaults(defineProps<{
    datalist?: datalist,
    id?: strnum,
    idKey?: strnum,
    valueKey?: strnum,
    placeholder?: string,
}>(), {
    datalist: () => [] as datalist,
    idKey: 'id',
    valueKey: 'value',
    placeholder: '',
});

const emits = defineEmits<{
    (event: 'update:id', id: strnum): void,
    (event: 'update:value', value: strnum): void,
}>();


const inputEl = ref<HTMLInputElement>();
const floating = ref<HTMLDivElement>();

const value = ref<string>('');
const bindIdIndex = props.datalist.findIndex((v) => v[props.idKey] === props.id);
if(bindIdIndex !== -1){
    emits('update:value', props.datalist[bindIdIndex][props.valueKey]);

    value.value = String(props.datalist[bindIdIndex][props.valueKey]);
}

const datalist = computed(() => {
    return props.datalist.filter((v) => {
        // если поле ввода пустое, то в предлагаемом списке должны оказаться все варианты
        if (!value.value || String(v[props.valueKey]).toLocaleLowerCase().includes(value.value.toLocaleLowerCase())) {
            return true;
        }
    });
});

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


const opened = ref(false);

window.addEventListener('click', (event) => {
    if (event.target !== inputEl.value && event.target !== floating.value) {
        hide();
    }
})
function hide() {
    opened.value = false;
    // inputEl.value?.blur();
}
function selectIndex(index: number) {
    emits('update:id', datalist.value[index][props.idKey]);
    emits('update:value', datalist.value[index][props.valueKey]);

    value.value = String(datalist.value[index][props.valueKey]);

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

    const index = datalist.value.findIndex((v) => value.value === String(v[props.valueKey]));
    if (index !== -1) {
        emits('update:id', datalist.value[index][props.idKey]);
        emits('update:value', datalist.value[index][props.valueKey]);
    } else {
        emits('update:id', value.value);
        emits('update:value', value.value);
    }
}

</script>

<template>
    <div>
        <input type="text" class="form-control" ref="inputEl" v-model="value" @click="opened = true;" @keyup="oninput"
            :placeholder="props.placeholder">
        <div ref="floating" class="list-group floating" :style="floatingStyles" v-show="opened">
            <button v-for="(data, i) in datalist" class="list-group-item" @click="selectIndex(i)">{{ data[props.valueKey]
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