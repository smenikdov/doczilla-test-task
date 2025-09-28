import fs from 'fs';
import path from 'path';
import ServerRouter from './serverRouter.js';
import { MIME_TYPES } from '../constants/index.js';

class StaticRouter extends ServerRouter {
    constructor({
        routerPath = '/',
        staticPath = '/',
        onRequest,
    } = {}) {
        super({ routerPath });
        this.staticPath = staticPath;
        this.onRequest = onRequest;
    }

    handleRequest(req, res) {
        const url = req.url
            .split('?')[0]
            .replace(this.routerPath, '/')

        let filePath = path.join(
            this.staticPath,
            url === '/' ? 'index.html' : url
        );

        let extname = path.extname(filePath);
        if (!extname) {
            extname = '.html';
            filePath += '.html';
        }

        const contentType = MIME_TYPES[extname] || 'text/plain';

        try {
            if (this.onRequest) {
                this.onRequest(filePath);
            }
            const content = fs.readFileSync(filePath);
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
            return true;
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                try {
                    const notFoundContent = fs.readFileSync(path.join(this.staticPath, '404.html'));
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end(notFoundContent, 'utf-8');
                    return true;
                } catch {
                    res.writeHead(404, { 'Content-Type': 'text/html' });
                    res.end('404 - Page not found');
                    return true;
                }
            } else {
                res.writeHead(500);
                res.end('500 - Server error');
                return true;
            }
        }
    }
}

export default StaticRouter;
