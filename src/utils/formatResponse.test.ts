import { describe, it, expect } from 'vitest';
import { formatResponse } from './formatResponse.js';

describe('formatResponse', () => {
  it('should return a success response object with default null data', () => {
    const response = formatResponse('Success message');
    expect(response).toEqual({
      success: true,
      message: 'Success message',
      data: null,
    });
  });

  it('should return a success response object with data and metadata when provided', () => {
    const mockData = { id: 1, name: 'Product' };
    const mockMeta = { page: 1, limit: 10, total: 100, totalPages: 10 };
    const response = formatResponse('Fetched products', mockData, mockMeta);

    expect(response).toEqual({
      success: true,
      message: 'Fetched products',
      data: mockData,
      meta: mockMeta,
    });
  });
});
