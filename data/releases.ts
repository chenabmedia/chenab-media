import { Release } from '@/types';

export const RELEASES: Release[] = [
  {
    id: 'rel-1',
    slug: 'reflections-on-the-valley',
    catalogueNumber: 'CHNB-001',
    title: 'Reflections on the Valley',
    artistIds: ['art-1'],
    artistName: 'Kashmir Wave Collective',
    type: 'ALBUM',
    releaseDate: '2025-10-14',
    genres: ['Ambient', 'Folk Fusion', 'Drone'],
    cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    description: 'A landmark debut LP capturing high-altitude drone synthesis and century-old Kashmiri folk string resonance. Recorded across winter sessions in Srinagar and Pahalgam, Reflections on the Valley merges centuries-old Santoor and Rabab tonal resonances with modular synthesizer decay. CHNB-001 stands as the foundational sonic manifesto of CHENAB MEDIA.',
    status: 'OUT NOW',
    tracks: [
      { id: 't-101', number: 1, title: 'TEARS (Above Zoji La)', duration: '06:42' },
      { id: 't-102', number: 2, title: 'INTOXICATED', duration: '08:15', featuredArtists: ['Noor Ali'] },
      { id: 't-103', number: 3, title: '6AM IN KISHTWAR', duration: '05:30' },
      { id: 't-104', number: 4, title: 'RPRSNT', duration: '07:11' },
      { id: 't-105', number: 5, title: 'TIMELESS', duration: '09:04' },
    ],
    credits: [
      { role: 'Executive Producer', name: 'CHENAB A&R' },
      { role: 'Santoor & Rabab', name: 'Ghulam Hassan' },
      { role: 'Modular Synthesis', name: 'Kashmiri Wave Ops' },
      { role: 'Mixing & Mastering', name: 'Zabarwan Studios' },
      { role: 'Artwork Photography', name: 'Srinagar Bureau' },
    ],
    streamingLinks: {
      spotify: 'https://open.spotify.com',
      appleMusic: 'https://music.apple.com',
      youtubeMusic: 'https://music.youtube.com',
      soundcloud: 'https://soundcloud.com',
      bandcamp: 'https://bandcamp.com',
    },
  },
  {
    id: 'rel-2',
    slug: 'subterranean-frequencies',
    catalogueNumber: 'CHNB-002',
    title: 'Subterranean Frequencies',
    artistIds: ['art-2'],
    artistName: 'Zabarwan',
    type: 'EP',
    releaseDate: '2025-11-28',
    genres: ['Experimental Electronic', 'Industrial'],
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    description: 'Monolithic sub-bass structures intertwined with brutalist sound design and raw field recordings. Zabarwan explores the tactile pressure of mountain stone through analogue distortion, tape delay feedback loops, and dense sub-bass architectures.',
    status: 'OUT NOW',
    tracks: [
      { id: 't-201', number: 1, title: 'BASALT STRUCTURE', duration: '05:12' },
      { id: 't-202', number: 2, title: 'FAULTLINE STATIC', duration: '06:45' },
      { id: 't-203', number: 3, title: 'GRANITE PRESSURE', duration: '04:58' },
      { id: 't-204', number: 4, title: 'IRON ORE DECAY', duration: '07:20' },
    ],
    credits: [
      { role: 'Producer & Composer', name: 'Zabarwan' },
      { role: 'Field Recording Engineer', name: 'Jammu Bureau' },
      { role: 'Mastering Engineer', name: 'Berlin Dub Mastering' },
    ],
    streamingLinks: {
      spotify: 'https://open.spotify.com',
      appleMusic: 'https://music.apple.com',
      youtubeMusic: 'https://music.youtube.com',
      bandcamp: 'https://bandcamp.com',
    },
  },
  {
    id: 'rel-3',
    slug: 'saffron-dust-and-echoes',
    catalogueNumber: 'CHNB-003',
    title: 'Saffron Dust & Echoes',
    artistIds: ['art-3'],
    artistName: 'Noor Ali',
    type: 'ALBUM',
    releaseDate: '2026-01-16',
    genres: ['Neo-Classical', 'Minimalism'],
    cover: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1200&q=80',
    description: 'Intimate felt piano compositions adorned with rare Kashmiri Oud motifs and tape-saturated reverb. Composed by virtuosic multi-instrumentalist Noor Ali during an autumn residency in Pampore. The record investigates silence, nostalgia, and acoustic space.',
    status: 'OUT NOW',
    tracks: [
      { id: 't-301', number: 1, title: 'PAMPORE MORNING', duration: '04:18' },
      { id: 't-302', number: 2, title: 'NOCTURNE FOR A LOST COURT', duration: '06:02' },
      { id: 't-303', number: 3, title: 'THREAD OF GOLD', duration: '05:24', featuredArtists: ['Kashmir Wave Collective'] },
      { id: 't-304', number: 4, title: 'LAL DED SOLILOQUY', duration: '07:11' },
      { id: 't-305', number: 5, title: 'POSTLUDE (COLD RAIN)', duration: '03:45' },
    ],
    credits: [
      { role: 'Piano & Oud', name: 'Noor Ali' },
      { role: 'Acoustic Engineer', name: 'Pampore Residency' },
      { role: 'Analog Transfer', name: 'CHENAB Audio Archive' },
    ],
    streamingLinks: {
      spotify: 'https://open.spotify.com',
      appleMusic: 'https://music.apple.com',
      youtubeMusic: 'https://music.youtube.com',
      bandcamp: 'https://bandcamp.com',
    },
  },
  {
    id: 'rel-4',
    slug: 'dal-lake-monologues',
    catalogueNumber: 'CHNB-004',
    title: 'Dal Lake Monologues',
    artistIds: ['art-4'],
    artistName: 'Tawi Sound System',
    type: 'SINGLE',
    releaseDate: '2026-03-02',
    genres: ['Dub', 'Ambient Techno'],
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    description: 'Hypnotic sub-dub rhythms woven with hydrophone water recordings and analogue spring reverb. Two expansive extended mixes created using custom built analogue dub sirens and real hydrophone recordings taken from the depths of Dal Lake at dawn.',
    status: 'OUT NOW',
    tracks: [
      { id: 't-401', number: 1, title: 'DAL LAKE MONOLOGUE (ORIGINAL DUB)', duration: '09:12' },
      { id: 't-402', number: 2, title: 'DAL LAKE MONOLOGUE (HYDROPHONE DUB)', duration: '11:40' },
    ],
    credits: [
      { role: 'Sound System Engine', name: 'Tawi Sound System' },
      { role: 'Hydrophone Rig', name: 'Srinagar Water Patrol' },
      { role: 'Dub Cut', name: 'London Dub Lathe' },
    ],
    streamingLinks: {
      spotify: 'https://open.spotify.com',
      youtubeMusic: 'https://music.youtube.com',
      soundcloud: 'https://soundcloud.com',
      bandcamp: 'https://bandcamp.com',
    },
  },
  {
    id: 'rel-5',
    slug: 'lost-manuscripts',
    catalogueNumber: 'CHNB-005',
    title: 'Lost Manuscripts',
    artistIds: ['art-5'],
    artistName: 'Pir Panjal',
    type: 'ALBUM',
    releaseDate: '2026-05-18',
    genres: ['Alternative Hip-Hop', 'Spoken Word'],
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    description: 'Raw poetic verses over boom-bap minimalism, jazz chords, and field recordings from mountain passes. A cinematic lyric album exploring memory, identity, and mountain heritage through sparse drum breaks, rhodes chords, and Kashmiri spoken-word passages.',
    status: 'PRE-ORDER',
    tracks: [
      { id: 't-501', number: 1, title: 'PROLOGUE (PASSAGE)', duration: '02:10' },
      { id: 't-502', number: 2, title: 'UNWRITTEN CODE', duration: '03:45' },
      { id: 't-503', number: 3, title: 'SRINAGAR NIGHTS', duration: '04:12', featuredArtists: ['Pir Panjal'] },
      { id: 't-504', number: 4, title: 'INK & ALTITUDE', duration: '03:58' },
      { id: 't-505', number: 5, title: 'EPILOGUE (SNOWFALL)', duration: '02:50' },
    ],
    credits: [
      { role: 'Vocals & Lyrics', name: 'Pir Panjal' },
      { role: 'Beat Production', name: 'Baramulla Beat Unit' },
      { role: 'Executive Curator', name: 'CHENAB MEDIA' },
    ],
    streamingLinks: {
      spotify: 'https://open.spotify.com',
      appleMusic: 'https://music.apple.com',
      youtubeMusic: 'https://music.youtube.com',
    },
  },
  {
    id: 'rel-6',
    slug: 'karakoram-monolith',
    catalogueNumber: 'CHNB-006',
    title: 'Karakoram Monolith',
    artistIds: ['art-1', 'art-2', 'art-3', 'art-4', 'art-6'],
    artistName: 'Resonance Kashmir & Various Artists',
    type: 'COMPILATION',
    releaseDate: '2026-07-04',
    genres: ['Drone', 'Modern Composition', 'Avant-Garde'],
    cover: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    description: 'A curated label compilation celebrating raw acoustic resonance and electronic minimalism. Featuring unreleased compositions, collaborative live improvisation recordings, and archival field tapes from the CHENAB MEDIA core roster.',
    status: 'OUT NOW',
    tracks: [
      { id: 't-601', number: 1, title: 'HIGH GLACIER SOLITUDE', duration: '08:30', featuredArtists: ['Kashmir Wave Collective'] },
      { id: 't-602', number: 2, title: 'SLATE & THUNDER', duration: '07:15', featuredArtists: ['Zabarwan'] },
      { id: 't-603', number: 3, title: 'NOCTURNE IN C SHARP MINOR', duration: '05:40', featuredArtists: ['Noor Ali'] },
      { id: 't-604', number: 4, title: 'ECHOES FROM JAMMU FORT', duration: '10:02', featuredArtists: ['Tawi Sound System'] },
    ],
    credits: [
      { role: 'Curator', name: 'CHENAB MEDIA Editorial Board' },
      { role: 'Contributed Audio', name: 'CHENAB Collective' },
      { role: 'Mastering', name: 'CHENAB High Fidelity Lab' },
    ],
    streamingLinks: {
      spotify: 'https://open.spotify.com',
      appleMusic: 'https://music.apple.com',
      bandcamp: 'https://bandcamp.com',
      youtubeMusic: 'https://music.youtube.com',
    },
  },
];

