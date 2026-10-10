import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { connectSocket } from '../../socket/socketClient';
import DashboardLayout from '../../components/DashboardLayout';
import NotificationBell from '../../components/NotificationBell';
import AgreementPage from '../AgreementPage'; 

import { WinnerModal, PaymentModal, WinnerNominateModal, ProvideGuarantorModal } from './Modals';
import { 
    ActionRequiredSection, 
    RoundHistorySection, 
    CategoryCards, 
    JoinRequestsSection,
    PlansGrid,
    AvailableGroupsGrid,
    SuccessView,
    ReceivedGuarantorRequestsSection
} from './DashboardSections';

// Safe LocalStorage Parser
const getStoredUser = () => {
    try {
        const item = localStorage.getItem('user');
        return item ? JSON.parse(item) : null;
    } catch (e) {
        console.error("Failed to parse stored user data:", e);
        return null;
    }
};

export default function MemberDashboard() {
    const navigate = useNavigate();
    const user = getStoredUser();
    const userId = user?.id;

    // --- NAVIGATION VIEWS ---
    const [view, setView] = useState('home'); 
    const [selCat, setSelCat] = useState(null);
    const [selPlan, setSelPlan] = useState(null);
    const [selGroup, setSelGroup] = useState(null);

    // --- DATA STATES ---
    const [allPlans, setAllPlans] = useState([]);
    const [groups, setGroups] = useState([]);
    const [memberships, setMemberships] = useState([]);
    const [myPayments, setMyPayments] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [recentWinners, setRecentWinners] = useState([]);
    const [myWins, setMyWins] = useState([]);
    const [receivedRequests, setReceivedRequests] = useState([]);
    const [loading, setLoading] = useState({ plans: false, groups: false, mb: true });
    
    // Modals Control
    const [activeModal, setActiveModal] = useState({ 
        winner: null, 
        payment: null, 
        nominate: null, 
        guarantorForm: null 
    });

    // --- DATA FETCHING ---
    const refreshData = useCallback(async () => {
        if (!userId) return;
        try {
            const [mbRes, payRes, winsRes, reqRes] = await Promise.all([
                axiosInstance.get(`/member/memberships/${userId}`),
                axiosInstance.get(`/payments/member/${userId}`),
                axiosInstance.get(`/guarantor/wins/${userId}`),
                axiosInstance.get(`/guarantor/pending/${userId}`)
            ]);

            setMemberships(mbRes.data || []);
            setMyPayments(payRes.data || []);
            setMyWins(winsRes.data || []);
            setReceivedRequests(reqRes.data || []);
            
            const approvedGids = (mbRes.data || [])
                .filter(m => m.status === 'APPROVED')
                .map(m => m.groupId);

            if (approvedGids.length > 0) {
                const historyPromises = approvedGids.map(gid => 
                    axiosInstance.get(`/draw/${gid}/results`).catch(() => ({ data: [] }))
                );
                const histories = await Promise.all(historyPromises);
                const combinedHistory = histories
                    .flatMap(h => h.data || [])
                    .sort((a, b) => new Date(b.drawnAt) - new Date(a.drawnAt));
                
                setRecentWinners(combinedHistory.slice(0, 10));
            }
        } catch (err) { 
            console.error("Refresh Data Error:", err); 
        } finally { 
            setLoading(prev => ({ ...prev, mb: false })); 
        }
    }, [userId]);

    useEffect(() => { 
        refreshData(); 
    }, [refreshData]);

    // --- SOCKET LOGIC ---
    useEffect(() => {
        if (!userId) return;
        const socket = connectSocket();

        socket.emit('joinUserRoom', { userId });

        const approvedGids = memberships
            .filter(m => m.status === 'APPROVED')
            .map(m => m.groupId);

        approvedGids.forEach(gid => socket.emit('joinGroupRoom', { groupId: gid, userId }));

        const handleWinnerAnnounced = (data) => {
            if (approvedGids.includes(data.groupId)) {
                setActiveModal(prev => ({ ...prev, winner: data }));
                refreshData();
            }
        };

        const handleGuarantorRequested = (data) => {
            refreshData();
            setNotifications(prev => [{ 
                id: Date.now(), 
                message: `🛡️ ${data.winnerName} nominated you as a Wase!`, 
                time: 'Just now' 
            }, ...prev]);
        };

        const handleGuarantorResponded = (data) => {
            refreshData();
            alert(`${data.guarantorName} has ${data.status?.toLowerCase()} your request.`);
        };

        socket.on('winnerAnnounced', handleWinnerAnnounced);
        socket.on('guarantorRequested', handleGuarantorRequested);
        socket.on('guarantorResponded', handleGuarantorResponded);

        return () => {
            socket.off('winnerAnnounced', handleWinnerAnnounced);
            socket.off('guarantorRequested', handleGuarantorRequested);
            socket.off('guarantorResponded', handleGuarantorResponded);
        };
    }, [userId, memberships, refreshData]);

    // --- ACTIONS ---
    const handleCategorySelect = async (catId) => {
        setSelCat(catId);
        setLoading(prev => ({ ...prev, plans: true }));
        try {
            const res = await axiosInstance.get('/admin/plans');
            setAllPlans((res.data || []).filter(p => p.category === catId));
            setView('plans');
        } catch (err) {
            console.error("Error fetching plans:", err);
        } finally {
            setLoading(prev => ({ ...prev, plans: false }));
        }
    };

    const handlePlanSelect = async (plan) => {
        setSelPlan(plan);
        setLoading(prev => ({ ...prev, groups: true }));
        try {
            const res = await axiosInstance.get(`/member/plans/${plan.id}/groups`);
            setGroups(res.data || []);
            setView('groups');
        } catch (err) {
            console.error("Error fetching groups:", err);
        } finally {
            setLoading(prev => ({ ...prev, groups: false }));
        }
    };

    const handleRejectRequest = async (requestId) => {
        if (!window.confirm("Are you sure you want to decline this request?")) return;
        try {
            await axiosInstance.patch(`/guarantor/${requestId}/respond`, { status: 'REJECTED', userId });
            refreshData();
        } catch (err) { 
            alert("Failed to reject request."); 
        }
    };

    const handleJoinGroup = async () => {
        if (!selGroup) return;
        try {
            await axiosInstance.post('/member/join-group', { userId, groupId: selGroup.id });
            refreshData(); 
            setView('success');
        } catch (err) { 
            alert(err.response?.data?.error || "Failed to join group."); 
        }
    };

    return (
        <DashboardLayout role="MEMBER" headerExtra={
            <NotificationBell notifications={notifications} onClear={() => setNotifications([])} />
        }>
            {/* --- MODALS --- */}
            {activeModal.winner && (
                <WinnerModal 
                    data={activeModal.winner} 
                    currentUserId={userId} 
                    onClose={() => setActiveModal(prev => ({ ...prev, winner: null }))} 
                />
            )}
            
            {activeModal.payment && (
                <PaymentModal 
                    membership={activeModal.payment} 
                    onClose={() => setActiveModal(prev => ({ ...prev, payment: null }))} 
                    onSubmitted={refreshData} 
                />
            )}
            
            {activeModal.nominate && (
                <WinnerNominateModal 
                    win={activeModal.nominate} 
                    onClose={() => setActiveModal(prev => ({ ...prev, nominate: null }))} 
                    onSubmitted={refreshData} 
                />
            )}
            
            {activeModal.guarantorForm && (
                <ProvideGuarantorModal 
                    guarantorRequest={activeModal.guarantorForm} 
                    onClose={() => setActiveModal(prev => ({ ...prev, guarantorForm: null }))} 
                    onSubmitted={refreshData} 
                />
            )}

            <div className="max-w-6xl mx-auto space-y-10">
                {view === 'home' && (
                    <>
                        <div className="flex justify-between items-center">
                            <h1 className="text-4xl font-black text-slate-800">My Savings</h1>
                            <p className="text-slate-400 font-bold uppercase text-xs">Overview</p>
                        </div>

                        <ReceivedGuarantorRequestsSection 
                            requests={receivedRequests} 
                            onAccept={(req) => setActiveModal(prev => ({ ...prev, guarantorForm: req }))}
                            onReject={handleRejectRequest}
                        />

                        <ActionRequiredSection 
                            myWins={myWins} 
                            onNominate={(win) => setActiveModal(prev => ({ ...prev, nominate: win }))} 
                        />

                        <CategoryCards onSelect={handleCategorySelect} />

                        <JoinRequestsSection 
                            memberships={memberships} 
                            myPayments={myPayments} 
                            onPay={(m) => setActiveModal(prev => ({ ...prev, payment: m }))} 
                            onDraw={(gid) => navigate(`/member/draw/${gid}`)} 
                        />

                        <RoundHistorySection history={recentWinners} memberships={memberships} />
                    </>
                )}

                {view === 'plans' && (
                    <PlansGrid 
                        category={selCat} 
                        plans={allPlans} 
                        loading={loading.plans} 
                        onBack={() => setView('home')} 
                        onSelect={handlePlanSelect} 
                    />
                )}
                
                {view === 'groups' && (
                    <AvailableGroupsGrid 
                        plan={selPlan} 
                        groups={groups} 
                        memberships={memberships} 
                        loading={loading.groups} 
                        onBack={() => setView('plans')} 
                        onJoin={(g) => { setSelGroup(g); setView('agreement'); }} 
                    />
                )}

                {view === 'agreement' && selGroup && (
                    <AgreementPage 
                        plan={{
                            amount: Number(selGroup.plan?.amount || 0).toLocaleString(),
                            penalty: Number(selGroup.plan?.penalty || 0).toLocaleString(),
                            members: selGroup.plan?.maxMembers,
                            size: selGroup.name,
                            startDate: selGroup.startDate ? new Date(selGroup.startDate).toLocaleDateString() : 'N/A'
                        }}
                        onAgree={handleJoinGroup}
                        onBack={() => setView('groups')}
                    />
                )}

                {view === 'success' && <SuccessView onHome={() => setView('home')} />}
            </div>
        </DashboardLayout>
    );
}