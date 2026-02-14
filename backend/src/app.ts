import express, { Application } from 'express';
import cors from 'cors';
import { Routes } from './utils/interfaces';

class App {
  public app: Application;
  public port: number;

  constructor(routes: Routes[]) {
    this.app = express();
    this.port = Number(process.env.PORT) || 8080;

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
  }

  private initializeMiddlewares() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach((route) => {
      this.app.use('/', route.router);
    });
  }

  public startServer() {
    this.app.listen(this.port, () => {
      console.log(`Server running on http://localhost:${this.port}`);
    });
  }
}

export default App;
