<script setup lang="ts">
import { ref, watch } from 'vue';
import { datalists } from './utils/consts.ts';
import { Api, Day } from './utils/api.ts';
import Schedule from './components/Schedule.vue';
import Select3 from './components/Select3.vue';

const api = new Api('http://shebot.shgpi/sch_api/index.php');

const date = ref((new Date()).toLocaleDateString('en-ca'));
const targetType = ref<'group' | 'query'>(localStorage.targetType ?? 'group');
const target = ref(localStorage.target as string);
const schedule = ref<Day[]>();
const week = ref(true);

const facultyIndex = ref(+localStorage.facultyIndex);
const query = ref('');

watch([targetType], () => {
	target.value = '';
	facultyIndex.value = -1;
	schedule.value = undefined;
});

watch([target], () => {
	schedule.value = undefined;
});

const states = {
	'group': {
		title: 'Для студентов',
		placeholder: 'Группа',
		datalist: datalists.group,
		apiHandler: api.getGroupPairs.bind(api),
		titleGenerator: () => `Расписание ${target.value} группы`,
	},
	'query': {
		title: 'Для преподавателей',
		placeholder: 'Имя преподавателя',
		datalist: datalists.query,
		apiHandler: api.searchPairs.bind(api),
		titleGenerator: () => `Расписание преподавателя: ${query.value}`,
	}
};

const loading = ref(false);
const error = ref<string>();
async function updateRes() {
	if (loading.value) {
		return;
	}
	loading.value = true;

	localStorage.target = target.value;
	localStorage.targetType = targetType.value;
	localStorage.facultyIndex = facultyIndex.value;

	try {
		error.value = '';

		schedule.value = await states[targetType.value].apiHandler(target.value, date.value, week.value);
	} catch (e) {
		console.log(e);
		error.value = String(e);
	}

	loading.value = false;
}

</script>

<template>
	<div class="container-fluid">
		<div class="row align-items-center">
			<div class="col-xs-12 col-md-12 col-lg-5">
				<ul class="nav nav-pills nav-priem">
					<li role="presentation" v-for="(state, stateTargetType) in states"
						:class="{ 'active': stateTargetType === targetType }" @click="targetType = stateTargetType"><a
							role="button">{{ state.title }}</a></li>
				</ul>
			</div>
			<template v-if="targetType === 'group'">
				<div class="col-xs-6 col-md-3 col-lg-2">
					<Select3 :datalist="datalists.group.map((v, i) => ({ id: i, value: v.title }))"
						v-model:id="facultyIndex" placeholder="Факультет" />
				</div>
				<div class="col-xs-6 col-md-3 col-lg-2">
					<Select3
						:datalist="datalists.group[facultyIndex]?.list.map(v => ({ id: v, value: v.toLocaleUpperCase() }))"
						v-model:id="target" :placeholder="states[targetType].placeholder" />
				</div>
			</template>
			<div class="col-xs-12 col-md-6 col-lg-4" v-else-if="targetType === 'query'">
				<Select3 :datalist="datalists.query.map(v => ({ id: v[1], value: v[0] }))" v-model:id="target"
					v-model:value="query" :placeholder="states[targetType].placeholder" />
			</div>
			<div class="col-xs-12 col-md-3 col-lg-2">
				<input type="date" v-model="date" class="form-control">
			</div>
		</div>

		<div class="row">
			<div class="col-xs-12">
				<label><input type="checkbox" v-model="week">На всю неделю</label>
			</div>
		</div>

		<div class="row">
			<div class="col-xs-4 col-md-2 col-lg-2">
				<button @click="updateRes" class="btn btn-primary w-100">
					<div class="spinner-border spinner-border-sm" v-if="loading"></div>
					Найти
				</button>
			</div>
		</div>

		<Schedule :days="schedule" :title="states[targetType].titleGenerator()" v-if="schedule && schedule.length > 0" />

		<div class="row" v-else-if="schedule && schedule.length === 0">
			<div class="col-xs-4">
				<p class="bg-danger rounded">Расписание не найдено</p>
			</div>
		</div>

		<div class="row" v-else-if="error">
			<div class="col-xs-4">
				<p class="bg-danger rounded">{{ error }}</p>
			</div>
		</div>
	</div>
</template>

<style scoped>
.row,
.row>* {
	margin-top: 0.5rem;
	margin-bottom: 0.5rem;
}

@media (min-width: 1200px){
	.align-items-center {
		display: flex;
		align-items: center;
	}
}

ul.nav-priem {
	display: flex;
	align-items: center;
}

ul.nav-priem li {
	width: 50%;
	flex-grow: 1;
	text-align: center;
	padding: 0;
}

.nav-priem a {
	color: #000;
	background-color: #eee;
	border-radius: 0 !important;
	font-size: 14px;
	padding: 10px;
}

.nav-priem a:focus,
.nav-priem a:hover {
	background-color: #e7e7e7 !important;
}

.nav-priem li.active a,
.nav-priem li.active a:focus,
.nav-priem li.active a:hover {
	background-color: var(--shspu-color-dark) !important;
}

.btn-primary {
	background-color: var(--shspu-color-dark) !important;
}

.btn-primary:hover {
	background-color: var(--shspu-color-dark-shadow) !important;
}

.btn {
	border-radius: 0;
}

.w-100 {
	width: 100%;
}
</style>
