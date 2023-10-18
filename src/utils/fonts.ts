import arial from './fonts/Arial.ttf';
import helvetica_neue from './fonts/Helvetica_Neue.ttf';
import helvetica from './fonts/Helvetica.ttf';
import sans from './fonts/sans-serif.ttf';

export const fonts = [
    ['Arial', arial],
    ['Helvetica Neue', helvetica_neue],
    ['Helvetica', helvetica],
    ['sans-serif', sans],
];

export async function loadFontAsBase64(path: string) {
    const resp = await fetch(path);
    if(!resp.ok){
        throw new Error('не удалось загрузить шрифт');
    }
    const blob = await resp.blob();

    const reader = new FileReader();
    reader.readAsDataURL(blob);
    const url = await new Promise<string>((res, rej) => {
        reader.onload = () => res(reader.result as string);
        reader.onerror = reader.onabort = rej;
    });
    const bs = url.split(',')[1];

    return bs;
}
