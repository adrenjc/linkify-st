import { fetchAllDomains } from '@/services/domain';
import {
  fetchAllLinks,
  fetchClickRecords,
  fetchLinkHistory,
  fetchLinks,
  fetchLinkUrlStats,
} from '@/services/shortUrl';
import { message } from 'antd';
import { useState } from 'react';
import { ClickRecord, ClickRecordFilter, DomainItem, LinkDetail, PaginationParams } from '../types';

export const useShortLinkAPI = () => {
  const [domainsLoading, setDomainsLoading] = useState(false);
  const [linkHistoryLoading, setLinkHistoryLoading] = useState(false);
  const [clickRecordsLoading, setClickRecordsLoading] = useState(false);
  const [urlStatsLoading, setUrlStatsLoading] = useState(false);

  // 获取域名列表
  const loadDomains = async (): Promise<DomainItem[]> => {
    setDomainsLoading(true);
    try {
      const res = await fetchAllDomains();
      if (res.success) {
        return res.data;
      }
      return [];
    } catch (error: any) {
      console.error('获取域名列表失败:', error);
      message.error('获取域名列表失败');
      return [];
    } finally {
      setDomainsLoading(false);
    }
  };

  // 获取短链历史记录
  const getLinkHistory = async (linkId: string): Promise<LinkDetail | null> => {
    setLinkHistoryLoading(true);
    try {
      const result = await fetchLinkHistory(linkId);
      if (result.success) {
        return result.data;
      } else {
        if (result.message) {
          message.error(result.message);
        } else {
          message.error('获取短链接详情失败');
        }
        return null;
      }
    } catch (error: any) {
      message.error(error.message || '获取短链接详情失败');
      console.error('获取短链接详情错误:', error);
      return null;
    } finally {
      setLinkHistoryLoading(false);
    }
  };

  // 获取URL统计信息
  const getLinkUrlStats = async (linkId: string): Promise<any> => {
    setUrlStatsLoading(true);
    try {
      const result = await fetchLinkUrlStats(linkId);
      if (result.success) {
        return result.data;
      } else {
        if (result.message) {
          message.error(result.message);
        } else {
          message.error('获取URL统计失败');
        }
        return null;
      }
    } catch (error: any) {
      message.error(error.message || '获取URL统计失败');
      console.error('获取URL统计错误:', error);
      return null;
    } finally {
      setUrlStatsLoading(false);
    }
  };

  // 获取点击记录
  const getClickRecords = async (
    linkId: string,
    pagination?: PaginationParams,
    filter?: ClickRecordFilter,
  ): Promise<{
    records: ClickRecord[];
    pagination: {
      current: number;
      pageSize: number;
      total: number;
    };
    success: boolean;
    message?: string;
  }> => {
    setClickRecordsLoading(true);
    try {
      const params = {
        current: pagination?.current || 1,
        pageSize: pagination?.pageSize || 10,
        ...filter,
      };

      const result = await fetchClickRecords(linkId, params);

      if (result.success) {
        return {
          records: result.data || [],
          pagination: {
            current: result.current || 1,
            pageSize: result.pageSize || 10,
            total: result.total || 0,
          },
          success: true,
        };
      }

      return {
        records: [],
        pagination: {
          current: 1,
          pageSize: 10,
          total: 0,
        },
        success: false,
        message: result.message,
      };
    } catch (error: any) {
      console.error('获取点击记录错误:', error);
      return {
        records: [],
        pagination: {
          current: 1,
          pageSize: 10,
          total: 0,
        },
        success: false,
        message: error.message || '获取点击记录失败',
      };
    } finally {
      setClickRecordsLoading(false);
    }
  };

  // 获取链接列表
  const getLinks = async (params: any = {}, showAllUsers: boolean = false) => {
    try {
      const response = showAllUsers ? await fetchAllLinks(params) : await fetchLinks(params);

      return {
        data: response.data,
        success: response.success,
        total: response.total,
      };
    } catch (error: any) {
      console.error('获取链接列表错误:', error);
      message.error('获取链接列表失败');
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };

  return {
    loadDomains,
    getLinkHistory,
    getLinkUrlStats,
    getClickRecords,
    getLinks,
    domainsLoading,
    linkHistoryLoading,
    urlStatsLoading,
    clickRecordsLoading,
  };
};

export default useShortLinkAPI;
