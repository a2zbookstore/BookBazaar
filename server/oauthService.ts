import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { db } from "./db";
import { users } from "@shared/schema";
import { eq, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { sendWelcomeEmail } from "./emailService";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const BASE_URL = (process.env.BASE_URL || "http://localhost:5000").replace(/\/$/, "");

console.log('OAuth Configuration:');
console.log('- Google OAuth:', GOOGLE_CLIENT_ID ? '✓ Configured' : '✗ Not configured');
console.log('- Facebook OAuth:', FACEBOOK_APP_ID ? '✓ Configured' : '✗ Not configured');
console.log('- Base URL:', BASE_URL);

// Serialize user for session
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id: string, done) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
if (GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: `${BASE_URL}/api/auth/google/callback`,
        scope: ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists with this Google ID or email
          const [existingUser] = await db
            .select()
            .from(users)
            .where(
              or(
                eq(users.oauthProviderId, profile.id),
                eq(users.email, profile.emails?.[0]?.value || '')
              )
            );

          if (existingUser) {
            // Update existing user with OAuth info if not already set
            if (!existingUser.oauthProviderId) {
              // Preserve authProvider for email/phone users so password login still works
              const keepExistingProvider = existingUser.authProvider === 'email' || existingUser.authProvider === 'phone';
              await db
                .update(users)
                .set({
                  oauthProviderId: profile.id,
                  ...(keepExistingProvider ? {} : { authProvider: 'google' as const }),
                  isEmailVerified: true,
                  profileImageUrl: existingUser.profileImageUrl || profile.photos?.[0]?.value,
                  updatedAt: new Date(),
                })
                .where(eq(users.id, existingUser.id));
            }
            return done(null, existingUser);
          }

          // Create new user
          const userId = nanoid();
          const newUser = {
            id: userId,
            email: profile.emails?.[0]?.value || null,
            firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User',
            lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
            profileImageUrl: profile.photos?.[0]?.value || null,
            authProvider: 'google' as const,
            oauthProviderId: profile.id,
            isEmailVerified: true,
            role: 'customer' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.insert(users).values(newUser);

          const [createdUser] = await db.select().from(users).where(eq(users.id, userId));
          
          // Send welcome email to new Google OAuth user
          if (createdUser.email) {
            sendWelcomeEmail({
              email: createdUser.email,
              firstName: createdUser.firstName || 'User',
              lastName: createdUser.lastName || '',
            }).catch(err => console.error('Failed to send Google OAuth welcome email:', err));
          }
          
          return done(null, createdUser);
        } catch (error) {
          console.error('Google OAuth error:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );
  console.log('✓ Google OAuth strategy registered');
} else {
  console.warn('⚠️  Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET');
}

// Facebook OAuth Strategy
if (FACEBOOK_APP_ID && FACEBOOK_APP_SECRET) {
  passport.use(
    new FacebookStrategy(
      {
        clientID: FACEBOOK_APP_ID,
        clientSecret: FACEBOOK_APP_SECRET,
        callbackURL: `${BASE_URL}/api/auth/facebook/callback`,
        profileFields: ['id', 'displayName', 'name', 'emails', 'picture.type(large)'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user exists with this Facebook ID or email
          const [existingUser] = await db
            .select()
            .from(users)
            .where(
              or(
                eq(users.oauthProviderId, profile.id),
                eq(users.email, profile.emails?.[0]?.value || '')
              )
            );

          if (existingUser) {
            // Update existing user with OAuth info if not already set
            if (!existingUser.oauthProviderId) {
              // Preserve authProvider for email/phone users so password login still works
              const keepExistingProvider = existingUser.authProvider === 'email' || existingUser.authProvider === 'phone';
              await db
                .update(users)
                .set({
                  oauthProviderId: profile.id,
                  ...(keepExistingProvider ? {} : { authProvider: 'facebook' as const }),
                  isEmailVerified: true,
                  profileImageUrl: existingUser.profileImageUrl || profile.photos?.[0]?.value,
                  updatedAt: new Date(),
                })
                .where(eq(users.id, existingUser.id));
            }
            return done(null, existingUser);
          }

          // Create new user
          const userId = nanoid();
          const newUser = {
            id: userId,
            email: profile.emails?.[0]?.value || null,
            firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || 'User',
            lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
            profileImageUrl: profile.photos?.[0]?.value || null,
            authProvider: 'facebook' as const,
            oauthProviderId: profile.id,
            isEmailVerified: true,
            role: 'customer' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await db.insert(users).values(newUser);

          const [createdUser] = await db.select().from(users).where(eq(users.id, userId));
          
          // Send welcome email to new Facebook OAuth user
          if (createdUser.email) {
            sendWelcomeEmail({
              email: createdUser.email,
              firstName: createdUser.firstName || 'User',
              lastName: createdUser.lastName || '',
            }).catch(err => console.error('Failed to send Facebook OAuth welcome email:', err));
          }
          
          return done(null, createdUser);
        } catch (error) {
          console.error('Facebook OAuth error:', error);
          return done(error as Error, undefined);
        }
      }
    )
  );
  console.log('✓ Facebook OAuth strategy registered');
} else {
  console.warn('⚠️  Facebook OAuth not configured - missing FACEBOOK_APP_ID or FACEBOOK_APP_SECRET');
}

export { passport };
