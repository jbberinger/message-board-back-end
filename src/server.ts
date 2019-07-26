import express, { Application, Request, Response, NextFunction } from 'express';
import auth from './routes/auth';
import bodyParser from 'body-parser';
import { testDBConnection } from './database/database';

const server: Application = express();

testDBConnection();

server.use(bodyParser.json());
server.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

// Handles all user authorization routes
server.use('/auth', auth);

// Extends Error by adding optional status responsne
interface ResponseError extends Error {
  status?: number;
}

// Catch 404 errors
server.use((req: Request, res: Response, next: NextFunction) => {
  const err: ResponseError = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handler
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
