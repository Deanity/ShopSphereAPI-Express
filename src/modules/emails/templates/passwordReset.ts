export const passwordResetTemplate = (recipientName: string, resetUrl: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Atur Ulang Kata Sandi - ShopSphere</title>
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
                  <h2 style="margin-top: 0; margin-bottom: 12px; color: #1E293B; font-size: 20px; font-weight: 700;">Atur Ulang Kata Sandi Anda</h2>
                  <p style="margin-top: 0; margin-bottom: 24px; color: #475569; font-size: 15px; line-height: 1.6;">
                    Halo <strong>${recipientName}</strong>,<br/>
                    Kami menerima permintaan untuk mengatur ulang kata sandi akun ShopSphere Anda. Silakan klik tombol di bawah ini untuk mengganti kata sandi Anda.
                  </p>

                  <!-- CTA Button -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                    <tr>
                      <td align="center">
                        <a href="${resetUrl}" target="_blank" style="display: inline-block; background-color: #4F46E5; color: #FFFFFF; font-weight: 600; font-size: 15px; text-decoration: none; padding: 14px 32px; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1);">Atur Ulang Kata Sandi</a>
                      </td>
                    </tr>
                  </table>

                  <!-- Fallback link -->
                  <p style="margin-top: 0; margin-bottom: 24px; color: #475569; font-size: 13px; line-height: 1.5;">
                    Jika tombol di atas tidak berfungsi, Anda juga dapat menyalin dan menempelkan tautan berikut ke peramban (browser) Anda:<br/>
                    <a href="${resetUrl}" target="_blank" style="color: #4F46E5; word-break: break-all;">${resetUrl}</a>
                  </p>

                  <div style="border-top: 1px solid #E2E8F0; padding-top: 16px;">
                    <p style="margin: 0; color: #94A3B8; font-size: 13px; line-height: 1.5;">
                      Tautan ini hanya berlaku selama <strong>1 jam</strong>. Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan email ini dengan aman.
                    </p>
                  </div>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px; text-align: center; color: #94A3B8; font-size: 12px; line-height: 1.5;">
                  Hubungi kami jika Anda memiliki masalah keamanan akun.<br/>
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
