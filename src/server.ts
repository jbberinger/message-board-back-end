import express, { Application, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import auth from './routes/auth';
import { testDBConnection, userLoginCount } from './database/database';
import passport from 'passport';
import localStrategy from './strategies/localStrategy';
import {
  signup,
  login,
  getPasswordHashFromEmail,
  checkEmailAvailability,
  getIdFromEmail,
} from './database/database';
const server: Application = express();

// DEVELOPMENT TESTS
testDBConnection();

// parses incomming json requests
server.use(express.json());

// express session
server.use(
  session({
    secret: 'process.env.SESSION_SECRET',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true },
  }),
);

// passport middleware
server.use(passport.initialize());
server.use(passport.session());

passport.use(localStrategy);

passport.serializeUser((user: any, done) => {
  done(null, getIdFromEmail(user.email));
});
passport.deserializeUser((id: any, done) => {
  done(null, id);
});

// handles all user authorization routes
server.use('/auth', auth);

// extends Error by adding optional status responsne
interface ResponseError extends Error {
  status?: number;
}

// catch 404 errors
server.use((req: Request, res: Response, next: NextFunction) => {
  const err: ResponseError = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
server.use(
  (err: ResponseError, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || 500);
    res.json({
      message: err.message,
      error: req.app.get('env') === 'production' ? err : {},
    });
  },
);

server.listen(5000, () => console.log('Server running'));
