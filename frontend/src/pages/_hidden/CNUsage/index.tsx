import {
  CountryStat,
  IPStat,
  RefererStat,
  getCountryStats,
  getIPStats,
  getRefererStats,
} from '@/services/analytics';
import { Column } from '@ant-design/plots';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Row,
  Space,
  Statistic,
  Switch,
  Table,
  Typography,
} from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { useEffect, useState } from 'react';

type RangeValue = [Dayjs | null, Dayjs | null] | null;

const countryNames: Record<string, string> = {
  CN: '中国',
  US: '美国',
  JP: '日本',
  DE: '德国',
  FR: '法国',
  GB: '英国',
  CA: '加拿大',
  AU: '澳大利亚',
  KR: '韩国',
  SG: '新加坡',
  IN: '印度',
  BR: '巴西',
  RU: '俄罗斯',
  IT: '意大利',
  ES: '西班牙',
  NL: '荷兰',
  TW: '台湾',
  HK: '香港',
  MO: '澳门',
};

const IPAnalytics: React.FC = () => {
  const [range, setRange] = useState<RangeValue>([null, null]);
  const [excludeBots, setExcludeBots] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [data, setData] = useState<{
    total: number;
    mainland: number;
    nonMainland: number;
    byCountry: CountryStat[];
  } | null>(null);
  const [ipStats, setIpStats] = useState<{
    total: number;
    mainland: number;
    nonMainland: number;
    totalUniqueIPs: number;
    mainlandUniqueIPs: number;
    byIP: IPStat[];
  } | null>(null);
  const [refererStats, setRefererStats] = useState<{
    total: number;
    mainland: number;
    nonMainland: number;
    byReferer: RefererStat[];
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        startDate: range?.[0]?.toISOString(),
        endDate: range?.[1]?.toISOString(),
        excludeBots,
      };
      console.log('请求参数:', params);

      const [countryRes, ipRes, refererRes] = await Promise.all([
        getCountryStats(params),
        getIPStats(params),
        getRefererStats(params),
      ]);

      console.log('API响应:', { countryRes, ipRes, refererRes });

      setData(countryRes);
      setIpStats(ipRes);
      setRefererStats(refererRes);
    } catch (error) {
      console.error('API请求失败:', error);
      // 设置默认数据避免空白
      setData({
        total: 0,
        mainland: 0,
        nonMainland: 0,
        byCountry: [],
      });
      setIpStats({
        total: 0,
        mainland: 0,
        nonMainland: 0,
        totalUniqueIPs: 0,
        mainlandUniqueIPs: 0,
        byIP: [],
      });
      setRefererStats({
        total: 0,
        mainland: 0,
        nonMainland: 0,
        byReferer: [],
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCountryName = (code: string) => {
    if (code === 'UNKNOWN') return '未知';
    return countryNames[code] || code;
  };

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Typography.Title level={2}>全球 IP 访问分析</Typography.Title>

        {/* 控制面板 */}
        <Card style={{ marginBottom: 24 }}>
          <Row gutter={16} align="middle">
            <Col>
              <Space>
                <span>时间范围:</span>
                <DatePicker.RangePicker
                  value={range as any}
                  onChange={(v) => setRange(v as RangeValue)}
                />
              </Space>
            </Col>
            <Col>
              <Space>
                <span>排除爬虫:</span>
                <Switch checked={excludeBots} onChange={setExcludeBots} />
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  size="small"
                  onClick={() => setRange([dayjs().startOf('day'), dayjs().endOf('day')])}
                >
                  今天
                </Button>
                <Button
                  size="small"
                  onClick={() =>
                    setRange([dayjs().subtract(7, 'day').startOf('day'), dayjs().endOf('day')])
                  }
                >
                  近7天
                </Button>
                <Button
                  size="small"
                  onClick={() =>
                    setRange([dayjs().subtract(30, 'day').startOf('day'), dayjs().endOf('day')])
                  }
                >
                  近30天
                </Button>
                <Button size="small" onClick={() => setRange([null, null])}>
                  全部
                </Button>
              </Space>
            </Col>
            <Col>
              <Button type="primary" onClick={fetchData} loading={loading}>
                搜索
              </Button>
            </Col>
          </Row>
        </Card>

        {/* 统计卡片 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="总访问量"
                value={data?.total || 0}
                loading={loading}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="已拦截（中国大陆）"
                value={data?.mainland || 0}
                loading={loading}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="正常访问"
                value={data?.nonMainland || 0}
                loading={loading}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="独立IP数"
                value={ipStats?.totalUniqueIPs || 0}
                loading={loading}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* 图表 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card title="国家访问排行" loading={loading}>
              <Column
                data={(data?.byCountry || []).slice(0, 10).map((d) => ({
                  country: getCountryName(d.country),
                  count: d.count,
                  status: d.isMainlandChina ? '已拦截' : '正常访问',
                }))}
                xField="country"
                yField="count"
                seriesField="status"
                color={['#52c41a', '#ff4d4f']}
                height={300}
                legend={{ position: 'top' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="来源网站统计" loading={loading} extra="🔍 投放目标追踪">
              <Table
                dataSource={refererStats?.byReferer?.slice(0, 15) || []}
                rowKey={(record, index) => `${record.referer}-${index}`}
                size="small"
                pagination={false}
                scroll={{ y: 260 }}
                columns={[
                  {
                    title: '来源网站',
                    dataIndex: 'referer',
                    render: (referer: string) => {
                      if (referer === 'direct') {
                        return <span style={{ color: '#999', fontStyle: 'italic' }}>直接访问</span>;
                      }
                      return (
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                            {referer.length > 25
                              ? referer
                                  .replace(/^https?:\/\//, '')
                                  .replace(/^www\./, '')
                                  .substring(0, 20) + '...'
                              : referer.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                          </div>
                          {referer !== 'direct' && (
                            <div style={{ fontSize: '10px', color: '#666' }}>{referer}</div>
                          )}
                        </div>
                      );
                    },
                  },
                  {
                    title: '状态',
                    dataIndex: 'isMainlandChina',
                    render: (isMainland: boolean) => (
                      <span style={{ color: isMainland ? '#ff4d4f' : '#52c41a' }}>
                        {isMainland ? '拦截' : '正常'}
                      </span>
                    ),
                  },
                  {
                    title: '点击',
                    dataIndex: 'count',
                    sorter: (a, b) => a.count - b.count,
                  },
                  {
                    title: 'UV',
                    dataIndex: 'uniqueIPCount',
                    sorter: (a, b) => a.uniqueIPCount - b.uniqueIPCount,
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>

        {/* 表格 */}
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Card title="国家统计" loading={loading}>
              <Table
                dataSource={data?.byCountry || []}
                rowKey={(record) => `${record.country}-${record.isMainlandChina}`}
                size="small"
                pagination={{ pageSize: 10 }}
                columns={[
                  {
                    title: '国家',
                    dataIndex: 'country',
                    render: (code: string) => getCountryName(code),
                  },
                  {
                    title: '状态',
                    dataIndex: 'isMainlandChina',
                    render: (isMainland: boolean) => (
                      <span style={{ color: isMainland ? '#ff4d4f' : '#52c41a' }}>
                        {isMainland ? '已拦截' : '正常访问'}
                      </span>
                    ),
                  },
                  {
                    title: '次数',
                    dataIndex: 'count',
                    sorter: (a, b) => a.count - b.count,
                  },
                ]}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card title="IP统计" loading={loading}>
              <Table
                dataSource={ipStats?.byIP?.slice(0, 20) || []}
                rowKey="ipAddress"
                size="small"
                pagination={{ pageSize: 10 }}
                columns={[
                  {
                    title: 'IP地址',
                    dataIndex: 'ipAddress',
                    render: (ip: string) => (
                      <code style={{ background: '#f5f5f5', padding: '2px 4px', borderRadius: 2 }}>
                        {ip}
                      </code>
                    ),
                  },
                  {
                    title: '地区',
                    render: (record: IPStat) => (
                      <div>
                        <div>{getCountryName(record.country)}</div>
                        {record.city && <small style={{ color: '#999' }}>{record.city}</small>}
                      </div>
                    ),
                  },
                  {
                    title: '状态',
                    dataIndex: 'isMainlandChina',
                    render: (isMainland: boolean) => (
                      <span style={{ color: isMainland ? '#ff4d4f' : '#52c41a' }}>
                        {isMainland ? '已拦截' : '正常'}
                      </span>
                    ),
                  },
                  {
                    title: '次数',
                    dataIndex: 'count',
                    sorter: (a, b) => a.count - b.count,
                  },
                ]}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default IPAnalytics;
