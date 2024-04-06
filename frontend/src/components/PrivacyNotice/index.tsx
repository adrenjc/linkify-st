import { SecurityScanOutlined } from '@ant-design/icons';
import { Alert, Button, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

const { Text, Link } = Typography;

/**
 * 隐私政策通知组件
 * 用于提醒用户我们使用 Google Analytics 收集数据
 */
const PrivacyNotice: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // 直接设置为已接受，不显示通知
    localStorage.setItem('privacy-policy-accepted', 'true');
    localStorage.setItem('privacy-policy-accepted-time', new Date().toISOString());
    setVisible(false);
  }, []);

  const handleAccept = () => {
    localStorage.setItem('privacy-policy-accepted', 'true');
    localStorage.setItem('privacy-policy-accepted-time', new Date().toISOString());
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('privacy-policy-declined', 'true');
    setVisible(false);
    // 可以在这里禁用 GA 追踪
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: 'denied',
      });
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        right: 20,
        zIndex: 1000,
        maxWidth: 600,
        margin: '0 auto',
      }}
    >
      <Alert
        message={
          <Space direction="vertical" size="small">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SecurityScanOutlined />
              <Text strong>隐私与数据收集提醒</Text>
            </div>
            <Text type="secondary">
              我们使用 Google Analytics 来分析网站使用情况和改进用户体验。
              这包括收集设备信息、访问页面、点击行为等数据。
              所有数据都已匿名化处理，不会收集个人身份信息。
            </Text>
            <div>
              <Text type="secondary">
                继续使用本站即表示您同意我们的数据收集方式。 详情请查看我们的
                <Link href="#" target="_blank">
                  隐私政策
                </Link>
                。
              </Text>
            </div>
          </Space>
        }
        type="info"
        showIcon
        action={
          <Space>
            <Button size="small" onClick={handleDecline}>
              拒绝
            </Button>
            <Button size="small" type="primary" onClick={handleAccept}>
              接受
            </Button>
          </Space>
        }
        closable={false}
      />
    </div>
  );
};

export default PrivacyNotice;
