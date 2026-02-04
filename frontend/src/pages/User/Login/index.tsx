import { AUTH_TOKEN_KEY } from '@/constants/auth';
import { currentUser, login } from '@/services/login/';
import { Helmet, history, useModel } from '@umijs/max';
import { message, Tabs } from 'antd';
import { createStyles } from 'antd-style';
import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import Settings from '../../../../config/defaultSettings';

const useStyles = createStyles(() => ({
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#ffffff',
    position: 'relative',
    overflow: 'hidden',
    padding: '24px',
  },
  bgDecor: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: 'radial-gradient(circle at 10% 20%, rgba(0, 0, 0, 0.02) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(0, 0, 0, 0.03) 0%, transparent 40%)',
    zIndex: 1,
  },
  loginCard: {
    width: '100%',
    maxWidth: '440px',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(30px)',
    borderRadius: '4px', // 与内部页面对齐的微圆角
    padding: '48px 40px',
    boxShadow: '0 0 1px rgba(0, 0, 0, 0.1), 0 10px 30px rgba(0, 0, 0, 0.03)',
    border: '1px solid #f0f0f0', // 柔和的边框
    zIndex: 10,
    transition: 'all 0.3s ease',
    '&:hover': {
      borderColor: '#000000',
      boxShadow: '0 0 1px rgba(0, 0, 0, 0.2), 0 20px 40px rgba(0, 0, 0, 0.06)',
    },
  },
  headerArea: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#000000',
    letterSpacing: '-0.5px',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: '11px',
    color: '#999999',
    letterSpacing: '1px',
    marginTop: '6px',
    textTransform: 'uppercase',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#333333',
  },
  input: {
    width: '100%',
    padding: '10px 0',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '1px solid #e0e0e0',
    borderRadius: '0',
    fontSize: '15px',
    color: '#000000',
    transition: 'all 0.2s ease',
    outline: 'none',
    '&:focus': {
      borderBottomColor: '#000000',
    },
    '&::placeholder': {
      color: '#d0d0d0',
    },
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#000000',
    border: 'none',
    borderRadius: '4px', // 统一圆角
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '12px',
    '&:hover': {
      backgroundColor: '#333333',
      transform: 'translateY(-1px)',
    },
    '&:disabled': {
      backgroundColor: '#e0e0e0',
      cursor: 'not-allowed',
    },
  },
  footerText: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '11px',
    color: '#bfbfbf',
  },
  copyright: {
    position: 'absolute',
    bottom: '32px',
    fontSize: '11px',
    color: '#cccccc',
    letterSpacing: '0.5px',
    zIndex: 10,
  },
}));

const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState('login');
  const { setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        try {
          const userInfo = await currentUser();
          if (userInfo?.data) {
            flushSync(() => {
              setInitialState((s) => ({ ...s, currentUser: userInfo.data }));
            });
            const urlParams = new URL(window.location.href).searchParams;
            history.push(urlParams.get('redirect') || '/');
          }
        } catch (error: any) {
          if (error.response?.status === 401) {
            localStorage.removeItem(AUTH_TOKEN_KEY);
          }
        }
      }
    };
    checkToken();
  }, [setInitialState]);

  const fetchUserInfo = async () => {
    const userInfo = await currentUser();
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({ ...s, currentUser: userInfo.data }));
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(loginForm);
      if (result.token) {
        message.success('欢迎回来');
        await fetchUserInfo();
        const urlParams = new URL(window.location.href).searchParams;
        history.push(urlParams.get('redirect') || '/');
      }
    } catch (error) {
       // handled by request middleware usually
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.bgDecor} />
      <Helmet>
        <title>登录 - {Settings.title}</title>
      </Helmet>

      <div className={styles.loginCard}>
        <div className={styles.headerArea}>
          <div className={styles.title}>LINKIFY</div>
          <div className={styles.subtitle}> minimalist link management </div>
        </div>

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>账号</label>
            <input
              type="text"
              className={styles.input}
              placeholder="请输入用户名"
              value={loginForm.username}
              onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>密码</label>
            <input
              type="password"
              className={styles.input}
              placeholder="请输入密码"
              value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              required
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? '处理中...' : '登 录'}
          </button>
          
          <div className={styles.footerText}> 安全企业访问控制 </div>
        </form>
      </div>
      
      <div className={styles.copyright}>
        &copy; {new Date().getFullYear()} LINKIFY / MONOCHROME DESIGN
      </div>
    </div>
  );
};

export default Login;
