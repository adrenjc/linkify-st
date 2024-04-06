import { BarChartOutlined } from '@ant-design/icons';
import { Card, Col, DatePicker, Divider, Modal, Row, Statistic, Table, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import { ClickRecord } from '../types';

interface ClickRecordsModalProps {
  visible: boolean;
  onCancel: () => void;
  clickRecords: ClickRecord[];
  pagination: {
    current: number;
    pageSize: number;
    total: number;
  };
  onPageChange: (page: number, pageSize?: number) => void;
  onDateFilterChange: (dates: any, dateStrings: [string, string]) => void;
  // 修正：URL统计数据结构
  urlStats?: Record<string, { clickCount: number; recentClicks: any[] }>;
  longUrls?: string[];
}

const ClickRecordsModal: React.FC<ClickRecordsModalProps> = ({
  visible,
  onCancel,
  clickRecords,
  pagination,
  onPageChange,
  onDateFilterChange,
  urlStats = {},
  longUrls = [],
}) => {
  // 计算总点击量 - 修正访问clickCount的方式
  const totalClicks = Object.values(urlStats).reduce(
    (sum, stat) => sum + (stat?.clickCount || 0),
    0,
  );

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BarChartOutlined />
          <span>点击记录详情</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={1200}
    >
      {/* URL统计区域 - 始终显示 */}
      {longUrls.length >= 1 && (
        <>
          <Card
            title={longUrls.length > 1 ? '原始链接点击统计' : '访问统计信息'}
            size="small"
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: '12px' }}
          >
            <Row gutter={16} style={{ marginBottom: 12 }}>
              <Col span={6}>
                <Statistic
                  title="总点击量"
                  value={totalClicks}
                  valueStyle={{ color: '#1890ff', fontSize: '20px' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title="链接数量"
                  value={longUrls.length}
                  valueStyle={{ color: '#52c41a', fontSize: '20px' }}
                />
              </Col>
            </Row>

            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              <Row gutter={[16, 8]}>
                {longUrls.map((url, index) => {
                  // 修正：正确访问clickCount字段
                  const clickCount = urlStats[url]?.clickCount || 0;
                  const percentage =
                    totalClicks > 0 ? ((clickCount / totalClicks) * 100).toFixed(1) : '0';

                  return (
                    <Col span={24} key={index}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px',
                          backgroundColor: '#fafafa',
                          borderRadius: '4px',
                          border: '1px solid #f0f0f0',
                        }}
                      >
                        {longUrls.length > 1 ? (
                          <Tag color="blue">#{index + 1}</Tag>
                        ) : (
                          <Tag color="green">目标链接</Tag>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '12px',
                              color: '#666',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                            title={url}
                          >
                            {url}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Tag color="green">{clickCount} 次</Tag>
                          {longUrls.length > 1 && <Tag color="orange">{percentage}%</Tag>}
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </div>
          </Card>
          <Divider style={{ margin: '16px 0' }} />
        </>
      )}

      {/* 日期筛选 */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>按日期筛选：</div>
        <DatePicker.RangePicker onChange={onDateFilterChange} style={{ width: '100%' }} />
      </div>

      {/* 访问记录表格 */}
      <Table
        dataSource={clickRecords}
        rowKey={(record) => `${record.ipAddress}-${record.time}`}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          onChange: onPageChange,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        columns={[
          {
            title: '访问时间',
            dataIndex: 'time',
            key: 'time',
            width: 160,
            render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm:ss'),
          },
          {
            title: 'IP地址',
            dataIndex: 'ipAddress',
            key: 'ipAddress',
            width: 120,
          },
          {
            title: '来源',
            dataIndex: 'referrerDisplay',
            key: 'referrerDisplay',
            width: 100,
            ellipsis: true,
            render: (text, record) => {
              return record.referrer && record.referrer !== 'direct' ? (
                <Tooltip title={record.referrer}>
                  <span>{text}</span>
                </Tooltip>
              ) : (
                <span>{text}</span>
              );
            },
          },
          {
            title: '设备/浏览器',
            dataIndex: 'userAgent',
            key: 'userAgent',
            width: 200,
            ellipsis: true,
          },
          // 访问目标列 - 始终显示，无论单条还是多条URL
          {
            title: '访问目标',
            dataIndex: 'targetUrl',
            key: 'targetUrl',
            width: longUrls.length > 1 ? 120 : 250,
            ellipsis: true,
            render: (targetUrl: string) => {
              // 如果没有targetUrl（历史记录）
              if (!targetUrl) {
                return (
                  <Tooltip title="此记录创建于多URL功能实现之前，无法确定具体访问目标">
                    <Tag color="default">历史记录</Tag>
                  </Tooltip>
                );
              }

              // 如果只有一条URL，直接显示完整URL
              if (longUrls.length <= 1) {
                return (
                  <Tooltip title={targetUrl}>
                    <div
                      style={{
                        maxWidth: '180px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontSize: '12px',
                      }}
                    >
                      {targetUrl}
                    </div>
                  </Tooltip>
                );
              }

              // 多条URL的情况
              const urlIndex = longUrls.findIndex((url) => url === targetUrl);
              if (urlIndex >= 0) {
                return (
                  <Tooltip title={targetUrl}>
                    <Tag color="blue">链接{urlIndex + 1}</Tag>
                  </Tooltip>
                );
              } else {
                // URL已被删除或修改，显示完整URL
                return (
                  <Tooltip title={`${targetUrl} (此URL已被删除或修改，但记录了原始访问目标)`}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <Tag color="orange">已删除</Tag>
                      <div
                        style={{
                          fontSize: '10px',
                          color: '#666',
                          maxWidth: longUrls.length > 1 ? '100px' : '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: '1.2',
                        }}
                      >
                        {targetUrl}
                      </div>
                    </div>
                  </Tooltip>
                );
              }
            },
          },
        ]}
        size="small"
      />
    </Modal>
  );
};

export default ClickRecordsModal;
