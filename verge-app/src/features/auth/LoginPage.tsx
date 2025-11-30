import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '@/shared/hooks';
import styles from './LoginPage.module.css';
import appPreviewImg from '@/assets/verge_logo.png'; // TODO: Replace with actual app screenshot

const TYPING_WORDS = ['reimagined', 'redefined', 'simplified', 'transformed'];

export const LoginPage: FC = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [animatedText, setAnimatedText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
  });

  const currentWord = TYPING_WORDS[wordIndex];

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (isPaused) {
      // Pause for 2 seconds with blinking cursor
      timeout = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, 2000);
    } else if (isDeleting) {
      if (animatedText === '') {
        // Finished deleting, move to next word
        timeout = setTimeout(() => {
          setIsDeleting(false);
          setWordIndex((prev) => (prev + 1) % TYPING_WORDS.length);
        }, 500);
      } else {
        // Continue deleting
        timeout = setTimeout(() => {
          setAnimatedText(animatedText.slice(0, -1));
        }, 50);
      }
    } else {
      if (animatedText === currentWord) {
        // Finished typing, pause before deleting
        timeout = setTimeout(() => {
          setIsPaused(true);
        }, 100);
      } else {
        // Continue typing
        timeout = setTimeout(() => {
          setAnimatedText(currentWord.slice(0, animatedText.length + 1));
        }, 100);
      }
    }

    return () => clearTimeout(timeout);
  }, [animatedText, isDeleting, isPaused, currentWord]);

  // Start the animation
  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedText(TYPING_WORDS[0][0]);
    }, 500);
    return () => clearTimeout(timeout);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Validate passwords match for signup
      if (isSignUp && formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        setIsLoading(false);
        return;
      }

      // Call appropriate auth function
      if (isSignUp) {
        await signup(formData.email, formData.password);
      } else {
        await login(formData.email, formData.password);
      }

      // Redirect to dashboard on success
      navigate('/dashboard');
    } catch (err) {
      setError('Authentication failed. Please try again.');
      console.error('Auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className={styles.loginPage}>
      {/* Left Side - Preview/Marketing */}
      <div className={styles.previewSection}>
        <div className={styles.previewContent}>
          <Link to="/" className={styles.backHome}>
            ← Back to Home
          </Link>
          
          <div className={styles.previewText}>
            <h1 className={styles.previewTitle}>
              Your productivity,<br />
              <span className={styles.typingWrapper}>
                <span className={styles.typingText}>{animatedText}</span>
                <span className={`${styles.cursor} ${isPaused ? styles.blinking : ''}`}>|</span>
              </span>
            </h1>
            <p className={styles.previewSubtitle}>
              Join thousands who've taken control of their workflow with Verge's AI-assisted platform.
            </p>
          </div>

          <div className={styles.previewImage}>
            <img 
              src={appPreviewImg} 
              alt="Verge Logo" 
              className={styles.appScreenshot}
            />
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className={styles.formSection}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className={styles.formSubtitle}>
              {isSignUp 
                ? 'Start organizing your life in minutes' 
                : 'Sign in to continue to your dashboard'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            {isSignUp && (
              <div className={styles.inputGroup}>
                <label htmlFor="name" className={styles.label}>
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Enter your full name"
                  required={isSignUp}
                />
              </div>
            )}

            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Email Address
              </label>
              <div className={styles.inputWrapper}>
                <FiMail className={styles.inputIcon} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Password
              </label>
              <div className={styles.inputWrapper}>
                <FiLock className={styles.inputIcon} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.togglePassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {isSignUp && (
              <div className={styles.inputGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  Confirm Password
                </label>
                <div className={styles.inputWrapper}>
                  <FiLock className={styles.inputIcon} />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="••••••••"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            {!isSignUp && (
              <div className={styles.formOptions}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" className={styles.checkbox} />
                  <span>Remember me</span>
                </label>
                <Link to="/forgot-password" className={styles.forgotLink}>
                  Forgot password?
                </Link>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className={styles.errorMessage}>
                {error}
              </div>
            )}

            <button type="submit" className={styles.submitButton} disabled={isLoading}>
              {isLoading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
              {!isLoading && <FiArrowRight className={styles.buttonIcon} />}
            </button>
          </form>

          <div className={styles.divider}>
            <span className={styles.dividerText}>or continue with</span>
          </div>

          <div className={styles.socialButtons}>
            <button className={styles.socialButton}>
              <svg className={styles.socialIcon} viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </button>
          </div>

          <div className={styles.switchMode}>
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(false)}
                  className={styles.switchButton}
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setIsSignUp(true)}
                  className={styles.switchButton}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
