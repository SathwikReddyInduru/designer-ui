import { useState } from 'react'
import Canvas from '../canvas/Canvas'
import LeftSidebar from '../leftSidebar/LeftSidebar'
import RightSidebar from '../rightSidebar/RightSidebar'
import logo from '@/assets/xiusLogo.png';
import styles from './FlowBuilder.module.css'
import { LogOut } from 'lucide-react';
import { logout } from '../../../auth/store/authSlice';
import { useDispatch } from 'react-redux';

const FlowBuilder = () => {

    const dispatch = useDispatch()
    const [leftOpen, setLeftOpen] = useState(true)
    const [rightOpen, setRightOpen] = useState(true)

    return (
        <div className={styles.flowBuilder}>
            <nav className={styles.loginNavbar}>
                <img src={logo} alt="Xius Logo" />
                <button className={styles.logout} onClick={() => dispatch(logout())}>
                    <LogOut size={16} /> Logout
                </button>
            </nav>
            <div className={styles.content}>
                <div style={{ width: leftOpen ? '290px' : '0px', transition: 'width 0.3s ease', overflow: 'hidden' }}>
                    <LeftSidebar />
                </div>
                <Canvas
                    leftOpen={leftOpen}
                    rightOpen={rightOpen}
                    toggleLeft={() => setLeftOpen(prev => !prev)}
                    toggleRight={() => setRightOpen(prev => !prev)}
                />
                <div style={{ width: rightOpen ? '400px' : '0px', transition: 'width 0.3s ease', borderLeft: '1px solid rgb(226, 232, 240)' }}>
                    <RightSidebar />
                </div>
            </div>
        </div>
    )
}

export default FlowBuilder