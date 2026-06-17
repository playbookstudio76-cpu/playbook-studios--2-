import React, { useState } from 'react';
import { UserProfile } from '../types';
import { loginUser, signupUser } from '../storage';

interface AuthViewProps {
  onAuthSuccess: (user: UserProfile) => void;
  onNavigate: (view: string) => void;
}

export default function AuthView({ onAuthSuccess, onNavigate }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (isLogin) {
      const res = loginUser(email, password);
      if (res.success && res.user) {
        onAuthSuccess(res.user);
        if (res.user.role === 'admin') {
          onNavigate('admin');
        } else {
          onNavigate('home');
        }
      } else {
        setError(res.error || 'Login failed. Please verify credentials.');
      }
    } else {
      if (!firstName || !lastName || !phone) {
        setError('Please complete all requested fields.');
        return;
      }
      const res = signupUser(firstName, lastName, email, phone, password);
      if (res.success && res.user) {
        setSuccessMsg('Account created successfully!');
        setTimeout(() => {
          onAuthSuccess(res.user!);
          onNavigate('home');
        }, 1200);
      } else {
        setError(res.error || 'Signup failed.');
      }
    }
  };

  const loadDemoCustomer = () => {
    setEmail('a.wright@example.com');
    setPassword('demopass123');
    setIsLogin(true);
  };

  const loadDemoAdmin = () => {
    setEmail('playbookstudio79@gmail.com');
    setPassword('adminpass79');
    setIsLogin(true);
  };

  return (
    <div className="flex-grow flex flex-col md:flex-row min-h-[calc(100vh-120px)]">
      {/* Left side: Editorial streetwear image */}
      <div className="hidden md:block md:w-1/2 relative min-h-[500px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 hover:scale-105"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800&auto=format&fit=crop')` 
          }}
        />
        {/* Subtle architectural tint overlay */}
        <div className="absolute inset-0 bg-black/15 mix-blend-multiply" />
        
        {/* Playbook brand mark overlay */}
        <div className="absolute top-[64px] left-[64px] max-w-md">
          <h1 className="font-display-lg text-[48px] lg:text-[64px] leading-tight tracking-[-0.03em] font-semibold text-white uppercase drop-shadow-sm select-none">
            PLAYBOOK<br/>STUDIOS
          </h1>
          <p className="font-label-caps text-xs text-white/90 tracking-[0.2em] uppercase mt-2">
            STREETWEAR FOR THE DISCERNING DESIGN MIND
          </p>
        </div>

        <div className="absolute bottom-[64px] left-[64px] right-[64px] text-white/85 text-xs font-mono max-w-sm">
          AUTUMN / WINTER 2026 EDITORIAL REPORT. STARK MONOCHROME DESIGNS AND LOOSE FITTING COTTON SEED CHASSIS.
        </div>
      </div>

      {/* Right side: Login / Signup form elements */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-16 bg-surface-container-lowest">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center md:text-left">
            <h2 className="font-display-lg text-[32px] md:text-[40px] tracking-[-0.02em] font-medium text-primary mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="font-body-md text-sm text-secondary">
              {isLogin 
                ? 'Enter your credentials to access your account.' 
                : 'Join Playbook Studios to track orders and save details.'}
            </p>
          </div>

          {/* Quick Demo Assist Credentials Bar */}
          <div className="bg-surface-container-low p-4 mb-8 text-xs border border-outline-variant space-y-2">
            <p className="font-semibold text-primary font-label-caps uppercase tracking-wider">Quick Demo Login Assist:</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <button 
                type="button" 
                onClick={loadDemoCustomer}
                className="px-3 py-1 bg-white text-primary border border-primary text-[10px] font-label-caps uppercase hover:bg-primary hover:text-white transition"
              >
                Demo Customer
              </button>
              <button 
                type="button" 
                onClick={loadDemoAdmin}
                className="px-3 py-1 bg-white text-primary border border-primary text-[10px] font-label-caps uppercase hover:bg-primary hover:text-white transition"
              >
                Demo Admin
              </button>
            </div>
            <p className="font-mono text-[9px] text-secondary">
              Secret admins use: <span className="text-primary font-semibold">playbookstudio79@gmail.com</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-error-container text-on-error-container p-4 text-xs font-mono border-l-2 border-error">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-50 text-emerald-800 p-4 text-xs font-mono border-l-2 border-emerald-600">
                {successMsg}
              </div>
            )}

            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="font-label-caps text-[10px] text-secondary block uppercase tracking-widest mb-1" htmlFor="firstName">
                    First Name
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="Enter first name"
                    className="border-b border-outline-variant focus:border-primary focus:outline-none w-full pb-2 pt-1 rounded-none text-sm transition-colors text-primary placeholder-transparent"
                  />
                </div>
                <div className="relative">
                  <label className="font-label-caps text-[10px] text-secondary block uppercase tracking-widest mb-1" htmlFor="lastName">
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="Enter last name"
                    className="border-b border-outline-variant focus:border-primary focus:outline-none w-full pb-2 pt-1 rounded-none text-sm transition-colors text-primary placeholder-transparent"
                  />
                </div>
              </div>
            )}

            {!isLogin && (
              <div className="relative">
                <label className="font-label-caps text-[10px] text-secondary block uppercase tracking-widest mb-1" htmlFor="phone">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+1 (555) 012-3456"
                  className="border-b border-outline-variant focus:border-primary focus:outline-none w-full pb-2 pt-1 rounded-none text-sm transition-colors text-primary placeholder-transparent"
                />
              </div>
            )}

            <div className="relative">
              <label className="font-label-caps text-[10px] text-secondary block uppercase tracking-widest mb-1" htmlFor="email">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className="border-b border-outline-variant focus:border-primary focus:outline-none w-full pb-2 pt-1 rounded-none text-sm transition-colors text-primary placeholder-transparent"
              />
            </div>

            <div className="relative">
              <div className="flex justify-between items-end mb-1">
                <label className="font-label-caps text-[10px] text-secondary block uppercase tracking-widest" htmlFor="password">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => alert('For testing purposes, simply input any demo password above.')}
                    className="font-label-caps text-[10px] text-secondary hover:text-primary transition-colors underline decoration-1 underline-offset-4"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="border-b border-outline-variant focus:border-primary focus:outline-none w-full pb-2 pt-1 rounded-none text-sm transition-colors text-primary placeholder-transparent"
              />
            </div>

            <div className="pt-4 flex flex-col space-y-4">
              <button
                type="submit"
                className="bg-primary text-on-primary font-button-text font-semibold uppercase tracking-widest text-xs py-4 px-6 select-none shadow-sm hover:opacity-90 active:scale-95 transition-all text-center rounded-none"
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>

              <div className="text-center mt-6">
                <span className="font-body-md text-xs text-secondary">
                  {isLogin ? "Don't have an account? " : "Already have an account? "}
                </span>
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="font-label-caps text-[10px] text-primary underline decoration-1 underline-offset-4 hover:opacity-60 transition-opacity ml-1 uppercase"
                >
                  {isLogin ? 'Create Account' : 'Sign In'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
