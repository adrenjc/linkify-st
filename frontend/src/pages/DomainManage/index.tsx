import { PERMISSION_CODES } from '@/constants/permissions';
import { usePermission } from '@/hooks/usePermission';
import {
  addDomain,
  deleteDomain,
  fetchAllDomains,
  recheckDomain,
  // renewSSLCertificate,
  verifyDomain,
} from '@/services/domain';
import { PlusOutlined } from '@ant-design/icons';
import { ActionType, ProColumns, ProTable } from '@ant-design/pro-components';
import { Button, Form, Input, Modal, Tag, Typography, message } from 'antd';
import { useRef, useState } from 'react';
const { Paragraph } = Typography;

type DomainItem = {
  _id: string;
  domain: string;
  verified: boolean;
  verificationCode: string;
  createdAt: string;
  user: {
    username: string;
    email: string;
  };
  sslCertificate?: {
    issuedAt: string;
    expiresAt: string;
    status: 'pending' | 'active' | 'expired' | 'error';
  };
  sslRemainingDays: number | null;
  sslStatus: 'pending' | 'active' | 'renewal-needed' | 'expired';
};

export default () => {
  const [form] = Form.useForm();
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [currentDomain, setCurrentDomain] = useState<DomainItem | null>(null);
  const [loading, setLoading] = useState(false);

  const { hasPermission } = usePermission();

  const handleSubmit = async (values: { domain: string }) => {
    setLoading(true);
    try {
      const res = await addDomain(values.domain);
      if (res.success) {
        message.success('域名添加成功');
        setCurrentDomain(res.data);
        setModalVisible(false);
        setVerifyModalVisible(true);
        actionRef.current?.reload();
      }
    } catch (error: any) {
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (domain: string) => {
    setLoading(true);
    try {
      const res = await verifyDomain(domain);
      if (res.success) {
        message.success('域名验证成功');
        setVerifyModalVisible(false);
        actionRef.current?.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  const columns: ProColumns<DomainItem>[] = [
    {
      title: '域名',
      dataIndex: 'domain',
      ellipsis: true,
    },
    {
      title: '所属用户',
      dataIndex: ['user', 'username'],
      ellipsis: true,
    },
    {
      title: '验证状态',
      dataIndex: 'verified',
      search: false,
      render: (_, record) => (
        <Tag color={record.verified ? 'success' : 'warning'}>
          {record.verified ? '已验证' : '未验证'}
        </Tag>
      ),
    },
    // {
    //   title: 'SSL 证书状态',
    //   dataIndex: 'sslStatus',
    //   search: false,
    //   render: (_, record) => {
    //     const getStatusConfig = (status: string) => {
    //       switch (status) {
    //         case 'active':
    //           return { color: 'success', text: '正常' };
    //         case 'renewal-needed':
    //           return { color: 'warning', text: '需要续期' };
    //         case 'expired':
    //           return { color: 'error', text: '已过期' };
    //         case 'pending':
    //         default:
    //           return { color: 'default', text: '未配置' };
    //       }
    //     };

    //     const config = getStatusConfig(record.sslStatus);
    //     return (
    //       <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
    //         <Tag color={config.color}>{config.text}</Tag>
    //         {record.sslRemainingDays !== null && (
    //           <div style={{ fontSize: '12px', color: '#666' }}>
    //             {record.sslRemainingDays > 0 ? `剩余 ${record.sslRemainingDays} 天` : '已过期'}
    //           </div>
    //         )}
    //         {(record.sslStatus === 'renewal-needed' || record.sslStatus !== 'expired') &&
    //           hasPermission(PERMISSION_CODES.DOMAIN_MANAGE) && (
    //             <Button
    //               type="link"
    //               size="small"
    //               icon={<SyncOutlined />}
    //               onClick={async () => {
    //                 const result = await renewSSLCertificate(record.domain);
    //                 if (result.success) {
    //                   message.success('SSL 证书更新成功');
    //                   actionRef.current?.reload();
    //                 }
    //               }}
    //             >
    //               更新证书
    //             </Button>
    //           )}
    //       </div>
    //     );
    //   },
    // },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      valueType: 'dateTime',
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      render: (_, record) => [
        !record.verified && (
          <a
            key="verify"
            onClick={() => {
              setCurrentDomain(record);
              setVerifyModalVisible(true);
            }}
          >
            验证
          </a>
        ),
        record.verified && (
          <a
            key="recheck"
            onClick={async () => {
              try {
                const result = await recheckDomain(record.domain);
                if (result.success) {
                  message.info(result.message);
                  actionRef.current?.reload();
                } else {
                  message.info(result.message);
                }
              } catch (error: any) {}
            }}
          >
            重新验证
          </a>
        ),
        hasPermission(PERMISSION_CODES.DOMAIN_DELETE) && (
          <a
            key="delete"
            onClick={() => {
              Modal.confirm({
                title: '确认删除',
                content: (
                  <div>
                    <p>删除域名将同时：</p>
                    <ul>
                      <li>删除该域名的所有配置信息</li>
                      <li>删除使用该域名的所有短链接</li>
                      <li>相关短链接将无法访问</li>
                    </ul>
                    <p>此操作不可恢复，是否继续？</p>
                  </div>
                ),
                okText: '确认删除',
                okType: 'danger',
                cancelText: '取消',
                onOk: async () => {
                  const result = await deleteDomain(record.domain);
                  if (result.success) {
                    message.success(result.message || '域名及相关短链删除成功');
                    actionRef?.current?.reload();
                  }
                },
              });
            }}
          >
            删除
          </a>
        ),
      ],
    },
  ];

  return (
    <>
      <ProTable<DomainItem>
        columns={columns}
        actionRef={actionRef}
        search={{
          labelWidth: 120,
        }}
        rowKey="_id"
        request={async (params = {}) => {
          const res = await fetchAllDomains(params);
          return {
            data: res.data,
            success: res.success,
            total: res.total,
          };
        }}
        pagination={{
          showQuickJumper: true,
          showSizeChanger: true,
        }}
        toolBarRender={() => [
          hasPermission(PERMISSION_CODES.DOMAIN_CREATE) && (
            <Button
              key="add"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                form.resetFields();
                setModalVisible(true);
              }}
            >
              添加域名
            </Button>
          ),
        ]}
      />

      {/* 添加域名弹窗 */}
      <Modal
        title="添加域名"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            label="域名"
            name="domain"
            rules={[
              { required: true, message: '请输入域名' },
              {
                pattern: /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/,
                message: '请输入有效的域名格式',
              },
            ]}
            extra="例如：example.com"
          >
            <Input placeholder="请输入域名" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 域名验证弹窗 */}
      <Modal
        title="域名验证"
        open={verifyModalVisible}
        onCancel={() => setVerifyModalVisible(false)}
        onOk={() => currentDomain && handleVerify(currentDomain.domain)}
        confirmLoading={loading}
        okText="验证"
        width={600}
      >
        <Typography>
          <Paragraph>
            <strong>第一步：添加 A 记录（必需）</strong>
          </Paragraph>
          <Paragraph>请在您的域名解析服务商处添加以下 A 记录：</Paragraph>
          <Paragraph>
            <ul>
              <li>
                <strong>主机记录：</strong> @
              </li>
              <li>
                <strong>记录类型：</strong> A
              </li>
              <li>
                <strong>记录值：</strong>
                <Paragraph copyable>38.95.121.181</Paragraph>
              </li>
              <li>
                <strong>TTL:</strong> 600
              </li>
            </ul>
          </Paragraph>

          <Paragraph>
            <strong>第二步：添加 TXT 记录（验证所有权）</strong>
          </Paragraph>
          <Paragraph>在相同的域名解析页面添加以下 TXT 记录：</Paragraph>
          <Paragraph>
            <ul>
              <li>
                <strong>主机记录：</strong> @
              </li>
              <li>
                <strong>记录类型：</strong> TXT
              </li>
              <li>
                <strong>记录值：</strong>
                <Paragraph copyable>{currentDomain?.verificationCode}</Paragraph>
              </li>
              <li>
                <strong>TTL:</strong> 600
              </li>
            </ul>
          </Paragraph>

          <Paragraph type="secondary">
            注意事项：
            <ul>
              <li>两条记录都必须添加才能完成验证</li>
              <li>A 记录用于将域名指向我们的服务器</li>
              <li>TXT 记录用于验证域名所有权</li>
              <li>DNS 解析生效可能需要几分钟到几小时不等</li>
              <li>如果验证失败，请确保两条记录都已正确添加并等待解析生效</li>
            </ul>
          </Paragraph>

          <Paragraph type="secondary">
            常见问题：
            <ul>
              <li>验证失败：请检查记录是否正确添加，等待 DNS 生效后重试</li>
              <li>无法访问：请确保 A 记录已正确设置并生效</li>
              <li>{`配置后仍显示未验证：请点击"验证"按钮进行验证`}</li>
            </ul>
          </Paragraph>
        </Typography>
      </Modal>
    </>
  );
};
