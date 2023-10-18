<script setup lang="ts">
import { computed } from 'vue';
import { Day } from '../utils/api';
import { formatDate, times } from '../utils/utils';

const props = defineProps<{
    days: Day[],
}>();

const fulfilledDays = computed(() => {
    let days = [] as {date: Date, data: string[][]}[];
    props.days.forEach((day) => {
        let data = new Array<string[]>(5);

        day.pairs.forEach(pair => {
            // let addit = '';
            // if(pair.groups){
            //     addit = pair.groups.map(v => v.toLocaleUpperCase()).join(', ');
            // }else if(pair.teachers){
            //     addit = pair.teachers.map(v => {
            //         const [st, nd, rd] = v.name.replace(/ *\(.*?\) */g, ' ').split(' ');
            //         const name = `${st} ${nd[0]}.${rd[0]}.`;

            //         let code = name;
            //         if(v.url){
            //             code = `<a href="${v.url}" target="_blank">${code}</a>`;
            //         }

            //         return code;
            //     }).join(', ');
            // }

            if(data[pair.num - 1]){
                data[pair.num - 1] = [
                    data[pair.num - 1][0] + '<br>' + pair.text,
                ];
            }else{
                data[pair.num - 1] = [
                    pair.text,
                ];
            }
        });

        for (let i = 0; i < 5; i++) {
            if (data[i]) {
                continue;
            }

            data[i] = ['-'];
        }

        days.push({date: day.date, data});
    });

    return days;
});
</script>

<template>
    <div class="container-fluid">
        <div class="schedule-row row">
            <div class="schedule-col" v-for="day in fulfilledDays">
                <h4>{{ formatDate(day.date) }}</h4>
                <table class="table">
                    <tbody>
                        <tr v-for="(row, i) in day.data">
                            <td class="legend w-18">
                                <p>{{ i + 1 }} пара</p>
                                <p class="time-text" v-html="times[i]"></p>
                            </td>
                            <td>
                                <p v-html="row[0]"></p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<style scoped>
.schedule-col {
    width: calc(50% - 2rem);
    margin: 0 1rem;
}

.schedule-row {
    display: flex;
    flex-wrap: wrap;
}

@media (max-width: 992px) {
    .schedule-col {
        width: 100%;
        margin: 1rem 0;
    }
}

.schedule-col {
    display: flex;
    flex-direction: column;
}

.table {
    height: 100%;
}

td:nth-child(1)>p {
    display: block;
    border-right: 1px solid #ddd;
}

td>p {
    display: flex;
    align-items: center;
    margin-bottom: 0;
}

td {
    padding: 6px 8px !important;
}

.legend {
    text-align: center;
    white-space: nowrap;
}

.legend>p {
    margin-top: -0.2rem;
    margin-bottom: -0.2rem;
}

.table td {
    vertical-align: middle;
}

.time-text {
    color: #aaa;
    font-size: small;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
}

.w-18 {
    width: 18%;
}
</style>