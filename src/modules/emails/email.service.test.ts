import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailService } from './email.service.js';
import { Order } from '../orders/order.model.js';
import { User } from '../users/user.model.js';

vi.mock('../orders/order.model.js');
vi.mock('../users/user.model.js');

describe('EmailService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should log mock email output in test environment and not throw', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // Arrange
    const mockOrder = {
      orderNumber: 'ORD-12345',
      subtotal: 100000,
      shippingCost: 10000,
      discountAmount: 0,
      totalAmount: 110000,
      xenditInvoiceUrl: 'http://invoice.url',
      shippingAddress: {
        recipientName: 'Budi',
        phone: '0812',
        province: 'Bali',
        city: 'Denpasar',
        district: 'Denpasar Selatan',
        postalCode: '80221',
        fullAddress: 'Jl. Raya No. 1',
      },
      items: [
        { name: 'Produk A', price: 100000, quantity: 1 }
      ],
      user: { name: 'Budi' }
    };
    
    vi.mocked(Order.findOne).mockReturnValue({
      populate: vi.fn().mockResolvedValue(mockOrder)
    } as any);

    // Act
    await expect(EmailService.sendOrderCreatedEmail('budi@example.com', 'ORD-12345')).resolves.not.toThrow();

    // Assert
    expect(Order.findOne).toHaveBeenCalledWith({ orderNumber: 'ORD-12345' });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should capture errors and not throw when order is not found', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(Order.findOne).mockReturnValue({
      populate: vi.fn().mockResolvedValue(null)
    } as any);

    await expect(EmailService.sendOrderCreatedEmail('budi@example.com', 'ORD-MISSING')).resolves.not.toThrow();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('should send password reset email without throwing', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(User.findOne).mockResolvedValue({ name: 'Budi' } as any);

    await expect(EmailService.sendPasswordResetEmail('budi@example.com', 'token123')).resolves.not.toThrow();
    expect(User.findOne).toHaveBeenCalledWith({ email: 'budi@example.com' });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should send return resolved email without throwing', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(User.findOne).mockResolvedValue({ name: 'Budi' } as any);

    await expect(
      EmailService.sendReturnResolvedEmail('budi@example.com', 'ORD-12345', 'approved', 50000, 'Approved notes')
    ).resolves.not.toThrow();
    expect(User.findOne).toHaveBeenCalledWith({ email: 'budi@example.com' });
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
