import { CLERK_SECRET_KEY } from 'astro:env/server';

export interface PublicProfile {
  id: string;
  username: string;
  fullName: string;
  imageUrl: string;
  collections: Record<string, 'p' | 'w'>;
}

export async function fetchClerkUserProfile(username: string): Promise<PublicProfile | null> {
  const secretKey = CLERK_SECRET_KEY || import.meta.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.warn('[Crystalica Server] CLERK_SECRET_KEY lipsește');
    return null;
  }

  const cleanUsername = username.replace(/^@/, '').trim();
  if (!cleanUsername) return null;

  try {
    const url = `https://api.clerk.com/v1/users?username=${encodeURIComponent(cleanUsername.toLowerCase())}&limit=1`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('[Crystalica Server] Eroare Clerk API:', res.status, res.statusText);
      return null;
    }

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const user = data[0];
    const rawCollections = user.unsafe_metadata?.collections;
    const collections: Record<string, 'p' | 'w'> = {};

    if (typeof rawCollections === 'string') {
      for (const entry of rawCollections.split(',')) {
        const sep = entry.lastIndexOf(':');
        if (sep <= 0) continue;
        const slug = entry.slice(0, sep);
        const state = entry.slice(sep + 1);
        if (slug && (state === 'p' || state === 'w')) collections[slug] = state;
      }
    } else if (rawCollections && typeof rawCollections === 'object') {
      for (const [slug, val] of Object.entries(rawCollections)) {
        if (val === 'p' || val === 'w') collections[slug] = val as 'p' | 'w';
      }
    }

    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || cleanUsername;

    return {
      id: user.id,
      username: user.username || cleanUsername,
      fullName,
      imageUrl: user.image_url || '',
      collections,
    };
  } catch (err) {
    console.error('[Crystalica Server] Excepție la fetchClerkUserProfile:', err);
    return null;
  }
}
