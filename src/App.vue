<script setup lang="ts">
import { ref, watch } from 'vue';
import { Api, Day } from './utils/api.ts';
import Schedule from './components/Schedule.vue';
import Select3 from './components/Select3.vue';

import { jsPDF } from 'jspdf';
import {dejavu} from './fonts';

const api = new Api('http://shebot.shgpi/sch_api/index.php');

const datalists = await (async () => {
	const [group, teacher] = await Promise.all([
		api.getGroups(),
		api.getTeachers(),
	]);

	return { group, teacher };
})();


const date = ref((new Date()).toLocaleDateString('en-ca'));
const schedule = ref<Day[]>();
const week = ref(true);

const targetType = ref<'group' | 'teacher'>(localStorage.targetType ?? 'group');
const target = ref((!isNaN(+localStorage.target)) ? +localStorage.target : undefined);

const facultyIndex = ref((!isNaN(+localStorage.facultyIndex)) ? +localStorage.facultyIndex : undefined);

watch([targetType], () => {
	target.value = undefined;
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
		titleGenerator: () => `${datalists.group[facultyIndex.value ?? -1].faculty}, ${datalists.group[facultyIndex.value ?? -1].groups[target.value ?? -1].name} группа`,
	},
	'teacher': {
		title: 'Для преподавателей',
		placeholder: 'ФИО преподавателя',
		datalist: datalists.teacher,
		apiHandler: api.getTeacherPairs.bind(api),
		titleGenerator: () => {
			let nameCode = datalists.teacher[target.value ?? -1].name;
			
			const url = datalists.teacher[target.value ?? -1].url;
			if(url){
				nameCode = `<a href="${url}" target="_blank" style="font-size: 24px;">${nameCode}</a>`
			}

			return `Преподаватель ${nameCode}`;
		},
	}
};

const loading = ref(false);
const error = ref<string>();
async function updateRes() {
	try {
		if (loading.value) {
			return;
		}
		loading.value = true;

		if (target.value === undefined) {
			throw new Error('Неверная цель');
		}

		localStorage.target = target.value;
		localStorage.targetType = targetType.value;
		localStorage.facultyIndex = facultyIndex.value;

		error.value = '';

		if(targetType.value === 'group'){
			schedule.value = await states[targetType.value].apiHandler(datalists.group[facultyIndex.value ?? -1].groups[target.value].id, date.value, week.value);
		}else if(targetType.value === 'teacher'){
			schedule.value = await states[targetType.value].apiHandler(datalists.teacher[target.value].id, date.value, week.value);
		}
	} catch (e) {
		console.log(e);
		error.value = String(e);
	} finally {
		loading.value = false;
	}
}

async function makePdf(){
	const scheduleBody = document.getElementById('scheduleBody');
	console.log(scheduleBody);
	if(!scheduleBody){
		return;
	}

	const doc = new jsPDF({unit: 'mm'});
	doc.addFileToVFS('sans-serif.ttf', dejavu);
	doc.addFont('sans-serif.ttf', 'sans-serif', 'normal');
	doc.setFont('sans-serif');
	doc.html(scheduleBody, {callback: (doc) => {
		doc.save('Расписание');
	}, x: 10, y: 10, width: 190, windowWidth: 1200});
}
</script>

