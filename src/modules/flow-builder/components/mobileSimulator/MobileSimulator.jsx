import { X } from 'lucide-react'
import { useState } from 'react'
import styles from './MobileSimulator.module.css'
import { simulateUssdApi } from "../../services/versionService"

const MobileSimulator = ({ onClose }) => {
    const [view, setView] = useState("dialer")
    const [screenText, setScreenText] = useState("")
    const [userInput, setUserInput] = useState("")
    const [msisdn, setMsisdn] = useState("1234567890")
    const [isSessionActive, setIsSessionActive] = useState(false)
    const [pageId, setPageId] = useState(0)
    const [isLoading, setIsLoading] = useState(false)

    const handleDial = () => {
        if (msisdn.length < 10) {
            alert("Please enter a valid mobile number first.")
            return
        }
        setView("ussd")
        setScreenText(`Handset Active: ${msisdn}\n\nDial *123# to start`)
        setPageId(0)
    }

    const handleSend = async () => {
        if (!userInput.trim() && !isSessionActive) return;

        setIsLoading(true);

        try {
            let payload;

            // 🔥 SESSION NOT STARTED
            if (!isSessionActive) {
                payload = {
                    MSISDN: msisdn,
                    PageId: 0,
                    UserInputOption: "",
                    UserInputText: ""
                };
            }

            // 🔥 SESSION ACTIVE
            else {
                payload = {
                    MSISDN: msisdn,
                    PageId: pageId,
                    UserInputOption: userInput.trim(),
                    UserInputText: ""
                };
            }

            console.log("Sending:", payload);

            const response = await simulateUssdApi(payload);

            console.log("Backend response:", response.data);

            const ussdResponse = response.data.ussd_response;

            setScreenText(ussdResponse.UserOutputText);
            setPageId(ussdResponse.PageId);

            // 🔥 Activate session after first successful call
            setIsSessionActive(true);

            if (ussdResponse.TerminateFlag === "Y") {
                setIsSessionActive(false);
                setTimeout(() => {
                    handleEndCall();
                }, 3000);
            }

            setUserInput("");

        } catch (error) {
            console.error(error);
            setScreenText("Network Error");
            setUserInput("");
        } finally {
            setIsLoading(false);
        }
    };

    const handleEndCall = () => {
        setIsSessionActive(false)
        setUserInput("")
        setView("dialer")
        setScreenText("")
        setPageId(0)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSend()
        }
    }

    return (
        <div className={styles.page}>
            <button onClick={onClose} className={styles.closeBtn}>
                <X size={20} />
            </button>

            <div className={styles.phoneFrame}>
                <div className={styles.earpiece}></div>

                <div className={styles.screen}>
                    {view === "dialer" ? (
                        <div className={styles.dialerContainer}>
                            <div className={styles.statusBar}>
                                <span>Network</span>
                            </div>
                            <h2 className={styles.heading}>Enter Mobile No.</h2>
                            <input
                                className={styles.dialInput}
                                value={msisdn}
                                onChange={(e) => setMsisdn(e.target.value)}
                                placeholder="1234567890"
                            />
                            <div className={styles.keypad}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map(key => (
                                    <button
                                        key={key}
                                        className={styles.key}
                                        onClick={() => setMsisdn(prev => prev + key)}
                                    >
                                        {key}
                                    </button>
                                ))}
                            </div>
                            <button onClick={handleDial} className={styles.callBtn}>
                                Initialize Handset
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className={styles.statusBar}>
                                <span>{msisdn}</span>
                                <span>{new Date().toLocaleTimeString('en-US', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    hour12: true
                                })}</span>
                            </div>

                            <div className={styles.ussdContent}>
                                {isLoading ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                                        <div style={{ marginBottom: '10px' }}>⏳</div>
                                        Loading...
                                    </div>
                                ) : (
                                    screenText.split('\n').map((line, i) => (
                                        <div key={i}>{line}</div>
                                    ))
                                )}
                            </div>

                            <div className={styles.inputArea}>
                                <input
                                    className={styles.input}
                                    value={userInput}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    placeholder={
                                        !isSessionActive
                                            ? "Dail Shortcode to start"
                                            : "Enter option..."
                                    }
                                    onKeyDown={handleKeyPress}
                                    autoFocus
                                    disabled={isLoading}
                                />
                                <div className={styles.buttonRow}>
                                    <button
                                        onClick={handleEndCall}
                                        className={styles.cancelBtn}
                                        disabled={isLoading}
                                    >
                                        End
                                    </button>
                                    <button
                                        onClick={handleSend}
                                        className={styles.sendBtn}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Sending...' : 'Send'}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
                <div className={styles.homeBtn} onClick={() => setView("dialer")}></div>
            </div>
        </div>
    )
}

export default MobileSimulator