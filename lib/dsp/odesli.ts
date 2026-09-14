import { DSPLinks } from '@/types';

export interface MatchedStore {
  key: keyof DSPLinks;
  name: string;
  url: string;
}

export interface OdesliDetectionResult {
  success: boolean;
  scanSource: string;
  detectedLinks: DSPLinks;
  matchedStores: MatchedStore[];
  pageUrl?: string;
  title?: string;
  artistName?: string;
  error?: string;
}

const PLATFORM_NAME_MAP: Record<string, { key: keyof DSPLinks; name: string }> = {
  spotify: { key: 'spotify', name: 'Spotify' },
  appleMusic: { key: 'appleMusic', name: 'Apple Music' },
  itunes: { key: 'appleMusic', name: 'Apple Music / iTunes' },
  youtubeMusic: { key: 'youtubeMusic', name: 'YouTube Music' },
  youtube: { key: 'youtube', name: 'YouTube' },
  amazonMusic: { key: 'amazonMusic', name: 'Amazon Music' },
  amazonStore: { key: 'amazonMusic', name: 'Amazon' },
  deezer: { key: 'deezer', name: 'Deezer' },
  tidal: { key: 'tidal', name: 'TIDAL' },
  soundcloud: { key: 'soundcloud', name: 'SoundCloud' },
  bandcamp: { key: 'bandcamp', name: 'Bandcamp' },
  audiomack: { key: 'other', name: 'Audiomack' },
  anghami: { key: 'other', name: 'Anghami' },
  pandora: { key: 'other', name: 'Pandora' },
  napster: { key: 'other', name: 'Napster' },
  audius: { key: 'other', name: 'Audius' },
  boomplay: { key: 'other', name: 'Boomplay' },
};

