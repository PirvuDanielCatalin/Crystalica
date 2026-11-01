// Clerk initialization script - loads Clerk from CDN and initializes it
// This avoids Vite bundling issues with Clerk v6 UI components

export type CollectionState = 'p' | 'w';
export type CollectionsMap = Record<string, CollectionState>;
export type FollowedMap = Record<string, true>; // username -> true

interface CrystalicaClerkWindow extends Window {
  Clerk?: any;
  __crystalicaClerk?: any;
  __crystalicaClerkReady?: Promise<void>;
  __crystalicaClerkStatus?: 'disabled' | 'loading' | 'ready' | 'failed';
}

const env = import.meta.env as Record<string, string | undefined>;
const publishableKey = env.PUBLIC_CLERK_PUBLISHABLE_KEY;
const browserWindow = typeof window !== 'undefined' ? (window as CrystalicaClerkWindow) : null;

let instance: any = null;
let ready: Promise<void> = Promise.resolve();
let status: 'disabled' | 'loading' | 'ready' | 'failed' = 'disabled';

function extractFrontendApiHost(key: string): string {
  const raw = key.replace(/^pk_(test|live)_/, '');
  if (!raw) return '';
  try {
    const padded = raw + '='.repeat((4 - (raw.length % 4)) % 4);
    return atob(padded.replace(/-/g, '+').replace(/_/g, '/')).replace(/\$$/, '').trim();
  } catch {
    return '';
  }
}

if (browserWindow) {
  if (!publishableKey) {
    console.warn('[Crystalica] PUBLIC_CLERK_PUBLISHABLE_KEY is missing — auth disabled.');
  } else if (!browserWindow.Clerk) {
    // Load Clerk from CDN
    const fapiHost = extractFrontendApiHost(publishableKey);
    if (!fapiHost) {
      console.error('[Crystalica] Cannot extract Frontend API host from publishable key.');
    } else {
      const npmBase = `https://${fapiHost}/npm`;
      
      // Load UI components first
      const uiScript = document.createElement('script');
      uiScript.src = `${npmBase}/@clerk/ui@1/dist/ui.browser.js`;
      uiScript.async = true;
      
      // Load Clerk SDK
      const clerkScript = document.createElement('script');
      clerkScript.src = `${npmBase}/@clerk/clerk-js@6/dist/clerk.browser.js`;
      clerkScript.setAttribute('data-clerk-publishable-key', publishableKey);
      clerkScript.async = true;
      
      // Wait for both to load
      browserWindow.__crystalicaClerkReady = Promise.all([
        new Promise<void>((resolve, reject) => {
          uiScript.addEventListener('load', () => {
            console.log('[Crystalica] @clerk/ui loaded from CDN');
            resolve();
          });
          uiScript.addEventListener('error', () => {
            console.error('[Crystalica] Failed to load @clerk/ui from CDN');
            reject(new Error('Failed to load @clerk/ui'));
          });
        }),
        new Promise<void>((resolve, reject) => {
          clerkScript.addEventListener('load', () => {
            console.log('[Crystalica] @clerk/clerk-js loaded from CDN');
            resolve();
          });
          clerkScript.addEventListener('error', () => {
            console.error('[Crystalica] Failed to load @clerk/clerk-js from CDN');
            reject(new Error('Failed to load @clerk/clerk-js'));
          });
        }),
      ]).then(() => {
        // When loaded from CDN, window.Clerk is ALREADY the singleton instance
        const clerkInstance = browserWindow.Clerk;
        if (!clerkInstance) {
          throw new Error('Clerk instance not found after script load');
        }
        
        browserWindow.__crystalicaClerk = clerkInstance;
        instance = clerkInstance;
        status = 'loading';
        browserWindow.__crystalicaClerkStatus = 'loading';
        
        // Pass the UI constructor to load() so UI components are attached
        return clerkInstance.load({
          clerkUICtor: (window as any).__internal_ClerkUICtor,
          appearance: {
            variables: {
              colorPrimary: '#3d9b91',
              fontFamily: "'DM Sans', system-ui, -apple-system, sans-serif",
              borderRadius: '0.5rem',
            },
          },
        }).then(() => {
          status = 'ready';
          browserWindow.__crystalicaClerkStatus = 'ready';
          console.log('[Crystalica] Clerk initialized successfully, status:', clerkInstance.status, 'loaded:', clerkInstance.loaded);
        }).catch((error: any) => {
          status = 'failed';
          browserWindow.__crystalicaClerkStatus = 'failed';
          console.error('[Crystalica] Clerk initialization failed:', error);
        });
      }).catch((error) => {
        status = 'failed';
        browserWindow.__crystalicaClerkStatus = 'failed';
        console.error('[Crystalica] Clerk setup failed:', error);
      });
      
      document.head.appendChild(uiScript);
      document.head.appendChild(clerkScript);
    }
  } else {
    // Clerk already loaded (e.g., from a previous script tag)
    instance = browserWindow.__crystalicaClerk;
    ready = browserWindow.__crystalicaClerkReady || Promise.resolve();
    status = browserWindow.__crystalicaClerkStatus || 'loading';
  }
}

