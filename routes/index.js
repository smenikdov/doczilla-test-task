import url from 'url';
import RoutesGroup from '../services/routesGroup.js';
import { redis, httpClient } from '../dependencies.js';

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

export default routes;
