// import { Pair } from "./api";

export function formatDate(date: Date){
    const rawtext = date.toLocaleDateString('ru', {weekday: 'short', year: '2-digit', month: '2-digit', day: '2-digit'});
    return rawtext.slice(0, 1).toLocaleUpperCase() + rawtext.slice(1, -3);
}

export function makeItMonday(date: string){
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
		if(i){
			p += ' - ';
		}
		let parts = c.split(':');
		return p + `${parts[0]}<sup>${parts[1]}</sup>`;
	}, '');
});

// /**
//  * @returns [подстрока, исходная_строка]
//  */
// export function splice(regexp: RegExp, str: string): [string, string | undefined]{
//     const matchRes = str.match(regexp);
//     if(!matchRes){
//         return [str, undefined];
//     }

//     const [match] = matchRes;
    
//     return [
//         str.split(match).join(''),
//         matchRes.slice(1).join(''),
//     ];
// }

// export function pairParser(pair: Pair){
//     let npair = {num: pair.num} as {
//         num: number,
//         auditory: string,
//         name: string,
//         subject: string,
//     };

//     let str = pair.text;
//     for(let func of [
//         (str: string) => {
//             const [nstr, auditory] = splice(/(\d{3}) *([абв])/i, str);
//             npair.auditory = auditory ?? '';

//             return nstr;
//         },
//         (str: string) => {
//             const [nstr, name] = splice(/([А-Я][а-я]+ (?:[А-Я]\.){2})|\(([А-Я][а-я]+)\)/, str);
//             npair.name = name ?? '';
    
//             return nstr;
//         },
//         (str: string) => {
//             return npair.subject = str.replace(/^[\s\\/]*|\s{2,}|[\s\\/]*$/g, '');
//         }
//     ]){
//         str = func(str);
//     }

//     return npair;
// }