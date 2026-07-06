import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { recommendationService, resumeService } from '../services/api';
import { Recommendation } from '../types';
import { 
  Sparkles, 
  MapPin, 
  ArrowUpRight,
  AlertTriangle,
  Brain,
  SlidersHorizontal
} from 'lucide-react';

const Recommendations: React.FC = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [hasResume, setHasResume] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scoreThreshold, setScoreThreshold] = useState(0);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const active = await resumeService.getActive().catch(() => null);
      if (active) {
        setHasResume(true);
        const data = await recommendationService.list();
        setRecommendations(data);
      } else {
        setHasResume(false);
      }
    } catch (error) {
      console.error("Failed to load recommendations:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
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
            We require an active resume profile to generate AI recommendation matches. Upload your profile document to unlock matching scores, gap analysis, and tailored career learning pathways.
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

  const filteredRecs = recommendations.filter(rec => rec.match_score >= scoreThreshold);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Filters and Threshold Sliders */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-850 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="font-bold text-white text-base flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
            <span>AI Semantic Matching Opportunities</span>
          </h3>
          <p className="text-xs text-slate-500">Matches sorted automatically by overall compatibility score.</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="space-y-1.5 flex-grow sm:flex-grow-0">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 flex justify-between">
              <span>Filter Match Score:</span>
              <span className="text-indigo-400 font-mono font-extrabold">{scoreThreshold}% +</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={scoreThreshold}
              onChange={(e) => setScoreThreshold(parseInt(e.target.value))}
              className="w-full sm:w-44 accent-indigo-500 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer border border-slate-800"
            />
          </div>
        </div>
      </div>

      {filteredRecs.length === 0 ? (
        <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-12 text-center text-slate-400">
          <SlidersHorizontal className="h-10 w-10 text-slate-600 mx-auto mb-4" />
          <p className="font-semibold text-white mb-1">No matching opportunities found</p>
          <p className="text-sm text-slate-500">Try lowering the Match Score threshold slide control.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredRecs.map((rec) => {
            const job = rec.job;
            if (!job) return null;
            return (
              <div 
                key={rec.id}
                className="bg-slate-900/40 backdrop-blur-md border border-slate-850 hover:border-slate-800/80 rounded-2xl p-6 flex flex-col md:flex-row gap-6 hover:shadow-xl transition-all duration-300"
              >
                {/* Score badge */}
                <div className="flex md:flex-col items-center justify-center p-4 rounded-xl bg-slate-950/60 border border-slate-850 md:w-28 shrink-0 text-center space-x-4 md:space-x-0 md:space-y-2">
                  <div className="text-3xl font-extrabold text-indigo-400 tracking-tight">{rec.match_score}%</div>
                  <div>
                    <div className="text-[9px] uppercase font-extrabold tracking-wider text-slate-500">AI Score</div>
                    <div className="text-[9px] font-medium text-slate-600">Cosine Match</div>
                  </div>
                </div>

                {/* Job metadata and reasoning */}
                <div className="flex-1 space-y-4 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="font-bold text-lg text-white truncate">{job.title}</h4>
                      <p className="text-sm text-slate-400 font-semibold truncate">{job.company}</p>
                      
                      <div className="flex items-center space-x-1 text-xs text-slate-500 pt-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{job.location}</span>
                      </div>
                    </div>
                    
                    <Link
                      to={`/jobs/${job.id}`}
                      className="text-slate-400 hover:text-indigo-400 p-1.5 rounded-lg bg-slate-950/40 border border-slate-850 hover:border-indigo-500/20 transition-all shadow"
                    >
                      <ArrowUpRight className="h-4.5 w-4.5" />
                    </Link>
                  </div>

                  {rec.explanation && (
                    <div className="text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-xl border border-slate-850/60">
                      {rec.explanation}
                    </div>
                  )}

                  {rec.skills_gap && rec.skills_gap.length > 0 ? (
                    <div className="space-y-1.5">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-rose-500 flex items-center space-x-1">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>Identified Skill Gap ({rec.skills_gap.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {rec.skills_gap.map((skill, index) => (
                          <span key={index} className="text-[9px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded uppercase">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center space-x-1">
                      <span>✓</span>
                      <span>No skill gaps! Perfect fit.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Recommendations;
