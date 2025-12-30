import { useState } from 'react';
import { Loader } from 'lucide-react';
import { useAuth0 } from "@auth0/auth0-react";

const OktaLoginModal = ({ onLoginSuccess }) => {
  const { loginWithRedirect } = useAuth0();
  const [socialLoading, setSocialLoading] = useState(null);

  const handleOktaLogin = async () => {
    setSocialLoading('okta');
    try {
      await loginWithRedirect({
        appState: { returnTo: window.location.pathname },
      });
    } catch (err) {
      console.error('Okta login failed:', err);
      setSocialLoading(null);
    }
  };

  const handleSocialLogin = async (provider) => {
    setSocialLoading(provider);

    try {
      // Social login through Okta
      await loginWithRedirect({
        connection: provider,
        appState: { returnTo: window.location.pathname },
      });
    } catch (err) {
      console.error(`${provider} login failed:`, err);
      setSocialLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-8 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1C6.48 1 2 5.48 2 11s4.48 10 10 10 10-4.48 10-10S17.52 1 12 1zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Okta</h1>
          <p className="text-sm text-gray-600">Sign in to your account</p>
        </div>

        {/* Okta Login Button */}
        <button
          onClick={handleOktaLogin}
          disabled={socialLoading !== null}
          className="w-full bg-blue-600 text-white font-medium py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-6"
        >
          {socialLoading === 'okta' && <Loader className="w-4 h-4 animate-spin" />}
          {socialLoading === 'okta' ? 'Signing in...' : 'Login with Okta'}
        </button>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 font-medium">Or connect with</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Google */}
          <button
            type="button"
            onClick={() => handleSocialLogin('google')}
            disabled={socialLoading !== null}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {socialLoading === 'google' ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            <span className="text-sm font-medium text-gray-700">Google</span>
          </button>

          {/* Microsoft */}
          <button
            type="button"
            onClick={() => handleSocialLogin('microsoft')}
            disabled={socialLoading !== null}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {socialLoading === 'microsoft' ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
              </svg>
            )}
            <span className="text-sm font-medium text-gray-700">Microsoft</span>
          </button>

          {/* Apple */}
          <button
            type="button"
            onClick={() => handleSocialLogin('apple')}
            disabled={socialLoading !== null}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {socialLoading === 'apple' ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.05 2.29.89 3.08.89.79 0 2.18-1.12 3.66-.96 2.42.2 4.53 1.44 5.69 3.48-2.3 1.39-2.44 4.82-.36 5.99-.66 1.59-1.66 2.59-2.77 3.42zm-7.38-17.67c-.61.08-1.3-.09-1.94-.5.18-1.45.97-2.63 2.07-2.93.61.32 1.16.78 1.56 1.31-1.14.22-1.92.52-2.1 1.35z" />
              </svg>
            )}
            <span className="text-sm font-medium text-gray-700">Apple</span>
          </button>

          {/* GitHub */}
          <button
            type="button"
            onClick={() => handleSocialLogin('github')}
            disabled={socialLoading !== null}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {socialLoading === 'github' ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            )}
            <span className="text-sm font-medium text-gray-700">GitHub</span>
          </button>
        </div>

        {/* Footer Links */}
        <div className="pt-6 border-t border-gray-200 flex items-center justify-between text-xs">
          <button className="text-blue-600 hover:text-blue-700 font-medium">
            Forgot password?
          </button>
          <span className="text-gray-600">
            Need help? <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">Contact support</a>
          </span>
        </div>
      </div>
    </div>
  );
};

export default OktaLoginModal;