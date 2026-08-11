import { NextRequest, NextResponse } from 'next/server';
import { verifyServerAuth } from '@/lib/auth/serverAuth';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { recordAuditLog } from '@/lib/firebase/audit';
import { CreateAdminInput } from '@/types/admin';
import { UserProfile } from '@/types/auth';

export async function GET(req: NextRequest) {
  const authRes = await verifyServerAuth(req, 'admins.view');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    let usersList: UserProfile[] = [];

    if (adminDb) {
      const snap = await adminDb.collection('users').get();
      snap.forEach((doc) => {
        usersList.push(doc.data() as UserProfile);
      });
    } else {
      // Fallback
      return NextResponse.json({ users: [] }, { status: 200 });
    }

    return NextResponse.json({ users: usersList }, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching admin users:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authRes = await verifyServerAuth(req, 'admins.create');
  if (!authRes.authenticated || !authRes.profile) {
    return NextResponse.json({ error: authRes.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: CreateAdminInput & { password?: string } = await req.json();
    const { displayName, email, role, status, permissions, password } = body;

    if (!email || !displayName || !role) {
      return NextResponse.json({ error: 'Missing required parameters (displayName, email, role)' }, { status: 400 });
    }

    if (role !== 'admin' && role !== 'executive') {
      return NextResponse.json(
        { error: 'Invalid role specified. Only "admin" or "executive" accounts can be provisioned through this endpoint.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check for duplicate email in Firestore
    if (adminDb) {
      const existingDocSnap = await adminDb.collection('users').where('email', '==', normalizedEmail).get();
      if (!existingDocSnap.empty) {
        return NextResponse.json(
          { error: `An administrative account with email ${normalizedEmail} already exists.` },
          { status: 400 }
        );
      }
    }
    let newUid = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // If Admin SDK is available, create Firebase Auth user
    if (adminAuth) {
      try {
        const existingAuthUser = await adminAuth.getUserByEmail(normalizedEmail);
        newUid = existingAuthUser.uid;
        // Update auth user displayName if changed
        await adminAuth.updateUser(newUid, {
          displayName,
          disabled: status === 'DISABLED' || status === 'SUSPENDED',
        });
      } catch (authErr: any) {
        if (authErr.code === 'auth/user-not-found') {
          const createdAuth = await adminAuth.createUser({
            email: normalizedEmail,
            emailVerified: true,
            password: password || 'ChenabAdmin2026!',
            displayName,
            disabled: status === 'DISABLED' || status === 'SUSPENDED',
          });
          newUid = createdAuth.uid;
        } else {
          throw authErr;
        }
      }
    }

    const now = new Date().toISOString();
    const newProfile: UserProfile = {
      uid: newUid,
      email: normalizedEmail,
      displayName,
      photoURL: null,
      role,
      status: status || 'ACTIVE',
      permissions: permissions || [],
      createdAt: now,
      updatedAt: now,
      createdBy: authRes.profile.uid,
    };

    if (adminDb) {
      await adminDb.collection('users').doc(newUid).set(newProfile, { merge: true });
    }

    // Record in Audit Log
    await recordAuditLog(
      { uid: authRes.profile.uid, name: authRes.profile.displayName || undefined, email: authRes.profile.email },
      'ADMIN_CREATED',
      'user',
      newUid,
      `Provisioned ${role.toUpperCase()} account for ${displayName} (${normalizedEmail}) with status ${status || 'ACTIVE'}.`,
      { role, permissions, status }
    );

    return NextResponse.json({ user: newProfile, success: true }, { status: 201 });
  } catch (err: any) {
    console.error('Error creating admin user:', err);
    return NextResponse.json({ error: err.message || 'Failed to create admin user' }, { status: 500 });
  }
}
