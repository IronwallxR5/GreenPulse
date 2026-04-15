import express, { Application } from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { Routes } from './utils/interfaces';
import { initializePassport } from './config/passport';

class App {
  public app: Application;
  public port: number;

  constructor(routes: Routes[]) {
    this.app = express();
    this.port = Number(process.env.PORT) || 8080;

    this.initializeMiddlewares();
    this.initializePassport();
    this.initializeRoutes(routes);
  }

  private initializeMiddlewares() {
    this.app.use(
      cors({
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        credentials: true,
      })
    );
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // express-session is required by Passport for the OAuth state parameter
    // (even though we use session:false on the routes — Passport still needs it
    //  during the initial redirect to store the anti-CSRF state nonce)
    this.app.use(
      session({
        secret: process.env.SESSION_SECRET || 'greenpulse-session-secret',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: process.env.NODE_ENV === 'production' },
      })
    );
  }

  private initializePassport() {
    initializePassport();
    this.app.use(passport.initialize());
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
