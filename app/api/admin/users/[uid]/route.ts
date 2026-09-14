import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/firebase/audit';
import { UpdateAdminInput } from '@/types/admin';
import { UserProfile } from '@/types/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  const authRes = await verifyServerAuth(req, 'admins.view');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    if (adminDb) {
      const docSnap = await adminDb.collection('users').doc(uid).get();
      if (!docSnap.exists) {
        return NextResponse.json({ error: 'User profile record not found' }, { status: 404 });
      }
      return NextResponse.json({ user: docSnap.data() as UserProfile }, { status: 200 });
    }
    return NextResponse.json({ error: 'Firestore Admin unavailable' }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error retrieving user profile' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  const authRes = await verifyServerAuth(req, 'admins.edit');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: UpdateAdminInput = await req.json();
    const { displayName, email, role, status, permissions } = body;

    if (!displayName || !email || !role) {
      return NextResponse.json({ error: 'Missing required update parameters' }, { status: 400 });
    }

    if (role as string === 'artist') {
      return NextResponse.json(
        { error: 'Cannot downgrade or reassign an admin account to an artist through this panel.' },
        { status: 400 }
      );
    }

    // Fetch existing target profile
    let existingProfile: UserProfile | null = null;
    if (adminDb) {
      const snap = await adminDb.collection('users').doc(uid).get();
      if (snap.exists) {
        existingProfile = snap.data() as UserProfile;
      }
    }

    if (!existingProfile) {
      return NextResponse.json({ error: 'Target user record not found' }, { status: 404 });
    }

    const SUPER_ADMIN_EMAIL = 'zaazze@chenabmedia.in';
    const isTargetSuperAdmin = existingProfile.email.toLowerCase() === SUPER_ADMIN_EMAIL;

    if (isTargetSuperAdmin) {
      if (role !== 'admin') {
        return NextResponse.json(
          { error: 'The super admin account role cannot be changed away from admin.' },
          { status: 400 }
        );
      }
      if (status === 'DISABLED' || status === 'SUSPENDED') {
        return NextResponse.json(
          { error: 'The super admin account (zaazze@chenabmedia.in) cannot be disabled or suspended.' },
          { status: 400 }
        );
      }
      if (email.toLowerCase().trim() !== SUPER_ADMIN_EMAIL) {
        return NextResponse.json(
          { error: 'The super admin account email address cannot be modified.' },
          { status: 400 }
        );
      }
    }

    // Security Check: Self Escalation Protection
    if (authRes.profile.uid === uid && authRes.profile.role !== 'admin' && role === 'admin') {
      return NextResponse.json({ error: 'Self-permission escalation is forbidden.' }, { status: 403 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailChanged = existingProfile.email.toLowerCase() !== normalizedEmail;
    const statusChanged = existingProfile.status !== status;
    const roleChanged = existingProfile.role !== role;
    const permissionsChanged = JSON.stringify(existingProfile.permissions || []) !== JSON.stringify(permissions || []);

    // Update Firebase Auth if available
    if (adminAuth) {
      try {
        const updateAuthPayload: { email?: string; displayName?: string; disabled?: boolean } = {
          displayName,
          disabled: status === 'DISABLED' || status === 'SUSPENDED',
        };

        if (emailChanged) {
          updateAuthPayload.email = normalizedEmail;
        }

        await adminAuth.updateUser(uid, updateAuthPayload);
      } catch (authErr: any) {
        console.error('Failed to sync Auth user update:', authErr);
        return NextResponse.json(
          { error: `Failed to update Firebase Authentication credentials: ${authErr.message}` },
          { status: 500 }
        );
      }
    }

    const now = new Date().toISOString();
    const updatedProfile: UserProfile = {
      ...existingProfile,
      displayName,
      email: normalizedEmail,
      role,
      status,
      permissions,
      updatedAt: now,
    };

    if (adminDb) {
      await adminDb.collection('users').doc(uid).set(updatedProfile, { merge: true });
    }

    // Determine audit action type
    let auditAction: any = 'ADMIN_UPDATED';
    if (statusChanged && status === 'DISABLED') auditAction = 'ADMIN_DISABLED';
    else if (statusChanged && status === 'ACTIVE') auditAction = 'ADMIN_REACTIVATED';
    else if (roleChanged) auditAction = 'ROLE_CHANGED';
    else if (permissionsChanged) auditAction = 'PERMISSIONS_CHANGED';

    await recordAuditLog(
      { uid: authRes.profile.uid, name: authRes.profile.displayName || undefined, email: authRes.profile.email },
      auditAction,
      'user',
      uid,
      `Updated user profile ${displayName} (${normalizedEmail}): Role [${role}], Status [${status}]`,
      { role, status, permissions, emailChanged, roleChanged, statusChanged }
    );

    return NextResponse.json({ user: updatedProfile, success: true }, { status: 200 });
  } catch (err: any) {
    console.error('Error updating admin user:', err);
    return NextResponse.json({ error: err.message || 'Failed to update admin user' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  const authRes = await verifyServerAuth(req, 'admins.disable');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    if (authRes.profile.uid === uid) {
      return NextResponse.json({ error: 'You cannot disable or revoke your own active admin account.' }, { status: 400 });
    }

    if (adminDb) {
      const snap = await adminDb.collection('users').doc(uid).get();
      if (snap.exists) {
        const targetEmail = (snap.data() as UserProfile).email.toLowerCase();
        if (targetEmail === 'zaazze@chenabmedia.in') {
          return NextResponse.json(
            { error: 'The super admin account (zaazze@chenabmedia.in) is protected and cannot be deleted or disabled.' },
            { status: 400 }
          );
        }
      }
    }

    if (adminAuth) {
      await adminAuth.updateUser(uid, { disabled: true });
    }

    const now = new Date().toISOString();
    if (adminDb) {
      await adminDb.collection('users').doc(uid).update({
        status: 'DISABLED',
        updatedAt: now,
      });
    }

    await recordAuditLog(
      { uid: authRes.profile.uid, name: authRes.profile.displayName || undefined, email: authRes.profile.email },
      'ADMIN_DISABLED',
      'user',
      uid,
      `Disabled administrative access for account UID: ${uid}`,
      { status: 'DISABLED' }
    );

    return NextResponse.json({ success: true, message: 'Admin account disabled successfully.' }, { status: 200 });
  } catch (err: any) {
    console.error('Error disabling admin user:', err);
    return NextResponse.json({ error: err.message || 'Failed to disable admin user' }, { status: 500 });
  }
}
