import logo from '@/assets/xiusLogo.png';
import { loginApi } from '@/modules/auth/services/authService';
import { login } from '@/modules/auth/store/authSlice';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.username.trim() || !formData.password.trim()) {
            setError('Please enter both username and password.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await loginApi(formData.username.trim(), formData.password);
            const { username, role } = res.data;

            // role comes from the backend — store as-is
            dispatch(login({ name: username, role }));
            navigate('/flowBuilder');
        } catch (err) {
            // Backend returns { error: "..." } on 400/401/403
            setError(err?.response?.data?.error || 'Invalid username or password.');
            setFormData(prev => ({ ...prev, password: '' }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.loginPage}>
            <nav className={styles.loginNavbar}>
                <img src={logo} alt="Xius Logo" />
            </nav>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
                <h2>Login</h2>

                <div className={styles.inputFields}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="username">Username</label>
                        <input
                            id="username"
                            type="text"
                            name="username"
                            placeholder="Enter your username"
                            value={formData.username}
                            onChange={handleChange}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            autoComplete="current-password"
                            required
                        />
                    </div>
                </div>

                {error && (
                    <p className={styles.error} role="alert">{error}</p>
                )}

                <button type="submit" className={styles.loginBtn} disabled={isLoading}>
                    {isLoading ? <Loader2 size={18} className={styles.spin} /> : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default Login;