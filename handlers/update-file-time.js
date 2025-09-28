import { promises as fs } from 'fs';
import { TASK2_DATA_PATH } from '../constants/index.js';

export async function updateFileTime(filePath) {
    try {
        let data = await fs.readFile(TASK2_DATA_PATH) || '[]';
        data = JSON.parse(data);

        const info = data.find(item => item.filePath === filePath);

        if (!info) {
            console.log('File not found');
            return { message: 'File not found' };
        }

        info.lastUpdated = new Date();
        await fs.writeFile(TASK2_DATA_PATH, JSON.stringify(data));

        return { message: 'OK' };
    }
    catch (error) {
        console.error(error)
        return { message: error.message };
    }
}
