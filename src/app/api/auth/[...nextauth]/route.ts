import NextAuth, { Account, Session } from 'next-auth';
import { JWT } from 'next-auth/jwt';
import LinkedInProvider from 'next-auth/providers/linkedin';

const handler = NextAuth({
  providers: [
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      authorization: {
        params: { scope: 'r_liteprofile r_emailaddress' },
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
      if (params.account) {
        params.token.accessToken = params.account.access_token as string;
      }
      return params.token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
