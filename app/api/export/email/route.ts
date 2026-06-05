import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    // get logged-in user's email from Clerk
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const email = user.emailAddresses?.[0]?.emailAddress;
    if (!email) return NextResponse.json({ error: 'No email found on account' }, { status: 400 });

    // parse the workflow JSON the client sent
    const body = await req.json();
    const workflowJson = JSON.stringify(body.workflow, null, 2);

    // gmail SMTP via app password
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: `NextFlow <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `Your NextFlow Workflow — ${new Date().toLocaleDateString()}`,
      text: 'Your exported workflow is attached as a JSON file.',
      attachments: [
        {
          filename: 'workflow.json',
          content: workflowJson,
          contentType: 'application/json',
        },
      ],
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Email export error:', err);
    return NextResponse.json({ error: err.message || 'Failed to send email' }, { status: 500 });
  }
}