<template>
	<div class="container-fluid">
		<div class="row align-items-center p-slim row-main">
			<div class="col-xs-12 col-lg-3">
				<div class="row">
					<div class="col-xs-12 col-md-12">
						<button :class="{ 'active': targetType === 'group' }" class="btn toggle"
							@click="targetType = 'group'">Для студентов</button>
					</div>
					<div class="col-xs-12 col-md-12">
						<button :class="{ 'active': targetType === 'teacher' }" class="btn toggle"
							@click="targetType = 'teacher'">Для преподавателей</button>
					</div>
				</div>
			</div>

			<div class="col-xs-12 col-lg-7 mid-col">
				<div class="row">
					<template v-if="targetType === 'group'">
						<div class="col-xs-12 col-md-9">
							<Select3 :datalist="datalists.group.map((v, i) => ({ id: i, value: v.faculty }))"
								v-model:id="facultyIndex" placeholder="Институт, факультет, колледж" />
						</div>

						<div class="col-xs-12 col-md-3">
							<Select3
								:datalist="datalists.group[facultyIndex ?? -1]?.groups.map((v, i) => ({ id: i, value: v.name.toLocaleUpperCase() }))"
								v-model:id="target" :placeholder="states[targetType].placeholder" />
						</div>
					</template>

					<div class="col-xs-12 col-md-6 col-lg-12" v-else-if="targetType === 'teacher'">
						<Select3 :datalist="datalists.teacher.map((v, i) => ({ id: i, value: v.name }))" v-model:id="target"
							:placeholder="states[targetType].placeholder" />
					</div>
				</div>

				<div class="row">
					<div class="col-xs-12">
						<button @click="updateRes" class="btn btn-primary w-100">
							<div class="spinner-border spinner-border-sm" v-if="loading"></div>
							Показать
						</button>
					</div>
				</div>
			</div>

			<div class="col-xs-12 col-md-12 col-lg-2 end-col">
				<div class="row">
					<div class="col-xs-12 col-md-6 col-lg-12">
						<input type="date" v-model="date" class="form-control">
					</div>
				</div>
				<div class="row">
					<div class="col-xs-12 col-md-6 col-lg-12">
						<label style="height: 34px;"><input type="checkbox" v-model="week" style="margin: 10px 6px 0 0;">На
							всю неделю</label>
					</div>
				</div>
			</div>
		</div>

		<template v-if="schedule && schedule.length > 0">
			<div id="scheduleBody" style="font-family: sans-serif;">
				<h3 style="text-align: center;" v-html="states[targetType].titleGenerator()"></h3>

				<Schedule :days="schedule" />
			</div>

			<button class="btn btn-primary w-100" @click="makePdf">Сохранить</button>
		</template>

		<div class="row" v-else-if="schedule && schedule.length === 0">
			<div class="col-xs-12">
				<p class="bg-danger alert">Расписание не найдено</p>
			</div>
		</div>

		<div class="row" v-else-if="error">
			<div class="col-xs-12">
				<p class="bg-danger alert">{{ error }}</p>
			</div>
		</div>
	</div>
</template>

<style scoped>
.row {
	margin-top: 0.5rem;
	margin-bottom: 0.5rem;
}

/* .p-slim>div{
	padding-left: 10px;
	padding-right: 10px;
} */

@media (min-width: 1200px) {
	.align-items-center {
		display: flex;
		align-items: center;
	}
}

@media (min-width: 1600px) {
	.end-col {
		width: 16%;
	}
}

@media (max-width: 1600px) {
	.end-col {
		width: 20%;
	}
}

@media (max-width: 1200px) {
	.end-col {
		width: 100%;
	}
}

.toggle {
	width: 100%;
	color: #000;
}

.toggle.active {
	background-color: var(--shspu-color-dark) !important;
	color: white;
}

/* ul.nav-priem {
	display: flex;
	flex-direction: column;
	align-items: center;
}

ul.nav-priem li {
	width: 100%;
	flex-grow: 1;
	text-align: center;
	padding: 0;
}

.nav-priem a, .navbtn {
	color: #000;
	background-color: #eee;
	border-radius: 0 !important;
	font-size: 14px;
	padding: 10px;
}

.nav-priem a:focus, .navbtn:focus,
.nav-priem a:hover, .navbtn:hover {
	background-color: #e7e7e7 !important;
}

.nav-priem li.active a, .navbtn,
.nav-priem li.active a:focus, .navbtn:focus,
.nav-priem li.active a:hover, .navbtn:hover{
	background-color: var(--shspu-color-dark) !important;
} */

.btn-primary {
	background-color: var(--shspu-color-dark) !important;
}

.btn-primary:hover {
	background-color: var(--shspu-color-dark-shadow) !important;
}

.btn {
	border-radius: 0;
	padding: 10px;
	border: none;
}

.w-100 {
	width: 100%;
}</style>
