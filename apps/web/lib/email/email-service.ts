import { Resend } from 'resend';

// Lazy initialization to ensure env vars are loaded
let resendInstance: Resend | null = null;

function getResendClient() {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("❌ RESEND_API_KEY is not configured in environment variables. Email will not be sent.");
      throw new Error('RESEND_API_KEY is not configured in environment variables');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export interface SendPasswordResetEmailParams {
  email: string;
  resetLink: string;
  tenantName?: string;
  tenantColor?: string;
  tenantLogo?: string;
}

export async function sendPasswordResetEmail({
  email,
  resetLink,
  tenantName = 'SaaS Store',
  tenantColor = '#4F46E5',
  tenantLogo,
}: SendPasswordResetEmailParams) {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: email,
      subject: `🔐 Recuperar Contraseña - ${tenantName}`,
      html: getPasswordResetEmailTemplate(resetLink, tenantName, tenantColor, tenantLogo),
    });

    if (error) {
      console.error('❌ Error sending password reset email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('✅ Password reset email sent successfully:', data?.id);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('❌ Error in sendPasswordResetEmail:', error);
    throw error;
  }
}

function getPasswordResetEmailTemplate(
  resetLink: string,
  tenantName: string,
  tenantColor: string = '#4F46E5',
  tenantLogo?: string
): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Recuperar Contraseña - ${tenantName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 30px 40px; text-align: center; background: linear-gradient(135deg, ${tenantColor} 0%, ${tenantColor}dd 100%);">
              ${tenantLogo ? `<img src="${tenantLogo}" alt="${tenantName}" style="max-width: 150px; height: auto; margin-bottom: 16px;">` : ''}
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">${tenantName}</h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">
                Recuperar Contraseña
              </h2>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva contraseña:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${resetLink}"
                       style="display: inline-block; padding: 18px 40px; background-color: ${tenantColor}; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px ${tenantColor}40; transition: all 0.3s;">
                      🔒 Restablecer Contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
              </p>

              <p style="margin: 10px 0 0 0; padding: 12px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 4px; color: #4b5563; font-size: 12px; word-break: break-all;">
                ${resetLink}
              </p>

              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">

              <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                <strong>Nota de seguridad:</strong> Este enlace expirará en 1 hora. Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} ${tenantName}. Todos los derechos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export interface SendPaymentConfirmationParams {
  to: string;
  orderId: string;
  amount: number;
  currency: string;
  orderDetails: {
    items: any[];
    total: number;
    tenantId: string;
  };
}

export async function sendPaymentConfirmation({
  to,
  orderId,
  amount,
  currency,
}: SendPaymentConfirmationParams) {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to,
      subject: `✅ Pago Confirmado - Orden #${orderId.slice(0, 8)}`,
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h1 style="color: #10B981;">✅ Pago Confirmado</h1>
  <p>Tu pago ha sido procesado exitosamente.</p>
  <p><strong>Orden:</strong> #${orderId.slice(0, 8)}</p>
  <p><strong>Monto:</strong> ${currency} $${amount.toFixed(2)}</p>
  <p>¡Gracias por tu compra!</p>
</body>
</html>`,
    });

    if (error) throw new Error(`Failed to send email: ${error.message}`);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('❌ Error in sendPaymentConfirmation:', error);
    throw error;
  }
}

export interface SendPaymentFailedParams {
  to: string;
  orderId: string;
  reason: string;
  amount: number;
  currency: string;
}

export async function sendPaymentFailedNotification({
  to,
  orderId,
  reason,
  amount,
  currency,
}: SendPaymentFailedParams) {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to,
      subject: `❌ Pago Fallido - Orden #${orderId.slice(0, 8)}`,
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h1 style="color: #EF4444;">❌ Pago No Procesado</h1>
  <p>Tu pago no pudo ser procesado.</p>
  <p><strong>Orden:</strong> #${orderId.slice(0, 8)}</p>
  <p><strong>Monto:</strong> ${currency} ${amount.toFixed(2)}</p>
  <p><strong>Razón:</strong> ${reason}</p>
  <p>Por favor, intenta nuevamente o contacta a soporte.</p>
</body>
</html>`,
    });

    if (error) throw new Error(`Failed to send email: ${error.message}`);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('❌ Error in sendPaymentFailedNotification:', error);
    throw error;
  }
}

export interface SendDisputeNotificationParams {
  to: string;
  orderId: string;
  disputeId: string;
  amount: number;
  currency: string;
  reason: string;
  status: string;
}

export async function sendDisputeNotification({
  to,
  orderId,
  disputeId,
  amount,
  currency,
  reason,
  status,
}: SendDisputeNotificationParams) {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to,
      subject: `⚠️ Disputa de Pago - Orden #${orderId.slice(0, 8)}`,
      html: `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h1 style="color: #F59E0B;">⚠️ Disputa de Pago</h1>
  <p>Se ha iniciado una disputa para tu pago.</p>
  <p><strong>Orden:</strong> #${orderId.slice(0, 8)}</p>
  <p><strong>Disputa:</strong> ${disputeId}</p>
  <p><strong>Monto:</strong> ${currency} ${amount.toFixed(2)}</p>
  <p><strong>Razón:</strong> ${reason}</p>
  <p><strong>Estado:</strong> ${status}</p>
  <p>Por favor, contacta a soporte para resolver esta disputa.</p>
</body>
</html>`,
    });

    if (error) throw new Error(`Failed to send email: ${error.message}`);
    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('❌ Error in sendDisputeNotification:', error);
    throw error;
  }
}
