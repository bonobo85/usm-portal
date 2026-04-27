import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      discord_id: string;
      username: string;
      email?: string;
      avatar_url?: string;
      rank_level: number;
      rank_nom: string;
      surnom?: string;
      is_active: boolean;
      permissions: string[];
      badges: string[];
      supabase_token: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    user_id?: string;
    discord_id?: string;
    username?: string;
    avatar_url?: string;
    rank_level?: number;
    rank_nom?: string;
    surnom?: string;
    is_active?: boolean;
    permissions?: string[];
    badges?: string[];
    supabase_token?: string;
  }
}
