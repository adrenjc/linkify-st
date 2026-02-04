import { ProLayoutProps } from '@ant-design/pro-components';

/**
 * @name
 */
const Settings: ProLayoutProps & {
  pwa?: boolean;
} = {
  navTheme: 'light',
  colorPrimary: '#722ED1',
  layout: 'mix',
  contentWidth: 'Fluid',
  fixedHeader: true,
  fixSiderbar: true,
  colorWeak: false,
  title: 'Linkify',
  pwa: false,
  logo: 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg', // Placeholder, will replace later or generic icon
  iconfontUrl: '',
  token: {
    // Premium theme tokens
    pageContainer: {
      paddingBlockPageContainerContent: 24,
      paddingInlinePageContainerContent: 24,
    },
    sider: {
      colorMenuBackground: '#fff',
      colorTextMenu: '#5e6c84',
      colorTextMenuSelected: '#722ED1',
      colorBgMenuItemSelected: '#F9F0FF',
    },
    header: {
      colorBgHeader: 'rgba(255, 255, 255, 0.8)', // Glassmorphism effect preparation
    }
  },
};

export default Settings;
