// src/components/ActiveEqubBox.jsx
import { Users, Calendar, ShieldCheck, TrendingUp } from 'lucide-react';

function ActiveEqubBox({ data }) {
  return (
    <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-50 shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-110"></div>
      
      <div className="relative">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-3xl font-black text-slate-800">{data.amount} <span className="text-sm text-slate-400">ETB</span></h3>
            <p className="text-blue-600 font-black text-xs uppercase tracking-widest">{data.size} Share</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600"><ShieldCheck size={24}/></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Members</p>
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <Users size={16}/> {data.members} People
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Starts On</p>
            <div className="flex items-center gap-2 font-bold text-slate-700">
              <Calendar size={16}/> {data.startDate}
            </div>
          </div>
        </div>

        <button className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-blue-600 transition-all">
          Open Management <TrendingUp size={18}/>
        </button>
      </div>
    </div>
  );
}

export default ActiveEqubBox;