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
    async jwt({ token, account }: { token: JWT; account?: Account }) {
      if (account) {
        token.accessToken = account.access_token as string;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
