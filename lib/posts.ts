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

export type AppPost = {
  id: string;
  user_id: string;
  author: string;
  item: string;
  address: string;
  description: string;
  time: string;
  type: string;
  imageURL: string;
  coordinates: { latitude: number; longitude: number };
};

export function mapPost(row: DbPost): AppPost {
  return {
    id: row.id,
    user_id: row.user_id,
    author: row.author,
    item: row.item,
    address: row.address,
    description: row.description,
    time: row.time,
    type: row.type,
    imageURL: row.image_url,
    coordinates: { latitude: row.latitude, longitude: row.longitude },
  };
}

export function formatPostTime(time: string): string {
  return new Date(time).toLocaleString();
}
