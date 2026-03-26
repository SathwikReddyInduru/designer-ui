import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import logo from '@/assets/xiusLogo.png';
import { useDispatch } from 'react-redux';
import { login } from '@/modules/auth/store/authSlice';

const CREDENTIALS = {
    user: {
        id: 1,
        username: 'user',
        password: 'user',
        role: 'user'
    },
    admin: {
        id: 2,
        username: 'admin',
        password: 'admin',
        role: 'admin'
    }
}

const Login = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (!formData.username.trim() || !formData.password.trim()) {
            setError('Please enter both username and password.');
            setIsLoading(false);
            return;
        }

        const matchedUser = Object.values(CREDENTIALS).find(
            cred => cred.username === formData.username &&
                cred.password === formData.password
        );

        if (matchedUser) {
            dispatch(login({
                id: matchedUser.id,
                name: matchedUser.username,
                role: matchedUser.role
            }));
            navigate('/flowBuilder');
        } else {
            setError('Invalid username or password.');
            setFormData({
                username: '',
                password: '',
            });
        }

        setIsLoading(false);
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
                    <p className={styles.error} role="alert">
                        {error}
                    </p>
                )}

                <button type="submit" className={styles.loginBtn} disabled={isLoading}>
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>
            </form>
        </div>
    );
};

export default Login;