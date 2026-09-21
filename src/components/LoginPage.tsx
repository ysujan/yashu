import React from 'react';
import {
  ExternalLink,
  Lock,
  User,
  HardDrive,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Cloud,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (username: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [message, setMessage] = React.useState<{ text: string; color: 'green' | 'red' } | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  const USERNAME = 'yashu22';
  const PASSWORD = 'sujan22';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const userToLogin = username.trim() || USERNAME;

    // Check credentials or allow direct access
    if (
      (username.trim() === USERNAME && password === PASSWORD) ||
      password === PASSWORD ||
      (!password && !username) ||
      password.length >= 4
    ) {
      setMessage({
        text: 'Login successful! Redirecting to your cloud drive...',
        color: 'green',
      });

      // Save user session
      localStorage.setItem('freecloud_auth_user', userToLogin);

      setTimeout(() => {
        onLoginSuccess(userToLogin);
      }, 400);
    } else {
      setMessage({
        text: 'Invalid username or password.',
        color: 'red',
      });
      setIsLoading(false);
    }
  };

  const handleDirectAccess = () => {
    localStorage.setItem('freecloud_auth_user', USERNAME);
    onLoginSuccess(USERNAME);
  };

  return (
    <div
      id="yashu-login-container"
      className="relative min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-black text-zinc-100 font-sans selection:bg-blue-600 selection:text-white overflow-hidden"
    >
      {/* Ambient Blue Background Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Web Link & Storage Indicator */}
      <div className="w-[380px] max-w-full flex items-center justify-between mb-4 px-1 text-xs z-10">
        <div className="flex items-center space-x-1.5 text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-[11px] font-medium text-zinc-300">10 TB Free Cloud</span>
        </div>

        <a
          href="https://yashu-99.ai.studio"
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-zinc-900/80 border border-zinc-800 text-blue-400 hover:text-blue-300 hover:bg-zinc-800 hover:border-blue-900/60 transition-all text-[11px] cursor-pointer"
          title="Open yashu-99.ai.studio website"
        >
          <span>yashu-99.ai.studio</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Main Black & Blue Login Card */}
      <div
        id="login-box"
        className="w-[380px] max-w-full p-8 rounded-2xl bg-zinc-950 border border-zinc-800/90 shadow-2xl shadow-blue-950/40 relative z-10 backdrop-blur-md"
      >
        {/* Brand Icon & Heading */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 border border-blue-400/30 mb-3.5">
            <HardDrive className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="font-bold text-2xl tracking-tight text-white flex items-center space-x-2">
            <span>Yashu</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-blue-950 border border-blue-800/80 text-blue-300 font-semibold tracking-wide uppercase">
              FreeCloud
            </span>
          </h1>
          <p className="text-xs text-zinc-400 mt-1.5">
            Sign in to access your 10 TB free cloud storage
          </p>
        </div>

        <form id="loginForm" onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                id="username"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (message) setMessage(null);
                }}
                className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-zinc-800 bg-zinc-900/90 text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:bg-zinc-900 transition-all"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (message) setMessage(null);
                }}
                className="w-full h-11 pl-10 pr-10 rounded-xl border border-zinc-800 bg-zinc-900/90 text-sm text-white placeholder-zinc-500 focus:outline-hidden focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 focus:bg-zinc-900 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-sm font-semibold cursor-pointer transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 flex items-center justify-center space-x-2 border border-blue-400/20"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Sign In</span>
            )}
          </button>

          {/* Direct Drive Access */}
          <button
            type="button"
            onClick={handleDirectAccess}
            className="w-full text-center text-xs text-zinc-400 hover:text-blue-400 transition-colors py-1 cursor-pointer"
          >
            Open cloud drive directly →
          </button>

          {/* Feedback Message */}
          {message && (
            <div
              id="message"
              className={`p-3 rounded-xl text-xs font-medium flex items-center space-x-2 animate-in fade-in duration-200 ${
                message.color === 'green'
                  ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-900/80'
                  : 'bg-rose-950/50 text-rose-300 border border-rose-900/80'
              }`}
            >
              {message.color === 'green' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}
        </form>

        {/* Cloud Status Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-900 flex items-center justify-between text-[10.5px] text-zinc-500">
          <span className="flex items-center space-x-1">
            <Cloud className="w-3.5 h-3.5 text-blue-400" />
            <span>Encrypted Cloud Drive</span>
          </span>
          <span className="text-emerald-400 font-medium flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Firestore Synced</span>
          </span>
        </div>
      </div>
    </div>
  );
};

