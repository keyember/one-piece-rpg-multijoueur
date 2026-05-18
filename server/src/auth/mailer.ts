import nodemailer from 'nodemailer';

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
  });
}

export async function sendVerificationEmail(
  to: string,
  token: string
): Promise<void> {
  const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN!;
  const link = `${CLIENT_ORIGIN}/verify-email?token=${token}`;

  await createTransporter().sendMail({
    from: `"Grand Line Online" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Vérification de ton adresse email — Grand Line Online',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>🏴‍☠️ Bienvenue sur Grand Line Online !</h2>
        <p>Clique sur le lien ci-dessous pour vérifier ton adresse email.
        Le lien expire dans <strong>24 heures</strong>.</p>
        <a href="${link}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold">
          Vérifier mon email
        </a>
        <p style="margin-top:16px;color:#888;font-size:12px">
          Si tu n'as pas créé de compte, ignore cet email.
        </p>
      </div>
    `,
  });
}
