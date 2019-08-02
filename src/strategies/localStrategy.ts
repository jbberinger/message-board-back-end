import LocalStrategy from 'passport-local';
import bcrypt from 'bcryptjs';
import {
  signup,
  login,
  getPasswordHashFromEmail,
  checkEmailAvailability,
} from '../database/database';

const localStrategy = new LocalStrategy.Strategy(
  {
    usernameField: 'email',
  },
  async (email: string, password: string, done: any) => {
    console.log(`username: ${email} password: ${password} done: ${done}`);
    // checks for valid username and password
    try {
      const passwordHash: string | undefined = await getPasswordHashFromEmail(
        password,
      );
      if (!passwordHash) {
        return done(null, false, {
          success: false,
          message: 'authentication failed',
        });
      } else {
        try {
          await bcrypt.compare(password, passwordHash, (err, isMatch) => {
            if (err) {
              return done(err);
            } else if (isMatch) {
              try {
                await login(email, passwordHash);
                return done(null, true, {
                  success: true,
                  email: email,
                });
              } catch (err) {
                return done(err);
              }
            } else {
              return done(null, false, {
                success: false,
                message: 'authentication failed',
              });
            }
          });
        } catch {
          return done(null, false, { message: "passwords don't match" });
        }
      }
    } catch (err) {
      return done(err);
    }
  },
);

export default localStrategy;
