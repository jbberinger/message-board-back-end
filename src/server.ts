require('dotenv').config();
import express, { Application, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import passport from 'passport';
import uuid from 'uuid/v4';
import cors from 'cors';
import auth from './routes/auth';
import { testDBConnection, userLoginCount } from './database/database';
import localStrategy from './strategies/localStrategy';
import { getIdFromEmail } from './database/database';
const server: Application = express();

// DEVELOPMENT TESTS
testDBConnection();

// parses incomming json requests
server.use(express.json());

server.use(cors({ credentials: true, origin: 'http://localhost:3000' }));

server.set('trust proxy', 1);

// express session
server.use(
  session({
    name: 'message_board',
    genid: req => {
      console.log('inside session middleware');
      console.log(req.sessionID);
      return uuid();
    },
    secret: process.env.SESSION_SECRET || 'keyboard_cat123',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  }),
);

// passport middleware
server.use(passport.initialize());
server.use(passport.session());

passport.use(localStrategy);

passport.serializeUser((user: any, done) => {
  console.log('serialize user -> ', user);
  done(null, { ...user });
});

passport.deserializeUser((serializedUser: any, done) => {
  console.log('deserialize user from id -> ', serializedUser);
  done(null, { ...serializedUser });
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
