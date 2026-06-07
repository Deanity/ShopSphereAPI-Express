import { Resend } from 'resend';
import dotenv from 'dotenv';
import { orderCreatedTemplate } from '../src/modules/emails/templates/orderCreated.js';
import { paymentSuccessTemplate } from '../src/modules/emails/templates/paymentSuccess.js';
import { orderShippedTemplate } from '../src/modules/emails/templates/orderShipped.js';
import { orderDeliveredTemplate } from '../src/modules/emails/templates/orderDelivered.js';
import { returnResolvedTemplate } from '../src/modules/emails/templates/returnResolved.js';
import { passwordResetTemplate } from '../src/modules/emails/templates/passwordReset.js';

// Load environment variables
dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);
const toEmail = 'dendradetama2@gmail.com';
const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

const sampleItems = [
  {
    name: 'Kemeja Batik Premium',
    image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=150&q=80',
    price: 250000,
    quantity: 2,
  },
];

const sampleAddress = {
  recipientName: 'Dendra Detama',
  phone: '08123456789',
  province: 'Bali',
  city: 'Denpasar',
  district: 'Denpasar Barat',
  postalCode: '80117',
  fullAddress: 'Jl. Teuku Umar No. 123',
};

async function sendTestEmails() {
  console.log('🚀 Starting test email delivery to:', toEmail);

  // 1. Order Created Template
  try {
    const html = orderCreatedTemplate(
      'Dendra Detama',
      'ORD-20260607-TEST',
      sampleItems,
      500000,
      15000,
      50000,
      465000,
      sampleAddress,
      'https://checkout.xendit.co/v2/posts/sample-invoice',
    );
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: 'Test [ShopSphere] - Pesanan Dibuat #ORD-20260607-TEST',
      html,
    });
    console.log('✓ Sent orderCreated template email');
  } catch (err) {
    console.error('✗ Failed to send orderCreated template email:', err);
  }

  // 2. Payment Success Template
  try {
    const html = paymentSuccessTemplate(
      'Dendra Detama',
      'ORD-20260607-TEST',
      sampleItems,
      500000,
      15000,
      50000,
      465000,
      sampleAddress,
      new Date(),
    );
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: 'Test [ShopSphere] - Pembayaran Berhasil #ORD-20260607-TEST',
      html,
    });
    console.log('✓ Sent paymentSuccess template email');
  } catch (err) {
    console.error('✗ Failed to send paymentSuccess template email:', err);
  }

  // 3. Order Shipped Template
  try {
    const html = orderShippedTemplate(
      'Dendra Detama',
      'ORD-20260607-TEST',
      'jne',
      'REG',
      'JNE882910283',
      '2-3',
    );
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: 'Test [ShopSphere] - Pesanan Dikirim #ORD-20260607-TEST',
      html,
    });
    console.log('✓ Sent orderShipped template email');
  } catch (err) {
    console.error('✗ Failed to send orderShipped template email:', err);
  }

  // 4. Order Delivered Template
  try {
    const html = orderDeliveredTemplate('Dendra Detama', 'ORD-20260607-TEST');
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: 'Test [ShopSphere] - Pesanan Diterima #ORD-20260607-TEST',
      html,
    });
    console.log('✓ Sent orderDelivered template email');
  } catch (err) {
    console.error('✗ Failed to send orderDelivered template email:', err);
  }

  // 5. Return Resolved Template (Approved)
  try {
    const html = returnResolvedTemplate(
      'Dendra Detama',
      'ORD-20260607-TEST',
      'approved',
      250000,
      'Barang terbukti cacat produksi. Pengembalian dana disetujui penuh.',
    );
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: 'Test [ShopSphere] - Pengembalian Barang Disetujui #ORD-20260607-TEST',
      html,
    });
    console.log('✓ Sent returnResolved (approved) template email');
  } catch (err) {
    console.error('✗ Failed to send returnResolved (approved) template email:', err);
  }

  // 6. Password Reset Template
  try {
    const html = passwordResetTemplate(
      'Dendra Detama',
      'http://localhost:5000/api/v1/auth/reset-password/sampletoken123',
    );
    await resend.emails.send({
      from: fromEmail,
      to: toEmail,
      subject: 'Test [ShopSphere] - Atur Ulang Kata Sandi',
      html,
    });
    console.log('✓ Sent passwordReset template email');
  } catch (err) {
    console.error('✗ Failed to send passwordReset template email:', err);
  }

  console.log('🎉 Done sending test emails!');
}

sendTestEmails();
