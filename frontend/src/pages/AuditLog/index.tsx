import { ACTION_MAP, RESOURCE_TYPE_MAP } from '@/constants/auditLogTypes';
import type { AuditLog } from '@/services/auditLog';
import { getAuditLogs } from '@/services/auditLog';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-layout';
import type { ActionType, ProColumns } from '@ant-design/pro-table';
import ProTable from '@ant-design/pro-table';
import { Alert, Space, Tag, Tooltip } from 'antd';
import React, { useRef, useState } from 'react';

const AuditLogList: React.FC = () => {
  const actionRef = useRef<ActionType>();

  // 添加状态来存储当前的筛选条件
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({});

  // 格式化日期范围
  const formatDateRange = (dates: string[] | undefined) => {
    if (!dates?.length || dates.length < 2) return '未设置';
    try {
      return `${new Date(dates[0]).toLocaleDateString()} 至 ${new Date(
        dates[1],
      ).toLocaleDateString()}`;
    } catch (error) {
      console.error('日期格式化错误:', error);
      return '日期格式错误';
    }
  };

  // 获取筛选条件的显示文本
  const getFilterText = (key: string, value: any) => {
    if (value === undefined || value === null) return '未设置';

    try {
      switch (key) {
        case 'createdAt':
          return `时间范围: ${formatDateRange(value)}`;
        case 'status':
          return `状态: ${value === 'SUCCESS' ? '成功' : value === 'FAILURE' ? '失败' : '未知'}`;
        case 'action':
          return `操作类型: ${ACTION_MAP[value as keyof typeof ACTION_MAP]?.text || '未知操作'}`;
        case 'resourceType':
          return `资源类型: ${
            RESOURCE_TYPE_MAP[value as keyof typeof RESOURCE_TYPE_MAP]?.text || '未知类型'
          }`;
        case 'userId':
          return `用户: ${value || '未知用户'}`;
        case 'ipAddress':
          return `IP地址: ${value || '未知IP'}`;
        default:
          return `${key}: ${value || '未知'}`;
      }
    } catch (error) {
      console.error('获取筛选文本错误:', error);
      return '数据错误';
    }
  };

  const columns: ProColumns<AuditLog>[] = [
    {
      title: '操作时间',
      dataIndex: 'createdAt',
      valueType: 'dateRange',
      search: {
        transform: (value) => {
          return {
            startDate: value?.[0],
            endDate: value?.[1],
          };
        },
      },
      render: (_, record) => (record.createdAt ? new Date(record.createdAt).toLocaleString() : '-'),
      width: 180,
    },
    {
      title: '用户',
      dataIndex: 'userId',
      fieldProps: {
        placeholder: '输入用户名搜索',
      },
      render: (_, record) => {
        try {
          if (!record?.userId) return <span className="text-gray-400">未知用户</span>;

          const username = record.userId.username;

          if (!username) return <span className="text-gray-400">未知用户</span>;

          return <span>{username}</span>;
        } catch (error) {
          console.error('用户信息渲染错误:', error);
          return <span className="text-red-500">数据错误</span>;
        }
      },
    },
    {
      title: (
        <>
          操作类型
          <Tooltip title="用户在系统中执行的具体操作">
            <QuestionCircleOutlined style={{ marginLeft: 4 }} />
          </Tooltip>
        </>
      ),
      dataIndex: 'action',
      valueEnum: Object.fromEntries(
        Object.entries(ACTION_MAP).map(([key, value]) => [key, { text: value.text }]),
      ),
      render: (_, record) => {
        const action = ACTION_MAP[record.action as keyof typeof ACTION_MAP];
        return action ? <Tag color={action.color}>{action.text}</Tag> : record.action;
      },
    },
    {
      title: '资源类型',
      dataIndex: 'resourceType',
      valueEnum: Object.fromEntries(
        Object.entries(RESOURCE_TYPE_MAP).map(([key, value]) => [key, { text: value.text }]),
      ),
      render: (_, record) => {
        const type = RESOURCE_TYPE_MAP[record.resourceType as keyof typeof RESOURCE_TYPE_MAP];
        return type ? <Tag color={type.color}>{type.text}</Tag> : record.resourceType;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      ellipsis: true,
      width: 300,
    },
    // {
    //   title: 'IP地址',
    //   dataIndex: 'ipAddress',
    //   width: 130,
    // },
    // {
    //   title: '浏览器信息',
    //   dataIndex: 'userAgent',
    //   ellipsis: true,
    //   width: 200,
    //   search: false,
    // },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: {
        SUCCESS: { text: '成功', status: 'Success' },
        FAILURE: { text: '失败', status: 'Error' },
      },
      render: (_, record) => (
        <Tag color={record.status === 'SUCCESS' ? 'success' : 'error'}>
          {record.status === 'SUCCESS' ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '设备信息',
      dataIndex: 'deviceInfo',
      width: 200,
      search: false,
      render: (_, record) => {
        try {
          if (!record.deviceInfo) return <span className="text-gray-400">-</span>;

          const maxLength = 20;
          const browser = record.deviceInfo.browser || '未知浏览器';
          const os = record.deviceInfo.os || '未知系统';
          const device = record.deviceInfo.device || '未知设备';

          const displayText = `${browser} / ${os}`;
          const shortText =
            displayText.length > maxLength ? `${displayText.slice(0, maxLength)}...` : displayText;

          return (
            <Tooltip title={`浏览器: ${browser}\n系统: ${os}\n设备: ${device}`}>
              <span>{shortText}</span>
            </Tooltip>
          );
        } catch (error) {
          console.error('设备信息渲染错误:', error);
          return <span className="text-red-500">设备信息错误</span>;
        }
      },
    },
  ];

  return (
    <PageContainer>
      {/* 添加筛选条件展示区域 */}
      {Object.keys(activeFilters).length > 0 && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={
            <Space direction="vertical">
              <Space wrap>
                <span>当前筛选条件:</span>
                {Object.entries(activeFilters).map(([key, value]) => {
                  if (!value) return null;
                  try {
                    return (
                      <Tag key={key} color="blue" style={{ padding: '4px 8px' }}>
                        {getFilterText(key, value)}
                      </Tag>
                    );
                  } catch (error) {
                    console.error('筛选条件渲染错误:', error);
                    return null;
                  }
                })}
              </Space>
            </Space>
          }
        />
      )}

      <ProTable<AuditLog>
        headerTitle="审计日志"
        actionRef={actionRef}
        rowKey="_id"
        search={{
          labelWidth: 120,
        }}
        request={async (params) => {
          try {
            // 更新筛选条件状态
            const {
              createdAt,
              status,
              action,
              resourceType,
              userId,
              ipAddress,
              current,
              pageSize,
              ...rest
            } = params;

            const filters = {
              createdAt,
              status,
              action,
              resourceType,
              userId,
              ipAddress,
            };

            // 过滤掉空值
            const activeFilters = Object.fromEntries(
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              Object.entries(filters).filter(([_, v]) => v !== undefined && v !== null && v !== ''),
            );

            setActiveFilters(activeFilters);

            // 构建查询参数
            const queryParams = {
              current,
              pageSize,
              // 如果有时间范围，则添加开始和结束时间
              ...(createdAt && {
                startDate: createdAt[0],
                endDate: createdAt[1],
              }),
              // 其他查询条件
              ...(userId && { userId }),
              ...(action && { action }),
              ...(resourceType && { resourceType }),
              ...(ipAddress && { ipAddress }),
              ...(status && { status }),
              ...rest,
            };

            const response = await getAuditLogs(queryParams);

            if (!response || !response.data) {
              return {
                data: [],
                success: false,
                total: 0,
              };
            }

            return {
              data: response.data,
              success: response.success ?? false,
              total: response.total ?? 0,
            };
          } catch (error) {
            console.error('获取审计日志错误:', error);
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        columns={columns}
        pagination={{
          showQuickJumper: true,
          showSizeChanger: true,
        }}
      />
    </PageContainer>
  );
};

export default AuditLogList;
