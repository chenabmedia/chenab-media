export interface SiteNavigationItem {
  id: string;
  label: string;
  href: string;
  enabled: boolean;
  order: number;
  openInNewTab?: boolean;
}

export interface SiteSectionConfig {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
}

export interface SiteConfig {
  siteName: string;
  siteDescription: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  ogImage: string;
  copyrightText: string;
  navigation: SiteNavigationItem[];
  pageVisibility: {
    releases: boolean;
    artists: boolean;
    story: boolean;
    journal: boolean;
    contact: boolean;
    demo: boolean;
  };
  homepage: {
    heroTitle: string;
    heroDescription: string;
    primaryCtaLabel: string;
    primaryCtaUrl: string;
    secondaryCtaLabel: string;
    secondaryCtaUrl: string;
    sections: SiteSectionConfig[];
  };
  textCms: Record<string, string>;
  footer: {
    description: string;
    copyright: string;
    socialLinks: {
      instagram: string;
      spotify: string;
      appleMusic: string;
      youtube: string;
      soundcloud: string;
      other: string;
    };
    portalAccess: {
      admin: { enabled: boolean; label: string };
      artist: { enabled: boolean; label: string };
    };
  };
}

export interface EmailIdentity {
  id: string;
  suffix: string;
  email: string;
  displayName: string;
  replyTo?: string;
  enabled: boolean;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  senderIdentityId: string;
  from: string;
  to: string;
  subject: string;
  status: 'SENT' | 'FAILED' | 'QUEUED';
  resendId?: string;
  error?: string;
  sentBy: string;
  createdAt: string;
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteName: "CHENAB MEDIA",
  siteDescription: "CHENAB Media is an independent label by the artist, for the artist, based in Jammu & Kashmir, India.",
  defaultSeoTitle: "CHENAB MEDIA — Independent Label from Jammu & Kashmir",
  defaultSeoDescription: "CHENAB Media is an independent label by the artist, for the artist, based in Jammu & Kashmir, India.",
  ogImage: "https://chenabmedia.in/og-image.png",
  copyrightText: "© 2026 CHENAB MEDIA. ALL RIGHTS RESERVED.",
  navigation: [
    { id: 'releases', label: 'Catalogue', href: '/releases', enabled: true, order: 1 },
    { id: 'artists', label: 'Artists', href: '/artists', enabled: true, order: 2 },
    { id: 'story', label: 'Story & Ethos', href: '/story', enabled: true, order: 3 },
    { id: 'journal', label: 'Journal', href: '/journal', enabled: true, order: 4 },
    { id: 'contact', label: 'Contact', href: '/contact', enabled: true, order: 5 },
    { id: 'demo', label: 'Submit Demo', href: '/demo', enabled: true, order: 6 },
  ],
  pageVisibility: {
    releases: true,
    artists: true,
    story: true,
    journal: true,
    contact: true,
    demo: true,
  },
  homepage: {
    heroTitle: "SONIC EXPEDITIONS FROM THE HIGH ALTITUDE",
    heroDescription: "An independent record label and multidisciplinary artist collective documenting contemporary soundscapes, ritual drone, and avant-garde composition.",
    primaryCtaLabel: "EXPLORE CATALOGUE",
    primaryCtaUrl: "/releases",
    secondaryCtaLabel: "SUBMIT DEMO",
    secondaryCtaUrl: "/demo",
    sections: [
      { id: 'releases', title: 'FEATURED CATALOGUE', enabled: true, order: 1 },
      { id: 'artists', title: 'ROSTER ARTISTS', enabled: true, order: 2 },
      { id: 'journal', title: 'LATEST DISPATCHES', enabled: true, order: 3 },
      { id: 'story', title: 'ETHOS & ARCHIVE', enabled: true, order: 4 },
    ],
  },
  textCms: {},
  footer: {
    description: "CHENAB Media is an independent label by the artist, for the artist, based in Jammu & Kashmir, India.",
    copyright: "© 2026 CHENAB MEDIA. ALL RIGHTS RESERVED.",
    socialLinks: {
      instagram: "https://instagram.com",
      spotify: "https://spotify.com",
      appleMusic: "https://music.apple.com",
      youtube: "https://youtube.com",
      soundcloud: "https://soundcloud.com",
      other: "",
    },
    portalAccess: {
      admin: { enabled: true, label: "ADMIN PORTAL" },
      artist: { enabled: true, label: "ARTIST PORTAL" },
    },
  },
};
