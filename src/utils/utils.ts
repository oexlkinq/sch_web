// import { Pair } from "./api";

import { ObjectDirective } from "vue";

export function formatDate(date: Date) {
	const rawtext = date.toLocaleDateString('ru', { weekday: 'short', year: '2-digit', month: '2-digit', day: '2-digit' });
    return rawtext.slice(0, 1).toLocaleUpperCase() + rawtext.slice(1, -3);
}

export function makeItMonday(date: string) {
    let monDate = new Date(date);
    monDate.setDate(monDate.getDate() - monDate.getDay() + 1);
    return monDate.toLocaleDateString('en-ca');
}

export const times = [
	['8:00', '9:30'],
	['9:40', '11:10'],
	['11:20', '12:50'],
	['13:20', '14:50'],
	['15:00', '16:30'],
	['16:40', '18:10'],
	['18:20', '19:50'],
].map((v) => {
	return v.reduce((p, c, i) => {
		if (i) {
			p += ' - ';
		}
		let parts = c.split(':');
		return p + `${parts[0]}<sup>${parts[1]}</sup>`;
	}, '');
});

export function getNumFromLS<T>(key: string, initValue: T) {
    const value = localStorage.getItem(key);

    return (value === null) ? initValue : +value;
}

type mouseEventListener = (event: MouseEvent) => void;
const listenersMap = new Map<HTMLElement, mouseEventListener>();
export const vClickOutside: ObjectDirective<HTMLElement, mouseEventListener> = {
	mounted(el, binding) {
		const listener: mouseEventListener = (event) => {
			if (!(el === event.target || el.contains(event.target as HTMLElement))) {
				binding.value(event);
			}
		};

		listenersMap.set(el, listener);

		document.addEventListener('click', listener);
	},
	unmounted(el) {
		const listener = listenersMap.get(el);

		if (!listener) {
			throw new Error('не удалось найти связанный с элементом обработчик событий');
		}

		document.removeEventListener('click', listener);
	},
};