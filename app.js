import Server from './services/server.js';
import ApiRouter from './services/apiRouter.js';
import StaticRouter from './services/staticRouter.js';
import routes from './routes/index.js';
import { updateFileTime } from './handlers/update-file-time.js';

const apiRouter = new ApiRouter({
    routerPath: '/api',
    routes: routes,
});

const userFilesRouter = new StaticRouter({
    routerPath: '/my-files',
    staticPath: 'user-files',
    onRequest: async (filePath) => {
        updateFileTime(filePath);
    },
});

const staticRouter = new StaticRouter({
    routerPath: '/',
    staticPath: 'public',
});

const server = new Server({
    port: 3000,
    routers: [
        apiRouter,
        userFilesRouter,
        staticRouter,
    ],
});

server.start();
