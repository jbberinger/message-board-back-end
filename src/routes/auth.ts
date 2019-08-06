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
    // console.log(`email: ${email} pass: ${password}`);

    // hashes password with salting and attempts to add user to database
    const saltCount = 13;
    bcrypt.hash(password, saltCount, async (err, passwordHash) => {
      if (err) {
        console.error('bcrypt:', err);
      } else {
        try {
          if (await signup(email, passwordHash)) {
            req.login(req.user, err => {
              if (err) {
                next(err);
              }
            });
            res.status(201).json({
              email: email,
              message: 'sign up successful ✅',
            });
          } else {
            res.status(400).json({
              email: email,
              message: 'sign up failed ❌',
            });
          }
        } catch (err) {
          next(err);
        }
      }
    });
  },
);

// user login
router.post(
  '/login',
  passport.authenticate('local'),
  (req: Request, res: Response, next: NextFunction) => {
    console.log(`---> ${JSON.stringify(req.session)}`);
    res.status(200).json({
      message: 'log in successful ✅',
    });
  },
);

router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
  console.log(`---> ${JSON.stringify(req.session)}`);
  req.logout();
  res.status(200).json({
    message: 'log out successful ✅',
  });
});

// check if logged in
router.get(
  '/checkauthentication',
  (req: Request, res: Response, next: NextFunction) => {
    const isAuth = req.isAuthenticated();
    console.log(`checkauthentication ---> ${isAuth}`);
    if (isAuth) {
      res.status(200).json({
        message: 'user is authorized',
      });
    } else {
      res.status(401).json({
        message: 'user is not authorized',
      });
    }
  },
);

// router.post('/login', (req: Request, res: Response, next: NextFunction) => {
//   console.log('inside POST /login callback');
//   passport.authenticate('local', (err, user, info) => {
//     console.log('Inside passport.authenticate() callback');
//     console.log(
//       `req.session.passport: ${JSON.stringify(req.session!.passport)}`,
//     );
//     console.log(`req.user: ${JSON.stringify(req.user)}`);
//     req.login(user, err => {
//       console.log('Inside req.login() callback');
//       console.log(
//         `req.session.passport: ${JSON.stringify(req.session!.passport)}`,
//       );
//       console.log(`req.user: ${JSON.stringify(req.user)}`);
//       return res.status(200).json({
//         message: 'log in successful ✅',
//       });
//     });
//   })(req, res, next);
// });

export default router;
