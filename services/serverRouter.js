class ServerRouter {
    constructor({
        routerPath = '/'
    } = {}) {
        this.routerPath = routerPath;
    }

    isRouterRequest(req) {
        return req.url.startsWith(this.routerPath);
    }

    handleRequest(req, res) {
        throw new Error('handleRequest must be implemented by subclass');
    }
}

export default ServerRouter;