function isValidHttpUrl(string: string): boolean {
  try {
    const url = new URL(string.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Resolves a seed streaming link via Odesli / Songlink into cross-DSP URLs.
 * Enforces a 10-second timeout and handles rate-limits and fallback resolution.
 */
export async function detectOdesliLinks(seedUrl: string): Promise<OdesliDetectionResult> {
  const trimmed = (seedUrl || '').trim();

  if (!trimmed) {
    return {
      success: false,
      scanSource: trimmed,
      detectedLinks: {},
      matchedStores: [],
      error: 'Enter a valid Spotify, Apple Music, YouTube, or other supported DSP URL.',
    };
  }

  // Reject naked ISRC / UPC values
  const isrcPattern = /^[A-Z]{2}-?[A-Z0-9]{3}-?[0-9]{2}-?[0-9]{5}$/i;
  const upcPattern = /^[0-9]{10,14}$/;
  if (isrcPattern.test(trimmed) || upcPattern.test(trimmed) || !isValidHttpUrl(trimmed)) {
    return {
      success: false,
      scanSource: trimmed,
      detectedLinks: {},
      matchedStores: [],
      error:
        'Enter a valid Spotify, Apple Music, YouTube, or other supported DSP URL. Direct ISRC/UPC lookups require a seed streaming link.',
    };
  }

  const detectedLinks: DSPLinks = {};
  const matchedStoresMap = new Map<keyof DSPLinks, MatchedStore>();
  let pageUrl: string | undefined;
  let title: string | undefined;
  let artistName: string | undefined;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    // 1. Attempt official API endpoint
    const apiKey = process.env.ODESLI_API_KEY;
    const apiUrl = `https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(trimmed)}&userCountry=IN${
      apiKey ? `&key=${encodeURIComponent(apiKey)}` : ''
    }`;

    let parsedSuccessfully = false;

    try {
      const apiRes = await fetch(apiUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ChenabMedia-DSP-Resolver/1.0',
        },
        signal: controller.signal,
      });

      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data && (data.linksByPlatform || data.pageUrl)) {
          pageUrl = data.pageUrl;
          if (data.entitiesByUniqueId && data.entityUniqueId) {
            const entity = data.entitiesByUniqueId[data.entityUniqueId];
            title = entity?.title;
            artistName = entity?.artistName;
          }

          if (data.linksByPlatform) {
            for (const [platform, linkObj] of Object.entries<any>(data.linksByPlatform)) {
              const url = linkObj?.url;
              if (url && typeof url === 'string') {
                const mapping = PLATFORM_NAME_MAP[platform] || {
                  key: 'other' as keyof DSPLinks,
                  name: platform,
                };
                if (!detectedLinks[mapping.key]) {
                  detectedLinks[mapping.key] = url;
                  matchedStoresMap.set(mapping.key, {
                    key: mapping.key,
                    name: mapping.name,
                    url,
                  });
                }
              }
            }
            parsedSuccessfully = true;
          }
        }
      } else if (apiRes.status === 429) {
        clearTimeout(timeoutId);
        return {
          success: false,
          scanSource: trimmed,
          detectedLinks: {},
          matchedStores: [],
          error: 'Detection rate limit reached. Please try again shortly.',
        };
      }
    } catch {
      // Continue to fallback resolver if primary API endpoint was unreachable
    }

    // 2. Fallback: Parse Songlink web page data if official API response was empty or deprecated
    if (!parsedSuccessfully) {
      const webUrl = `https://song.link/${trimmed}`;
      const webRes = await fetch(webUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
      });

      if (webRes.status === 429) {
        clearTimeout(timeoutId);
        return {
          success: false,
          scanSource: trimmed,
          detectedLinks: {},
          matchedStores: [],
          error: 'Detection rate limit reached. Please try again shortly.',
        };
      }

      if (!webRes.ok) {
        clearTimeout(timeoutId);
        return {
          success: false,
          scanSource: trimmed,
          detectedLinks: {},
          matchedStores: [],
          error: 'No matching streaming platforms were found for this URL.',
        };
      }

      const html = await webRes.text();
      const nextDataMatch = html.match(
        /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
      );

      if (nextDataMatch && nextDataMatch[1]) {
        try {
          const nextData = JSON.parse(nextDataMatch[1]);
          const pageData = nextData?.props?.pageProps?.pageData;

          if (pageData) {
            pageUrl = pageData.pageUrl;
            title = pageData.entityData?.title;
            artistName = pageData.entityData?.artistName;

            const sections = pageData.sections || [];
            for (const section of sections) {
              if (section?.links && Array.isArray(section.links)) {
                for (const linkItem of section.links) {
                  const platform = linkItem.platform;
                  const url = linkItem.url;
                  const displayName = linkItem.displayName;

                  if (platform && url && typeof url === 'string') {
                    const mapping = PLATFORM_NAME_MAP[platform] || {
                      key: 'other' as keyof DSPLinks,
                      name: displayName || platform,
                    };

                    if (!detectedLinks[mapping.key]) {
                      detectedLinks[mapping.key] = url;
                      matchedStoresMap.set(mapping.key, {
                        key: mapping.key,
                        name: displayName || mapping.name,
                        url,
                      });
                    }
                  }
                }
              }
            }
          }
        } catch {
          // Parsing failure handled below
        }
      }
    }

    clearTimeout(timeoutId);

    const matchedStores = Array.from(matchedStoresMap.values());

    if (matchedStores.length === 0) {
      return {
        success: false,
        scanSource: trimmed,
        detectedLinks: {},
        matchedStores: [],
        error: 'No matching streaming platforms were found.',
      };
    }

    return {
      success: true,
      scanSource: trimmed,
      detectedLinks,
      matchedStores,
      pageUrl,
      title,
      artistName,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);

    if (err?.name === 'AbortError') {
      return {
        success: false,
        scanSource: trimmed,
        detectedLinks: {},
        matchedStores: [],
        error: 'Streaming link detection timed out. Please try again.',
      };
    }

    return {
      success: false,
      scanSource: trimmed,
      detectedLinks: {},
      matchedStores: [],
      error: 'Streaming link detection is temporarily unavailable.',
    };
  }
}
