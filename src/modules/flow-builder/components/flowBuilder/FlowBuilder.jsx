import { useState, useEffect, useRef } from 'react'
import Canvas from '@/modules/flow-builder/components/canvas/Canvas'
import LeftSidebar from '@/modules/flow-builder/components/leftSidebar/LeftSidebar'
import RightSidebar from '@/modules/flow-builder/components/rightSidebar/RightSidebar'
import logo from '@/assets/xiusLogo.png';
import styles from './FlowBuilder.module.css'
import { LogOut, UserCircle, UserIcon } from 'lucide-react';
import { logout } from '@/modules/auth/store/authSlice';
import { useDispatch, useSelector } from 'react-redux';
import { ReactFlowProvider } from 'reactflow';

const FlowBuilder = () => {

    const dispatch = useDispatch()
    const { user } = useSelector((state) => state.auth)
    const [leftOpen, setLeftOpen] = useState(true)
    const [rightOpen, setRightOpen] = useState(true)
    const [menuOpen, setMenuOpen] = useState(false)
    const menuRef = useRef()

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false)
            }
        }

        document.addEventListener("pointerdown", handleClickOutside)

        return () => {
            document.removeEventListener("pointerdown", handleClickOutside)
        }
    }, [])

    return (
        <ReactFlowProvider>
            <div className={styles.flowBuilder}>
                <nav className={styles.loginNavbar}>
                    <img src={logo} alt="Xius Logo" />

                    <div className={styles.menuWrapper} ref={menuRef}>
                        <button
                            className={styles.iconButton}
                            onClick={() => setMenuOpen(prev => !prev)}
                        >
                            <UserCircle size={24} />
                        </button>

                        {menuOpen && (
                            <div className={styles.dropdown}>
                                <div className={styles.dropdownItem}>
                                    <UserIcon size={17} /> {user?.name || 'User'}
                                </div>
                                <div
                                    className={styles.dropdownItem1}
                                    onClick={() => {
                                        dispatch(logout())
                                        setMenuOpen(false)
                                    }}
                                >
                                    <LogOut size={16} fill='red' /> Logout
                                </div>
                            </div>
                        )}
                    </div>
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
                        closeMenu={() => setMenuOpen(false)}
                    />
                    <div style={{ width: rightOpen ? '400px' : '0px', transition: 'width 0.3s ease', borderLeft: '1px solid rgb(226, 232, 240)' }}>
                        <RightSidebar />
                    </div>
                </div>
            </div>
        </ReactFlowProvider>
    )
}

export default FlowBuilder