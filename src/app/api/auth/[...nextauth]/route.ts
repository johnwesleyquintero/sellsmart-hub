import NextAuth, { Account, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import LinkedInProvider from 'next-auth/providers/linkedin';

const handler = NextAuth({
  providers: [
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      authorization: {
        params: { scope: 'openid profile email w_member_social' },
      },
    }),
  ],
  callbacks: {
    async jwt(params: {
      token: JWT;
      user: unknown;
      account: Account | null;
      profile?: unknown;
      trigger?: unknown;
      isNewUser?: boolean;
      session?: unknown;
    }) {
      console.log('JWT Callback - Account:', params.account);
      if (params.account) {
        params.token.accessToken = params.account.access_token as string;
      }
      console.log('JWT Callback - Token:', params.token);
      return params.token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      console.log('Session Callback - Token:', token);
      if (token.accessToken) {
        session.accessToken = token.accessToken as string;
      } else {
        console.log('Session Callback - accessToken is missing from token');
      }
      console.log('Session Callback - Session:', session);
      return session;
    },
  },
});

export { handler as GET, handler as POST };
