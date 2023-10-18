import { makeItMonday } from "./utils";

export type Pair = {num: number, text: string};
export type Day = {date: Date, pairs: Pair[]};

export class Api{
    baseUrl: string;

    constructor(baseUrl: string){
        this.baseUrl = baseUrl;
    }

    // async getGroups(){
    //     return await this.makeRequest<{faculty: string, groups: {id: number, name: string}[]}[]>('getGroups');
    // }

    // async getTeachers(){
    //     return await this.makeRequest<{id: number, name: string, url: string}[]>('getTeachers');
    // }

    async getGroupPairs(target: string, date: string, week = false){
        return await this.getPairs(target, date, week, 'getPairs.group');
    }

    async searchPairs(target: string, date: string, week = false){
        return await this.getPairs(target, date, week, 'getPairs.query');
    }

    async getPairs(target: string, date: string, week = false, method: 'getPairs.group' | 'getPairs.query'){
        const res = await this.makeRequest<{date: string, pairs: Pair[]}[]>(method, {
            date: (week) ? makeItMonday(date) : date,
            target,
            week: (week) ? '1' : '0',
        });

        const days = res.map((v) => (
            {
                date: new Date(v.date),
                pairs: v.pairs,
            }
        )) as Day[];

        return days;
    }

    async makeRequest<T>(method: string, params?: object){
        const url = new URL(this.baseUrl);
        url.searchParams.append('method', method);
        if(params){
            Object.entries(params).forEach((v) => url.searchParams.append(v[0], v[1]));
        }

        const res = await fetch(url);
        const json = await res.json() as {
            ok: boolean,
            result: T,
            error: unknown,
        };

        if(!json.ok){
            throw new Error(String(json.error));
        }

        return json.result;
    }
}