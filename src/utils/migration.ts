import { SchApi } from "node-sch-api";
import { rawStateType } from "../App.vue";

export async function fixState(api: SchApi, state: rawStateType) {
    const rawCurrentCpIndex = getItem('currentCpIndex')
    if (!rawCurrentCpIndex) {
        return state
    }
    const cpIndex = JSON.parse(rawCurrentCpIndex) as number
    state.data.cpIndex = cpIndex

    const rawDiary = getItem('diary')
    if (rawDiary) {
        state.data.diary = JSON.parse(rawDiary) as boolean
    }

    const rawFacultyIndex = getItem('facultyIndex')
    if (rawFacultyIndex) {
        const facultyIndex = JSON.parse(rawFacultyIndex) as number
        state.data.facultyIndex = facultyIndex
        
        const rawGroupId = getItem('groupId')
        if (!rawGroupId) {
            return state
        }
        const groupId = JSON.parse(rawGroupId) as number
    
        const groups = await api.groups.get()
        const groupIndex = groups[facultyIndex].groups.findIndex(group => group.id === groupId)
        if (groupIndex === -1) {
            return state
        }
        
        state.data.groupIndex = groupIndex
    }


    const rawTeacherId = getItem('teacherId')
    if(rawTeacherId) {
        const teacherId = JSON.parse(rawTeacherId) as number
    
        const teachers = await api.teachers.get()
        const teacherIndex = teachers.findIndex(teacher => teacher.id === teacherId)
        if(teacherIndex === -1) {
            return state
        }
    
        state.data.teacherIndex = teacherIndex
    }

    return state
}

function getItem(key: string) {
    const res = localStorage.getItem(key)
    localStorage.removeItem(key)

    return res
}