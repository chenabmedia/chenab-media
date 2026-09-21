import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { getSiteConfig, saveSiteConfig } from '@/lib/siteConfig';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { recordAuditLog } from '@/lib/firebase/audit';
import { SiteConfig } from '@/types/site';

export async function GET(req: NextRequest) {
  try {
    const authRes = await verifyServerAuth(req, 'site.manage');
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized: site.manage permission required' }, { status: 403 });
    }

    const db = getAdminDb();
    if (!db) {
      console.warn('[GET /api/admin/site Diagnostics]', {
        route: '/api/admin/site',
        method: 'GET',
        projectId: 'chenabmedia-in',
        databaseId: '(default)',
        adminInitialized: false,
        authVerified: true,
      });
      return NextResponse.json({ error: 'Firebase Admin SDK is not initialized.' }, { status: 503 });
    }

    const config = await getSiteConfig();
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch site config' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authRes = await verifyServerAuth(req, 'site.manage');
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized: site.manage permission required' }, { status: 403 });
    }

    const db = getAdminDb();
    console.log('[POST /api/admin/site Diagnostics]', {
      route: '/api/admin/site',
      method: 'POST',
      projectId: 'chenabmedia-in',
      databaseId: '(default)',
      adminInitialized: Boolean(db),
      authVerified: true,
      adminDbExists: Boolean(db),
    });

    if (!db) {
      return NextResponse.json({ error: 'Firebase Admin SDK is not initialized.' }, { status: 503 });
    }

    const body = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid configuration payload' }, { status: 400 });
    }

    const currentConfig = await getSiteConfig();

    // Explicit allowlist mapping to prevent arbitrary mass-assignment
    const sanitizedConfig: SiteConfig = {
      siteName: typeof body.siteName === 'string' ? body.siteName.trim() : currentConfig.siteName,
      siteDescription: typeof body.siteDescription === 'string' ? body.siteDescription.trim() : currentConfig.siteDescription,
      defaultSeoTitle: typeof body.defaultSeoTitle === 'string' ? body.defaultSeoTitle.trim() : currentConfig.defaultSeoTitle,
      defaultSeoDescription: typeof body.defaultSeoDescription === 'string' ? body.defaultSeoDescription.trim() : currentConfig.defaultSeoDescription,
      ogImage: typeof body.ogImage === 'string' ? body.ogImage.trim() : currentConfig.ogImage,
      copyrightText: typeof body.copyrightText === 'string' ? body.copyrightText.trim() : currentConfig.copyrightText,
      navigation: Array.isArray(body.navigation)
        ? body.navigation.map((item: any) => ({
            id: String(item.id || ''),
            label: String(item.label || ''),
            href: String(item.href || ''),
            enabled: Boolean(item.enabled),
            order: Number(item.order || 0),
            openInNewTab: Boolean(item.openInNewTab),
          }))
        : currentConfig.navigation,
      pageVisibility: body.pageVisibility && typeof body.pageVisibility === 'object'
        ? {
            releases: Boolean(body.pageVisibility.releases),
            artists: Boolean(body.pageVisibility.artists),
            story: Boolean(body.pageVisibility.story),
            journal: Boolean(body.pageVisibility.journal),
            contact: Boolean(body.pageVisibility.contact),
            demo: Boolean(body.pageVisibility.demo),
          }
        : currentConfig.pageVisibility,
      homepage: body.homepage && typeof body.homepage === 'object'
        ? {
            heroTitle: String(body.homepage.heroTitle || currentConfig.homepage?.heroTitle || ''),
            heroDescription: String(body.homepage.heroDescription || currentConfig.homepage?.heroDescription || ''),
            primaryCtaLabel: String(body.homepage.primaryCtaLabel || currentConfig.homepage?.primaryCtaLabel || ''),
            primaryCtaUrl: String(body.homepage.primaryCtaUrl || currentConfig.homepage?.primaryCtaUrl || ''),
            secondaryCtaLabel: String(body.homepage.secondaryCtaLabel || currentConfig.homepage?.secondaryCtaLabel || ''),
            secondaryCtaUrl: String(body.homepage.secondaryCtaUrl || currentConfig.homepage?.secondaryCtaUrl || ''),
            sections: Array.isArray(body.homepage.sections)
              ? body.homepage.sections.map((s: any) => ({
                  id: String(s.id || ''),
                  title: String(s.title || ''),
                  enabled: Boolean(s.enabled),
                  order: Number(s.order || 0),
                }))
              : currentConfig.homepage?.sections || [],
          }
        : currentConfig.homepage,
      textCms: body.textCms && typeof body.textCms === 'object' && !Array.isArray(body.textCms)
        ? Object.fromEntries(
            Object.entries(body.textCms).map(([k, v]) => [String(k), String(v || '')])
          )
        : currentConfig.textCms,
      footer: body.footer && typeof body.footer === 'object'
        ? {
            description: String(body.footer.description || currentConfig.footer?.description || ''),
            copyright: String(body.footer.copyright || currentConfig.footer?.copyright || ''),
            socialLinks: body.footer.socialLinks && typeof body.footer.socialLinks === 'object'
              ? {
                  instagram: String(body.footer.socialLinks.instagram || ''),
                  spotify: String(body.footer.socialLinks.spotify || ''),
                  appleMusic: String(body.footer.socialLinks.appleMusic || ''),
                  youtube: String(body.footer.socialLinks.youtube || ''),
                  soundcloud: String(body.footer.socialLinks.soundcloud || ''),
                  other: String(body.footer.socialLinks.other || ''),
                }
              : currentConfig.footer?.socialLinks,
            portalAccess: body.footer.portalAccess && typeof body.footer.portalAccess === 'object'
              ? {
                  admin: {
                    enabled: Boolean(body.footer.portalAccess.admin?.enabled),
                    label: String(body.footer.portalAccess.admin?.label || 'Admin Portal'),
                  },
                  artist: {
                    enabled: Boolean(body.footer.portalAccess.artist?.enabled),
                    label: String(body.footer.portalAccess.artist?.label || 'Artist Portal'),
                  },
                }
              : currentConfig.footer?.portalAccess,
          }
        : currentConfig.footer,
    };

    await saveSiteConfig(sanitizedConfig);

    await recordAuditLog({
      actorUid: authRes.profile.uid,
      actorName: authRes.profile.displayName || authRes.profile.email.split('@')[0],
      actorEmail: authRes.profile.email,
      action: 'SITE_CONFIG_UPDATED',
      targetType: 'system',
      targetId: 'global',
      description: `Updated global site configuration and CMS settings`,
      metadata: { updatedKeys: Object.keys(body) },
    });

    return NextResponse.json({ success: true, config: sanitizedConfig });
  } catch (error: any) {
    console.error('Failed to save site config:', error);
    return NextResponse.json({ error: 'Failed to save site configuration' }, { status: 500 });
  }
}
