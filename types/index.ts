export * from './auth';

export type ReleaseType = 'SINGLE' | 'EP' | 'ALBUM' | 'COMPILATION';
export type ReleaseStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'UNPUBLISHED' | 'ARCHIVED';

export interface DSPLinks {
  spotify?: string;
  appleMusic?: string;
  youtubeMusic?: string;
  youtube?: string;
  amazonMusic?: string;
  deezer?: string;
  soundcloud?: string;
  soundCloud?: string;
  tidal?: string;
  bandcamp?: string;
  other?: string;
}

export interface SocialLinks {
  spotify?: string;
  appleMusic?: string;
  instagram?: string;
  youtube?: string;
  soundcloud?: string;
  twitter?: string;
  x?: string;
  tiktok?: string;
  facebook?: string;
  threads?: string;
  snapchat?: string;
  website?: string;
  [key: string]: string | undefined;
}

export interface Track {
  id: string;
  trackNumber?: number;
  number?: number; // Alias for backward compatibility
  title: string;
  version?: string;
  duration: string;
  isrc?: string;
  explicit?: boolean;
  primaryArtistIds?: string[];
  featuredArtistIds?: string[];
  featuredArtists?: string[]; // Alias/display string array
  writers?: string[];
  producers?: string[];
  credits?: Credit[];
  audioPreviewUrl?: string;
  audioUrl?: string; // Alias
  dspLinks?: DSPLinks;
}

export interface Credit {
  role: string;
  name: string;
}

export interface StreamingLinks extends DSPLinks {}

export interface SmartLinkInfo {
  id?: string;
  slug: string;
  url?: string;
}

export interface Release {
  id: string;
  slug: string;
  catalogueNumber: string; // e.g. CHNB-001
  title: string;
  releaseType?: ReleaseType;
  type?: ReleaseType | string; // Alias for backward compatibility
  primaryArtistIds?: string[];
  featuredArtistIds?: string[];
  artistIds: string[]; // Primary + featured
  artistName: string; // Primary artist display name
  coverImage?: string;
  cover?: string; // Artwork path/URL (alias)
  backCoverImage?: string;
  description?: string;
  genre?: string;
  subgenres?: string[];
  genres?: string[]; // All genres array
  releaseDate: string;
  status: ReleaseStatus | 'OUT NOW' | 'PRE-ORDER' | 'ARCHIVE' | string; // Backward compatibility + new status
  explicit?: boolean;
  copyright?: string;
  publisher?: string;
  label?: string;
  tracks?: Track[];
  credits?: Credit[];
  dspLinks?: DSPLinks;
  streamingLinks?: StreamingLinks; // Backward compatibility
  smartLink?: SmartLinkInfo;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface SmartLink {
  id: string;
  releaseId: string;
  slug: string;
  title: string;
  artistIds: string[];
  artistName?: string;
  artwork: string;
  dspLinks: DSPLinks;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
  clickCount?: number;
}

export interface SmartLinkEvent {
  id?: string;
  smartLinkId: string;
  releaseId: string;
  platform: string;
  timestamp: string;
  referrer?: string;
  country?: string;
  device?: string;
}

export interface Artist {
  id: string;
  userId?: string;
  stageName?: string;
  name?: string; // Fallback / alias for stageName
  legalName?: string;
  email?: string;
  phone?: string;
  profileImage?: string;
  image?: string; // Fallback / alias for profileImage
  coverImage?: string;
  bio: string;
  location: string;
  genres: string[];
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ALUMNI';
  socialLinks: SocialLinks;
  streamingLinks: StreamingLinks;
  releaseIds: string[]; // Catalogue release IDs
  catalogueNumberPrefix?: string;
  featuredQuote?: string;
  slug?: string;
  joinedAt?: string;
  updatedAt?: string;
  internalNotes?: string;
}

export interface Notification {
  id: string;
  recipientUid: string;
  userId?: string; // Alias for recipientUid
  artistId?: string;
  title: string;
  message: string;
  type: 'RELEASE' | 'SYSTEM' | 'ROYALTY' | 'AGREEMENT' | 'GENERAL';
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface JournalPost {
  id: string;
  slug: string;
  title: string;
  category: 'EDITORIAL' | 'ANNOUNCEMENT' | 'INTERVIEW' | 'FIELD NOTES' | 'STUDIO LOG';
  date: string;
  author: string;
  coverUrl: string;
  shortExcerpt: string;
  content: string[];
  readTime: string;
  tags: string[];
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  department: 'General Enquiries' | 'A&R / Demo Submissions' | 'Business' | 'Press / Media';
  subject: string;
  message: string;
  createdAt: string;
}

export interface DemoSubmission {
  id: string;
  artistName: string;
  email: string;
  phone: string;
  genre: string;
  socialLinks: string;
  streamingLinks: string;
  demoTitle: string;
  message: string;
  fileName?: string;
  fileSize?: string;
  createdAt: string;
}
