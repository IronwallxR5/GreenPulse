import 'dotenv/config';
import { createServer } from 'http';
import App from './app';
import AuthRoutes from './routes/auth.routes';
import ProjectRoutes from './routes/project.routes';
import ImpactRoutes from './routes/impact.routes';
import { initializeAlertSocketGateway } from './realtime/alertSocket.gateway';

const app = new App([
  new AuthRoutes(),
  new ProjectRoutes(),
  new ImpactRoutes()
]);

const httpServer = createServer(app.app);
initializeAlertSocketGateway(httpServer);

httpServer.listen(app.port, () => {
  console.log(`Server running on http://localhost:${app.port}`);
});
