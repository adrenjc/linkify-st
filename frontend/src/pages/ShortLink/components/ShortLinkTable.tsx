import { ProColumns } from '@ant-design/pro-components';
import { Badge, Button, message, Modal, Space, Tag, Tooltip } from 'antd';
import { LinkItem } from '../types';

interface ShortLinkColumnsProps {
  currentUserId?: string;
  access: {
    canViewAllLinks?: () => boolean;
    canManageAllLinks?: () => boolean;
  };
  onEdit: (record: LinkItem) => void;
  onDelete: (id: string) => void;
  onShowClickRecords: (id: string) => void;
  onViewDetail: (id: string) => void;
}

export const useShortLinkColumns = ({
  currentUserId,
  access,
  onEdit,
  onDelete,
  onShowClickRecords,
  onViewDetail,
}: ShortLinkColumnsProps) => {
  // 基础列定义
  const baseColumns: ProColumns<LinkItem>[] = [
    {
      title: '短链',
      dataIndex: 'shortUrl',
      search: false,
      width: 280,
      render: (_, record) => (
        <a
          href={record.shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            message.info('正在打开链接');
            window.open(record.shortUrl, '_blank');
          }}
        >
          {record.shortUrl}
        </a>
      ),
    },
    {
      title: '原始链接',
      dataIndex: 'longUrls',
      ellipsis: true,
      search: true,
      width: 350,
      render: (_, record) => {
        const longUrls = record.longUrls || [];
        if (longUrls.length === 0) return '-';

        if (longUrls.length === 1) {
          // 单个链接时直接显示
          return (
            <Tooltip title={longUrls[0]}>
              <a href={longUrls[0]} target="_blank" rel="noopener noreferrer">
                {longUrls[0].length > 40 ? `${longUrls[0].substring(0, 40)}...` : longUrls[0]}
              </a>
            </Tooltip>
          );
        }

        // 多个链接时显示标签
        return (
          <Space size={[0, 4]} wrap>
            {longUrls.map((url, index) => {
              const clickCount = record.urlStats?.[url] || 0;
              return (
                <Tag
                  key={index}
                  color="blue"
                  style={{ margin: '2px', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(url, '_blank');
                  }}
                >
                  <Tooltip title={`${url} (访问${clickCount}次)`}>
                    链接{index + 1}({clickCount})
                  </Tooltip>
                </Tag>
              );
            })}
            <Tag color="green">共{longUrls.length}个</Tag>
          </Space>
        );
      },
    },
    {
      title: '备注',
      dataIndex: 'remark',
      ellipsis: true,
      search: true,
      width: 200,
      render: (text) => text || '-',
    },
    {
      title: '点击量',
      dataIndex: 'clickCount',
      key: 'clickCount',
      search: false,
      width: 80,
      sorter: (a, b) => a.clickCount - b.clickCount,
      render: (count) => {
        // 转换count为数字类型再进行比较
        const clickCount = typeof count === 'string' ? parseInt(count, 10) : (count as number);

        return (
          <Badge
            count={clickCount}
            overflowCount={9999}
            showZero
            style={{
              backgroundColor: clickCount > 0 ? '#52c41a' : '#bfbfbf',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: '14px',
              padding: '0 8px',
              height: '22px',
              lineHeight: '22px',
              borderRadius: '11px',
              boxShadow: '0 0 0 1px #f0f0f0 inset',
              display: 'inline-block',
              minWidth: '22px',
              textAlign: 'center',
            }}
          />
        );
      },
    },
    {
      title: '访问记录',
      dataIndex: 'recentClicks',
      key: 'recentClicks',
      search: false,
      width: 100,
      render: (_, record) => {
        const clickCount =
          typeof record.clickCount === 'string'
            ? parseInt(record.clickCount, 10)
            : (record.clickCount as number);

        // 判断是否有权限查看点击记录
        const isOwner = record.createdBy === currentUserId || !record.createdBy;
        const canViewClickRecords = isOwner || access.canViewAllLinks?.();

        if (!canViewClickRecords) {
          return (
            <Button type="link" size="small" disabled>
              无权查看
            </Button>
          );
        }

        return clickCount > 0 ? (
          <Button type="link" size="small" onClick={() => onShowClickRecords(record._id)}>
            查看记录
          </Button>
        ) : (
          <Button type="link" size="small" disabled>
            暂无记录
          </Button>
        );
      },
    },
    {
      title: '自定义域名',
      dataIndex: 'customDomain',
      search: false,
      render: (domain) => {
        if (domain === window.location.host) {
          return '-';
        }
        return domain || '-';
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => {
        // 判断是否有权限查看详情和修改
        const isOwner = record.createdBy?._id === currentUserId || !record.createdBy;
        const canViewDetail = isOwner || access.canViewAllLinks?.();
        const canEdit = isOwner || access.canManageAllLinks?.();

        return [
          canViewDetail && (
            <a key="detail" onClick={() => onViewDetail(record._id)}>
              详情
            </a>
          ),
          canEdit && (
            <a
              key="edit"
              onClick={() => {
                onEdit(record);
              }}
            >
              编辑
            </a>
          ),
          canEdit && (
            <a
              key="delete"
              onClick={() => {
                Modal.confirm({
                  title: '确认删除',
                  content: '您确定要删除这个短链吗？',
                  onOk: async () => {
                    onDelete(record._id);
                  },
                });
              }}
            >
              删除
            </a>
          ),
        ].filter(Boolean);
      },
    },
  ];

  // 带创建用户的列定义（查看所有用户短链时使用）
  const allLinksColumns: ProColumns<LinkItem>[] = [
    ...baseColumns.slice(0, 5), // 保留前5列（短链、原始链接、备注、点击量、访问记录）
    {
      title: '创建用户',
      dataIndex: ['createdBy', 'username'],
      search: false,
      render: (_, record) => (
        <Tooltip title={record.createdBy?.email || ''}>
          {record.createdBy?.nickname || record.createdBy?.username || '-'}
        </Tooltip>
      ),
    },
    ...baseColumns.slice(5), // 添加剩余列
  ];

  return {
    baseColumns,
    allLinksColumns,
  };
};

export default useShortLinkColumns;
