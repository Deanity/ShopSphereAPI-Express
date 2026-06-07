const formatIDR = (amount: number): string => {
  return 'Rp ' + amount.toLocaleString('id-ID');
};

export const paymentSuccessTemplate = (
  recipientName: string,
  orderNumber: string,
  items: Array<{ name: string; image?: string; price: number; quantity: number }>,
  subtotal: number,
  shippingCost: number,
  discountAmount: number,
  totalAmount: number,
  shippingAddress: {
    recipientName: string;
    phone: string;
    province: string;
    city: string;
    district: string;
    postalCode: string;
    fullAddress: string;
  },
  paidAt: Date,
): string => {
  const itemsHtml = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; vertical-align: middle;">
          ${
            item.image
              ? `<img src="${item.image}" alt="${item.name}" style="width: 48px; height: 48px; border-radius: 4px; object-fit: cover; margin-right: 8px; vertical-align: middle;" />`
              : ''
          }
          <span style="font-weight: 500; color: #1E293B;">${item.name}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; text-align: center; color: #475569;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: 500; color: #1E293B;">
          ${formatIDR(item.price)}
        </td>
      </tr>
    `,
    )
    .join('');

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(paidAt));

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pembayaran Berhasil - ShopSphere</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
              <!-- Header -->
              <tr>
                <td style="background-color: #16A34A; padding: 24px; text-align: center;">
                  <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">ShopSphere</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 32px 24px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <div style="display: inline-block; background-color: #DCFCE7; color: #16A34A; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; font-size: 28px; font-weight: bold; text-align: center; margin-bottom: 12px;">✓</div>
                    <h2 style="margin: 0; color: #1E293B; font-size: 22px; font-weight: 700;">Pembayaran Berhasil!</h2>
                    <p style="margin: 4px 0 0 0; color: #475569; font-size: 14px;">Terima kasih atas pembayaran Anda</p>
                  </div>
                  
                  <p style="margin-top: 0; margin-bottom: 24px; color: #475569; font-size: 15px; line-height: 1.6;">
                    Halo <strong>${recipientName}</strong>,<br/>
                    Pembayaran Anda untuk pesanan <strong>${orderNumber}</strong> telah berhasil diverifikasi pada <strong>${formattedDate}</strong>. Kami sedang menyiapkan pesanan Anda untuk segera dikirim.
                  </p>

                  <div style="border-top: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0; padding: 12px 0; margin-bottom: 24px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #475569; font-size: 13px;">Nomor Pesanan</td>
                        <td style="text-align: right; font-weight: 600; color: #1E293B; font-size: 13px;">${orderNumber}</td>
                      </tr>
                      <tr>
                        <td style="color: #475569; font-size: 13px; padding-top: 4px;">Status Pembayaran</td>
                        <td style="text-align: right; font-weight: 600; color: #16A34A; font-size: 13px; padding-top: 4px;">LUNAS</td>
                      </tr>
                    </table>
                  </div>
                  
                  <!-- Items Table -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin-bottom: 24px;">
                    <thead>
                      <tr style="background-color: #F1F5F9;">
                        <th style="padding: 12px; text-align: left; font-size: 13px; font-weight: 600; color: #475569; border-bottom: 2px solid #E2E8F0;">Produk</th>
                        <th style="padding: 12px; text-align: center; font-size: 13px; font-weight: 600; color: #475569; border-bottom: 2px solid #E2E8F0; width: 60px;">Qty</th>
                        <th style="padding: 12px; text-align: right; font-size: 13px; font-weight: 600; color: #475569; border-bottom: 2px solid #E2E8F0; width: 120px;">Harga</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>

                  <!-- Totals -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 4px 0; color: #475569; font-size: 14px;">Subtotal</td>
                      <td style="padding: 4px 0; text-align: right; font-weight: 500; color: #1E293B; font-size: 14px;">${formatIDR(subtotal)}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #475569; font-size: 14px;">Ongkos Kirim</td>
                      <td style="padding: 4px 0; text-align: right; font-weight: 500; color: #1E293B; font-size: 14px;">${formatIDR(shippingCost)}</td>
                    </tr>
                    ${
                      discountAmount > 0
                        ? `
                    <tr>
                      <td style="padding: 4px 0; color: #16A34A; font-size: 14px;">Diskon Kupon</td>
                      <td style="padding: 4px 0; text-align: right; font-weight: 600; color: #16A34A; font-size: 14px;">-${formatIDR(discountAmount)}</td>
                    </tr>
                    `
                        : ''
                    }
                    <tr>
                      <td style="padding: 12px 0 4px 0; border-top: 1px solid #E2E8F0; color: #1E293B; font-size: 16px; font-weight: 700;">Total Dibayar</td>
                      <td style="padding: 12px 0 4px 0; border-top: 1px solid #E2E8F0; text-align: right; font-size: 18px; font-weight: 700; color: #16A34A;">${formatIDR(totalAmount)}</td>
                    </tr>
                  </table>

                  <!-- Shipping Address -->
                  <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px;">
                    <h3 style="margin-top: 0; margin-bottom: 8px; font-size: 14px; font-weight: 600; color: #1E293B;">Alamat Pengiriman</h3>
                    <p style="margin: 0; font-size: 13px; color: #475569; line-height: 1.5;">
                      <strong>${shippingAddress.recipientName}</strong> (${shippingAddress.phone})<br/>
                      ${shippingAddress.fullAddress}<br/>
                      ${shippingAddress.district}, ${shippingAddress.city}<br/>
                      ${shippingAddress.province}, ${shippingAddress.postalCode}
                    </p>
                  </div>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px; text-align: center; color: #94A3B8; font-size: 12px; line-height: 1.5;">
                  Email ini berfungsi sebagai bukti pembayaran resmi Anda. Jika ada pertanyaan, hubungi tim CS kami.<br/>
                  &copy; 2026 ShopSphere. All rights reserved.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};
