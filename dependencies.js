import RedisService from './services/redisService.js';
import HttpClient from './services/httpClient.js';

export const redis = new RedisService();
redis.connect();
export const httpClient = new HttpClient();
