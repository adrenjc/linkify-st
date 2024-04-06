import { PERMISSION_CODES } from '@/constants/permissions';
import { usePermission } from '@/hooks/usePermission';
import { createRole, deleteRole, getPermissions, getRoles, updateRole } from '@/services/role';
import type { Permission, Role } from '@/services/role/typings';
import { DeleteOutlined, EditOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Form, Input, Modal, Select, Space, Tooltip, message } from 'antd';
import { useEffect, useRef, useState } from 'react';

const RoleManagement = () => {
  const [form] = Form.useForm();
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const { hasPermission } = usePermission();

  // 获取权限列表
  const fetchPermissions = async () => {
    try {
      const response = await getPermissions();
      setPermissions(response.data || []);
    } catch (error) {}
  };

  // 在组件挂载时获取权限列表
  useEffect(() => {
    fetchPermissions();
  }, []);

  // 检查页面访问权限
  if (!hasPermission(PERMISSION_CODES.ROLE_VIEW)) {
    return <div>无权限访问此页面</div>;
  }

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      if (currentRole) {
        await updateRole(currentRole._id, values);
        message.success('角色更新成功');
      } else {
        await createRole(values);
        message.success('角色创建成功');
      }
      setModalVisible(false);
      actionRef.current?.reload();
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (record: Role) => {
    if (!hasPermission(PERMISSION_CODES.ROLE_UPDATE)) {
      message.error('没有编辑权限');
      return;
    }
    setCurrentRole(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      permissions: record.permissions?.map((p: Permission) => p._id),
    });
    setModalVisible(true);
  };

  const handleDelete = async (record: Role) => {
    if (!hasPermission(PERMISSION_CODES.ROLE_DELETE)) {
      message.error('没有删除权限');
      return;
    }

    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除角色"${record.name}"吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteRole(record._id);
          message.success('角色删除成功');
          actionRef.current?.reload();
        } catch (error: any) {}
      },
    });
  };

  const columns: ProColumns<Role>[] = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      ellipsis: true,
      render: (_, record) => {
        if (!record.permissions?.length) return '-';
        const permissionNames = record.permissions.map((p: Permission) => p.name);
        return (
          <Tooltip title={permissionNames.join(', ')}>
            <span>{permissionNames.join(', ')}</span>
          </Tooltip>
        );
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      valueType: 'dateTime',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title={record.isSystem ? '系统角色不可编辑' : '编辑'}>
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              disabled={record.isSystem}
            />
          </Tooltip>
          <Tooltip title={record.isSystem ? '系统角色不可删除' : '删除'}>
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              disabled={record.isSystem}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <ProTable<Role>
        columns={columns}
        actionRef={actionRef}
        request={async (params) => {
          try {
            const response = await getRoles(params);
            return {
              data: response.data,
              success: true,
              total: response.total,
            };
          } catch (error) {
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        rowKey="_id"
        search={false}
        pagination={{
          showQuickJumper: true,
          showSizeChanger: true,
          defaultPageSize: 10,
        }}
        dateFormatter="string"
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            onClick={() => {
              if (!hasPermission(PERMISSION_CODES.ROLE_CREATE)) {
                message.error('没有创建权限');
                return;
              }
              setCurrentRole(null);
              form.resetFields();
              setModalVisible(true);
            }}
          >
            新建角色
          </Button>,
        ]}
      />

      <Modal
        title={currentRole ? '编辑角色' : '新建角色'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setCurrentRole(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>

          <Form.Item name="description" label="角色描述">
            <Input.TextArea placeholder="请输入角色描述" rows={4} />
          </Form.Item>

          <Form.Item
            name="permissions"
            label="权限"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Select
              mode="multiple"
              placeholder="请选择权限"
              options={permissions.map((p) => ({
                label: p.name,
                value: p._id,
                description: p.description,
              }))}
              optionFilterProp="label"
              maxTagCount="responsive"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                确定
              </Button>
              <Button onClick={() => setModalVisible(false)}>取消</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default RoleManagement;
