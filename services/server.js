import http from 'http';
import ServerRouter from './serverRouter.js';

class Server {
    constructor({
        port = 3000,
        routers = [],
    } = {}) {
        this.port = port;
        this.server = null;
        this.routers = [];

        for (let router of routers) {
            this.registerRouter(router);
        }
    }

    registerRouter(router) {
        if (!(router instanceof ServerRouter)) {
            throw new Error('Router must be an instance of ServerRouter');
        }
        this.routers.push(router);
    }

    handleRequest(req, res) {
        for (const router of this.routers) {
            if (router.isRouterRequest(req)) {
                router.handleRequest(req, res);
                return;
            }
        }

        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 - Not Found');
    }

    start() {
        if (this.server) {
            console.warn('Server already started');
            return;
        }
        this.server = http.createServer((req, res) => this.handleRequest(req, res));
        this.server.listen(this.port, () => {
            console.log(`Server started on http://localhost:${this.port}`);
        });
    }

    stop() {
        if (!this.server) {
            console.warn('Server not started');
            return;
        }
        this.server.close(() => {
            console.log('Server stopped');
            this.server = null;
        });
    }
}

export default Server;
