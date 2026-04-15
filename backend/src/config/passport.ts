import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import UserRepository from '../repositories/user.repository';

const userRepository = new UserRepository();

export function initializePassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: process.env.GOOGLE_CALLBACK_URL!,
      },
      async (_accessToken, _refreshToken, profile: Profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || profile.name?.givenName || 'Google User';

          if (!email) {
            return done(new Error('No email returned from Google'), undefined);
          }

          // Try to find existing user by googleId first, then by email (account linking)
          let user = await userRepository.findByGoogleId(googleId);

          if (!user) {
            const existingByEmail = await userRepository.findByEmail(email);
            if (existingByEmail) {
              // Link Google ID to existing email/password account
              user = await userRepository.linkGoogleId(existingByEmail.id, googleId);
            } else {
              // Brand-new Google user — create account (no password)
              user = await userRepository.upsertGoogleUser({ googleId, email, name });
            }
          }

          return done(null, user);
        } catch (err) {
          return done(err as Error, undefined);
        }
      }
    )
  );
}
