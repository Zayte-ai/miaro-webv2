import nodemailer from 'nodemailer';

// Vérifier si SMTP est configuré
const SMTP_CONFIGURED = Boolean(
  process.env.SMTP_HOST && 
  process.env.SMTP_USER && 
  process.env.SMTP_PASSWORD
);

const transporter = SMTP_CONFIGURED ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
}) : null;

/**
 * Envoie un email de contact depuis le formulaire
 * Destination: jakob.legris17@gmail.com
 */
export async function sendContactEmail({
  firstName,
  lastName,
  email,
  subject,
  message,
}: {
  firstName: string;
  lastName: string;
  email: string;
  subject: string;
  message: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!SMTP_CONFIGURED || !transporter) {
    console.error('SMTP not configured. Email not sent.');
    return { 
      success: false, 
      error: 'Email service not configured' 
    };
  }

  try {
    const fullName = `${firstName} ${lastName}`;
    const recipientEmail = 'jakob.legris17@gmail.com';

    // Créer le contenu HTML de l'email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
              color: white;
              padding: 30px;
              border-radius: 8px 8px 0 0;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 24px;
              font-weight: 600;
            }
            .content {
              background: #fff;
              padding: 30px;
              border: 1px solid #e5e7eb;
              border-top: none;
            }
            .field {
              margin-bottom: 20px;
            }
            .field-label {
              font-weight: 600;
              color: #374151;
              margin-bottom: 5px;
              display: block;
            }
            .field-value {
              color: #1f2937;
              padding: 12px;
              background: #f9fafb;
              border-radius: 6px;
              border-left: 3px solid #1f2937;
            }
            .message-box {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 15px;
              white-space: pre-wrap;
              line-height: 1.6;
            }
            .footer {
              background: #f9fafb;
              padding: 20px;
              text-align: center;
              border-radius: 0 0 8px 8px;
              border: 1px solid #e5e7eb;
              border-top: none;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>✉️ Nouveau Message - MaisonMiaro</h1>
          </div>
          <div class="content">
            <div class="field">
              <span class="field-label">Sujet:</span>
              <div class="field-value">${subject}</div>
            </div>
            
            <div class="field">
              <span class="field-label">Nom complet:</span>
              <div class="field-value">${fullName}</div>
            </div>
            
            <div class="field">
              <span class="field-label">Email:</span>
              <div class="field-value">
                <a href="mailto:${email}" style="color: #1f2937; text-decoration: none;">${email}</a>
              </div>
            </div>
            
            <div class="field">
              <span class="field-label">Message:</span>
              <div class="message-box">${message}</div>
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0;">Ce message a été envoyé depuis le formulaire de contact de MaisonMiaro</p>
          </div>
        </body>
      </html>
    `;

    // Créer le contenu texte brut
    const textContent = `
Nouveau Message - MaisonMiaro
==============================

Sujet: ${subject}

Nom: ${fullName}
Email: ${email}

Message:
${message}

---
Ce message a été envoyé depuis le formulaire de contact de MaisonMiaro
    `;

    // Envoyer l'email
    const info = await transporter.sendMail({
      from: `"MaisonMiaro Contact" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      replyTo: email,
      subject: `[MaisonMiaro] ${subject} - Message de ${fullName}`,
      text: textContent,
      html: htmlContent,
    });

    console.log('Contact email sent successfully:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Failed to send contact email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// TODO: Uncomment this function once OrderConfirmationEmail component is created
/*
export async function sendOrderConfirmationEmail(props: React.ComponentProps<typeof OrderConfirmationEmail>) {
  try {
    const html = render(OrderConfirmationEmail(props));

    const info = await transporter.sendMail({
      from: `"Maison Miaro" <${process.env.SMTP_USER}>`,
      to: props.customerEmail,
      subject: `Order Confirmation - #${props.orderNumber}`,
      html,
    });

    console.log('Order confirmation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return false;
  }
}
*/

// Temporary placeholder function until OrderConfirmationEmail component is created
export async function sendOrderConfirmationEmail(orderData: {
  customerEmail: string;
  orderNumber: string;
  [key: string]: any;
}) {
  try {
    if (!transporter) {
      throw new Error('Email transporter is not configured');
    }
    
    // Simple plain text email for now
    const info = await transporter.sendMail({
      from: `"Maison Miaro" <${process.env.SMTP_USER}>`,
      to: orderData.customerEmail,
      subject: `Order Confirmation - #${orderData.orderNumber}`,
      text: `Thank you for your order! Your order number is ${orderData.orderNumber}.`,
      html: `<p>Thank you for your order! Your order number is <strong>${orderData.orderNumber}</strong>.</p>`,
    });

    console.log('Order confirmation email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    return false;
  }
}
