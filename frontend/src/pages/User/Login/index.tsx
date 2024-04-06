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
    // background: 'linear-gradient(135deg, #f9f0ff 0%, #efdbff 100%)',
    padding: '20px',
  },
  loginCard: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '24px',
    padding: '40px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(114, 46, 209, 0.1)',
    boxShadow: '0 20px 40px rgba(114, 46, 209, 0.08)',
    animation: 'fadeIn 0.6s ease-out',

    '@media screen and (max-width: 576px)': {
      padding: '30px 20px',
      borderRadius: '20px',
    },
  },
  title: {
    fontSize: '32px',
    fontWeight: 700,
    color: '#722ED1',
    textAlign: 'center',
    marginBottom: '8px',
    letterSpacing: '0.5px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#8c8c8c',
    textAlign: 'center',
    marginBottom: '40px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  inputGroup: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: '#595959',
    fontSize: '14px',
    marginLeft: '4px',
    fontWeight: 500,
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    backgroundColor: '#fafafa',
    border: '2px solid transparent',
    borderRadius: '12px',
    color: '#262626',
    fontSize: '15px',
    transition: 'all 0.3s ease',
    outline: 'none',

    '&:hover': {
      backgroundColor: '#f5f5f5',
      borderColor: 'rgba(114, 46, 209, 0.1)',
    },

    '&:focus': {
      backgroundColor: '#ffffff',
      borderColor: '#722ED1',
      boxShadow: '0 0 0 3px rgba(114, 46, 209, 0.1)',
    },

    '&::placeholder': {
      color: '#bfbfbf',
    },
  },
  error: {
    backgroundColor: '#fff1f0',
    color: '#ff4d4f',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '14px',
    marginBottom: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid #ffccc7',

    '&::before': {
      content: '"⚠"',
      fontSize: '16px',
      color: '#ff4d4f',
    },
  },
  button: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#722ED1',
    border: 'none',
    borderRadius: '12px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '10px',
    position: 'relative',
    overflow: 'hidden',

    '&:hover': {
      backgroundColor: '#8546d6',
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(114, 46, 209, 0.25)',
    },

    '&:active': {
      backgroundColor: '#642ab5',
      transform: 'translateY(0)',
      boxShadow: '0 3px 10px rgba(114, 46, 209, 0.2)',
    },

    '&:disabled': {
      backgroundColor: '#d9d9d9',
      opacity: 0.7,
      cursor: 'not-allowed',
      transform: 'none',
      boxShadow: 'none',
    },
  },
  '@keyframes fadeIn': {
    from: {
      opacity: 0,
      transform: 'translateY(20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
  tabs: {
    marginBottom: '32px',
    '.ant-tabs-nav': {
      marginBottom: '32px',
      '&::before': {
        border: 'none',
      },
    },
    '.ant-tabs-tab': {
      padding: '12px 0',
      fontSize: '16px',
      transition: 'all 0.3s ease',

      '&:hover': {
        color: '#8546d6',
      },

      '&.ant-tabs-tab-active .ant-tabs-tab-btn': {
        color: '#722ED1',
        fontWeight: 600,
      },
    },
    '.ant-tabs-ink-bar': {
      backgroundColor: '#722ED1',
      height: '3px',
      borderRadius: '3px',
    },
  },
  registerForm: {
    '.ant-form-item': {
      marginBottom: '24px',
    },
  },
  passwordStrength: {
    marginTop: '4px',
    fontSize: '12px',
    '&.weak': { color: '#ff4d4f' },
    '&.medium': { color: '#faad14' },
    '&.strong': { color: '#52c41a' },
  },
}));

