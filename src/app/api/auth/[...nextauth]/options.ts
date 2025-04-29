import { clientPromise } from '@/lib/mongodb';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { AuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import LinkedInProvider from 'next-auth/providers/linkedin';

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise()),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      authorization: {
        params: {
          scope: 'read:user user:email repo',
        },
      },
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID || 'your_linkedin_client_id',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET as string,
      authorization: {
        params: { scope: 'openid profile email' },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          username: account.providerAccountId,
          provider: account.provider,
          expires_at: (account.expires_at ?? 0) * 1000,
        };
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.expires_at ?? 0)) {
        return token;
      }

      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub;
        session.accessToken = token.accessToken as string;
        session.provider = token.provider as string;
        session.expires_at = token.expires_at as number;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Log successful sign-ins for monitoring
      console.info('User signed in:', {
        userId: user.id,
        email: user.email,
      });
    },
    async signOut() {
      // Handle sign-out event
    },
  },
  debug: process.env.NODE_ENV === 'development',
};
