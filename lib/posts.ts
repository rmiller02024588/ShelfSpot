import { getCurrentUser } from './auth';
import { supabase } from '../Supabaseconfig';

export type DbPost = {
  id: string;
  user_id: string;
  author: string;
  item: string;
  address: string;
  description: string;
  time: string;
  type: string;
  image_url: string;
  latitude: number;
  longitude: number;
  exp_date: string;
};

export type StockVote = 'in_stock' | 'sold_out';

export type AppPost = {
  id: string;
  user_id: string;
  author: string;
  avatarUrl: string | null;
  item: string;
  address: string;
  description: string;
  time: string;
  type: string;
  imageURL: string;
  coordinates: { latitude: number; longitude: number };
  /** 0–100 likelihood item is still there; null when nobody has voted yet */
  reliabilityScore: number | null;
  inStockVotes: number;
  soldOutVotes: number;
  myVote: StockVote | null;
};

function resolveAuthorName(
  displayName: string | null | undefined,
  fallbackAuthor: string,
  email?: string | null,
): string {
  const fromProfile = displayName?.trim();
  if (fromProfile) return fromProfile;

  const fromAuthor = fallbackAuthor?.trim();
  if (fromAuthor) {
    return fromAuthor.includes('@') ? fromAuthor.split('@')[0] : fromAuthor;
  }

  if (email) return email.split('@')[0];
  return 'Unknown';
}

export function mapPost(row: DbPost): AppPost {
  return {
    id: row.id,
    user_id: row.user_id,
    author: row.author,
    avatarUrl: null,
    item: row.item,
    address: row.address,
    description: row.description,
    time: row.time,
    type: row.type,
    imageURL: row.image_url,
    coordinates: { latitude: row.latitude, longitude: row.longitude },
    reliabilityScore: null,
    inStockVotes: 0,
    soldOutVotes: 0,
    myVote: null,
  };
}

export function computeReliabilityScore(inStockVotes: number, soldOutVotes: number): number | null {
  const total = inStockVotes + soldOutVotes;
  if (total === 0) return null;
  return Math.round((inStockVotes / total) * 100);
}

export async function setStockVote(
  postId: string,
  vote: StockVote,
): Promise<{ inStockVotes: number; soldOutVotes: number; myVote: StockVote | null; reliabilityScore: number | null } | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data: existing } = await supabase
    .from('stock_votes')
    .select('vote')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .maybeSingle();

  if (existing?.vote === vote) {
    await supabase
      .from('stock_votes')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId);
  } else {
    const { error } = await supabase.from('stock_votes').upsert(
      {
        user_id: user.id,
        post_id: postId,
        vote,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,post_id' },
    );
    if (error) {
      console.error('Error saving stock vote:', error);
      return null;
    }
  }

  return getPostReliability(postId, user.id);
}

export async function getPostReliability(postId: string, userId?: string | null) {
  const { data: votes, error } = await supabase
    .from('stock_votes')
    .select('user_id, vote')
    .eq('post_id', postId);

  if (error) {
    console.error('Error loading stock votes:', error);
    return {
      inStockVotes: 0,
      soldOutVotes: 0,
      myVote: null as StockVote | null,
      reliabilityScore: null as number | null,
    };
  }

  let inStockVotes = 0;
  let soldOutVotes = 0;
  let myVote: StockVote | null = null;

  for (const row of votes ?? []) {
    if (row.vote === 'in_stock') inStockVotes += 1;
    if (row.vote === 'sold_out') soldOutVotes += 1;
    if (userId && row.user_id === userId) {
      myVote = row.vote as StockVote;
    }
  }

  return {
    inStockVotes,
    soldOutVotes,
    myVote,
    reliabilityScore: computeReliabilityScore(inStockVotes, soldOutVotes),
  };
}

async function enrichPostsWithReliability(posts: AppPost[]): Promise<AppPost[]> {
  if (posts.length === 0) return posts;

  const postIds = posts.map((post) => post.id);
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    user = null;
  }

  const { data: votes, error } = await supabase
    .from('stock_votes')
    .select('post_id, user_id, vote')
    .in('post_id', postIds);

  if (error) {
    console.error('Error loading post reliability:', error);
    return posts;
  }

  const stats = new Map<string, { inStock: number; soldOut: number; myVote: StockVote | null }>();
  for (const post of posts) {
    stats.set(post.id, { inStock: 0, soldOut: 0, myVote: null });
  }

  for (const row of votes ?? []) {
    const entry = stats.get(row.post_id);
    if (!entry) continue;
    if (row.vote === 'in_stock') entry.inStock += 1;
    if (row.vote === 'sold_out') entry.soldOut += 1;
    if (user && row.user_id === user.id) {
      entry.myVote = row.vote as StockVote;
    }
  }

  return posts.map((post) => {
    const entry = stats.get(post.id) ?? { inStock: 0, soldOut: 0, myVote: null };
    return {
      ...post,
      inStockVotes: entry.inStock,
      soldOutVotes: entry.soldOut,
      myVote: entry.myVote,
      reliabilityScore: computeReliabilityScore(entry.inStock, entry.soldOut),
    };
  });
}

/** Attach current profile display names, avatars, and reliability scores to posts. */
export async function enrichPostsWithProfiles(posts: AppPost[]): Promise<AppPost[]> {
  if (posts.length === 0) return posts;

  const userIds = [...new Set(posts.map((post) => post.user_id).filter(Boolean))];
  let withProfiles = posts;

  if (userIds.length > 0) {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, email')
      .in('id', userIds);

    if (error) {
      console.error('Error loading post profiles:', error);
    } else {
      const byId = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
      withProfiles = posts.map((post) => {
        const profile = byId.get(post.user_id);
        return {
          ...post,
          author: resolveAuthorName(profile?.display_name, post.author, profile?.email),
          avatarUrl: profile?.avatar_url || null,
        };
      });
    }
  }

  return enrichPostsWithReliability(withProfiles);
}

const EARTH_RADIUS_MILES = 3958.8;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Great-circle distance between two coordinates, in miles. */
export function milesBetween(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a));
}

/** Rough lat/lng window used to pre-filter posts before exact distance checks. */
export function boundingBox(latitude: number, longitude: number, miles: number) {
  const latDelta = miles / 69;
  const cosLat = Math.cos(toRadians(latitude));
  const lonDelta = miles / (69 * Math.max(cosLat, 0.01));
  return {
    minLat: latitude - latDelta,
    maxLat: latitude + latDelta,
    minLon: longitude - lonDelta,
    maxLon: longitude + lonDelta,
  };
}

export function filterPostsWithinMiles(
  posts: AppPost[],
  latitude: number,
  longitude: number,
  miles: number,
): AppPost[] {
  return posts.filter((post) => {
    const { latitude: postLat, longitude: postLon } = post.coordinates;
    if (!Number.isFinite(postLat) || !Number.isFinite(postLon)) return false;
    return milesBetween(latitude, longitude, postLat, postLon) <= miles;
  });
}

/** Delete a post owned by the current user. Returns true on success. */
export async function deletePost(postId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Not signed in' };

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting post:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export function formatPostTime(time: string): string {
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return time;

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'Posted just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `Posted ${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Posted ${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `Posted ${days} day${days === 1 ? '' : 's'} ago`;
  }

  const weeks = Math.floor(days / 7);
  if (weeks < 5) {
    return `Posted ${weeks} week${weeks === 1 ? '' : 's'} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `Posted ${months} month${months === 1 ? '' : 's'} ago`;
  }

  const years = Math.floor(days / 365);
  return `Posted ${years} year${years === 1 ? '' : 's'} ago`;
}
