<script setup lang="ts">
import { computed } from 'vue';
import { Day } from '../utils/api';
import { formatDate, times } from '../utils/utils';

const props = defineProps<{
    days: Day[],
    title: string,
}>();

const fulfilledDays = computed(() => {
    const days = props.days.slice();
    days.forEach((day) => {
        let newPairs = [];
        day.pairs.forEach(pair => {
            newPairs[pair.num - 1] = pair;
        });

        for (let i = 0; i < 5; i++) {
            if (newPairs[i]) {
                continue;
            }

            newPairs[i] = { num: i + 1, text: '-' };
        }
        day.pairs = newPairs;
    });

    return days;
});
</script>

<template>
    <div class="container-fluid">
        <div class="row">
            <div class="col" style="text-align: center;">
                <h3>{{ props.title }}</h3>
            </div>
        </div>

        <div class="schedule-row row">
            <div class="schedule-col col" v-for="day in fulfilledDays">
                <h4>{{ formatDate(day.date) }}</h4>
                <table class="table">
                    <thead>
                        <tr>
                            <th class="w-18">№</th>
                            <th>Предмет</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="pair in day.pairs">
                            <td class="legend">
                                <p>{{ pair.num }} пара</p>
                                <p class="time-text" v-html="times[pair.num - 1]"></p>
                            </td>
                            <td>
                                <p>{{ pair.text }}</p>
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
    border-right: 1px solid #ddd;
}

td:nth-child(2)>p {
    display: flex;
    align-items: center;
    margin: 0;
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