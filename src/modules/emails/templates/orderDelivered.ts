export const orderDeliveredTemplate = (recipientName: string, orderNumber: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pesanan Diterima - ShopSphere</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
              <!-- Header -->
              <tr>
                <td style="background-color: #4F46E5; padding: 24px; text-align: center;">
                  <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">ShopSphere</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 32px 24px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <div style="display: inline-block; background-color: #E0E7FF; color: #4F46E5; width: 56px; height: 56px; line-height: 56px; border-radius: 50%; font-size: 28px; font-weight: bold; text-align: center; margin-bottom: 12px;">🎉</div>
                    <h2 style="margin: 0; color: #1E293B; font-size: 22px; font-weight: 700;">Pesanan Telah Diterima!</h2>
                  </div>

                  <p style="margin-top: 0; margin-bottom: 24px; color: #475569; font-size: 15px; line-height: 1.6;">
                    Halo <strong>${recipientName}</strong>,<br/>
                    Pesanan Anda dengan nomor <strong>${orderNumber}</strong> telah dikonfirmasi sampai di alamat tujuan pengiriman Anda.
                  </p>

                  <p style="margin-top: 0; margin-bottom: 24px; color: #475569; font-size: 14px; line-height: 1.6;">
                    Kami harap Anda menyukai produk yang Anda beli! Jangan ragu untuk memberikan ulasan dan rating produk tersebut agar bisa membantu pembeli yang lain di kemudian hari.
                  </p>

                  <!-- CTA Box -->
                  <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 16px; text-align: center; margin-bottom: 12px;">
                    <p style="margin: 0 0 12px 0; font-size: 13px; color: #475569;">Apakah Anda puas dengan pesanan ini?</p>
                    <p style="margin: 0; font-size: 12px; color: #94A3B8;">Anda bisa mengirimkan ulasan (review) dari riwayat pesanan Anda di aplikasi / web kami.</p>
                  </div>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px; text-align: center; color: #94A3B8; font-size: 12px; line-height: 1.5;">
                  Terima kasih telah berbelanja di ShopSphere!<br/>
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
