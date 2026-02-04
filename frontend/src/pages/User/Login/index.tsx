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
    padding: '20px',
  },
  bgDecor: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    background: 'radial-gradient(circle at 10% 20%, rgba(0, 0, 0, 0.03) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(0, 0, 0, 0.05) 0%, transparent 40%)',
    zIndex: 1,
  },
  loginCard: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(50px)',
    borderRadius: '0px', // Square edge for minimalist feel
    padding: '60px 48px',
    boxShadow: '0 0 1px rgba(0, 0, 0, 0.1), 0 20px 40px rgba(0, 0, 0, 0.05)',
    border: '1px solid #000000',
    zIndex: 10,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      boxShadow: '0 0 1px rgba(0, 0, 0, 0.2), 0 30px 60px rgba(0, 0, 0, 0.1)',
      transform: 'translateY(-2px)',
    },
  },
  headerArea: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  title: {
    fontSize: '32px',
    fontWeight: 900,
    color: '#000000',
    letterSpacing: '-1.5px',
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: '12px',
    color: '#888888',
    letterSpacing: '2px',
    marginTop: '4px',
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
    color: '#000000',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid #eeeeee',
    borderRadius: '0',
    fontSize: '15px',
    color: '#000000',
    transition: 'all 0.25s ease',
    outline: 'none',
    '&:focus': {
      borderBottomColor: '#000000',
    },
    '&::placeholder': {
      color: '#cccccc',
    },
  },
  button: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#000000',
    border: 'none',
    borderRadius: '0',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    '&:hover': {
      backgroundColor: '#333333',
      paddingLeft: '20px',
    },
    '&:disabled': {
      backgroundColor: '#cccccc',
      cursor: 'not-allowed',
    },
  },
  footerText: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '11px',
    color: '#bbbbbb',
    letterSpacing: '1px',
  },
  copyright: {
    position: 'absolute',
    bottom: '40px',
    fontSize: '11px',
    color: '#dddddd',
    letterSpacing: '1px',
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
        message.success('登录成功');
        await fetchUserInfo();
        const urlParams = new URL(window.location.href).searchParams;
        history.push(urlParams.get('redirect') || '/');
      }
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
          <div className={styles.subtitle}>企业级短链接管理系统</div>
        </div>

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>用户名</label>
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
            {loading ? '正在登录...' : '进入系统'}
          </button>
          
          <div className={styles.footerText}>SECURE ACCESS ONLY</div>
        </form>
      </div>
      
      <div className={styles.copyright}>
        &copy; {new Date().getFullYear()} LINKIFY INC. / MINIMALIST TECH
      </div>
    </div>
  );
};

export default Login;