const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState('login');
  const [userLoginState, setUserLoginState] = useState<API.LoginResult>({});
  const { setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  // const [registerForm, setRegisterForm] = useState({
  //   username: '',
  //   password: '',
  //   confirmPassword: '',
  // });

  // 修改 useEffect 中的 token 获取
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        try {
          const userInfo = await currentUser();
          if (userInfo?.data) {
            flushSync(() => {
              setInitialState((s) => ({
                ...s,
                currentUser: userInfo.data,
              }));
            });

            const urlParams = new URL(window.location.href).searchParams;
            const redirect = urlParams.get('redirect');

            history.push(redirect || '/');
            message.success('已自动登录');
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
    console.log(userInfo, '看一下用户信息');
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo.data,
        }));
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await login(loginForm);
      if (result.token) {
        message.success('登录成功！');
        await fetchUserInfo();
        const urlParams = new URL(window.location.href).searchParams;
        history.push(urlParams.get('redirect') || '/');
        return;
      }
      setUserLoginState(result);
    } finally {
      setLoading(false);
    }
  };

  // const handleRegister = async (e: React.FormEvent) => {
  //   e.preventDefault();

  //   // 表单验证
  //   if (!registerForm.username || !registerForm.password) {
  //     message.error('用户名和密码不能为空！');
  //     return;
  //   }

  //   if (registerForm.username.length < 3) {
  //     message.error('用户名至少需要3个字符！');
  //     return;
  //   }

  //   if (registerForm.password.length < 6) {
  //     message.error('密码至少需要6个字符！');
  //     return;
  //   }

  //   if (registerForm.password !== registerForm.confirmPassword) {
  //     message.error('两次输入的密码不一致！');
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const result = await register({
  //       username: registerForm.username,
  //       password: registerForm.password,
  //     });

  //     if (result.token) {
  //       localStorage.setItem(AUTH_TOKEN_KEY, result.token); // 使用常量
  //       message.success('注册成功！');

  //       await fetchUserInfo();

  //       const urlParams = new URL(window.location.href).searchParams;
  //       history.push(urlParams.get('redirect') || '/');
  //     } else {
  //       message.success('注册成功，请登录！');
  //       setActiveTab('login');
  //       setLoginForm({
  //         username: registerForm.username,
  //         password: registerForm.password,
  //       });
  //     }

  //     setRegisterForm({
  //       username: '',
  //       password: '',
  //       confirmPassword: '',
  //     });
  //   } catch (error: any) {
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const LoginForm = (
    <form className={styles.form} onSubmit={handleLogin}>
      <div className={styles.inputGroup}>
        <label className={styles.label}>用户名</label>
        <input
          type="text"
          name="username"
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
          name="password"
          className={styles.input}
          placeholder="请输入密码"
          value={loginForm.password}
          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
          required
        />
      </div>

      <button type="submit" className={styles.button} disabled={loading}>
        {loading ? '登录中...' : '登录'}
      </button>
    </form>
  );

  // const RegisterForm = (
  //   <form className={`${styles.form} ${styles.registerForm}`} onSubmit={handleRegister}>
  //     <div className={styles.inputGroup}>
  //       <label className={styles.label}>用户名</label>
  //       <input
  //         type="text"
  //         name="username"
  //         className={styles.input}
  //         placeholder="请输入用户名（至少3个字符）"
  //         value={registerForm.username}
  //         onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
  //         required
  //         minLength={3}
  //       />
  //     </div>

  //     <div className={styles.inputGroup}>
  //       <label className={styles.label}>密码</label>
  //       <input
  //         type="password"
  //         name="password"
  //         className={styles.input}
  //         placeholder="请输入密码（至少6个字符）"
  //         value={registerForm.password}
  //         onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
  //         required
  //         minLength={6}
  //       />
  //     </div>

  //     <div className={styles.inputGroup}>
  //       <label className={styles.label}>确认密码</label>
  //       <input
  //         type="password"
  //         name="confirmPassword"
  //         className={styles.input}
  //         placeholder="请再次输入密码"
  //         value={registerForm.confirmPassword}
  //         onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
  //         required
  //       />
  //     </div>

  //     <button type="submit" className={styles.button} disabled={loading}>
  //       {loading ? '注册中...' : '注册'}
  //     </button>
  //   </form>
  // );

  return (
    <div className={styles.container}>
      <Helmet>
        <title>
          {activeTab === 'login' ? '登录' : '注册'} - {Settings.title}
        </title>
      </Helmet>

      <div className={styles.loginCard}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          className={styles.tabs}
          items={[
            {
              key: 'login',
              label: '账号登录',
              children: (
                <>
                  {userLoginState.status === 'error' && (
                    <div className={styles.error}>账户或密码错误，请重试</div>
                  )}
                  {LoginForm}
                </>
              ),
            },
            // {
            //   key: 'register',
            //   label: '注册账号',
            //   children: RegisterForm,
            // },
          ]}
        />
      </div>
    </div>
  );
};

export default Login;
