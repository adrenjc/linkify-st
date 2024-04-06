import { PERMISSION_CODES } from '@/constants/permissions';
import { usePermission } from '@/hooks/usePermission';
import { createUser, deleteUser, getAllUsers, updateUser } from '@/services/login';
import { getRoles } from '@/services/role';
import type { Role } from '@/services/role/typings';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Form, Input, message, Modal, Popconfirm, Select, Space, Tag } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useModel } from 'umi';

interface UserType {
  _id: string;
  username: string;
  roles: Role[];
  createdAt: string;
  isSystem: boolean;
}

const UserList: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const actionRef = useRef<ActionType>();
  const [form] = Form.useForm();
  const [roles, setRoles] = useState<Role[]>([]);

  const { initialState } = useModel('@@initialState');
  const { currentUser: globalCurrentUser } = initialState || {};

  const { hasPermission } = usePermission();

  const fetchRoles = async () => {
    try {
      const response = await getRoles();
      setRoles(response.data || []);
    } catch (error) {}
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  if (!hasPermission(PERMISSION_CODES.USER_VIEW)) {
    return <div>无权限访问此页面</div>;
  }

  const handleEdit = (user: UserType) => {
    if (!hasPermission(PERMISSION_CODES.USER_UPDATE)) {
      message.error('没有编辑权限');
      return;
    }
    setCurrentUser(user);
    setIsModalVisible(true);
    setIsEditing(true);
    form.setFieldsValue({
      username: user.username,
      password: '',
      roles: user.roles?.map((role: any) => role._id) || [],
    });
  };

  const handleOk = async (values: any) => {
    try {
      if (isEditing) {
        if (!currentUser) {
          message.error('当前用户信息无效');
          return;
        }
        await updateUser(
          {
            username: values.username,
            password: values.password,
            roles: values.roles,
          },
          currentUser._id,
        );
        message.success('用户信息更新成功');
      } else {
        await createUser({
          username: values.username,
          password: values.password,
          roles: values.roles,
        });
        message.success('用户新增成功');
      }
      setIsModalVisible(false);
      setCurrentUser(null);
      if (actionRef.current) {
        actionRef.current.reload();
      }
    } catch (error: any) {}
  };

  const handleDelete = async (id: string) => {
    if (!hasPermission(PERMISSION_CODES.USER_DELETE)) {
      message.error('没有删除权限');
      return;
    }
    try {
      await deleteUser(id);
      message.success('删除成功');
      if (actionRef.current) {
        actionRef.current.reload();
      }
    } catch (error: any) {
      message.error(error.message || '删除失败');
    }
  };

  const columns: ProColumns<UserType>[] = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      search: true,
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      search: false,
      render: (_, record) => (
        <Space>
          {record.roles?.map((role) => (
            <Tag key={role._id} color={role.isSystem ? 'blue' : 'default'}>
              {role.name}
            </Tag>
          )) || '-'}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      search: false,
      render: (_, record) => <span>{new Date(record.createdAt).toLocaleString('zh-CN')}</span>,
    },
    {
      title: '操作',
      key: 'action',
      search: false,
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={!hasPermission(PERMISSION_CODES.USER_UPDATE)}
          />
          <Popconfirm
            title="确定要删除该用户吗？"
            onConfirm={() => handleDelete(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              disabled={!hasPermission(PERMISSION_CODES.USER_DELETE) || record.isSystem}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <ProTable<UserType>
        columns={columns}
        request={async (params) => {
          try {
            const { current, pageSize, ...searchParams } = params;
            const response = await getAllUsers({
              page: current,
              pageSize,
              ...searchParams,
            });

            return {
              data: response.data,
              success: response.success,
              total: response.total,
            };
          } catch (error) {
            message.error('获取用户列表失败');
            return { data: [], success: false };
          }
        }}
        rowKey="_id"
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
        search={{
          labelWidth: 'auto',
          defaultCollapsed: false,
        }}
        actionRef={actionRef}
        toolBarRender={() => [
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              if (!hasPermission(PERMISSION_CODES.USER_CREATE)) {
                message.error('没有创建权限');
                return;
              }
              setIsModalVisible(true);
              setIsEditing(false);
              setCurrentUser(null);
              form.resetFields();
            }}
          >
            新增用户
          </Button>,
        ]}
      />
      <Modal
        title={isEditing ? '编辑用户' : '新增用户'}
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          setCurrentUser(null);
          form.resetFields();
        }}
        footer={null}
        width={520}
        destroyOnClose
        maskClosable={false}
        centered
      >
        <Form
          form={form}
          onFinish={handleOk}
          labelCol={{ span: 4 }}
          wrapperCol={{ span: 19 }}
          layout="horizontal"
          autoComplete="off"
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: !isEditing, message: '请输入密码' }]}
          >
            <Input.Password placeholder={isEditing ? '不修改请留空' : '请输入密码'} />
          </Form.Item>
          <Form.Item name="roles" label="角色" rules={[{ required: true, message: '请选择角色' }]}>
            <Select
              mode="multiple"
              placeholder="请选择角色"
              options={roles.map((role) => ({
                label: role.name,
                value: role._id,
                disabled: role.isSystem && globalCurrentUser?.username !== 'admin',
              }))}
              optionFilterProp="label"
            />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 4, span: 19 }}>
            <Space>
              <Button type="primary" htmlType="submit">
                确定
              </Button>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  setCurrentUser(null);
                  form.resetFields();
                }}
              >
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserList;
