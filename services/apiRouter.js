import ServerRouter from './serverRouter.js';
import RoutesGroup from './routesGroup.js';

class ApiRouter extends ServerRouter {
    constructor({
        routerPath = '/',
        routes,
    } = {}) {
        super({ routerPath });

        if (!routes || !(routes instanceof RoutesGroup)) {
            throw new Error('Routes must be an instance of RoutesGroup');
        }

        this.routes = routes;
    }

    async handleRequest(req, res) {
        console.log(`API request: ${req.method} ${req.url}`);

        const url = req.url
            .split('?')[0]
            .replace(this.routerPath, '');

        const routeController = this.routes.getController(req.method, url);

        if (routeController) {
            try {
                const result = await routeController.handler(req, res);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                console.log(`API response: ${JSON.stringify(result)}`);
            }
            catch (err) {
                console.error(err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err?.message ?? 'Internal server error' }));
            }
        }
        else {
            console.error(`Route not found: ${req.method} ${req.url}`);
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    }
}

export default ApiRouter;
