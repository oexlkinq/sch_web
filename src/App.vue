<script setup lang="ts">
import { provide, ref } from 'vue';
import { Api, Day } from './utils/api.ts';
import Schedule from './components/Schedule.vue';

import { jsPDF } from 'jspdf';
import { loadFontAsBase64, fonts } from './utils/fonts';

import { getNumFromLS } from './utils/utils';


// TODO: приложить сюда мозг. мб есть более хороший способ организовать это
const api = new Api((import.meta.env.PROD) ? 'https://shgpi.edu.ru/sch_api/index.php' : 'http://localhost/sch_api/index.php');
provide('api', api);


const date = ref((new Date()).toLocaleDateString('en-ca'));
const schedule = ref<Day[]>();
const scheduleTitle = ref<string>();
const week = ref(true);


import group from './components/cps/group.vue';
import query from './components/cps/query.vue';
import teacher from './components/cps/teacher.vue';

const cps = [
	{
		title: 'Для студентов',
		component: group,
	},
	{
		title: 'Для преподавателей',
		component: teacher,
	},
	// {
	// 	title: 'Поиск',
	// 	component: query,
	// },
];


const cp = ref<InstanceType<typeof group> | InstanceType<typeof teacher> | InstanceType<typeof query>>();
const currentCpIndex = ref<number>(getNumFromLS('currentCpIndex', 0));


let firstCpResolve = true;
function onCpResolve() {
	if (firstCpResolve) {
		firstCpResolve = false;

		return;
	}

	cp.value?.resetInputs();
	localStorage.currentCpIndex = currentCpIndex.value;
}


const loading = ref(false);
const error = ref<string>();
async function updateRes() {
	try {
		if (loading.value) {
			return;
		}

		loading.value = true;
		error.value = '';
		schedule.value = undefined;


		if (cp.value === undefined) {
			return alert('не удалось загрузить панель параметров запроса');
		}

		schedule.value = await cp.value.fetcher(date.value, week.value);
		scheduleTitle.value = cp.value.titleGenerator();

		cp.value.saveState();
	} catch (e) {
		console.error(e);
		error.value = String(e);
	} finally {
		loading.value = false;
	}
}


const makePdfState = ref<'processing' | 'idle'>('idle');
async function makePdf() {
	try {
		const scheduleBody = document.getElementById('scheduleBody');
		if (!scheduleBody) {
			return;
		}

		makePdfState.value = 'processing';

		const doc = new jsPDF({ unit: 'mm' });

		await Promise.all(fonts.map(async ([file, path]) => {
			const font = await loadFontAsBase64(path);

			doc.addFileToVFS(file, font);
			doc.addFont(file, file, 'normal');
		}));

		const pdf = await new Promise((res) => {
			doc.html(scheduleBody, { callback: res, x: 10, y: 10, width: 190, windowWidth: 1200 });
		}) as jsPDF;

		pdf.save('Расписание');
	} catch (e) {
		console.error(e);
		alert('Произошла ошибка');
	} finally {
		makePdfState.value = 'idle';
	}
}
</script>

<template>
	<div class="container-fluid">
		<div class="row align-items-center p-slim row-main">
			<div class="col-xs-12 col-lg-3">
				<div class="row">
					<div class="col-xs-12 col-md-12" v-for="(cp, i) in cps">
						<button :class="{ 'active': currentCpIndex === i }" class="btn toggle"
							@click="currentCpIndex = i">{{ cp.title }}</button>
					</div>
				</div>
			</div>

			<div class="col-xs-12 col-lg-7 mid-col">
				<div class="row">
					<KeepAlive>
						<Suspense @resolve="onCpResolve">
							<component :is="cps[currentCpIndex].component" ref="cp" />

							<template #fallback>
								<div class="center-children">
									<span class="spinner-border"></span>
								</div>
							</template>
						</Suspense>
					</KeepAlive>
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
			<div id="scheduleBody">
				<h3 style="text-align: center;" v-html="scheduleTitle"></h3>

				<Schedule :days="schedule" />
			</div>

			<button class="btn btn-primary w-100" @click="makePdf">
				<span class="spinner-border spinner-border-sm" v-if="makePdfState === 'processing'"></span>
				Сохранить
			</button>
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
#scheduleBody {
	font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.row {
	margin-top: 0.5rem;
	margin-bottom: 0.5rem;
}

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
</style>
