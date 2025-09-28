import RoutesGroup from '../services/routesGroup.js';

const routes = new RoutesGroup();

routes.get('/ping', {
    handler: (req, res) => {
        return { ping: 'pong' };
    },
});

export default routes;
