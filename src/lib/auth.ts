import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { UserModel } from '@/models'

export const authOptions: NextAuthOptions = {
  // Use JWT strategy (no database adapter needed)
  session: {
    strategy: 'jwt',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'google' && user.email) {
          // Check if user exists in our MongoDB database
          let existingUser = await UserModel.findByEmail(user.email)
          
          if (!existingUser) {
            // Create new user in our database
            await UserModel.create({
              name: user.name || '',
              email: user.email,
              emailVerified: new Date(),
              image: user.image || '',
            })
          } else {
            // Update existing user info
            await UserModel.updateById(existingUser._id!.toString(), {
              name: user.name || existingUser.name,
              image: user.image || existingUser.image,
              emailVerified: existingUser.emailVerified || new Date(),
            })
          }
        }
        return true
      } catch (error) {
        console.error('Error in signIn callback:', error)
        return true // Allow sign in even if database operation fails
      }
    },
    async jwt({ token, user, account }) {
      if (user && account) {
        // First time sign in
        try {
          const dbUser = await UserModel.findByEmail(user.email!)
          if (dbUser) {
            token.uid = dbUser._id!.toString()
          }
        } catch (error) {
          console.error('Error getting user in JWT callback:', error)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session?.user && token?.uid) {
        (session.user as any).id = token.uid
      }
      return session
    },
    redirect: async ({ url, baseUrl }) => {
      // Redirect to profile after sign-in/sign-up
      if (url === `${baseUrl}/auth/signin` || url === `${baseUrl}/auth/signup`) {
        return `${baseUrl}/`
      }
      // Handle redirects properly for both environments
      if (url.startsWith('/')) return `${baseUrl}${url}`
      if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development',
  useSecureCookies: process.env.NEXTAUTH_URL?.startsWith('https://'),
}
