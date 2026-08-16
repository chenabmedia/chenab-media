import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { getSiteConfig, saveSiteConfig } from '@/lib/siteConfig';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { recordAuditLog } from '@/lib/firebase/audit';

export async function GET(req: NextRequest) {
  try {
    const authRes = await verifyServerAuth(req, 'site.manage');
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized: site.manage permission required' }, { status: 403 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Firebase Admin SDK is not initialized.' }, { status: 500 });
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

    const body = await req.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid configuration payload' }, { status: 400 });
    }

    const currentConfig = await getSiteConfig();
    const updatedConfig = { ...currentConfig, ...body };

    await saveSiteConfig(updatedConfig);

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

    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error: any) {
    console.error('Failed to save site config:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
