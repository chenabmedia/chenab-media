import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { db } from '@/lib/firebase/firestore';
import { collection, addDoc } from 'firebase/firestore';
import { sendTemplateEmail } from '@/lib/email/service';
import { recordAuditLog } from '@/lib/firebase/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, department, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, subject, message are mandatory.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Invalid email address format.' }, { status: 400 });
    }

    const ticketId = `TICK-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    const messageData = {
      id: ticketId,
      name,
      email: normalizedEmail,
      department: department || 'General Enquiries',
      subject,
      message,
      status: 'UNREAD',
      createdAt: now,
    };

    if (adminDb) {
      await adminDb.collection('messages').doc(ticketId).set(messageData);
    } else if (db) {
      await addDoc(collection(db, 'messages'), messageData);
    }

    // Trigger confirmation email using Resend template: ContactConfirmation
    const emailResult = await sendTemplateEmail({
      templateKey: 'CONTACT_CONFIRMATION',
      to: normalizedEmail,
      from: 'CHENAB MEDIA Correspondence <contact@chenabmedia.in>',
      subject: `Enquiry Received (${ticketId}) - ${subject}`,
      variables: {
        contactName: name,
        ticketId,
        subject,
        submittedAt: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        expectedResponse: '24-48 business hours',
        website: 'https://chenabmedia.in',
        supportEmail: 'contact@chenabmedia.in',
        supportPhone: '+1 (800) 555-CHENAB',
        companyName: 'Chenab Media',
      },
      eventType: 'PUBLIC_CONTACT_SUBMISSION',
      relatedId: ticketId,
    });

    await recordAuditLog({
      actorUid: 'anonymous_user',
      actorName: name,
      actorEmail: normalizedEmail,
      action: 'CONTACT_SUBMITTED',
      targetType: 'message',
      targetId: ticketId,
      description: `Public contact enquiry submitted by ${name} (${normalizedEmail}) for ${department || 'General'}`,
      metadata: { ticketId, department, subject },
    });

    return NextResponse.json(
      {
        success: true,
        ticketId,
        emailDispatched: emailResult.success,
        resendId: emailResult.resendId,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error('Error in POST /api/contact:', err);
    return NextResponse.json({ error: err.message || 'Failed to submit contact enquiry' }, { status: 500 });
  }
}
