import { apiRequest } from '@/services';

export type CountryStat = {
  country: string;
  isMainlandChina: boolean;
  count: number;
};

export type CountryStatsResponse = {
  total: number;
  mainland: number;
  nonMainland: number;
  byCountry: CountryStat[];
};

export async function getCountryStats(params: {
  startDate?: string;
  endDate?: string;
  excludeBots?: boolean;
}) {
  const query = {
    ...params,
    excludeBots: params.excludeBots !== false ? 'true' : 'false',
  } as Record<string, string>;

  const res = await apiRequest.get('/audit-logs/country-stats', query);
  return res.data.data as CountryStatsResponse;
}

export type IPStat = {
  ipAddress: string;
  country: string;
  region: string | null;
  city: string | null;
  isMainlandChina: boolean;
  count: number;
};

export type IPStatsResponse = {
  total: number;
  mainland: number;
  nonMainland: number;
  totalUniqueIPs: number;
  mainlandUniqueIPs: number;
  byIP: IPStat[];
};

export async function getIPStats(params: {
  startDate?: string;
  endDate?: string;
  excludeBots?: boolean;
}) {
  const query = {
    ...params,
    excludeBots: params.excludeBots !== false ? 'true' : 'false',
  } as Record<string, string>;
  const res = await apiRequest.get('/audit-logs/ip-stats', query);
  return res.data.data as IPStatsResponse;
}

export type RefererStat = {
  referer: string;
  country: string;
  isMainlandChina: boolean;
  count: number;
  uniqueIPCount: number;
};

export type RefererStatsResponse = {
  total: number;
  mainland: number;
  nonMainland: number;
  byReferer: RefererStat[];
};

export async function getRefererStats(params: {
  startDate?: string;
  endDate?: string;
  excludeBots?: boolean;
}) {
  const query = {
    ...params,
    excludeBots: params.excludeBots !== false ? 'true' : 'false',
  } as Record<string, string>;
  const res = await apiRequest.get('/audit-logs/referer-stats', query);
  return res.data.data as RefererStatsResponse;
}

export type LinkCNPersistence = {
  linkId: string;
  shortUrl: string;
  shortKey: string;
  hasMainland: boolean;
  mainlandClickCount: number;
};

export async function getLinksCNPersistence(params: {
  startDate?: string;
  endDate?: string;
  excludeBots?: boolean;
}) {
  const query = {
    ...params,
    excludeBots: params.excludeBots !== false ? 'true' : 'false',
  } as Record<string, string>;
  const res = await apiRequest.get('/links/cn-presence', query);
  return res.data.data as LinkCNPersistence[];
}
