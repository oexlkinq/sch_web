<script setup lang="ts">
import { computed, provide, ref } from 'vue';
import { Api, Day } from './utils/api';
import Schedule from './components/Schedule.vue';

import { jsPDF } from 'jspdf';
import { loadFontAsBase64, fonts } from './utils/fonts';
import { State } from './utils/state';


const api = new Api(import.meta.env.VITE_CUSTOM_SCH_API ?? (window.location.protocol + '//shgpi.edu.ru/sch_api/index.php'));
provide('api', api);

const rawState = new State<{
	cpIndex: number,
	diary: boolean,
	week: boolean,

	teacherIndex: number | undefined,
	searchMode: boolean,
	searchQuery: string,
	facultyIndex: number | undefined,
	groupIndex: number | undefined,
}>('state', {
	cpIndex: 0,
	diary: false,
	week: true,

	teacherIndex: undefined,
	searchMode: false,
	searchQuery: '',
	facultyIndex: undefined,
	groupIndex: undefined,
})
const state = fixState(api, rawState)
provide('state', state)
export type rawStateType = typeof rawState
export type stateType = typeof state


const date = ref((new Date()).toLocaleDateString('en-ca'));
const week = ref(rawState.data.week);
const schedule = ref<Day[]>();
const scheduleTitle = ref<string>();
const diary = ref(rawState.data.diary);


import group from './components/cps/group.vue';
import teacher from './components/cps/teacher.vue';
import { fixState } from './utils/migration';

const cps = [
	{
		title: 'Для студентов',
		component: group,
	},
	{
		title: 'Для преподавателей',
		component: teacher,
	},
];


const cp = ref<InstanceType<typeof group> | InstanceType<typeof teacher>>();
const currentCpIndex = ref(rawState.data.cpIndex);


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


		if (!cp.value) {
			return alert('не удалось загрузить панель параметров запроса');
		}

		schedule.value = await cp.value.fetcher(date.value, week.value);
		scheduleTitle.value = cp.value.titleGenerator();

		cp.value.saveState();
		rawState.data.diary = diary.value;
		rawState.data.cpIndex = currentCpIndex.value;
		rawState.data.week = week.value
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

/** реф для хранения ширины окна */
const windowWidth = ref(window.innerWidth)
// обновлять реф с шириной окна при изменении размеров окна
window.addEventListener('resize', () => {
	windowWidth.value = window.innerWidth
})
/** computed boolean. true если ширина экрана больше 1200 */
const isWideScreen = computed(() => windowWidth.value >= 1200)
</script>

<template>
	<div class="container-fluid mt-1">
		<template v-if="isWideScreen">
			<!-- верхняя строка -->
			<div class="row desktop align-items-center">
				<div class="col-lg-3">
					<button :class="{ 'active': currentCpIndex === 0 }" class="btn toggle custom"
						@click="currentCpIndex = 0">{{ cps[0].title }}</button>
				</div>
	
				<div class="col-lg-7">
					<KeepAlive>
						<Suspense>
							<component :is="cps[currentCpIndex].component" ref="cp" />
	
							<template #fallback>
								<div class="justify-content-center">
									<span class="spinner-border"></span>
								</div>
							</template>
						</Suspense>
					</KeepAlive>
				</div>
	
				<div class="col-lg-2">
					<input type="date" v-model="date" class="form-control">
				</div>
			</div>
	
			<!-- нижняя строка -->
			<div class="row desktop align-items-center">
				<div class="col-lg-3">
					<button :class="{ 'active': currentCpIndex === 1 }" class="btn toggle custom"
						@click="currentCpIndex = 1">{{ cps[1].title }}</button>
				</div>
	
				<div class="col-lg-7">
					<button @click="updateRes" class="btn btn-primary custom w-100" :disabled="loading">
						<div class="spinner-border spinner-border-sm" v-if="loading"></div>
						Показать
					</button>
				</div>
	
				<div class="col-lg-2">
					<label class="checkbox-label"><input type="checkbox" v-model="week" class="checkbox">На всю неделю</label>
					<!-- <label class="checkbox-label"><input type="checkbox" v-model="diary" class="checkbox">Дневник</label> -->
				</div>
			</div>
		</template>

		<template v-if="!isWideScreen">
			<div class="row mobile">
				<div class="col-xs-12">
					<button :class="{ 'active': currentCpIndex === 0 }" class="btn toggle custom"
						@click="currentCpIndex = 0">{{ cps[0].title }}</button>
					<button :class="{ 'active': currentCpIndex === 1 }" class="btn toggle custom"
						@click="currentCpIndex = 1">{{ cps[1].title }}</button>
				</div>
	
				<div class="col-xs-12">
					<KeepAlive>
						<Suspense>
							<component :is="cps[currentCpIndex].component" ref="cp" />
	
							<template #fallback>
								<div class="justify-content-center">
									<span class="spinner-border"></span>
								</div>
							</template>
						</Suspense>
					</KeepAlive>
				</div>
	
				<div class="col-xs-12">
					<input type="date" v-model="date" class="form-control">
				</div>
	
				<div class="col-xs-12">
					<label class="checkbox-label"><input type="checkbox" v-model="week" class="checkbox">На всю неделю</label>
					<!-- <label class="checkbox-label"><input type="checkbox" v-model="diary" class="checkbox">Дневник</label> -->
				</div>

				<div class="col-xs-12">
					<button @click="updateRes" class="btn btn-primary custom w-100" :disabled="loading">
						<div class="spinner-border spinner-border-sm" v-if="loading"></div>
						Показать
					</button>
				</div>
			</div>
		</template>

		<!-- блок расписания -->
		<template v-if="schedule && schedule.length > 0">
			<div id="scheduleBody">
				<h3 v-html="scheduleTitle"></h3>

				<Schedule :days="schedule" :diary="diary"/>
			</div>

			<button class="btn btn-primary custom w-100" @click="makePdf">
				<span class="spinner-border spinner-border-sm" v-if="makePdfState === 'processing'"></span>
				Сохранить
			</button>
		</template>

		<div class="row mt-1" v-else-if="schedule && schedule.length === 0">
			<div class="col-xs-12">
				<p class="bg-danger alert">Расписание не найдено</p>
			</div>
		</div>

		<div class="row mt-1" v-else-if="error">
			<div class="col-xs-12">
				<p class="bg-danger alert">{{ error }}</p>
			</div>
		</div>
	</div>
</template>

<style>
.checkbox-label {
	display: flex;
	margin: 0;
}
.checkbox-label .checkbox {
	margin: 0 6px 0 0;
}
.mobile .checkbox-label {
	margin-top: 6px;
	margin-bottom: 6px;
}

.desktop .align-items-center, .desktop.align-items-center {
	display: flex;
	align-items: center;
}
.desktop .justify-content-center {
	display: flex;
	justify-content: center;
}

.mobile input {
	margin-top: 2px;
	margin-bottom: 2px;
}
</style>
<style scoped>
#scheduleBody {
	font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
#scheduleBody > h3 {
	text-align: center;
}

.toggle {
	width: 100%;
	color: #000;
}
.toggle.active {
	background-color: var(--shspu-color-dark);
	color: white;
}

.btn.custom {
	border-radius: 0;
	padding: 10px;
	border: none;
}

.btn-primary.custom {
	background-color: var(--shspu-color-dark);
}
.btn-primary.custom:hover {
	background-color: var(--shspu-color-dark-shadow);
}

.mt-1 {
	margin-top: 1rem;
}
</style>
