import { type NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        isPin: { label: 'Is PIN', type: 'text' },
        userId: { label: 'User ID', type: 'text' },
      },
      async authorize(credentials) {
        if (credentials?.isPin === 'true' && credentials?.userId) {
          const res = await fetch(`${BACKEND_URL}/api/users/${credentials.userId}/profile`, {
            headers: { 'x-user-id': credentials.userId }
          });
          if (!res.ok) return null;
          const data = await res.json();
          return {
            id: String(data.user.id),
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            companyId: data.user.company_id,
            image: data.user.avatar_url,
          };
        }

        if (!credentials?.email || !credentials?.password) return null;

        const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            app_type: 'mobile'
          }),
        });

        if (!res.ok) return null;
        
        const data = await res.json();
        return data.user;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.companyId = (user as any).companyId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).companyId = token.companyId;
      }
      return session;
    },
  },
};
