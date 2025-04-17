import NextAuth from 'next-auth';
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
    async jwt({ token, account }) {
      // Persist the access token to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
