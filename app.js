import Server from './services/server.js';
import ApiRouter from './services/apiRouter.js';
import StaticRouter from './services/staticRouter.js';
import routes from './routes/index.js';

const apiRouter = new ApiRouter({
    routerPath: '/api',
    routes: routes,
});

const staticRouter = new StaticRouter({
    routerPath: '/',
    staticPath: '/public',
});

const server = new Server({
    port: 3000,
    routers: [
        apiRouter,
        staticRouter,
    ],
});

server.start();
