export interface DSPDiscoveryProvider {
  name: string;
  isConfigured: boolean;
  discoverLinks(query: { isrc?: string; title: string; artistName?: string }): Promise<{
    spotify?: string;
    appleMusic?: string;
    youtubeMusic?: string;
    amazonMusic?: string;
    deezer?: string;
    soundcloud?: string;
    tidal?: string;
    other?: string;
    message?: string;
  }>;
}

export class DefaultDSPDiscoveryProvider implements DSPDiscoveryProvider {
  name = 'CHENAB Automated DSP Discovery Engine';
  isConfigured = false; // Set to true when API credentials (e.g. Spotify Web API, Odesli/Songlink, Apple Music API) are attached

  async discoverLinks(query: { isrc?: string; title: string; artistName?: string }) {
    if (!this.isConfigured) {
      return {
        message: 'Automatic DSP discovery is not configured.',
      };
    }

    // Provider implementation placeholder for legit APIs when configured
    return {
      message: 'Automatic DSP discovery processed.',
    };
  }
}

export const dspDiscoveryService = new DefaultDSPDiscoveryProvider();
