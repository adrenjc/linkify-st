import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Form, Input, Select, Space } from 'antd';
import { useEffect } from 'react';
import { MAX_LONG_URLS_COUNT } from '../../../constants/shortLinkConfig';
import { DomainItem, LinkItem } from '../types';

const { TextArea } = Input;

interface CreateEditFormProps {
  form: any;
  currentItem: LinkItem | null;
  domains: DomainItem[];
  onFinish?: (values: any) => Promise<void>;
}

const CreateEditForm: React.FC<CreateEditFormProps> = ({
  form,
  currentItem,
  domains,
  onFinish,
}) => {
  // 当currentItem变化时重置表单
  useEffect(() => {
    if (currentItem) {
      form.setFieldsValue({
        longUrls: currentItem.longUrls || [],
        customDomain: currentItem.customDomain,
        customShortKey: currentItem.shortKey,
        remark: currentItem.remark,
      });
    } else {
      form.resetFields();
      // 新建时默认添加一个空的URL字段
      form.setFieldsValue({
        longUrls: [''],
      });
    }
  }, [form, currentItem]);

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.List
        name="longUrls"
        rules={[
          {
            validator: async (_, value) => {
              if (!value || value.length === 0) {
                throw new Error('至少需要添加一个原始链接');
              }
              if (value.length > MAX_LONG_URLS_COUNT) {
                throw new Error(`最多只能添加${MAX_LONG_URLS_COUNT}个原始链接`);
              }
            },
          },
        ]}
      >
        {(fields, { add, remove }) => (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                原始链接 (最多可添加{MAX_LONG_URLS_COUNT}个，访问时随机跳转)
              </label>
              {fields.map(({ key, name, ...restField }) => (
                <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                  <Form.Item
                    {...restField}
                    name={name}
                    rules={[
                      { required: true, message: '请输入有效的URL' },
                      { type: 'url', message: '请输入有效的URL格式' },
                    ]}
                    style={{ flex: 1, minWidth: 300 }}
                  >
                    <Input placeholder="https://example.com" />
                  </Form.Item>
                  {fields.length > 1 && (
                    <MinusCircleOutlined
                      className="dynamic-delete-button"
                      onClick={() => remove(name)}
                      style={{ color: '#ff4d4f' }}
                    />
                  )}
                </Space>
              ))}
              <Form.Item>
                <Button
                  type="dashed"
                  onClick={() => add()}
                  block
                  icon={<PlusOutlined />}
                  disabled={fields.length >= MAX_LONG_URLS_COUNT}
                >
                  {fields.length >= MAX_LONG_URLS_COUNT
                    ? `已达到最大数量限制 (${MAX_LONG_URLS_COUNT}个)`
                    : `添加原始链接 (${fields.length}/${MAX_LONG_URLS_COUNT})`}
                </Button>
              </Form.Item>
            </div>
          </>
        )}
      </Form.List>

      <Form.Item
        label="自定义短链key"
        name="customShortKey"
        extra="可选，长度4-6位，不填则自动生成"
        rules={[
          {
            min: 4,
            max: 6,
            message: '长度必须在4-6位之间',
          },
          {
            pattern: /^[a-zA-Z0-9-_]+$/,
            message: '只能包含字母、数字、下划线和横线',
          },
        ]}
      >
        <Input placeholder="请输入自定义短链key" />
      </Form.Item>

      <Form.Item
        label="备注"
        name="remark"
        extra="选填，最多256个字符"
        rules={[
          {
            max: 256,
            message: '备注最多256个字符',
          },
        ]}
      >
        <TextArea
          placeholder="请输入备注信息"
          autoSize={{ minRows: 2, maxRows: 6 }}
          maxLength={256}
          showCount
        />
      </Form.Item>

      <Form.Item label="自定义域名" name="customDomain" extra="如不选择则使用默认域名">
        <Select
          allowClear
          placeholder="选择域名"
          options={domains
            .filter((d) => d.verified)
            .map((d) => ({
              label: `${d.domain}`,
              value: d.domain,
            }))}
        />
      </Form.Item>
    </Form>
  );
};

export default CreateEditForm;
