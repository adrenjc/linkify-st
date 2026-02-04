import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Statistic } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(() => ({
  statCard: {
    background: '#fff',
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    border: '1px solid #f0f0f0',
    transition: 'box-shadow 0.2s ease',
    '&:hover': {
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    },
  },
  statLabel: {
    color: '#6b7280',
    fontSize: '13px',
    fontWeight: 500,
    marginBottom: '8px',
  },
  statTrend: {
    fontSize: '12px',
    marginTop: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  trendUp: {
    color: '#10b981',
  },
  trendDown: {
    color: '#ef4444',
  },
  trendText: {
    color: '#9ca3af',
  },
  chartCard: {
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '24px',
  },
  chartPlaceholder: {
    height: '280px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
    borderRadius: '12px',
    color: '#9ca3af',
    fontSize: '14px',
  },
}));

const Dashboard: React.FC = () => {
  const { styles } = useStyles();

  const stats = [
    { label: 'Total Links', value: 1284, trend: '+12%', up: true },
    { label: 'Total Clicks', value: 45231, trend: '+5.4%', up: true },
    { label: 'Active Users', value: 321, trend: '-2%', up: false },
    { label: 'Conversion Rate', value: 2.4, suffix: '%', trend: '+0.8%', up: true },
  ];

  return (
    <PageContainer title="Dashboard" header={{ title: 'Overview', breadcrumb: {} }}>
      <Row gutter={[24, 24]}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>{stat.label}</div>
              <Statistic 
                value={stat.value} 
                suffix={stat.suffix}
                valueStyle={{ fontWeight: 700, fontSize: '28px', color: '#1f2937' }} 
              />
              <div className={styles.statTrend}>
                <span className={stat.up ? styles.trendUp : styles.trendDown}>{stat.trend}</span>
                <span className={styles.trendText}>vs last week</span>
              </div>
            </div>
          </Col>
        ))}

        <Col span={24}>
          <Card bordered={false} className={styles.chartCard}>
            <div className={styles.chartTitle}>Traffic Analytics</div>
            <div className={styles.chartPlaceholder}>
              Chart will be displayed here
            </div>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default Dashboard;
