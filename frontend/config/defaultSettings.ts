import { ProLayoutProps } from '@ant-design/pro-components';

/**
 * @name
 */
const Settings: ProLayoutProps & {
  pwa?: boolean;
} = {
  navTheme: 'light',
  colorPrimary: '#000000',
  layout: 'mix',
  contentWidth: 'Fluid',
  fixedHeader: true,
  fixSiderbar: true,
  colorWeak: false,
  title: 'Linkify',
  pwa: false,
  logo: 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
  iconfontUrl: '',
  token: {
    borderRadius: 4,
    pageContainer: {
      paddingBlockPageContainerContent: 16,
      paddingInlinePageContainerContent: 24,
      colorBgPageContainer: '#ffffff', // 统一背景色
    },
    sider: {
      colorMenuBackground: '#ffffff',
      colorBgMenuItemSelected: '#f7f7f7',
      colorTextMenuSelected: '#000000',
      colorTextMenuItemHover: '#000000',
      colorTextMenu: '#8c8c8c',
    },
    header: {
      colorBgHeader: '#ffffff',
      colorHeaderTitle: '#000000',
      colorTextMenuSelected: '#000000',
    },
  },
};

export default Settings;
