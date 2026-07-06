import React, { useState, useEffect, useRef } from 'react';
import { resumeService } from '../services/api';
import { Resume } from '../types';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  FileCheck,
  Brain,
  History
} from 'lucide-react';

const ResumeUpload: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [activeResume, setActiveResume] = useState<Resume | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchResumes = async () => {
    try {
      const allResumes = await resumeService.list();
      setResumes(allResumes);
      const active = await resumeService.getActive().catch(() => null);
      setActiveResume(active);
    } catch (error) {
      console.error("Failed to fetch resumes:", error);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUpload(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpload = async (file: File) => {
    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.txt') && !file.name.endsWith('.docx') && !file.name.endsWith('.pdf')) {
      setErrorMessage("Unsupported file type. Please upload a PDF, TXT, or DOCX document.");
      return;
    }

    setUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await resumeService.upload(file);
      setSuccessMessage(`Successfully uploaded and parsed "${file.name}"!`);
      setActiveResume(response);
      fetchResumes();
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.response?.data?.detail || "Failed to upload or parse resume text.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto">
      {/* Upload Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-white tracking-tight">Upload Your Resume</h2>
          
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[260px] cursor-pointer ${
              dragActive 
                ? 'border-indigo-500 bg-indigo-500/5' 
                : 'border-slate-800 bg-slate-900/20 hover:border-slate-700/60'
            }`}
            onClick={onButtonClick}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.txt,.docx"
            />
            
            {uploading ? (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
                <p className="text-sm font-semibold text-slate-300">Extracting resume text and parsing skills...</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-14 w-14 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-center text-slate-400 mx-auto group-hover:scale-110 transition-transform">
                  <UploadCloud className="h-7 w-7 text-indigo-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Drag & drop your resume file here</p>
                  <p className="text-xs text-slate-500 mt-1">or click to browse from files</p>
                </div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-600">Supports PDF, TXT, or DOCX (Max 5MB)</p>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl flex items-start space-x-3 text-sm animate-fadeIn">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-xl flex items-start space-x-3 text-sm animate-fadeIn">
              <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* Active Profile Info */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-850 rounded-2xl p-6 space-y-6">
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 text-indigo-400" />
            <h3 className="font-bold text-white text-base">Active Profile</h3>
          </div>

          {activeResume ? (
            <div className="space-y-4">
              <div className="flex items-start space-x-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                <FileCheck className="h-9 w-9 text-indigo-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white truncate">{activeResume.file_name}</p>
                  <p className="text-[10px] text-slate-500">Parsed {new Date(activeResume.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {activeResume.parsed_skills && activeResume.parsed_skills.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Identified Skillset:</h4>
                  <div className="flex flex-wrap gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                    {activeResume.parsed_skills.map((skill, index) => (
                      <span key={index} className="text-[9px] uppercase font-bold tracking-wider bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500 text-xs">
              No active resume uploaded. Upload a document to build your AI profile.
            </div>
          )}
        </div>
      </div>

      {/* History log list */}
      {resumes.length > 0 && (
        <div className="bg-slate-900/20 border border-slate-850 rounded-2xl p-6 space-y-4">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5 text-slate-500" />
            <h3 className="font-bold text-white text-base">Upload History</h3>
          </div>
          
          <div className="divide-y divide-slate-850">
            {resumes.map((res) => (
              <div key={res.id} className="flex justify-between items-center py-3 first:pt-0 last:pb-0">
                <div className="flex items-center space-x-3 min-w-0">
                  <FileText className="h-5 w-5 text-slate-500 shrink-0" />
                  <span className="text-sm font-medium text-slate-300 truncate">{res.file_name}</span>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  {new Date(res.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeUpload;
