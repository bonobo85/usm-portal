import { NextAuthOptions } from 'next-auth';
import DiscordProvider from 'next-auth/providers/discord';
import { createAdminClient } from './supabase-server';
import { SignJWT } from 'jose';

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: 'identify email' } },
    }),
  ],

  pages: {
    signIn: '/login',
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      if (!account || account.provider !== 'discord') return false;

      const supabase = createAdminClient();
      const discordId = account.providerAccountId;
      const discordProfile = profile as any;

      // Check if user exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('discord_id', discordId)
        .single();

      if (existingUser) {
        // Reject if deactivated
        if (!existingUser.is_active) return false;

        // Update on login
        await supabase.from('users').update({
          username: discordProfile?.username || user.name || 'Inconnu',
          email: user.email,
          avatar_url: user.image,
          derniere_connexion: new Date().toISOString(),
          statut: 'disponible',
        }).eq('id', existingUser.id);

      } else {
        // Create new user at rank 1
        await supabase.from('users').insert({
          discord_id: discordId,
          username: discordProfile?.username || user.name || 'Inconnu',
          email: user.email,
          avatar_url: user.image,
          rank_level: 1,
          statut: 'disponible',
          is_active: true,
          derniere_connexion: new Date().toISOString(),
        });
      }

      return true;
    },

    async jwt({ token, account }) {
      if (account) {
        token.discord_id = account.providerAccountId;
      }

      const supabase = createAdminClient();

      // Load full user data
      const { data: dbUser } = await supabase
        .from('users')
        .select(`
          *,
          user_badges(badge_id, badges(code)),
          user_permissions(permission)
        `)
        .eq('discord_id', token.discord_id as string)
        .single();

      if (!dbUser || !dbUser.is_active) {
        token.is_active = false;
        return token;
      }

      // Heartbeat: update last connection every JWT refresh
      await supabase.from('users').update({
        derniere_connexion: new Date().toISOString(),
      }).eq('id', dbUser.id);

      // Generate Supabase-compatible JWT
      const supabaseToken = await new SignJWT({
        sub: dbUser.id,
        user_id: dbUser.id,
        rank_level: dbUser.rank_level,
        aud: 'authenticated',
        role: 'authenticated',
      })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('2h')
        .sign(secret);

      token.user_id = dbUser.id;
      token.discord_id = dbUser.discord_id;
      token.username = dbUser.username;
      token.avatar_url = dbUser.avatar_url;
      token.rank_level = dbUser.rank_level;
      token.surnom = dbUser.surnom;
      token.is_active = dbUser.is_active;
      token.supabase_token = supabaseToken;
      token.permissions = dbUser.user_permissions?.map((p: any) => p.permission) || [];
      token.badges = dbUser.user_badges
        ?.filter((ub: any) => ub.badges)
        .map((ub: any) => ub.badges.code) || [];

      // Get rank name
      const { data: rank } = await supabase
        .from('ranks')
        .select('nom')
        .eq('level', dbUser.rank_level)
        .single();
      token.rank_nom = rank?.nom || 'BCSO';

      return token;
    },

    async session({ session, token }) {
      if (!token.is_active) {
        return { ...session, user: null } as any;
      }

      session.user = {
        ...session.user,
        id: token.user_id as string,
        discord_id: token.discord_id as string,
        username: token.username as string,
        avatar_url: token.avatar_url as string,
        rank_level: token.rank_level as number,
        rank_nom: token.rank_nom as string,
        surnom: token.surnom as string,
        is_active: token.is_active as boolean,
        permissions: token.permissions as string[],
        badges: token.badges as string[],
        supabase_token: token.supabase_token as string,
      } as any;

      return session;
    },
  },

  events: {
    async signOut({ token }) {
      if (token?.user_id) {
        const supabase = createAdminClient();
        await supabase.from('users').update({ statut: 'hors_ligne' }).eq('id', token.user_id);
      }
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 7200, // 2h
  },
};
