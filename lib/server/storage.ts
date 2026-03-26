import { getDb } from "../db";

const VIDEO_BUCKET = "videos";
const AVATAR_BUCKET = "avatars";
const MAX_VIDEO_SIZE_BYTES = 200 * 1024 * 1024;
const ALLOWED_VIDEO_MIME_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-m4v",
];

let videoBucketReady = false;

async function ensureVideoBucketExists() {
  if (videoBucketReady) return;

  const result = await getDb().storage.createBucket(VIDEO_BUCKET, {
    allowedMimeTypes: ALLOWED_VIDEO_MIME_TYPES,
    fileSizeLimit: MAX_VIDEO_SIZE_BYTES,
    public: true,
  });

  if (result.error && !/already exists/i.test(result.error.message)) {
    throw new Error(`视频存储桶初始化失败：${result.error.message}`);
  }

  videoBucketReady = true;
}

export function isAllowedVideoFile(file: File): boolean {
  return ALLOWED_VIDEO_MIME_TYPES.includes(file.type.toLowerCase());
}

export function getVideoSizeLimit(): number {
  return MAX_VIDEO_SIZE_BYTES;
}

export async function uploadSourceVideoToStorage(input: {
  file: File;
  objectPath: string;
  contentType: string;
}): Promise<{ objectPath: string }> {
  await ensureVideoBucketExists();

  const buffer = Buffer.from(await input.file.arrayBuffer());

  const { error } = await getDb().storage.from(VIDEO_BUCKET).upload(input.objectPath, buffer, {
    cacheControl: "3600",
    contentType: input.contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`视频上传失败：${error.message}`);
  }

  return { objectPath: input.objectPath };
}

export async function removeVideoFromStorage(objectPaths: Array<string | null | undefined>): Promise<void> {
  const validPaths = objectPaths.filter((p): p is string => typeof p === "string" && p.trim() !== "");
  if (validPaths.length === 0) return;

  await getDb().storage.from(VIDEO_BUCKET).remove(validPaths);
}

export function getVideoPublicUrl(objectPath: string): string {
  const { data } = getDb().storage.from(VIDEO_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

export async function uploadAvatarToStorage(input: {
  userId: number;
  file: File;
  objectPath: string;
}): Promise<string> {
  await getDb().storage.createBucket(AVATAR_BUCKET, {
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
    fileSizeLimit: 5 * 1024 * 1024,
    public: true,
  }).catch(() => {}); // ignore "already exists"

  const buffer = Buffer.from(await input.file.arrayBuffer());
  const contentType = input.file.type || "image/jpeg";

  const { error } = await getDb().storage.from(AVATAR_BUCKET).upload(input.objectPath, buffer, {
    cacheControl: "3600",
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`头像上传失败：${error.message}`);
  }

  const { data } = getDb().storage.from(AVATAR_BUCKET).getPublicUrl(input.objectPath);
  return data.publicUrl;
}
