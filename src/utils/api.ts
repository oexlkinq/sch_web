import { makeItMonday } from "./utils";

export type Pair = {num: number, text: string};
export type Day = {date: Date, pairs: Pair[]};

export class Api{
    baseUrl: string;

    constructor(baseUrl: string){
        this.baseUrl = baseUrl;
    }

    async getGroupPairs(target: string, date: string, week = false){
        return await this.getPairs(target, date, week, 'getPairs.group');
    }

    async searchPairs(target: string, date: string, week = false){
        return await this.getPairs(target, date, week, 'getPairs.query');
    }

    async getPairs(target: string, date: string, week = false, method: 'getPairs.group' | 'getPairs.query'){
        const res = await this.makeRequest<{date: string, pairs: {num: string, text: string}[]}[]>(method, {
            date: (week) ? makeItMonday(date) : date,
            target,
            week: (week) ? '1' : '0',
        });
        
        if(!res.ok){
            throw new Error(res.error);
        }

        const rawDays = res.result.map((v) => (
            {
                date: new Date(v.date),
                pairs: v.pairs.map((pair) => (
                    {
                        num: +pair.num,
                        text: pair.text,
                    }
                )),
            }
        )) as Day[];
        
        // console.log(rawDays.map((day) => {
        //     return day.pairs.map((pair) => {
        //         return pairParser(pair);
        //     });
        // }));

        return rawDays;
    }

    async makeRequest<T>(method: string, params: object){
        const url = new URL(this.baseUrl);
        url.searchParams.append('method', method);
        Object.entries(params).forEach((v) => url.searchParams.append(v[0], v[1]));

        const res = await fetch(url);
        const json = await res.json();

        return json as {
            ok: boolean,
            result: T,
            error: any,
        };
    }
}