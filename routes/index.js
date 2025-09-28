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

routes.get('/solve-task-1', {
    handler: async (req, res) => {
        const initialGrid = [
            [1, 2],
            [2, 1],
            [0, 0],
        ];

        try {
            const N = initialGrid.length;
            const V = initialGrid[0].length;
            const initialState = initialGrid.map(row => row.filter(c => c !== 0));

            const colors = new Set();
            initialState.forEach(tube => tube.forEach(c => colors.add(c)));
            const M = colors.size;

            function isGoal(state) {
                let fullTubes = 0;
                const usedColors = new Set();
                for (let tube of state) {
                    if (tube.length === 0) continue;
                    if (tube.length !== V) return false;
                    const col = tube[0];
                    if (!tube.every(c => c === col)) return false;
                    if (usedColors.has(col)) return false;
                    usedColors.add(col);
                    fullTubes++;
                }
                return fullTubes === M;
            }

            function getKey(state) {
                return state.map(tube => tube.join(',')).join(';');
            }

            function getMoves(state) {
                const moves = [];
                for (let i = 0; i < N; i++) {
                    const tubeA = state[i];
                    if (tubeA.length === 0) continue;
                    const topC = tubeA[tubeA.length - 1];
                    let stackS = 1;
                    for (let k = tubeA.length - 2; k >= 0; k--) {
                        if (tubeA[k] === topC) stackS++;
                            else break;
                    }
                    for (let j = 0; j < N; j++) {
                        if (i === j) continue;
                        const tubeB = state[j];
                        const free = V - tubeB.length;
                        if (free === 0) continue;
                        const topB = tubeB.length > 0 ? tubeB[tubeB.length - 1] : null;
                        if (topB !== null && topB !== topC) continue;
                        const amt = Math.min(stackS, free);
                        if (amt > 0) {
                            moves.push({ from: i, to: j, amount: amt });
                        }
                    }
                }
                return moves;
            }

            function applyMove(state, move) {
                const newState = state.map(tube => [...tube]);
                const { from, to, amount } = move;
                const topC = newState[from][newState[from].length - 1];
                newState[from].splice(-amount);
                for (let k = 0; k < amount; k++) {
                    newState[to].push(topC);
                }
                return newState;
            }

            const queue = [];
            queue.push({ state: initialState, path: [] });
            const visited = new Set();
            visited.add(getKey(initialState));

            while (queue.length > 0) {
                const current = queue.shift();
                const { state, path } = current;
                if (isGoal(state)) {
                    return { initialGrid, path };
                }
                const moves = getMoves(state);
                for (let m of moves) {
                    const newS = applyMove(state, m);
                    const key = getKey(newS);
                    if (!visited.has(key)) {
                        visited.add(key);
                        const newPath = [...path, [m.from, m.to]];
                        queue.push({ state: newS, path: newPath });
                    }
                }
            }

            return null;
        }
        catch (error) {
            console.error(error)
            return { error: error.message };
        }
    },
});

export default routes;