export const clerk = instance;
export const clerkReady = ready;

export function getClerkStatus(): 'disabled' | 'loading' | 'ready' | 'failed' {
  return status;
}

/**
 * Opens a Clerk modal with retry on mount race.
 * Clerk's openSignIn/openSignUp throw SYNCHRONOUSLY ("Clerk was not loaded with Ui components")
 * when called before the UI controller finishes attaching.
 */
function openModal(kind: 'signIn' | 'signUp', props?: Record<string, unknown>): boolean {
  if (!instance) return false;
  
  try {
    if (kind === 'signIn') {
      instance.openSignIn(props);
    } else {
      instance.openSignUp(props);
    }
    return true;
  } catch (err) {
    const msg = (err as Error)?.message || '';
    if (msg.includes('Ui components') || msg.includes('UI components')) {
      console.log('[Crystalica] UI components not ready yet, will retry...');
      requestAnimationFrame(() => {
        try {
          if (kind === 'signIn') instance?.openSignIn(props);
          else instance?.openSignUp(props);
        } catch (e) {
          console.error('[Crystalica] Failed to open modal after retry:', e);
        }
      });
      return false;
    }
    throw err;
  }
}

export function openSignIn(props?: Record<string, unknown>): boolean {
  return openModal('signIn', props);
}

export function openSignUp(props?: Record<string, unknown>): boolean {
  return openModal('signUp', props);
}

export function readCollections(user: unknown): CollectionsMap {
  const metadata = (user as { unsafeMetadata?: Record<string, unknown> } | null | undefined)
    ?.unsafeMetadata;
  const raw = metadata?.collections;
  const collections: CollectionsMap = {};

  if (typeof raw === 'string') {
    for (const entry of raw.split(',')) {
      const separator = entry.lastIndexOf(':');
      if (separator <= 0) continue;
      const slug = entry.slice(0, separator);
      const state = entry.slice(separator + 1);
      if (slug && (state === 'p' || state === 'w')) {
        collections[slug] = state;
      }
    }
    return collections;
  }

  if (raw && typeof raw === 'object') {
    for (const [slug, value] of Object.entries(raw as Record<string, unknown>)) {
      if (value === 'p' || value === 'w') {
        collections[slug] = value;
      }
    }
  }

  return collections;
}

export function currentCollections(): CollectionsMap {
  return readCollections(clerk?.user);
}

export async function saveCollections(
  user: { unsafeMetadata?: Record<string, unknown>; update: (data: any) => Promise<unknown> },
  collections: CollectionsMap,
): Promise<void> {
  const unsafeMetadata = {
    ...(user.unsafeMetadata ?? {}),
    collections: Object.entries(collections)
      .map(([slug, state]) => `${slug}:${state}`)
      .join(','),
  };

  await user.update({ unsafeMetadata });
  document.dispatchEvent(
    new CustomEvent<CollectionsMap>('crystalica:collections', { detail: collections }),
  );
}

export function readFollowed(user: unknown): FollowedMap {
  const metadata = (user as { unsafeMetadata?: Record<string, unknown> } | null | undefined)
    ?.unsafeMetadata;
  const raw = metadata?.followed;
  const followed: FollowedMap = {};

  if (Array.isArray(raw)) {
    for (const username of raw) {
      if (username && typeof username === 'string') {
        followed[username.toLowerCase()] = true;
      }
    }
    return followed;
  }

  if (typeof raw === 'string') {
    for (const username of raw.split(',')) {
      const clean = username.trim().toLowerCase();
      if (clean) followed[clean] = true;
    }
    return followed;
  }

  return followed;
}

export function currentFollowed(): FollowedMap {
  return readFollowed(clerk?.user);
}

export async function saveFollowed(
  user: { unsafeMetadata?: Record<string, unknown>; update: (data: any) => Promise<unknown> },
  followed: FollowedMap,
): Promise<void> {
  const usernames = Object.keys(followed);
  const unsafeMetadata = {
    ...(user.unsafeMetadata ?? {}),
    followed: usernames,
  };

  await user.update({ unsafeMetadata });
  document.dispatchEvent(
    new CustomEvent<FollowedMap>('crystalica:followed', { detail: followed }),
  );
}

export async function followUser(
  user: { unsafeMetadata?: Record<string, unknown>; update: (data: any) => Promise<unknown> },
  username: string,
): Promise<void> {
  const current = readFollowed(user);
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername || current[cleanUsername]) return;

  const next = { ...current, [cleanUsername]: true };
  await saveFollowed(user, next);
}

export async function unfollowUser(
  user: { unsafeMetadata?: Record<string, unknown>; update: (data: any) => Promise<unknown> },
  username: string,
): Promise<void> {
  const current = readFollowed(user);
  const cleanUsername = username.trim().toLowerCase();
  if (!cleanUsername || !current[cleanUsername]) return;

  const next = { ...current };
  delete next[cleanUsername];
  await saveFollowed(user, next);
}
