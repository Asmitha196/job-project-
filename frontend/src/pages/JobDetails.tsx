import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jobService, resumeService, recommendationService } from '../services/api';
import { Job, Recommendation } from '../types';
import { 
  ArrowLeft, 
  MapPin, 
  DollarSign, 
  UserCheck, 
  Calendar,
  Sparkles,
  Award
} from 'lucide-react';

const JobDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobDetails = async () => {
      if (!id) return;
      try {
        const jobData = await jobService.get(parseInt(id));
        setJob(jobData);

        // Fetch matching recommendation if available
        const activeResume = await resumeService.getActive().catch(() => null);
        if (activeResume) {
          const recs = await recommendationService.list().catch(() => []);
          const match = recs.find(r => r.job_id === jobData.id);
          if (match) {
            setRecommendation(match);
          }
        }
      } catch (error) {
        console.error("Failed to load job details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-12 text-center text-slate-400">
        <p className="font-semibold text-white mb-2">Job Listing Not Found</p>
        <Link to="/jobs" className="text-sm text-indigo-400 hover:underline">Return to job listings</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Back navigation */}
      <Link 
        to="/jobs" 
        className="flex items-center space-x-2 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to listings</span>
      </Link>

      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-850 rounded-2xl p-6 md:p-8 space-y-8 shadow-2xl relative overflow-hidden">
        {/* Decorative Gradients */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-800/60">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{job.title}</h2>
            <p className="text-base font-semibold text-indigo-400">{job.company}</p>
            
            <div className="flex flex-wrap gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center space-x-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span>{job.location}</span>
              </span>
              {job.experience_level && (
                <span className="flex items-center space-x-1.5">
                  <UserCheck className="h-3.5 w-3.5" />
                  <span>{job.experience_level}</span>
                </span>
              )}
              {job.salary_range && (
                <span className="flex items-center space-x-1.5">
                  <DollarSign className="h-3.5 w-3.5" />
                  <span>{job.salary_range}</span>
                </span>
              )}
              <span className="flex items-center space-x-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Posted {new Date(job.created_at).toLocaleDateString()}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col items-stretch sm:items-end w-full sm:w-auto">
            {recommendation ? (
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 flex items-center space-x-3 self-start sm:self-auto">
                <div className="h-10 w-10 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow">
                  {recommendation.match_score}%
                </div>
                <div>
                  <p className="text-xs font-semibold text-indigo-400">Match Score</p>
                  <p className="text-[10px] text-slate-500">AI Evaluated</p>
                </div>
              </div>
            ) : (
              <Link 
                to="/resumes" 
                className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-center"
              >
                Upload resume for AI match analysis
              </Link>
            )}
          </div>
        </div>

        {/* AI Analysis Sub-block */}
        {recommendation && (
          <div className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl space-y-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
              <h3 className="font-bold text-base text-white">AI Matching Feedback</h3>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {recommendation.explanation}
            </p>
            {recommendation.skills_gap && recommendation.skills_gap.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Identified Skill Gaps:</h4>
                <div className="flex flex-wrap gap-1.5">
                  {recommendation.skills_gap.map((skill, index) => (
                    <span key={index} className="text-[10px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2.5 py-1 rounded-full uppercase">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Job Body Details */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h3 className="font-bold text-lg text-white">Description</h3>
            <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
              {job.description}
            </p>
          </div>

          {job.requirements && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-white">Requirements</h3>
              <p className="text-sm text-slate-400 leading-relaxed whitespace-pre-wrap">
                {job.requirements}
              </p>
            </div>
          )}

          {job.skills_required && job.skills_required.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-lg text-white">Key Skills Required</h3>
              <div className="flex flex-wrap gap-2">
                {job.skills_required.map((skill, index) => (
                  <span 
                    key={index} 
                    className="flex items-center space-x-1.5 bg-slate-950/60 border border-slate-800 text-slate-400 px-3.5 py-1.5 rounded-xl font-medium text-xs uppercase"
                  >
                    <Award className="h-3.5 w-3.5 text-indigo-500" />
                    <span>{skill}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Apply Trigger */}
        <div className="border-t border-slate-800/60 pt-6 mt-8 flex justify-between items-center">
          <div className="text-xs text-slate-500">
            ID: JOB-{job.id}
          </div>
          <button
            onClick={() => alert("Apply feature simulated! Your active profile was successfully shared.")}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-6 py-3 rounded-xl text-sm shadow-lg shadow-indigo-600/10 active:scale-95 transition-all"
          >
            Apply for this Role
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobDetails;
