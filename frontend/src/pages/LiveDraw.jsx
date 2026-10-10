// src/pages/LiveDraw.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import DashboardLayout from '../components/DashboardLayout';
import SpinningWheel from '../components/SpinningWheel';
import axiosInstance from '../api/axiosInstance';
import { connectSocket } from '../socket/socketClient';
import { WinnerModal } from '../pages/member/Modals'; 
import {
    Play, Trophy, Users, Clock, CheckCircle2,
    AlertCircle, Loader2, ArrowLeft, Search, RefreshCw
} from 'lucide-react';

const CONFETTI_COLORS = ['#f59e0b', '#fbbf24', '#6366f1', '#3b82f6', '#10b981', '#ec4899', '#ffffff'];

function Countdown({ totalMs }) {
    const [msLeft, setMsLeft] = useState(totalMs);

    useEffect(() => {
        setMsLeft(totalMs);
    }, [totalMs]);

    useEffect(() => {
        if (msLeft <= 0) return;
        const id = setInterval(() => setMsLeft(prev => Math.max(0, prev - 1000)), 1000);
        return () => clearInterval(id);
    }, [msLeft]);

    const secs = Math.floor((msLeft / 1000) % 60);
    const mins = Math.floor(msLeft / 60000);

    return (
        <div className="flex flex-col items-center gap-2 mb-8">
            <div className="text-6xl font-black tabular-nums text-slate-800 tracking-tighter">
                {String(mins).padStart(2, '0')}:<span className="text-blue-600">{String(secs).padStart(2, '0')}</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Remaining Time</p>
        </div>
    );
}

