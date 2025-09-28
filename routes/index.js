import url from 'url';
import path from 'path';
import { promises as fs } from 'fs';
import RoutesGroup from '../services/routesGroup.js';
import { redis, httpClient } from '../dependencies.js';
import { parseMultipartFormData } from '../utils/multipart.js';
import { FILE_TTL, TASK2_DATA_PATH } from '../constants/index.js';

const routes = new RoutesGroup();

routes.get('/ping', {
    handler: (req, res) => {
        return { ping: 'pong' };
    },
});

routes.get('/weather', {
    handler: async (req, res) => {
        try {
            const parsedUrl = url.parse(req.url, true);
            const city = parsedUrl.query.city;

            if (!city) {
                return { error: 'City is required' };
            }

            const cacheKey = 'weather:' + city.toLowerCase();
            const cachedData = await redis.get(cacheKey);

            if (cachedData !== null) {
                const weatherData = JSON.parse(cachedData);
                return weatherData;
            }

            const geoData = await httpClient.get(`http://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}`);

            console.log(geoData);

            const { latitude: lat, longitude: lon } = geoData.data.results[0];
            const forecastData = await httpClient.get(`http://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&forecast_hours=24`);

            console.log(forecastData);

            const weatherData = forecastData.data.hourly;

            await redis.set(cacheKey, JSON.stringify(weatherData), 900);

            return weatherData;
        }
        catch (error) {
            console.error(error)
            return { error: error.message };
        }
    },
});

routes.post('/save-file', {
    handler: async (req, res) => {
        try {
            const { files } = await parseMultipartFormData(req);
            const file = files[0];
            const safeFileName = path.basename(file.filename.replace(/[^a-zA-Z0-9._-]/g, '_'));
            const filePath = path.join('user-files', safeFileName);
            await fs.writeFile(filePath, file.data);

            let data = await fs.readFile(TASK2_DATA_PATH, 'utf8') || '[]';
            data = JSON.parse(data);
            data.push({ filePath: filePath, lastUpdated: new Date() });

            await fs.writeFile(TASK2_DATA_PATH, JSON.stringify(data));

            return { url: `/my-files/${ safeFileName }` };
        }
        catch (error) {
            console.error(error)
            return { error: error.message };
        }
    },
});

routes.post('/delete-old-files', {
    handler: async (req, res) => {
        try {
            let data = await fs.readFile(TASK2_DATA_PATH, 'utf8') || '[]';
            data = JSON.parse(data);

            for (let { filePath, lastUpdated } of data) {
                if (new Date() - new Date(lastUpdated) > FILE_TTL) {
                    await fs.unlink(filePath);
                    data = data.filter(item => item.filePath !== filePath);
                }
            }

            await fs.writeFile(TASK2_DATA_PATH, JSON.stringify(data));
        }
        catch (error) {
            console.error(error)
            return { error: error.message };
        }
    },
});

export default routes;
