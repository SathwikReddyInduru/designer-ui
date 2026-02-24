import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import logo from '@/assets/xiusLogo.png';
import { useDispatch } from 'react-redux';
import { login } from '../../store/authSlice';

const Login = () => {
    const dispatch = useDispatch();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // const response = await axios.post('/api/login', formData);
            // const { token } = response.data;
            // localStorage.setItem('token', token);

            const tempUser = 'user';
            const tempPass = 'user';

            if (formData.username === tempUser && formData.password === tempPass) {
                dispatch(login({
                    id: 1,
                    name: formData.username,
                    role: "admin"
                }));
                navigate('/flowBuilder');
            }
            else {
                setError('Invalid username or password.');
                setFormData({
                    username: '',
                    password: '',
                });
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
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