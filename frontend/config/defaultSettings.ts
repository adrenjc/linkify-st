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
    pageContainer: {
      paddingBlockPageContainerContent: 24,
      paddingInlinePageContainerContent: 24,
      colorBgPageContainer: '#fcfcfc',
    },
    sider: {
      colorMenuBackground: '#ffffff',
      colorBgMenuItemSelected: '#f5f5f5',
      colorTextMenuSelected: '#000000',
      colorTextMenuItemHover: '#000000',
      colorTextMenu: '#595959',
    },
    header: {
      colorBgHeader: 'rgba(255, 255, 255, 0.9)',
      colorHeaderTitle: '#000000',
    }
  },
};

export default Settings;
