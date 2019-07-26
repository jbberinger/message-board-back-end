import express, { Router, Request, Response, NextFunction } from 'express';
import { newUser } from '../database/database';

const router = Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
  res.json({
    message: 'connected 😎',
  });
});

interface User {
  email: string;
  password: string;
}

// Validates email and password for signup.
const validUser = (user: User) => {
  const validEmail = typeof user.email == 'string' && user.email.trim() != '';
  const validPassword =
    typeof user.password == 'string' &&
    user.password.trim() != '' &&
    user.password.length >= 6;
  return validEmail && validPassword;
};

// Posts new user if valid
router.post('/signup', (req: Request, res: Response, next: NextFunction) => {
  const { email, password, username } = req.query;
  console.log(`email: ${email} pass: ${password} user: ${username}`);
  if (true) {
    newUser(email, password, username);
    res.json({
      message: '✅',
    });
  } else {
    next(new Error('Invalid User'));
  }
});

export default router;
