import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";

export default function AuthPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect to home if already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const endpoint = isLogin ? "/api/login" : "/api/register";
      const body = isLogin
        ? { email, password }
        : { email, password, firstName, lastName };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        router.push("/");
      } else {
        const data = await response.json();
        setError(data.error || "Authentication failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="auth-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-content">
        <div className="auth-left">
          <div className="auth-form">
            <div className="logo-section">
              <Image src="/logo-orange.png" alt="TWX" width={80} height={80} />
            </div>
            
            <h1 className="auth-title">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="auth-subtitle">
              {isLogin 
                ? "Sign in to continue to your projects" 
                : "Get started with digital temporary works inspection"
              }
            </p>

            <form onSubmit={handleSubmit} className="form">
              {error && <div className="error-message">{error}</div>}

              {!isLogin && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name</label>
                    <input
                      id="firstName"
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                      disabled={submitting}
                      placeholder="John"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name</label>
                    <input
                      id="lastName"
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                      disabled={submitting}
                      placeholder="Doe"
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                  placeholder="you@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={submitting}
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="button-spinner"></div>
                    {isLogin ? "Signing In..." : "Creating Account..."}
                  </>
                ) : (
                  <>{isLogin ? "Sign In" : "Create Account"}</>
                )}
              </button>

              <div className="form-footer">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError("");
                  }}
                  className="link-button"
                  disabled={submitting}
                >
                  {isLogin
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="auth-right">
          <div className="hero-content">
            <h2>Digital Temporary Works Inspection</h2>
            <p>
              Track temporary works materials across multiple construction projects with full BIM integration and lifecycle management.
            </p>
            <ul className="feature-list">
              <li>✓ BIM-integrated 3D visualization</li>
              <li>✓ QR code asset tracking</li>
              <li>✓ Cross-project material reuse</li>
              <li>✓ Complete inspection history</li>
              <li>✓ Compliance documentation</li>
            </ul>
          </div>
        </div>
      </div>

      <style jsx>{`
        .auth-container {
          width: 100%;
          min-height: 100vh;
          background: var(--color-dark);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-md);
        }

        .auth-content {
          width: 100%;
          max-width: 1000px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--color-gray-800);
          border-radius: var(--border-radius-xl);
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .auth-left {
          padding: var(--space-3xl);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .auth-form {
          width: 100%;
          max-width: 400px;
        }

        .logo-section {
          display: flex;
          justify-content: center;
          margin-bottom: var(--space-lg);
        }

        .auth-title {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          color: var(--color-white);
          margin: 0 0 var(--space-sm) 0;
          text-align: center;
        }

        .auth-subtitle {
          font-size: var(--font-size-base);
          color: var(--color-gray-400);
          margin: 0 0 var(--space-2xl) 0;
          text-align: center;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }

        .form-group label {
          font-size: var(--font-size-sm);
          font-weight: 500;
          color: var(--color-gray-300);
        }

        .form-group input {
          padding: var(--space-md);
          background: var(--color-gray-700);
          border: var(--border-width) solid var(--color-gray-600);
          border-radius: var(--border-radius);
          color: var(--color-white);
          font-size: var(--font-size-base);
          transition: border-color 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: var(--color-primary);
        }

        .form-group input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .error-message {
          padding: var(--space-md);
          background: rgba(220, 38, 38, 0.1);
          border: var(--border-width) solid var(--color-error);
          border-radius: var(--border-radius);
          color: var(--color-error);
          font-size: var(--font-size-sm);
          text-align: center;
        }

        .btn-full {
          width: 100%;
          padding: var(--space-md);
          font-size: var(--font-size-base);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
        }

        .button-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .form-footer {
          text-align: center;
        }

        .link-button {
          background: none;
          border: none;
          color: var(--color-primary);
          font-size: var(--font-size-sm);
          cursor: pointer;
          padding: var(--space-sm);
          transition: color 0.2s;
        }

        .link-button:hover:not(:disabled) {
          color: var(--color-primary-hover);
          text-decoration: underline;
        }

        .link-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .auth-right {
          background: linear-gradient(135deg, #ff6b35 0%, #ff8c42 100%);
          padding: var(--space-3xl);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .hero-content {
          max-width: 400px;
        }

        .hero-content h2 {
          font-size: var(--font-size-2xl);
          font-weight: 700;
          margin: 0 0 var(--space-lg) 0;
          line-height: 1.2;
        }

        .hero-content p {
          font-size: var(--font-size-base);
          line-height: 1.6;
          margin: 0 0 var(--space-xl) 0;
          opacity: 0.95;
        }

        .feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .feature-list li {
          font-size: var(--font-size-base);
          opacity: 0.95;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 4px solid var(--color-gray-700);
          border-top-color: var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 768px) {
          .auth-content {
            grid-template-columns: 1fr;
          }

          .auth-right {
            display: none;
          }

          .auth-left {
            padding: var(--space-xl);
          }
        }
      `}</style>
    </div>
  );
}
