export const orderShippedTemplate = (
  recipientName: string,
  orderNumber: string,
  courier: string,
  service: string,
  trackingNumber: string,
  estimatedDays: string,
): string => {
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pesanan Dikirim - ShopSphere</title>
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
                  <h2 style="margin-top: 0; margin-bottom: 12px; color: #1E293B; font-size: 20px; font-weight: 700;">Pesanan Anda Telah Dikirim!</h2>
                  <p style="margin-top: 0; margin-bottom: 24px; color: #475569; font-size: 15px; line-height: 1.6;">
                    Halo <strong>${recipientName}</strong>,<br/>
                    Kabar baik! Pesanan Anda <strong>${orderNumber}</strong> saat ini telah diserahkan ke kurir dan sedang dalam perjalanan ke alamat pengiriman Anda.
                  </p>

                  <!-- Delivery info box -->
                  <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #475569; font-size: 14px; padding-bottom: 8px; width: 150px;">Kurir / Layanan</td>
                        <td style="font-weight: 600; color: #1E293B; font-size: 14px; padding-bottom: 8px;">${courier.toUpperCase()} - ${service.toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td style="color: #475569; font-size: 14px; padding-bottom: 8px;">Nomor Resi</td>
                        <td style="font-weight: 700; color: #4F46E5; font-size: 15px; padding-bottom: 8px; letter-spacing: 0.5px;">${trackingNumber}</td>
                      </tr>
                      <tr>
                        <td style="color: #475569; font-size: 14px;">Estimasi Tiba</td>
                        <td style="font-weight: 600; color: #1E293B; font-size: 14px;">${estimatedDays} Hari Kerja</td>
                      </tr>
                    </table>
                  </div>

                  <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
                    Anda dapat memantau status pengiriman secara berkala menggunakan nomor resi di atas melalui situs resmi kurir.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px; text-align: center; color: #94A3B8; font-size: 12px; line-height: 1.5;">
                  Hubungi tim layanan pelanggan kami jika pesanan Anda belum tiba dalam batas estimasi.<br/>
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
