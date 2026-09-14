import { JournalPost } from '@/types';

export const JOURNAL_POSTS: JournalPost[] = [
  {
    id: 'post-1',
    slug: 'sonic-geography-of-pir-panjal',
    title: 'The Sonic Geography of Pir Panjal: Field Recording in High Altitude',
    category: 'FIELD NOTES',
    date: '2026-02-10',
    author: 'A&R Editorial Team',
    coverUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80',
    shortExcerpt: 'An in-depth expedition diary detailing how sub-zero wind currents and acoustic mountain passes shape CHENAB MEDIA’s sound palette.',
    readTime: '6 min read',
    tags: ['Field Recording', 'Acoustics', 'Behind The Scenes', 'Sound Architecture'],
    content: [
      'Standing at an elevation of 3,800 meters in the Pir Panjal range, sound behaves differently. The air density alters acoustic velocity, and natural stone concavities form natural resonant chambers.',
      'During our autumn field expedition with artist Zabarwan, our objective was clear: record raw wind friction against basalt cliff faces and capture hydrophone impulses from glacial streams.',
      'These high-altitude field tapes serve as the structural backbone for catalogue releases like CHNB-001 and CHNB-002. Rather than relying on synthetic white noise plugins, CHENAB artists utilize genuine atmospheric pressure captured directly from the land.',
      'Our commitment remains absolute: honouring the sonic geography of Jammu & Kashmir while expanding the boundary of international underground electronic music.',
    ],
  },
  {
    id: 'post-2',
    slug: 'noor-ali-interview-chnb-003',
    title: 'Noor Ali on Blending 14th-Century Kashmiri Poetry with Modular Synthesizers',
    category: 'INTERVIEW',
    date: '2026-01-22',
    author: 'Farooq Wani',
    coverUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?auto=format&fit=crop&w=1200&q=80',
    shortExcerpt: 'A candid dialogue with multi-instrumentalist Noor Ali following the release of Saffron Dust & Echoes (CHNB-003).',
    readTime: '8 min read',
    tags: ['Interview', 'Neo-Classical', 'Kashmiri Poetry', 'Analogue Synths'],
    content: [
      'When you listen to Noor Ali’s felt piano on CHNB-003, there is an unmistakable sense of historical weight. "I grew up listening to my grandfather recite Lal Ded and Habba Khatoon in our courtyards," Noor explains from his Pampore studio.',
      '"For me, modern modular synthesis isn’t a departure from tradition. It is simply a different pipe for air and voltage to flow through. When I run an Oud phrase through a tape delay with 15-second decay, it mirrors the acoustic memory of an ancient stone hallway."',
      'We discuss the recording process of Saffron Dust & Echoes, the choice to release on hand-numbered vinyl, and why artistic autonomy is the single most valuable currency for an artist today.',
    ],
  },
  {
    id: 'post-3',
    slug: 'building-an-independent-creative-sanctuary',
    title: 'Building an Independent Creative Sanctuary in Jammu & Kashmir',
    category: 'EDITORIAL',
    date: '2025-12-05',
    author: 'CHENAB MEDIA Founders',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    shortExcerpt: 'Why CHENAB MEDIA was founded as a self-governed artist collective and record label, prioritizing creative ownership above algorithmic trends.',
    readTime: '5 min read',
    tags: ['Manifesto', 'Independent Music', 'Label Ethos', 'Artistic Freedom'],
    content: [
      'The modern music industry is plagued by speed over substance, micro-trends, and algorithmic homogeneity. CHENAB MEDIA was established to offer an alternative: a home where music is treated as enduring art.',
      'Rooted in the rich cultural history of Jammu & Kashmir, CHENAB operates with a strict philosophy: complete artistic control for creators, transparent physical and digital publishing, and meticulous packaging for every release.',
      'We do not rush releases to meet quarterly quotas. Every catalogue number—from CHNB-001 to CHNB-100—is treated as a permanent artefact in our collective archive.',
    ],
  },
  {
    id: 'post-4',
    slug: 'art-of-physical-releases-in-streamed-epoch',
    title: 'The Art of Physical Releases in a Streamed Epoch',
    category: 'ANNOUNCEMENT',
    date: '2025-11-12',
    author: 'Production Department',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    shortExcerpt: 'Announcing our 180g vinyl lathe-cut pressings and custom cassette tape series crafted in small physical batches.',
    readTime: '4 min read',
    tags: ['Physical Releases', 'Vinyl', 'Cassette', 'Design'],
    content: [
      'While digital streaming allows global reach, physical tangible objects carry soul. At CHENAB MEDIA, every LP and EP is accompanied by a bespoke physical edition.',
      'We work with artisan vinyl pressings, heavy 350gsm matte cardboard jackets, foil-stamped catalogue numbers, and archival lyric inserts.',
      'Explore our physical store pre-orders and limited cassette releases crafted for listeners who still value the ritual of spinning a record from start to finish.',
    ],
  },
];

export function getAllJournalPosts(): JournalPost[] {
  return JOURNAL_POSTS;
}

export function getJournalPostBySlug(slug: string): JournalPost | undefined {
  return JOURNAL_POSTS.find((post) => post.slug === slug);
}
