import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Statistic } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(() => ({
  statCard: {
    background: '#fff',
    padding: '24px',
    borderRadius: '0', // Square edges
    boxShadow: '0 0 1px rgba(0,0,0,0.1)',
    border: '1px solid #f0f0f0',
    transition: 'all 0.3s ease',
    '&:hover': {
      borderColor: '#000',
      transform: 'translateY(-2px)',
      boxShadow: '0 10px 20px rgba(0,0,0,0.05)',
    },
  },
  statLabel: {
    color: '#8c8c8c',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '12px',
  },
  statTrend: {
    fontSize: '11px',
    marginTop: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#bfbfbf',
  },
  trendValue: {
    color: '#000',
    fontWeight: 700,
  },
  chartCard: {
    borderRadius: '0',
    border: '1px solid #f0f0f0',
    boxShadow: '0 0 1px rgba(0,0,0,0.1)',
  },
  chartTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '24px',
  },
  chartPlaceholder: {
    height: '320px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fcfcfc',
    border: '1px dashed #e8e8e8',
    color: '#bfbfbf',
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '2px',
  },
}));

const Welcome: React.FC = () => {
  const { styles } = useStyles();

  const stats = [
    { label: '总链接数', value: 1284, trend: '+12%', up: true },
    { label: '总访问量', value: 45231, trend: '+5.4%', up: true },
    { label: '活跃用户', value: 321, trend: '-2%', up: false },
    { label: '转化率', value: 2.4, suffix: '%', trend: '+0.8%', up: true },
  ];

  return (
    <PageContainer 
      title="控制台" 
      subTitle="数据概览"
    >
      <Row gutter={[24, 24]}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>{stat.label}</div>
              <Statistic 
                value={stat.value} 
                suffix={stat.suffix}
                valueStyle={{ fontWeight: 900, fontSize: '32px', color: '#000000', letterSpacing: '-1px' }} 
              />
              <div className={styles.statTrend}>
                较上周 <span className={styles.trendValue}>{stat.trend}</span>
              </div>
            </div>
          </Col>
        ))}

        <Col span={24}>
          <Card bordered={false} className={styles.chartCard}>
            <div className={styles.chartTitle}>链路访问统计</div>
            <div className={styles.chartPlaceholder}>
              数据看板加载中...
            </div>
          </Card>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default Welcome;
