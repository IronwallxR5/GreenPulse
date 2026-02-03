import 'dotenv/config';
import App from './app';
import ImpactRoutes from './routes/impact.routes';
import AuthRoutes from './routes/auth.routes';

const app = new App([
  new AuthRoutes(),
  new ImpactRoutes()
]);

app.startServer();
