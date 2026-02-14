import 'dotenv/config';
import App from './app';
import AuthRoutes from './routes/auth.routes';
import ProjectRoutes from './routes/project.routes';
import ImpactRoutes from './routes/impact.routes';

const app = new App([
  new AuthRoutes(),
  new ProjectRoutes(),
  new ImpactRoutes()
]);

app.startServer();
