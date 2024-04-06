import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  List,
  Skeleton,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import useShortLinkAPI from '../hooks/useShortLinkAPI';
import { LinkDetail } from '../types';

const { Text, Paragraph } = Typography;

interface LinkDetailDrawerProps {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  linkDetail: LinkDetail | null;
}

const LinkDetailDrawer: React.FC<LinkDetailDrawerProps> = ({
  visible,
  onClose,
  loading,
  linkDetail,
}) => {
  const [urlStats, setUrlStats] = useState<
    Record<string, { clickCount: number; recentClicks: any[] }>
  >({});
  const [urlStatsLoading, setUrlStatsLoading] = useState(false);
  const [lastFetchedLinkId, setLastFetchedLinkId] = useState<string>(''); // 记录上次获取统计的链接ID
  const statsCache = useRef<
    Record<string, Record<string, { clickCount: number; recentClicks: any[] }>>
  >({});
  const { getLinkUrlStats } = useShortLinkAPI();

  // 当详情页面打开且有链接信息时，获取URL统计
  useEffect(() => {
    if (visible && linkDetail?.linkInfo?.id && linkDetail?.linkInfo?.longUrls?.length > 0) {
      const linkId = linkDetail.linkInfo.id;

      // 检查缓存中是否已有该链接的统计数据
      if (statsCache.current[linkId]) {
        setUrlStats(statsCache.current[linkId]);
        setLastFetchedLinkId(linkId);
        return;
      }

      // 只在链接ID变化时才重新获取
      if (linkId !== lastFetchedLinkId) {
        const fetchUrlStats = async () => {
          setUrlStatsLoading(true);
          try {
            const stats = await getLinkUrlStats(linkId);
            if (stats) {
              const urlStatsData = stats.urlStats || {};
              setUrlStats(urlStatsData);
              statsCache.current[linkId] = urlStatsData; // 缓存数据
              setLastFetchedLinkId(linkId);
            }
          } catch (error) {
            console.error('获取URL统计失败:', error);
          } finally {
            setUrlStatsLoading(false);
          }
        };
        fetchUrlStats();
      }
    }
  }, [
    visible,
    linkDetail?.linkInfo?.id,
    linkDetail?.linkInfo?.longUrls?.length,
    lastFetchedLinkId,
  ]); // 移除getLinkUrlStats依赖

  // 清理状态
  useEffect(() => {
    if (!visible) {
      setUrlStats({});
      setLastFetchedLinkId('');
      setUrlStatsLoading(false);
    }
  }, [visible]);

  return (
    <Drawer
      title="短链接详情"
      width={window.innerWidth > 1600 ? 1200 : window.innerWidth > 1200 ? 900 : 800}
      placement="right"
      onClose={onClose}
      open={visible}
      extra={
        <Space>
          <Button onClick={onClose}>关闭</Button>
        </Space>
      }
      bodyStyle={{ paddingBottom: 80 }}
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : linkDetail ? (
        <>
          <Card bordered={false} style={{ marginBottom: 24 }}>
            <Descriptions
              title="基本信息"
              column={1}
              bordered
              items={[
                {
                  key: 'shortUrl',
                  label: <span style={{ whiteSpace: 'nowrap' }}>短链接</span>,
                  children: (
                    <a
                      href={linkDetail.linkInfo.shortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {linkDetail.linkInfo.shortUrl}
                    </a>
                  ),
                },
                {
                  key: 'longUrls',
                  label: <span style={{ whiteSpace: 'nowrap' }}>原始链接</span>,
                  children: (
                    <div>
                      {linkDetail.linkInfo.longUrls && linkDetail.linkInfo.longUrls.length > 0 ? (
                        <Space direction="vertical" style={{ width: '100%' }}>
                          {linkDetail.linkInfo.longUrls.map((url, index) => {
                            // 从API获取的URL统计数据
                            const clickCount = urlStats[url]?.clickCount || 0;
                            return (
                              <div
                                key={index}
                                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                              >
                                <Tag color="blue">#{index + 1}</Tag>
                                <Paragraph
                                  ellipsis={{ rows: 1, expandable: true, symbol: '展开' }}
                                  style={{ margin: 0, flex: 1 }}
                                >
                                  <a href={url} target="_blank" rel="noopener noreferrer">
                                    {url}
                                  </a>
                                </Paragraph>
                                {urlStatsLoading && !urlStats[url] ? (
                                  <Tag color="processing">统计中...</Tag>
                                ) : (
                                  <Tag color="green">访问{clickCount}次</Tag>
                                )}
                              </div>
                            );
                          })}
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            共 {linkDetail.linkInfo.longUrls.length} 个原始链接，访问时随机跳转
                          </Text>
                        </Space>
                      ) : (
                        <Text type="secondary">无原始链接</Text>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'shortKey',
                  label: <span style={{ whiteSpace: 'nowrap' }}>短链KEY</span>,
                  children: linkDetail.linkInfo.shortKey,
                },
                ...(linkDetail.linkInfo.customDomain
                  ? [
                      {
                        key: 'customDomain',
                        label: <span style={{ whiteSpace: 'nowrap' }}>自定义域名</span>,
                        children: linkDetail.linkInfo.customDomain,
                      },
                    ]
                  : []),
                {
                  key: 'remark',
                  label: <span style={{ whiteSpace: 'nowrap' }}>备注</span>,
                  children: linkDetail.linkInfo.remark || '无',
                },
                {
                  key: 'createdAt',
                  label: <span style={{ whiteSpace: 'nowrap' }}>创建时间</span>,
                  children: dayjs(linkDetail.linkInfo.createdAt).format('YYYY-MM-DD HH:mm:ss'),
                },
                {
                  key: 'updatedAt',
                  label: <span style={{ whiteSpace: 'nowrap' }}>最后更新</span>,
                  children: dayjs(linkDetail.linkInfo.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
                },
                {
                  key: 'creator',
                  label: <span style={{ whiteSpace: 'nowrap' }}>创建者</span>,
                  children: (
                    <Space>
                      <Avatar style={{ backgroundColor: '#87d068' }}>
                        {linkDetail.linkInfo.creator.username.substring(0, 1).toUpperCase()}
                      </Avatar>
                      <span>{linkDetail.linkInfo.creator.username}</span>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {linkDetail.linkInfo.creator.email}
                      </Text>
                    </Space>
                  ),
                },
              ]}
            />
          </Card>

          <Divider orientation="left">修改历史</Divider>

          {linkDetail.history.length > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Timeline
                style={{ maxWidth: 800, width: '100%' }}
                mode="alternate"
                items={linkDetail.history.map((record) => ({
                  color: record.action === '创建' ? 'green' : 'blue',
                  label: dayjs(record.time).format('YYYY-MM-DD HH:mm:ss'),
                  children: (
                    <Card
                      title={
                        <Space>
                          <Tag color={record.action === '创建' ? 'success' : 'processing'}>
                            {record.action}
                          </Tag>
                          <span>由 {record.username} 操作</span>
                        </Space>
                      }
                      style={{ width: '100%', maxWidth: 600 }}
                    >
                      {record.action === '更新' && record.changes ? (
                        <List
                          itemLayout="horizontal"
                          dataSource={Object.entries(record.changes).filter(([, value]) => value)}
                          renderItem={([key, value]) => {
                            let fieldName;
                            switch (key) {
                              case 'longUrls':
                                fieldName = '原始链接';
                                break;
                              case 'remark':
                                fieldName = '备注';
                                break;
                              case 'customShortKey':
                                fieldName = '短链KEY';
                                break;
                              case 'customDomain':
                                fieldName = '自定义域名';
                                break;
                              default:
                                fieldName = key;
                            }

                            return (
                              <List.Item>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                  <Text strong>{fieldName}</Text>
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '8px',
                                    }}
                                  >
                                    <div>
                                      <Tag color="red">修改前</Tag>
                                      {key === 'longUrls' && Array.isArray(value.from) ? (
                                        <div style={{ marginTop: '4px' }}>
                                          {value.from.map((url: string, idx: number) => (
                                            <div
                                              key={idx}
                                              style={{ marginLeft: '8px', fontSize: '12px' }}
                                            >
                                              <Tag>#{idx + 1}</Tag>
                                              <Text ellipsis={{ tooltip: url }}>{url}</Text>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <Text
                                          style={{
                                            maxWidth: '100%',
                                            display: 'inline-block',
                                            verticalAlign: 'middle',
                                          }}
                                          ellipsis={{ tooltip: value.from }}
                                        >
                                          {value.from || '(空)'}
                                        </Text>
                                      )}
                                    </div>
                                    <div>
                                      <Tag color="green">修改后</Tag>
                                      {key === 'longUrls' && Array.isArray(value.to) ? (
                                        <div style={{ marginTop: '4px' }}>
                                          {value.to.map((url: string, idx: number) => (
                                            <div
                                              key={idx}
                                              style={{ marginLeft: '8px', fontSize: '12px' }}
                                            >
                                              <Tag>#{idx + 1}</Tag>
                                              <Text ellipsis={{ tooltip: url }}>{url}</Text>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <Text
                                          style={{
                                            maxWidth: '100%',
                                            display: 'inline-block',
                                            verticalAlign: 'middle',
                                          }}
                                          ellipsis={{ tooltip: value.to }}
                                        >
                                          {value.to || '(空)'}
                                        </Text>
                                      )}
                                    </div>
                                  </div>
                                </Space>
                              </List.Item>
                            );
                          }}
                        />
                      ) : (
                        <Text>{record.description}</Text>
                      )}
                      <div style={{ marginTop: 8, textAlign: 'right' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          IP: {record.ipAddress}
                        </Text>
                      </div>
                    </Card>
                  ),
                }))}
              />
            </div>
          ) : (
            <Empty description="暂无历史记录" />
          )}
        </>
      ) : (
        <Empty description="获取详情失败" />
      )}
    </Drawer>
  );
};

export default LinkDetailDrawer;
