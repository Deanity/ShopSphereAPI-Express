const formatIDR = (amount: number): string => {
  return 'Rp ' + amount.toLocaleString('id-ID');
};

export const returnResolvedTemplate = (
  recipientName: string,
  orderNumber: string,
  status: 'approved' | 'rejected',
  refundAmount?: number,
  adminNotes?: string,
): string => {
  const isApproved = status.toLowerCase() === 'approved';
  const headerBg = isApproved ? '#16A34A' : '#DC2626'; // Green if approved, red if rejected
  const statusLabel = isApproved ? 'DISETUJUI' : 'DITOLAK';

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Pengajuan Pengembalian Diperbarui - ShopSphere</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 20px 0;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);">
              <!-- Header -->
              <tr>
                <td style="background-color: ${headerBg}; padding: 24px; text-align: center;">
                  <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">ShopSphere</h1>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 32px 24px;">
                  <h2 style="margin-top: 0; margin-bottom: 12px; color: #1E293B; font-size: 20px; font-weight: 700;">
                    Pengembalian Barang ${statusLabel}
                  </h2>
                  <p style="margin-top: 0; margin-bottom: 24px; color: #475569; font-size: 15px; line-height: 1.6;">
                    Halo <strong>${recipientName}</strong>,<br/>
                    Pengajuan pengembalian (return) barang untuk pesanan Anda dengan nomor <strong>${orderNumber}</strong> telah ditinjau dan statusnya diperbarui menjadi: <strong>${statusLabel}</strong>.
                  </p>

                  <!-- Status info box -->
                  <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; padding: 20px; margin-bottom: 24px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="color: #475569; font-size: 14px; padding-bottom: 8px; width: 150px;">Status Keputusan</td>
                        <td style="font-weight: 700; color: ${headerBg}; font-size: 14px; padding-bottom: 8px;">${statusLabel}</td>
                      </tr>
                      ${
                        isApproved && refundAmount !== undefined
                          ? `
                      <tr>
                        <td style="color: #475569; font-size: 14px; padding-bottom: 8px;">Jumlah Refund</td>
                        <td style="font-weight: 700; color: #1E293B; font-size: 15px; padding-bottom: 8px;">${formatIDR(refundAmount)}</td>
                      </tr>
                      `
                          : ''
                      }
                      ${
                        adminNotes
                          ? `
                      <tr>
                        <td style="color: #475569; font-size: 14px; vertical-align: top;">Catatan Admin</td>
                        <td style="font-weight: 500; color: #475569; font-size: 14px; line-height: 1.5;">${adminNotes}</td>
                      </tr>
                      `
                          : ''
                      }
                    </table>
                  </div>

                  ${
                    isApproved
                      ? `
                    <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
                      Dana pengembalian (refund) akan diproses oleh tim keuangan kami. Silakan periksa rekening atau e-wallet Anda secara berkala sesuai ketentuan platform kami.
                    </p>
                    `
                      : `
                    <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
                      Jika Anda merasa keputusan penolakan ini keliru atau memiliki pertanyaan tambahan, silakan hubungi tim CS kami untuk klarifikasi lebih lanjut.
                    </p>
                    `
                  }
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px; text-align: center; color: #94A3B8; font-size: 12px; line-height: 1.5;">
                  Butuh bantuan lebih lanjut? Hubungi layanan pelanggan kami.<br/>
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
