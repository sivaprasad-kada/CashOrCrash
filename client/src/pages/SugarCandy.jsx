import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function SugarCandy() {
    const { teamId } = useParams();
    const navigate = useNavigate();
    const { adminBalance, adminName, adminRoomId, refreshAdminBalance } = useGame();

    const [team, setTeam] = useState(null);
    const [cards, setCards] = useState([]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [loading, setLoading] = useState(true);

    const [modalOpen, setModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                // 1. Fetch Team
                const teamRes = await api.get(`/api/teams/${teamId}`);
                setTeam(teamRes.data);

                // 2. Fetch Cards
                const cardsRes = await api.get("/api/sugarcandy");
                setCards(cardsRes.data);

                setLoading(false);
            } catch (err) {
                console.error("Failed to load Sugar Candy data", err);
                // Extract error message
                const msg = err.response?.data?.error || err.message;
                setTeam(null); // Ensure null to trigger error view
                console.log(`Error fetching team ${teamId}: ${msg}`);
                alert(`Error loading data: ${msg}`); // Temporary alert for visibility
                setLoading(false);
            }
        };
        init();

        // Seed if empty (dev utility)
        api.post("/api/sugarcandy/seed").catch(() => { });
    }, [teamId]);

    const handleCardClick = (card) => {
        if (team.sugarCandyAddCount >= 2) return;
        setSelectedCard(card);
        setModalOpen(true);
    };

    const handleAnswer = async (answer) => {
        if (!selectedCard || !team) return;
        setProcessing(true);

        try {

            // Identify Admin ID
            // We NO LONGER check local storage for identity.
            // We rely on the /apply endpoint to extract ID from the httpOnly cookie.

            // Just verifying we have an active session in context is good UI practice though.
            if (!adminName) {
                // Try to refresh or warn?
                // But let's trust the backend to reject if invalid.
            }

            const res = await api.post("/api/sugarcandy/apply", {
                teamId: team._id,
                percentage: selectedCard.percentage,
                answer,
                // adminId: ... NO! Backend extracts from token.
            });



            if (res.data.success) {
                setTeam(res.data.team);
                setModalOpen(false);
                setSelectedCard(null);
                alert(answer === "Approved" ? "Bonus Applied!" : "Dissapproved. No bonus.");
            }
        } catch (err) {
            alert(err.response?.data?.error || "Transaction Failed");
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>Loading Candy Shop...</div>;
    if (!team) return <div style={{ color: 'white' }}>Team Not Found</div>;

    const isLimitReached = team.sugarCandyAddCount >= 2;

    return (
        <div className="sugar-candy-page" style={{
            minHeight: '100vh', background: '#1a0b2e', color: 'white', padding: '20px', fontFamily: '"Orbitron", sans-serif'
        }}>
            {/* HEADER */}
            <div className="header" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '15px',
                border: '1px solid rgba(255,105,180,0.3)', marginBottom: '40px'
            }}>
                <div>
                    <h1 style={{ margin: 0, color: '#ff69b4', textShadow: '0 0 10px #ff69b4' }}>{team.name}</h1>
                    <div style={{ fontSize: '1.5rem', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        WALLET: <span style={{ color: '#2ecc71' }}>₹ {team.balance.toLocaleString()}</span>
                        <button
                            onClick={async () => {
                                try {
                                    const res = await api.get(`/api/teams/${teamId}?t=${Date.now()}`);
                                    setTeam(res.data);
                                } catch (e) { console.error("Refresh failed") }
                            }}
                            title="Refresh Team Balance"
                            style={{
                                background: 'transparent', border: '1px solid #2ecc71', color: '#2ecc71',
                                borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            ↻
                        </button>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', color: '#aaa' }}>CANDY CONSUMED: {team.sugarCandyAddCount} / 2</div>
                    <div style={{ fontSize: '1.2rem', marginTop: '5px', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end' }}>
                        HOST BANK: <span style={{ color: '#f1c40f' }}>{adminBalance === null ? '...' : `₹ ${adminBalance.toLocaleString()}`}</span>
                        <button
                            onClick={refreshAdminBalance}
                            style={{
                                background: 'transparent', border: '1px solid #f1c40f', color: '#f1c40f',
                                borderRadius: '50%', width: '20px', height: '20px', fontSize: '12px',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            ↻
                        </button>
                    </div>
                </div>
            </div>

            <button onClick={() => navigate("/game")} style={{ background: 'transparent', border: '1px solid #666', color: '#ccc', padding: '10px 20px', cursor: 'pointer', marginBottom: '20px' }}>
                ← BACK TO ARENA
            </button>

            {/* CARDS GRID */}
            <h2 style={{ textAlign: 'center', color: '#fff', marginBottom: '30px' }}>SELECT PERCENTAGE BONUS</h2>

            <div className="cards-grid" style={{
                display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap'
            }}>
                {cards.map(card => (
                    <div
                        key={card._id}
                        onClick={() => !isLimitReached && handleCardClick(card)}
                        style={{
                            width: '180px', height: '240px',
                            background: isLimitReached ? '#333' : 'linear-gradient(145deg, #ff69b4, #9b59b6)',
                            borderRadius: '15px',
                            display: 'flex', flexDirection: 'column',
                            justifyContent: 'center', alignItems: 'center',
                            cursor: isLimitReached ? 'not-allowed' : 'pointer',
                            opacity: isLimitReached ? 0.5 : 1,
                            transition: 'transform 0.2s',
                            boxShadow: isLimitReached ? 'none' : '0 10px 30px rgba(255,105,180,0.4)',
                            border: '2px solid rgba(255,255,255,0.2)'
                        }}
                        onMouseEnter={(e) => !isLimitReached && (e.currentTarget.style.transform = 'translateY(-10px)')}
                        onMouseLeave={(e) => !isLimitReached && (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                        <div style={{ fontSize: '3rem', fontWeight: 'bold' }}>{card.percentage}%</div>
                        <div style={{ fontSize: '1.5rem', marginTop: '5px', color: '#f1c40f', fontWeight: 'bold' }}>
                            ₹ {((adminBalance || 0) * card.percentage / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                        <div style={{ fontSize: '0.8rem', marginTop: '10px' }}>SUGAR RUSH</div>
                    </div>
                ))
                }
            </div>

            {/* MODAL */}
            {modalOpen && selectedCard && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.9)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        background: '#2d1b4e', padding: '40px', borderRadius: '20px',
                        border: '2px solid #ff69b4', maxWidth: '500px', width: '90%', textAlign: 'center',
                        boxShadow: '0 0 50px rgba(255,105,180,0.5)'
                    }}>
                        <h2 style={{ fontSize: '2.5rem', color: '#ff69b4', marginBottom: '20px' }}>
                            {selectedCard.percentage}% STAKE
                        </h2>
                        <p style={{ fontSize: '1.2rem', marginBottom: '40px', lineHeight: '1.6' }}>
                            {selectedCard.question}
                        </p>

                        <div style={{ display: 'flex', gap: '20px', justifyContent: 'center' }}>
                            <button
                                onClick={() => handleAnswer("Approved")}
                                disabled={processing}
                                style={{
                                    padding: '15px 30px', fontSize: '1.1rem', fontWeight: 'bold',
                                    background: '#2ecc71', border: 'none', borderRadius: '10px',
                                    color: 'white', cursor: 'pointer', flex: 1
                                }}
                            >
                                APPROVE ✅
                            </button>
                            <button
                                onClick={() => handleAnswer("Disapproved")}
                                disabled={processing}
                                style={{
                                    padding: '15px 30px', fontSize: '1.1rem', fontWeight: 'bold',
                                    background: '#e74c3c', border: 'none', borderRadius: '10px',
                                    color: 'white', cursor: 'pointer', flex: 1
                                }}
                            >
                                DISAPPROVE ❌
                            </button>
                        </div>
                        <div style={{ marginTop: '20px', cursor: 'pointer', textDecoration: 'underline', color: '#aaa' }} onClick={() => setModalOpen(false)}>
                            Cancel
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
