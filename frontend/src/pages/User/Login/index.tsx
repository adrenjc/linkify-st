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
    background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%)',
    position: 'relative',
    overflow: 'hidden',
    padding: '20px',
  },
  bgDecor1: {
    position: 'absolute',
    top: '-30%',
    left: '-10%',
    width: '60%',
    height: '60%',
    borderRadius: '50%',
    background: 'rgba(114, 46, 209, 0.05)',
    filter: 'blur(80px)',
  },
  bgDecor2: {
    position: 'absolute',
    bottom: '-20%',
    right: '-10%',
    width: '50%',
    height: '50%',
    borderRadius: '50%',
    background: 'rgba(99, 102, 241, 0.05)',
    filter: 'blur(60px)',
  },
  loginCard: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    padding: '40px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    zIndex: 10,
    transition: 'box-shadow 0.3s ease',
    '&:hover': {
      boxShadow: '0 12px 48px rgba(0, 0, 0, 0.1)',
    },
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: '8px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: '32px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#374151',
    marginLeft: '2px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    border: '1.5px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#1f2937',
    transition: 'all 0.2s ease',
    outline: 'none',
    '&:hover': {
      borderColor: '#d1d5db',
    },
    '&:focus': {
      borderColor: '#722ED1',
      backgroundColor: '#fff',
      boxShadow: '0 0 0 3px rgba(114, 46, 209, 0.1)',
    },
    '&::placeholder': {
      color: '#9ca3af',
    },
  },
  button: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #722ED1 0%, #5b21b6 100%)',
    border: 'none',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    marginTop: '8px',
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 6px 20px rgba(114, 46, 209, 0.3)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'not-allowed',
      transform: 'none',
    },
  },
  footer: {
    textAlign: 'center',
    marginTop: '16px',
    fontSize: '12px',
    color: '#9ca3af',
  },
  copyright: {
    position: 'absolute',
    bottom: '20px',
    fontSize: '12px',
    color: '#9ca3af',
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
        message.success('Welcome back!');
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
      <div className={styles.bgDecor1} />
      <div className={styles.bgDecor2} />
      <Helmet>
        <title>Login - {Settings.title}</title>
      </Helmet>

      <div className={styles.loginCard}>
        <div className={styles.title}>Linkify</div>
        <div className={styles.subtitle}>Enterprise Link Management</div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          items={[
            {
              key: 'login',
              label: 'Sign In',
              children: (
                <form className={styles.form} onSubmit={handleLogin}>
                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Username</label>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Enter your username"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <label className={styles.label}>Password</label>
                    <input
                      type="password"
                      className={styles.input}
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                  </div>

                  <button type="submit" className={styles.button} disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </button>
                  
                  <div className={styles.footer}>Secure Enterprise Access</div>
                </form>
              ),
            },
          ]}
        />
      </div>
      
      <div className={styles.copyright}>
        &copy; {new Date().getFullYear()} Linkify Inc.
      </div>
    </div>
  );
};

export default Login;
