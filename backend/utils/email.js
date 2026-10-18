const emailApiUrl = () => process.env.EMAIL_API_URL || 'https://api.resend.com/emails';

export const isEmailDeliveryConfigured = () => Boolean(
  process.env.EMAIL_API_KEY && process.env.EMAIL_FROM
);

export const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  if (!isEmailDeliveryConfigured()) {
    throw new Error('Password reset email delivery is not configured');
  }

  const greeting = (name || 'there').replace(/[<>"'&]/g, '');
  const response = await fetch(emailApiUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.EMAIL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [to],
      subject: 'Reset your CourseHub password',
      text: `Hi ${greeting},\n\nUse this link to reset your CourseHub password. It expires in 30 minutes.\n\n${resetUrl}\n\nIf you did not request a reset, you can ignore this email.`,
      html: `<p>Hi ${greeting},</p><p>Use the link below to reset your CourseHub password. It expires in 30 minutes.</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request a reset, you can ignore this email.</p>`,
    }),
  });

  if (!response.ok) {
    throw new Error(`Email provider returned status ${response.status}`);
  }
};
