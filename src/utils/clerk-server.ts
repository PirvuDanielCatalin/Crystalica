import { CLERK_SECRET_KEY } from 'astro:env/server';

// Simple in-memory cache for Clerk API responses (per server instance)
const clerkCache = new Map<string, { data: any; expires: number }>();

function getCached(key: string): any | null {
  const entry = clerkCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    clerkCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any, ttlMs = 60000): void {
  clerkCache.set(key, { data, expires: Date.now() + ttlMs });
}

export interface PublicProfile {
  id: string;
  username: string;
  fullName: string;
  imageUrl: string;
  collections: Record<string, 'p' | 'w'>;
  followed: string[];
}

export async function fetchClerkUserProfile(username: string): Promise<PublicProfile | null> {
  const secretKey = CLERK_SECRET_KEY || import.meta.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.warn('[Crystalica Server] CLERK_SECRET_KEY lipsește');
    return null;
  }

  const cleanUsername = username.replace(/^@/, '').trim();
  if (!cleanUsername) return null;

  const cacheKey = `profile:${cleanUsername.toLowerCase()}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

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

    const rawFollowed = user.unsafe_metadata?.followed;
    const followed: string[] = Array.isArray(rawFollowed) ? rawFollowed : 
      (typeof rawFollowed === 'string' ? rawFollowed.split(',').filter(Boolean) : []);

    const result = {
      id: user.id,
      username: user.username || cleanUsername,
      fullName,
      imageUrl: user.image_url || '',
      collections,
      followed,
    };

    setCache(cacheKey, result);
    return result;
  } catch (err) {
    console.error('[Crystalica Server] Excepție la fetchClerkUserProfile:', err);
    return null;
  }
}

export interface FollowedProfile {
  id: string;
  username: string;
  fullName: string;
  imageUrl: string;
}

export async function fetchFollowersOf(targetUsername: string): Promise<FollowedProfile[]> {
  const cleanTarget = targetUsername.replace(/^@/, '').trim().toLowerCase();
  const secretKey = CLERK_SECRET_KEY || import.meta.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.warn('[Crystalica Server] CLERK_SECRET_KEY lipsește');
    return [];
  }

  const cacheKey = `followers:${cleanTarget}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const url = 'https://api.clerk.com/v1/users?limit=500';
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      console.error('[Crystalica Server] Eroare Clerk API:', res.status, res.statusText);
      return [];
    }

    const users = await res.json();
    const followers: FollowedProfile[] = [];

    if (!Array.isArray(users)) return [];

    for (const user of users) {
      const rawFollowed = user.unsafe_metadata?.followed;
      const followedList: string[] = Array.isArray(rawFollowed)
        ? rawFollowed
        : typeof rawFollowed === 'string'
          ? rawFollowed.split(',').filter(Boolean)
          : [];

      if (followedList.some((f: string) => typeof f === 'string' && f.trim().toLowerCase() === cleanTarget)) {
        const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || '';
        followers.push({
          id: user.id,
          username: user.username || '',
          fullName,
          imageUrl: user.image_url || '',
        });
      }
    }

    setCache(cacheKey, followers);
    return followers;
  } catch (err) {
    console.error('[Crystalica Server] Excepție la fetchFollowersOf:', err);
    return [];
  }
}

export async function fetchFollowedProfiles(usernames: string[]): Promise<FollowedProfile[]> {
  if (!usernames.length) return [];
  
  const cacheKey = `followed:${usernames.sort().join(',')}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const secretKey = CLERK_SECRET_KEY || import.meta.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    console.warn('[Crystalica Server] CLERK_SECRET_KEY lipsește');
    return [];
  }

  try {
    // Batch fetch: use single API call with multiple usernames via query param
    const encodedUsernames = usernames
      .map(u => u.replace(/^@/, '').trim().toLowerCase())
      .filter(Boolean)
      .join(',');
    
    if (!encodedUsernames) return [];

    // Clerk supports filtering by multiple usernames - use email_address or username filter
    // We'll use the users endpoint with email_address filter as workaround
    // For now, batch in chunks of 50 to avoid URL length limits
    const results: FollowedProfile[] = [];
    const usernamesList = encodedUsernames.split(',');
    
    // Process in parallel batches of 10
    const batchSize = 10;
    for (let i = 0; i < usernamesList.length; i += batchSize) {
      const batch = usernamesList.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (username) => {
          const cacheKeySingle = `profile:${username}`;
          const cachedSingle = getCached(cacheKeySingle);
          if (cachedSingle) return cachedSingle;

          const url = `https://api.clerk.com/v1/users?username=${encodeURIComponent(username)}&limit=1`;
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
          if (Array.isArray(data) && data.length > 0) {
            const user = data[0];
            const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username || username;
            const result = {
              id: user.id,
              username: user.username || username,
              fullName,
              imageUrl: user.image_url || '',
            };
            setCache(cacheKeySingle, result);
            return result;
          }
          return null;
        })
      );
      results.push(...batchResults.filter(Boolean) as FollowedProfile[]);
    }
    
    setCache(cacheKey, results);
    return results;
  } catch (err) {
    console.error('[Crystalica Server] Excepție la fetchFollowedProfiles:', err);
    return [];
  }
}