export default function LiveDraw() {
    const { groupId } = useParams();
    const navigate = useNavigate();

    // 1. Safe LocalStorage User Parsing
    const user = React.useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('user')) || {};
        } catch {
            return {};
        }
    }, []);

    const isOrganizer = user?.role === 'ORGANIZER';

    const [group, setGroup] = useState(null);
    const [pastResults, setPastResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [drawState, setDrawState] = useState('idle'); // 'idle' | 'spinning' | 'finished'
    const [drawData, setDrawData] = useState(null);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState('');

    // Fetch Initial Group Data and Draw History
    const refreshRoomData = useCallback(async () => {
        try {
            const [grpRes, histRes] = await Promise.all([
                axiosInstance.get(`/member/groups/${groupId}`),
                axiosInstance.get(`/draw/${groupId}/results`)
            ]);
            setGroup(grpRes.data);
            setPastResults(histRes.data);
        } catch (err) { 
            setError('Failed to sync with server.'); 
        } finally { 
            setLoading(false); 
        }
    }, [groupId]);

    useEffect(() => { 
        refreshRoomData(); 
    }, [refreshRoomData]);

    // 2. Optimized WebSockets Setup
    useEffect(() => {
        if (!groupId || !user?.id) return;

        const socket = connectSocket();
        socket.emit('joinGroupRoom', { groupId, userId: user.id });

        socket.on('drawStarted', (data) => {
            if (data.groupId !== groupId) return;
            const now = Date.now();
            const elapsed = data.isSync ? data.elapsedMs : (now - data.serverStartTime);
            const remaining = data.drawDurationMs - elapsed;

            if (remaining > 1000) { 
                setDrawData({ ...data, drawDurationMs: remaining });
                setDrawState('spinning');
                setError('');
            } else {
                setDrawData(data);
                setDrawState('finished');
            }
        });

        socket.on('winnerAnnounced', (data) => {
            if (data.groupId !== groupId) return;
            setDrawData(data);
            
            // Trigger celebration confetti
            confetti({
                particleCount: 120,
                spread: 80,
                origin: { y: 0.6 },
                colors: CONFETTI_COLORS
            });

            setTimeout(() => {
                setDrawState('finished');
                refreshRoomData();
            }, 1000);
        });

        return () => {
            socket.off('drawStarted');
            socket.off('winnerAnnounced');
        };
    }, [groupId, user?.id, refreshRoomData]);

    const handleStartDraw = async () => {
        setStarting(true); 
        setError('');
        try {
            await axiosInstance.post(`/draw/${groupId}/start`);
        } catch (err) {
            setError(err.response?.data?.error || 'System failed to initiate draw.');
        } finally { 
            setStarting(false); 
        }
    };

    const handleStartNewCycle = async () => {
        if (!window.confirm("Start a new cycle? All current winners will be reset.")) return;
        setStarting(true);
        try {
            await axiosInstance.post(`/organizer/groups/${groupId}/start-new-cycle`);
            alert("New cycle started!");
            refreshRoomData();
        } catch (err) { 
            setError("Failed to reset cycle."); 
        } finally { 
            setStarting(false); 
        }
    };

    if (loading) {
        return (
            <DashboardLayout role={isOrganizer ? 'ORGANIZER' : 'MEMBER'}>
                <div className="p-40 text-center font-black animate-pulse text-slate-300">
                    Syncing with Hub...
                </div>
            </DashboardLayout>
        );
    }

    const remainingEligible = group?.memberships?.filter(m => m.hasWon === false) || [];

    return (
        <DashboardLayout role={isOrganizer ? 'ORGANIZER' : 'MEMBER'}>
            
            {/* WINNER MODAL */}
            {drawState === 'finished' && drawData && (
                <WinnerModal 
                    data={drawData} 
                    currentUserId={user?.id} 
                    onClose={() => setDrawState('idle')} 
                />
            )}

            <div className="max-w-6xl mx-auto mb-20">
                <div className="flex items-center justify-between mb-10">
                    <div className="flex items-center gap-5">
                        <button 
                            onClick={() => navigate(-1)} 
                            className="p-4 bg-white shadow-xl rounded-2xl hover:text-blue-600 transition-all border border-slate-100"
                        >
                            <ArrowLeft size={20}/>
                        </button>
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 tracking-tight">{group?.name}</h1>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.25em] mt-1">
                                Live Lottery Hub • Cycle {group?.cycleNumber || 1}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    
                    {/* MAIN DRAW AREA */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-2xl flex flex-col items-center justify-center min-h-[650px] relative overflow-hidden">
                            
                            {/* IDLE STATE */}
                            {drawState === 'idle' && (
                                <div className="text-center space-y-12 animate-in fade-in duration-700">
                                    <div className="w-72 h-72 bg-slate-50 rounded-full border-[10px] border-white shadow-inner flex items-center justify-center mx-auto ring-1 ring-slate-100">
                                        <Trophy size={100} className="text-slate-200" />
                                    </div>
                                    
                                    {isOrganizer ? (
                                        <>
                                            {remainingEligible.length > 0 ? (
                                                <button 
                                                    onClick={handleStartDraw} 
                                                    disabled={starting} 
                                                    className="px-16 py-7 bg-slate-900 hover:bg-blue-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl transition-all scale-110 active:scale-95 disabled:opacity-50"
                                                >
                                                    {starting ? 'INITIATING...' : 'START LOTTERY NOW'}
                                                </button>
                                            ) : (
                                                <div className="space-y-6">
                                                    <div className="bg-amber-50 p-6 rounded-2xl border-2 border-amber-200">
                                                        <p className="text-amber-800 font-bold italic text-sm">Round complete! All members have won.</p>
                                                    </div>
                                                    <button 
                                                        onClick={handleStartNewCycle} 
                                                        disabled={starting} 
                                                        className="px-16 py-7 bg-emerald-600 text-white rounded-[2.5rem] font-black text-xl shadow-2xl transition-all scale-110 flex items-center gap-3 mx-auto"
                                                    >
                                                        <RefreshCw size={24} /> START NEW CYCLE
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="space-y-4">
                                            <p className="font-black text-slate-400 text-xl uppercase tracking-[0.2em] animate-pulse">Awaiting Signal...</p>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="bg-red-50 text-red-600 p-5 rounded-2xl border-2 border-red-100 font-bold text-sm">
                                            {error}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* SPINNING STATE */}
                            {drawState === 'spinning' && drawData && (
                                <div className="flex flex-col items-center animate-in zoom-in duration-500">
                                    <Countdown totalMs={drawData.drawDurationMs} />
                                    <div className="scale-125 md:scale-150 py-10">
                                        <SpinningWheel 
                                            participants={drawData.participants} 
                                            winnerId={drawData.winnerId} 
                                            durationMs={drawData.drawDurationMs} 
                                            onFinished={() => setDrawState('finished')} 
                                        />
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                    {/* SIDEBAR */}
                    <div className="space-y-8">
                        
                        {/* ELIGIBLE LIST */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl">
                            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3 text-sm italic uppercase tracking-wider">
                                Eligible Members ({remainingEligible.length})
                            </h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {remainingEligible.length === 0 ? (
                                    <p className="text-xs font-bold text-slate-400 italic">No remaining members in this cycle.</p>
                                ) : (
                                    remainingEligible.map((m, i) => (
                                        <div key={m.id || i} className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-transparent">
                                            <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-[10px] font-black text-blue-600 border border-blue-50">
                                                {i + 1}
                                            </div>
                                            <span className="font-bold text-slate-700 text-sm truncate">
                                                {m.user?.fullName || "Member"}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* ROUND HISTORY */}
                        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-xl">
                            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-3 text-sm italic uppercase tracking-wider">
                                Round History
                            </h3>
                            <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                                {pastResults.length === 0 ? (
                                    <p className="text-xs font-bold text-slate-400 italic">No previous winners yet.</p>
                                ) : (
                                    pastResults.map(r => (
                                        <div key={r.id} className="flex items-center justify-between p-4 bg-amber-50/30 rounded-2xl border border-amber-100/50">
                                            <div className="min-w-0">
                                                <p className="font-black text-slate-800 text-sm truncate">
                                                    {r.winner?.fullName || "Anonymous Winner"}
                                                </p>
                                                <p className="text-[9px] font-black text-amber-600 uppercase">
                                                    ROUND {r.roundNumber}
                                                </p>
                                            </div>
                                            <Trophy size={16} className="text-amber-500 shrink-0 ml-3" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}