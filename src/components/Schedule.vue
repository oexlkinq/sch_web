<script setup lang="ts">
import { computed } from 'vue';
import { Day } from 'node-sch-api';
import { formatDate, times } from '../utils/utils';

const props = defineProps<{
    days: Day[],
    diary: boolean,
}>();

const fulfilledDays = computed(() => {
    let days = [] as {date: Date, data: string[][]}[];
    let rawDays: Day[];

    const fulfill = props.diary || props.days.length > 1;
    
    if(fulfill){
        rawDays = new Array<Day>(6);

        props.days.forEach(day => rawDays[day.date.getDay() - 1] = day);
        
        let startDate = new Date(props.days[0].date);
        startDate.setDate(startDate.getDate() - startDate.getDay() + 1);
        for(let i = 0; i < rawDays.length; i++){
            if(!rawDays[i]){
                let date = new Date(startDate);
                date.setDate(date.getDate() + i);
    
                rawDays[i] = {date, pairs: []};
            }
        }
    }else{
        rawDays = props.days.slice();
    }


    for(let i = 0; i < rawDays.length; i++){
        const day = rawDays[i];
        
        let maxPairIndex = 4;
        let data = new Array<string[]>(maxPairIndex + 1);
    
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
    
            const pairIndex = pair.num - 1;

            if(data[pairIndex]){
                data[pairIndex] = [
                    data[pairIndex][0] + '<br>' + pair.text,
                ];
            }else{
                data[pairIndex] = [
                    pair.text,
                ];
            }

            if(maxPairIndex < pairIndex){
                maxPairIndex = pairIndex;
            }
        });
    
        for (let i = 0; i < maxPairIndex + 1; i++) {
            if (data[i]) {
                continue;
            }
    
            data[i] = ['-'];
        }
    
        let place = i;
        if(props.diary && rawDays.length === 6){
            place = [0, 2, 4, 1, 3, 5][i];
        }
        days[place] = {date: day.date, data};
    }

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