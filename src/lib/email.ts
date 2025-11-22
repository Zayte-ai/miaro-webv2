import nodemailer from 'nodemailer';
import { render } from '@react-email/render';
// TODO: Create OrderConfirmationEmail component at @/components/email/OrderConfirmationEmail
// import OrderConfirmationEmail from '@/components/email/OrderConfirmationEmail';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

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
