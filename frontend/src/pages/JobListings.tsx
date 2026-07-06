import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { jobService } from '../services/api';
import { Job, JobCreate } from '../types';
import { 
  Search, 
  MapPin, 
  Plus, 
  Trash2, 
  X,
  SlidersHorizontal,
  DollarSign,
  UserCheck
} from 'lucide-react';

const JobListings: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<JobCreate>({
    defaultValues: {
      title: '',
      company: '',
      location: '',
      description: '',
      requirements: '',
      skills_required: [],
      experience_level: '',
      salary_range: '',
      is_active: true
    }
  });

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const data = await jobService.list();
      setJobs(data);
    } catch (error) {
      console.error("Failed to load jobs list:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleAddJob = async (data: any) => {
    setFormError(null);
    try {
      // Split comma separated skills
      const skills = typeof data.skills_required === 'string'
        ? data.skills_required.split(',').map((s: string) => s.trim()).filter(Boolean)
        : [];
      
      await jobService.create({
        ...data,
        skills_required: skills
      });
      setShowAddModal(false);
      reset();
      fetchJobs();
    } catch (error: any) {
      console.error(error);
      setFormError(error.response?.data?.detail || 'Failed to create job listing. Please check inputs.');
    }
  };

  const handleDeleteJob = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this job listing? This will also remove associated vector indexes.")) {
      try {
        await jobService.delete(id);
        fetchJobs();
      } catch (error) {
        console.error("Failed to delete job:", error);
      }
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation = locationFilter === '' || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Search Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative flex-grow max-w-md w-full">
          <Search className="absolute left-4 top-3.5 h-4.5 w-4.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search job title, company, description..."
            className="w-full bg-slate-900/50 border border-slate-800 focus:border-indigo-500 text-white rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none transition-all"
          />
        </div>

        <div className="flex w-full sm:w-auto items-center space-x-3">
          <div className="relative w-1/2 sm:w-44">
            <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              placeholder="Location..."
              className="w-full bg-slate-900/50 border border-slate-800 focus:border-indigo-500 text-white rounded-xl pl-9 pr-4 py-3 text-sm focus:outline-none transition-all"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="w-1/2 sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-3 rounded-xl flex items-center justify-center space-x-2 font-semibold text-sm shadow-lg shadow-indigo-600/10 active:scale-95 transition-all"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Post a Job</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-slate-900/30 border border-slate-850 rounded-2xl p-12 text-center text-slate-400">
          <SlidersHorizontal className="h-10 w-10 text-slate-600 mx-auto mb-4" />
          <p className="font-semibold text-white mb-1">No job listings found</p>
          <p className="text-sm text-slate-500">Try adjusting your search criteria or post a new job posting.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <div 
              key={job.id} 
              className="bg-slate-900/40 backdrop-blur-md border border-slate-850 hover:border-slate-700/60 rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 relative group overflow-hidden"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg text-white group-hover:text-indigo-400 transition-colors">{job.title}</h3>
                    <p className="text-sm font-semibold text-slate-400">{job.company}</p>
                  </div>
                  <button 
                    onClick={() => handleDeleteJob(job.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all focus:opacity-100"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="flex items-center space-x-1.5 bg-slate-950/60 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-full font-medium">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{job.location}</span>
                  </span>
                  {job.experience_level && (
                    <span className="flex items-center space-x-1.5 bg-slate-950/60 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-full font-medium">
                      <UserCheck className="h-3.5 w-3.5" />
                      <span>{job.experience_level}</span>
                    </span>
                  )}
                  {job.salary_range && (
                    <span className="flex items-center space-x-1.5 bg-slate-950/60 border border-slate-800 text-slate-400 px-3 py-1.5 rounded-full font-medium">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span>{job.salary_range}</span>
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">
                  {job.description}
                </p>

                {job.skills_required && job.skills_required.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {job.skills_required.slice(0, 5).map((skill, index) => (
                      <span key={index} className="text-[10px] uppercase font-bold tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                    {job.skills_required.length > 5 && (
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-850 border border-slate-800 text-slate-500 px-2 py-1 rounded">
                        +{job.skills_required.length - 5} More
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-slate-850 pt-4 mt-6 flex justify-end">
                <Link
                  to={`/jobs/${job.id}`}
                  className="text-xs font-bold bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:text-white px-4 py-2.5 rounded-xl text-slate-400 transition-all flex items-center space-x-1"
                >
                  <span>View Details</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-30 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-slate-900 border border-slate-800 w-full max-w-xl p-8 rounded-2xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white tracking-tight">Post a Job Listing</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-200 p-1">
                <X className="h-6 w-6" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl text-sm">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit(handleAddJob)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Title*</label>
                  <input
                    type="text"
                    {...register('title', { required: 'Job title is required' })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                    placeholder="Software Engineer"
                  />
                  {errors.title && <p className="text-xs text-red-400 mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Company*</label>
                  <input
                    type="text"
                    {...register('company', { required: 'Company name is required' })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                    placeholder="Innovate Tech"
                  />
                  {errors.company && <p className="text-xs text-red-400 mt-1">{errors.company.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Location*</label>
                  <input
                    type="text"
                    {...register('location', { required: 'Location is required' })}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                    placeholder="Remote"
                  />
                  {errors.location && <p className="text-xs text-red-400 mt-1">{errors.location.message}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Experience Level</label>
                  <input
                    type="text"
                    {...register('experience_level')}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                    placeholder="Mid-Senior"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Salary Range</label>
                  <input
                    type="text"
                    {...register('salary_range')}
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                    placeholder="$100k - $120k"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Skills Required (comma separated)</label>
                <input
                  type="text"
                  {...register('skills_required')}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all"
                  placeholder="Python, SQL, React"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Job Description*</label>
                <textarea
                  rows={4}
                  {...register('description', { required: 'Job description is required' })}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all resize-none"
                  placeholder="Describe details, roles, and context..."
                />
                {errors.description && <p className="text-xs text-red-400 mt-1">{errors.description.message}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Additional Requirements</label>
                <textarea
                  rows={2}
                  {...register('requirements')}
                  className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all resize-none"
                  placeholder="Degree, travel needs..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-slate-950/60 hover:bg-slate-950 border border-slate-800 hover:text-white text-slate-400 font-semibold px-5 py-2.5 rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm shadow-lg shadow-indigo-600/10 active:scale-95 transition-all"
                >
                  Post Opportunity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobListings;