export function getAllReleases(): Release[] {
  return RELEASES;
}

export function getReleaseBySlug(slug: string): Release | undefined {
  return RELEASES.find((release) => release.slug === slug);
}

export function getReleasesByArtistId(artistId: string): Release[] {
  return RELEASES.filter(
    (release) =>
      release.artistIds.includes(artistId) ||
      release.artistName.toLowerCase().includes(artistId.toLowerCase())
  );
}

export function searchReleases(
  query: string,
  typeFilter: string = 'ALL',
  sortOption: 'NEWEST' | 'OLDEST' | 'AZ' = 'NEWEST'
): Release[] {
  const q = query.trim().toLowerCase();

  let filtered = RELEASES.filter((release) => {
    const matchesType =
      typeFilter === 'ALL' ||
      (typeFilter === 'SINGLES' && release.type === 'SINGLE') ||
      (typeFilter === 'EPs' && release.type === 'EP') ||
      (typeFilter === 'ALBUMS' && release.type === 'ALBUM') ||
      (typeFilter === 'COMPILATIONS' && release.type === 'COMPILATION');

    if (!matchesType) return false;
    if (!q) return true;

    return (
      release.title.toLowerCase().includes(q) ||
      release.artistName.toLowerCase().includes(q) ||
      release.catalogueNumber.toLowerCase().includes(q) ||
      (release.genres && release.genres.some((g) => g.toLowerCase().includes(q))) ||
      (release.description && release.description.toLowerCase().includes(q))
    );
  });

  filtered = [...filtered].sort((a, b) => {
    if (sortOption === 'NEWEST') {
      return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
    }
    if (sortOption === 'OLDEST') {
      return new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
    }
    if (sortOption === 'AZ') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  return filtered;
}
