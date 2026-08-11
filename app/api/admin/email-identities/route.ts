import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/firestore';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { recordAuditLog } from '@/lib/firebase/audit';
import { EmailIdentity } from '@/types/site';

const ALLOWED_DOMAIN = 'chenabmedia.in';

export async function GET(req: NextRequest) {
  try {
    const authRes = await verifyServerAuth(req);
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
    }

    let identities: EmailIdentity[] = [];
    if (adminDb) {
      const snapshot = await adminDb.collection('emailIdentities').get();
      identities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailIdentity));
    } else if (db) {
      const snapshot = await getDocs(collection(db, 'emailIdentities'));
      identities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmailIdentity));
    }

    if (identities.length === 0) {
      const defaultIdentities: Omit<EmailIdentity, 'id'>[] = [
        { suffix: 'hello', email: `hello@${ALLOWED_DOMAIN}`, displayName: 'Chenab Hello', enabled: true, description: 'General label greetings', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { suffix: 'demos', email: `demos@${ALLOWED_DOMAIN}`, displayName: 'Chenab Demos', enabled: true, description: 'A&R and demo submissions', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { suffix: 'support', email: `support@${ALLOWED_DOMAIN}`, displayName: 'Chenab Support', enabled: true, description: 'Artist and fan support', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { suffix: 'press', email: `press@${ALLOWED_DOMAIN}`, displayName: 'Chenab Press', enabled: true, description: 'Media and press inquiries', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ];

      for (const item of defaultIdentities) {
        if (adminDb) {
          const ref = await adminDb.collection('emailIdentities').add(item);
          identities.push({ id: ref.id, ...item });
        } else if (db) {
          const ref = await addDoc(collection(db, 'emailIdentities'), item);
          identities.push({ id: ref.id, ...item });
        }
      }
    }

    return NextResponse.json({ identities });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to fetch email identities' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authRes = await verifyServerAuth(req, 'email.identities.manage');
    if (!authRes.authenticated || !authRes.profile) {
      return NextResponse.json({ error: authRes.error || 'Unauthorized: email.identities.manage permission required' }, { status: 403 });
    }

    const body = await req.json();
    const { suffix, displayName, replyTo, description, enabled } = body;

    if (!suffix) {
      return NextResponse.json({ error: 'Suffix is required' }, { status: 400 });
    }

    const cleanSuffix = suffix.trim().toLowerCase().replace(/[^a-z0-9\-]/g, '');
    if (!cleanSuffix || cleanSuffix !== suffix.trim().toLowerCase()) {
      return NextResponse.json({ error: 'Invalid suffix. Only letters, numbers, and hyphens are permitted.' }, { status: 400 });
    }

    const email = `${cleanSuffix}@${ALLOWED_DOMAIN}`;

    const now = new Date().toISOString();
    const newIdentity: Omit<EmailIdentity, 'id'> = {
      suffix: cleanSuffix,
      email,
      displayName: displayName || `Chenab ${cleanSuffix}`,
      replyTo: replyTo || email,
      enabled: enabled !== undefined ? enabled : true,
      description: description || '',
      createdAt: now,
      updatedAt: now,
    };

    let newId = '';
    if (adminDb) {
      const ref = await adminDb.collection('emailIdentities').add(newIdentity);
      newId = ref.id;
    } else if (db) {
      const ref = await addDoc(collection(db, 'emailIdentities'), newIdentity);
      newId = ref.id;
    }

    await recordAuditLog({
      actorUid: authRes.profile.uid,
      actorName: authRes.profile.displayName || authRes.profile.email.split('@')[0],
      actorEmail: authRes.profile.email,
      action: 'EMAIL_IDENTITY_CREATED',
      targetType: 'system',
      targetId: newId,
      description: `Created email sender identity: ${email}`,
      metadata: { email, suffix: cleanSuffix },
    });

    return NextResponse.json({ success: true, identity: { id: newId, ...newIdentity } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create email identity' }, { status: 500 });
  }
}
