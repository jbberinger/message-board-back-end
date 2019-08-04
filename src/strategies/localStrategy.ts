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
        email,
      );
      if (!passwordHash) {
        return done(null, false, {
          success: false,
          message: 'authentication failed',
        });
      } else {
        try {
          await bcrypt.compare(password, passwordHash, async (err, isMatch) => {
            if (err) {
              return done(err);
            } else if (isMatch) {
              try {
                const loginRes = await login(email, passwordHash);

                const user = {
                  email: loginRes.email,
                  username: loginRes.username,
                  topic_count: loginRes.topic_count,
                  post_count: loginRes.post_count,
                  likes_given: loginRes.likes_given,
                  likes_received: loginRes.likes_received,
                  bio: loginRes.bio,
                  name: loginRes.name,
                  location: loginRes.location,
                  timezone: loginRes.timezone,
                  signup_date: loginRes.signup_date,
                };

                return done(null, user);
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
