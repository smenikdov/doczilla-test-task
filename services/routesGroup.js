class RoutesGroup {
    constructor() {
        this.routes = {};
    }

    get(path, controller) {
        this.registerRoute('GET', path, controller);
        return this;
    }

    post(path, controller) {
        this.registerRoute('POST', path, controller);
        return this;
    }

    put(path, controller) {
        this.registerRoute('PUT', path, controller);
        return this;
    }

    delete(path, controller) {
        this.registerRoute('DELETE', path, controller);
        return this;
    }

    registerRoute(method, path, controller) {
        method = method.toUpperCase();
        if (!this.routes[method]) {
            this.routes[method] = {};
        }
        this.routes[method][path] = controller;
    }

    getController(method, url) {
        method = method.toUpperCase();
        return this.routes[method][url] ?? null;
    }
}

export default RoutesGroup;
