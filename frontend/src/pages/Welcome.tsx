import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Statistic } from 'antd';
import { createStyles } from 'antd-style';
import React from 'react';

const useStyles = createStyles(() => ({
  statCard: {
    background: '#ffffff',
    padding: '32px 24px',
    borderRadius: '4px', // 统一微圆角
    border: '1px solid #f0f0f0',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&:hover': {
      borderColor: '#000000',
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 24px rgba(0,0,0,0.03)',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: '0',
      left: '0',
      width: '100%',
      height: '1px',
      background: '#000000',
      transform: 'scaleX(0)',
      transition: 'transform 0.3s ease',
      transformOrigin: 'right',
    },
    '&:hover::after': {
      transform: 'scaleX(1)',
      transformOrigin: 'left',
    },
  },
  statLabel: {
    color: '#8c8c8c',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '16px',
    display: 'block',
  },
  statTrend: {
    fontSize: '11px',
    marginTop: '16px',
    color: '#bfbfbf',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  trendValue: {
    color: '#333333',
    fontWeight: 600,
  },
  chartCard: {
    borderRadius: '4px',
    border: '1px solid #f0f0f0',
    background: '#ffffff',
  },
  chartHeader: {
    padding: '24px',
    borderBottom: '1px solid #f5f5f5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#000000',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  chartPlaceholder: {
    height: '400px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#fcfcfc',
    color: '#d9d9d9',
    fontSize: '12px',
    letterSpacing: '1px',
    textTransform: 'uppercase',
  },
}));

const Welcome: React.FC = () => {
  const { styles } = useStyles();

  const stats = [
    { label: '总链接数', value: 1284, trend: '+12%', up: true },
    { label: '本月点击', value: 45231, trend: '+5.4%', up: true },
    { label: '系统负载', value: 12, suffix: '%', trend: '稳定', up: true },
    { label: '异常拦截', value: 24, trend: '-8%', up: true },
  ];

  return (
    <PageContainer 
      header={{
        title: '仪表盘',
        subTitle: '业务数据实时概览',
      }}
    >
      <Row gutter={[24, 24]}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>{stat.label}</span>
              <Statistic 
                value={stat.value} 
                suffix={stat.suffix}
                valueStyle={{ fontWeight: 800, fontSize: '28px', color: '#000000', letterSpacing: '-0.5px' }} 
              />
              <div className={styles.statTrend}>
                趋势 <span className={styles.trendValue}>{stat.trend}</span>
              </div>
            </div>
          </Col>
        ))}

        <Col span={24}>
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <div className={styles.chartTitle}>访问量分时统计</div>
              <div style={{ fontSize: '11px', color: '#8c8c8c' }}>实时更新中</div>
            </div>
            <div className={styles.chartPlaceholder}>
              可视化看板组件加载中...
            </div>
          </div>
        </Col>
      </Row>
    </PageContainer>
  );
};

export default Welcome;
