import React from 'react';
import { Metadata } from 'next';
import { getPublicArtistBySlug } from '@/lib/firebase/serverCatalog';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const artist = await getPublicArtistBySlug(slug);

  if (!artist) {
    return {
      title: 'Artist Profile — CHENAB MEDIA',
      description: 'Official artist roster profile on Chenab Media independent record label.',
    };
  }

  const name = artist.stageName || artist.name || 'Artist';
  const bio =
    artist.bio && artist.bio.trim().length > 0
      ? artist.bio
      : `Official digital hub, streaming links, and discography for ${name} on Chenab Media.`;
  const image =
    artist.profileImage ||
    artist.image ||
    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80';

  return {
    title: `${name} — CHENAB MEDIA`,
    description: bio,
    openGraph: {
      title: `${name} — CHENAB MEDIA`,
      description: bio,
      images: [
        {
          url: image,
          width: 800,
          height: 800,
          alt: `${name} Profile Artwork`,
        },
      ],
      url: `https://chenabmedia.in/artist/${slug}`,
      type: 'profile',
      siteName: 'CHENAB MEDIA',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} — CHENAB MEDIA`,
      description: bio,
      images: [image],
    },
    alternates: {
      canonical: `https://chenabmedia.in/artist/${slug}`,
    },
  };
}

export default function ArtistSlugLayout({ children }: LayoutProps) {
  return <>{children}</>;
}
