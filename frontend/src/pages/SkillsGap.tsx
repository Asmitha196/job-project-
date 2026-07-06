import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import { recommendationService, resumeService } from '../services/api';
import { SkillsGapAnalysis } from '../types';
import { 
  BarChart3, 
  BookOpen, 
  Brain, 
  Info
} from 'lucide-react';

const SkillsGap: React.FC = () => {
  const [analysis, setAnalysis] = useState<SkillsGapAnalysis | null>(null);
  const [hasResume, setHasResume] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkillsGap = async () => {
      setLoading(true);
      try {
        const active = await resumeService.getActive().catch(() => null);
        if (active) {
          setHasResume(true);
          const data = await recommendationService.getSkillsGap();
          setAnalysis(data);
        } else {
          setHasResume(false);
        }
      } catch (error) {
        console.error("Failed to load skills gap analysis:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkillsGap();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[65vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!hasResume) {
    return (
      <div className="bg-slate-900/40 border border-slate-850 rounded-2xl p-12 text-center text-slate-400 max-w-xl mx-auto space-y-6 animate-fadeIn mt-12">
        <div className="h-14 w-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto animate-pulse">
          <Brain className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-xl text-white">Upload Your Resume First</h3>
          <p className="text-sm leading-relaxed">
            We require an active resume profile to analyze your skill gaps. Upload your profile document to unlock matching scores, gap analysis, and tailored career learning pathways.
          </p>
        </div>
        <Link
          to="/resumes"
          className="inline-block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-6 py-3 rounded-xl text-sm shadow-lg shadow-indigo-600/10 transition-all active:scale-95"
        >
          Go to Resume Manager
        </Link>
      </div>
    );
  }

  if (!analysis || analysis.skill_gaps.length === 0) {
    return (
      <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-12 text-center text-slate-400 max-w-xl mx-auto mt-12 space-y-4">
        <BarChart3 className="h-10 w-10 text-emerald-500 mx-auto mb-2 animate-bounce" />
        <h3 className="font-bold text-lg text-white">No Skill Gaps Identified!</h3>
        <p className="text-sm leading-relaxed">
          Amazing work! Your current resume profile matches all key skill requirements of the active job opportunities listed in our system. You are fully aligned.
        </p>
      </div>
    );
  }

  // Format data for Recharts
  const chartData = analysis.skill_gaps.slice(0, 8).map(item => ({
    name: item.skill,
    'Jobs Missing': item.missing_in_jobs_count,
    Percentage: item.percentage_of_jobs
  }));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Overview Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-850 rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-white text-base mb-6 flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-indigo-400" />
              <span>Skill Deficit Frequency (Top 8 Gaps)</span>
            </h3>
            
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    labelStyle={{ color: '#ffffff', fontWeight: 'bold' }}
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Bar dataKey="Jobs Missing" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Stats card */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-850 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Info className="h-5 w-5 text-indigo-400" />
              <h3 className="font-bold text-white text-base">Analysis Summary</h3>
            </div>
            
            <div className="divide-y divide-slate-800">
              <div className="py-3 flex justify-between text-sm">
                <span className="text-slate-400">Total Jobs Evaluated</span>
                <span className="font-bold text-white font-mono">{analysis.total_jobs_evaluated}</span>
              </div>
              <div className="py-3 flex justify-between text-sm">
                <span className="text-slate-400">Your Declared Skills</span>
                <span className="font-bold text-white font-mono">{analysis.resume_skills.length}</span>
              </div>
              <div className="py-3 flex justify-between text-sm">
                <span className="text-slate-400">Unique Missing Skills</span>
                <span className="font-bold text-rose-400 font-mono">{analysis.skill_gaps.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-xl p-4 text-xs text-slate-400 leading-relaxed mt-6">
            Semantic models calculate skill gaps by comparing requirements across recommended listings against extracted resume contexts.
          </div>
        </div>
      </div>

      {/* LLM Roadmap Block */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-850 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center space-x-3 pb-4 border-b border-slate-800">
          <BookOpen className="h-6 w-6 text-indigo-400 animate-pulse" />
          <h3 className="font-bold text-lg text-white">AI-Generated Learning Roadmap</h3>
        </div>

        <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {analysis.advice}
        </div>
      </div>
    </div>
  );
};

export default SkillsGap;
