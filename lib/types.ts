// ===== Core DB Types =====

export interface User {
  id: number;
  name: string | null;
  username: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  account_type: string;
  email_verified_at: string | null;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Video {
  id: number;
  origin: string | null;
  legacy_tweet_id: string | null;
  uploader_user_id: number | null;
  title: string | null;
  caption: string | null;
  description: string | null;
  storage_path: string | null;
  poster_url: string | null;
  playback_url: string | null;
  hls_url: string | null;
  duration_text: string | null;
  duration_seconds: number | null;
  width: number | null;
  height: number | null;
  visibility: string;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VideoComment {
  id: number;
  video_id: number;
  user_id: number;
  parent_id: number | null;
  reply_to_comment_id: number | null;
  body: string;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserFollow {
  follower_user_id: number;
  followed_user_id: number;
  created_at: string;
}

// ===== View Models (UI-ready) =====

export interface VideoFeedItem {
  videoId: string;
  tweetId: string;
  displayText: string;
  detailUrl: string;
  postedAtText: string;
  media: {
    posterUrl: string;
    videoUrl: string;
    hlsUrl: string;
    durationText: string;
    frameClass: string;
  };
  author: {
    userId?: number | null;
    name: string;
    imageUrl: string;
    profileUrl: string;
  };
}

export interface VideoDetail extends VideoFeedItem {
  likeCount: number;
  bookmarkCount: number;
  commentCount: number;
  viewCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  isFollowingAuthor?: boolean;
  categories: { id: number; slug: string; name: string }[];
  tags: { id: number; slug: string; name: string }[];
}

export interface CommentItem {
  id: number;
  body: string;
  createdAtText: string;
  editedAtText: string | null;
  author: {
    name: string;
    username: string;
    imageUrl: string;
    profileUrl: string;
  };
  replies?: CommentItem[];
  replyToCommentId: number | null;
  parentId: number | null;
  isOwner?: boolean;
}

export interface PublicProfile {
  userId: number;
  name: string;
  username: string;
  handle: string;
  bio: string;
  imageUrl: string;
  followerCount: number;
  followingCount: number;
  videoCount: number;
  isFollowing: boolean;
  videos: VideoFeedItem[];
}

export interface RankingItem {
  rank: number;
  userId: number;
  name: string;
  username: string;
  handle: string;
  imageUrl: string;
  profileUrl: string;
  publishedCount7d: string;
  totalVideos: string;
  unreadCount: number;
  lastPublishedAtText: string;
  isFollowing: boolean;
}

export interface ViewerProfile {
  id: number;
  name: string | null;
  username: string | null;
  email: string | null;
  bio: string | null;
  avatarUrl: string | null;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  groupId: number;
  sortOrder: number;
  videoCount: number;
  coverUrl: string | null;
}

export interface CategoryGroup {
  id: number;
  slug: string;
  name: string;
  sortOrder: number;
  items: Category[];
}

export interface Tag {
  id: number;
  slug: string;
  name: string;
  sortOrder: number;
  videoCount: number;
}
