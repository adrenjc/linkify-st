import { AUTH_TOKEN_KEY } from '@/constants/auth';
import { currentUser, login } from '@/services/login/';
import { Helmet, history, useModel } from '@umijs/max';
import { message, Tabs } from 'antd';
import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import Settings from '../../../../config/defaultSettings';

const Login: React.FC = () => {
  const [activeTab, setActiveTab] = useState('login');
  const { setInitialState } = useModel('@@initialState');
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
              setInitialState((s) => ({
                ...s,
                currentUser: userInfo.data,
              }));
            });
            const urlParams = new URL(window.location.href).searchParams;
            const redirect = urlParams.get('redirect');
            history.push(redirect || '/');
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
        message.success('Welcome back!');
        await fetchUserInfo();
        const urlParams = new URL(window.location.href).searchParams;
        history.push(urlParams.get('redirect') || '/');
        return;
      }
    } catch (error) {
      // Error handled by request interceptor usually, or we show message here
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-purple-200/30 blur-[120px]" />
            <div className="absolute top-[40%] -right-[10%] w-[60%] h-[60%] rounded-full bg-blue-200/30 blur-[100px]" />
        </div>

      <Helmet>
        <title>
          Login - {Settings.title}
        </title>
      </Helmet>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-xl rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/20 p-8 z-10 transition-all duration-500 hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)]">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight mb-2">Linkify</h1>
            <p className="text-gray-500 text-sm">Enterprise Link Management Platform</p>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          centered
          className="mb-6 custom-tabs"
          items={[
            {
              key: 'login',
              label: 'Sign In',
              children: (
                <form className="flex flex-col gap-5 mt-4" onSubmit={handleLogin}>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 ml-1">Username</label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition-all duration-200 placeholder:text-gray-400"
                      placeholder="Enter your username"
                      value={loginForm.username}
                      onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 ml-1">Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 text-sm focus:bg-white focus:border-purple-600 focus:ring-2 focus:ring-purple-100 outline-none transition-all duration-200 placeholder:text-gray-400"
                      placeholder="Enter your password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-purple-500/20 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                  </button>
                  
                  <div className="text-center mt-4">
                      <span className="text-xs text-gray-400">Secure Enterprise Access</span>
                  </div>
                </form>
              ),
            },
          ]}
        />
      </div>
      
      <div className="absolute bottom-6 text-xs text-gray-400 font-light">
        &copy; {new Date().getFullYear()} Linkify Inc. All rights reserved.
      </div>
    </div>
  );
};

export default Login;
