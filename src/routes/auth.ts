import express, { Router, Request, Response, NextFunction } from 'express';
import {
  signup,
  login,
  getPasswordHashFromEmail,
  checkEmailAvailability,
} from '../database/database';
import bcrypt from 'bcryptjs';
import passport from 'passport';
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

// Checks if email is available for signup
router.post(
  '/signup/emailavailable',
  async (req: Request, res: Response, next: NextFunction) => {
    const email = req.body.email;
    const result: boolean | undefined = await checkEmailAvailability(email);
    res.json({
      success: result,
    });
  },
);

// new user signup
router.post(
  '/signup/finish',
  (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;
    console.log(`email: ${email} pass: ${password}`);

    // hashes password with salting and attempts to add user to database
    const saltCount = 13;
    bcrypt.hash(password, saltCount, (err, passwordHash) => {
      if (err) {
        console.error('bcrypt:', err);
      } else {
        try {
          signup(email, passwordHash);
        } catch (err) {
          next(err);
        }
      }
    });

    res.json({
      email: email,
      message: 'signed up ✅',
    });
  },
);

// user login
router.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction) => {
    const { username, password } = req.body;
    await console.log(`username: ${username} password: ${password}`);
    try {
      // attempts passport authentication with local strategy
      await passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/login',
      });
      console.log('ok');
      await res.redirect('/');
    } catch (err) {
      next(err);
    }
  },
);

export default router;
