import axios from 'axios';
import { env } from '../../config/env.js';
import { AppError } from '../../utils/appError.js';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

let provinceCache: CacheEntry<any[]> | null = null;
let cityCache: Map<string, CacheEntry<any[]>> = new Map();

export interface RajaOngkirCostResponse {
  courier: string;
  services: Array<{
    service: string;
    description: string;
    cost: number;
    estimatedDays: string;
  }>;
}

export class ShippingService {
  private static getHeaders() {
    return {
      key: env.RAJAONGKIR_API_KEY,
      'content-type': 'application/x-www-form-urlencoded',
    };
  }

  static async getProvinces(): Promise<any[]> {
    const now = Date.now();
    if (provinceCache && now - provinceCache.timestamp < CACHE_TTL) {
      return provinceCache.data;
    }

    try {
      const response = await axios.get('https://api.rajaongkir.com/starter/province', {
        headers: this.getHeaders(),
      });

      const provinces = response.data?.rajaongkir?.results;
      if (!provinces) {
        throw new AppError('Shipping service returned invalid data', 503, 'SHIPPING_SERVICE_UNAVAILABLE');
      }

      provinceCache = { data: provinces, timestamp: now };
      return provinces;
    } catch (error: any) {
      console.error('RajaOngkir Provinces Error:', error.message);
      throw new AppError(
        'Shipping service is temporarily unavailable',
        503,
        'SHIPPING_SERVICE_UNAVAILABLE',
      );
    }
  }

  static async getCities(provinceId?: string): Promise<any[]> {
    const cacheKey = provinceId || 'all';
    const now = Date.now();
    const cached = cityCache.get(cacheKey);

    if (cached && now - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }

    try {
      const url = provinceId
        ? `https://api.rajaongkir.com/starter/city?province=${provinceId}`
        : 'https://api.rajaongkir.com/starter/city';

      const response = await axios.get(url, {
        headers: this.getHeaders(),
      });

      const cities = response.data?.rajaongkir?.results;
      if (!cities) {
        throw new AppError('Shipping service returned invalid data', 503, 'SHIPPING_SERVICE_UNAVAILABLE');
      }

      cityCache.set(cacheKey, { data: cities, timestamp: now });
      return cities;
    } catch (error: any) {
      console.error('RajaOngkir Cities Error:', error.message);
      if (error.response?.status === 400) {
        throw new AppError('Invalid province ID', 400, 'INVALID_PROVINCE_ID');
      }
      throw new AppError(
        'Shipping service is temporarily unavailable',
        503,
        'SHIPPING_SERVICE_UNAVAILABLE',
      );
    }
  }

  static async calculateCost(
    destinationCityId: string,
    weight: number,
    courier: 'jne' | 'pos' | 'tiki',
  ): Promise<RajaOngkirCostResponse> {
    try {
      const origin = env.RAJAONGKIR_ORIGIN_CITY_ID.toString();

      const response = await axios.post(
        'https://api.rajaongkir.com/starter/cost',
        new URLSearchParams({
          origin,
          destination: destinationCityId,
          weight: weight.toString(),
          courier,
        }).toString(),
        {
          headers: this.getHeaders(),
        },
      );

      const results = response.data?.rajaongkir?.results?.[0];
      if (!results) {
        throw new AppError('Shipping service returned invalid data', 503, 'SHIPPING_SERVICE_UNAVAILABLE');
      }

      const services = results.costs.map((c: any) => {
        // RajaOngkir returns ETD with unit, let's clean it up to just the estimated days range
        // e.g. "1-2 HARI" -> "1-2", "3" -> "3"
        let etd = c.cost[0]?.etd || '';
        etd = etd.replace(/\s*HARI\s*/i, '').trim();

        return {
          service: c.service,
          description: c.description,
          cost: c.cost[0]?.value || 0,
          estimatedDays: etd,
        };
      });

      return {
        courier: results.code,
        services,
      };
    } catch (error: any) {
      console.error('RajaOngkir Cost Error:', error.message || error);
      
      const status = error.response?.status;
      const description = error.response?.data?.rajaongkir?.status?.description || '';

      if (status === 400 || description.toLowerCase().includes('invalid destination')) {
        throw new AppError('Invalid destination city ID', 400, 'INVALID_CITY_ID');
      }

      throw new AppError(
        'Shipping service is temporarily unavailable',
        503,
        'SHIPPING_SERVICE_UNAVAILABLE',
      );
    }
  }
}
