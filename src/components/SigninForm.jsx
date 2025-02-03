import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import app from './firebaseConfig';

const auth = getAuth(app);

// Set language to English
auth.languageCode = 'en';

const SigninForm = () => {
    const [ph, setPh] = useState("");
    const [cr, setCr] = useState(null);
    const [vc, setVc] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        try {
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'sign-in-button', {
                    'size': 'invisible',
                    'callback': (response) => {
                        console.log('reCAPTCHA solved:', response);
                    },
                    'expired-callback': () => {
                        setError('reCAPTCHA expired. Please try again.');
                    }
                });
            }
        } catch (err) {
            console.error('reCAPTCHA Error:', err);
            setError('Failed to initialize reCAPTCHA');
        }

        return () => {
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        };
    }, []);

    const validph = () => {
        // Allow only E.164 format: +[country code][number]
        const re = /^\+[1-9]\d{1,14}$/;
        return re.test(ph);
    }

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!ph) return;

        setLoading(true);
        setError(null);

        try {
            const phoneNumber = ph.trim();
            console.log('Attempting to send code to:', phoneNumber);

            const confirmationResult = await signInWithPhoneNumber(
                auth,
                phoneNumber,
                window.recaptchaVerifier
            );

            setCr(confirmationResult);
            alert('Verification code sent!');
        } catch (err) {
            console.error('Phone Auth Error:', err);
            setError(err.message);
            
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        } finally {
            setLoading(false);
        }
    };

    const verifyCode = async (e) => {
        e.preventDefault();
        if (!vc || !cr) return;

        setLoading(true);
        setError(null);

        try {
            const result = await cr.confirm(vc);
            console.log('Successfully signed in:', result.user);
            alert('Successfully verified!');
        } catch (err) {
            console.error('Verification Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const onChangeph = () => {
        setVc("");
        setCr(null);
        setError(null);
    }

    return (
        <div className="signin-container">
            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <form onSubmit={onSubmit}>
                <div className="input-group">
                    <label>
                        Phone Number (with country code):
                        <input
                            type="tel"
                            value={ph}
                            onChange={(e) => setPh(e.target.value)}
                            placeholder="+1234567890"
                            disabled={loading}
                            required
                        />
                    </label>
                </div>

                <button 
                    id="sign-in-button"
                    type="submit"
                    disabled={loading || !ph}
                >
                    {loading ? 'Sending...' : 'Send Code'}
                </button>
            </form>

            {cr && (
                <form onSubmit={verifyCode} className="verification-form">
                    <div className="input-group">
                        <label>
                            Verification Code:
                            <input
                                type="text"
                                value={vc}
                                onChange={(e) => setVc(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="123456"
                                maxLength="6"
                                disabled={loading}
                                required
                            />
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !vc}
                    >
                        {loading ? 'Verifying...' : 'Verify Code'}
                    </button>
                </form>
            )}

            <style jsx>{`
                .signin-container {
                    max-width: 400px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .error-message {
                    color: red;
                    margin-bottom: 15px;
                    padding: 10px;
                    background-color: #ffebee;
                    border-radius: 4px;
                }
                .input-group {
                    margin-bottom: 15px;
                }
                .input-group label {
                    display: block;
                    margin-bottom: 5px;
                }
                .input-group input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }
                .recaptcha-container {
                    margin: 15px 0;
                }
                button {
                    width: 100%;
                    padding: 10px;
                    background-color: #4285f4;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                button:disabled {
                    background-color: #ccc;
                    cursor: not-allowed;
                }
                .verification-form {
                    margin-top: 20px;
                    padding-top: 20px;
                    border-top: 1px solid #eee;
                }
            `}</style>
        </div>
    );
};

export default SigninForm;
