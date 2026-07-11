import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { recommendationService, resumeService } from "../services/api";
import { SkillsGapAnalysis } from "../types";

import {
  BarChart3,
  BookOpen,
  Brain,
  Info,
} from "lucide-react";

const SkillsGap: React.FC = () => {
  const [analysis, setAnalysis] = useState<SkillsGapAnalysis | null>(null);
  const [hasResume, setHasResume] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkillsGap = async () => {
      try {
        setLoading(true);

        const activeResume = await resumeService
          .getActive()
          .catch(() => null);

        if (!activeResume) {
          setHasResume(false);
          return;
        }

        setHasResume(true);

        const data = await recommendationService.getSkillsGap();

        setAnalysis({
          resume_skills: data?.resume_skills ?? [],
          skill_gaps: data?.skill_gaps ?? [],
          total_jobs_evaluated: data?.total_jobs_evaluated ?? 0,
          advice:
            data?.advice ??
            "No learning roadmap is currently available.",
        });
      } catch (err) {
        console.error("Failed to load skills gap:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSkillsGap();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="h-12 w-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hasResume) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-slate-900/40 border border-slate-800 rounded-xl p-10 text-center">

        <Brain className="mx-auto h-12 w-12 text-indigo-400 mb-5" />

        <h2 className="text-2xl font-bold text-white mb-3">
          Upload Resume First
        </h2>

        <p className="text-slate-400 mb-8">
          Upload your resume before generating a skill gap analysis.
        </p>

        <Link
          to="/resumes"
          className="px-6 py-3 rounded-xl bg-indigo-600 text-white"
        >
          Upload Resume
        </Link>

      </div>
    );
  }

  if (!analysis || analysis.skill_gaps.length === 0) {
    return (
      <div className="max-w-xl mx-auto mt-12 bg-slate-900/40 border border-slate-800 rounded-xl p-10 text-center">

        <BarChart3 className="mx-auto h-12 w-12 text-green-500 mb-5" />

        <h2 className="text-2xl font-bold text-white mb-3">
          No Skill Gaps Found
        </h2>

        <p className="text-slate-400">
          Great! Your resume currently matches the available jobs.
        </p>

      </div>
    );
  }

  const chartData = (analysis.skill_gaps ?? []).slice(0, 8).map((item: any) => ({
    name: item.skill,
    Missing: item.missing_in_jobs_count,
  }));

  return (
    <div className="space-y-8">

      <div className="grid lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 bg-slate-900/40 rounded-xl border border-slate-800 p-6">

          <div className="flex items-center mb-5">

            <BarChart3 className="mr-2 text-indigo-400" />

            <h2 className="font-bold text-white">
              Top Missing Skills
            </h2>

          </div>

          <div className="h-80">

            <ResponsiveContainer width="100%" height="100%">

              <BarChart data={chartData}>

                <CartesianGrid strokeDasharray="3 3" />

                <XAxis dataKey="name" />

                <YAxis />

                <Tooltip />

                <Bar dataKey="Missing" fill="#6366f1" />

              </BarChart>

            </ResponsiveContainer>

          </div>

        </div>

        <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-6">

          <div className="flex items-center mb-5">

            <Info className="mr-2 text-indigo-400" />

            <h2 className="font-bold text-white">
              Summary
            </h2>

          </div>

          <div className="space-y-4">

            <div className="flex justify-between">
              <span className="text-slate-400">
                Total Jobs
              </span>

              <span className="text-white font-bold">
                {analysis.total_jobs_evaluated}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">
                Resume Skills
              </span>

              <span className="text-white font-bold">
                {analysis.resume_skills?.length ?? 0}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">
                Missing Skills
              </span>

              <span className="text-red-400 font-bold">
                {analysis.skill_gaps?.length ?? 0}
              </span>
            </div>

          </div>

        </div>

      </div>

      <div className="bg-slate-900/40 rounded-xl border border-slate-800 p-6">

        <div className="flex items-center mb-5">

          <BookOpen className="mr-2 text-indigo-400" />

          <h2 className="font-bold text-white">
            AI Learning Roadmap
          </h2>

        </div>

        <p className="text-slate-300 whitespace-pre-wrap">
          {analysis.advice}
        </p>

      </div>

    </div>
  );
};

export default SkillsGap;