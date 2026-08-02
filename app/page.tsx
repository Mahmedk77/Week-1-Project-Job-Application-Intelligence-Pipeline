"use client";

import { useState } from "react";

type JobParserResult = {
  role: string;
  company: string;
  requiredSkills: string[];
  niceToHave: string[];
  salaryRange: string;
  remotePolicy: "remote" | "hybrid" | "onsite" | "not specified";
};

type ResumeParserResult = {
  skills: string[];
  experience: string[];
  education: string[];
};

type Score = {
  score: number;
  reasoning: string;
};

type MatchScore = {
  skillGapScore: Score;
  cultureFitScore: Score;
};

type AnalysisResult = {
  jobParserRes: JobParserResult;
  resumeParserRes: ResumeParserResult;
  matchScore: MatchScore;
};

function decodeBase64Header(value: string | null): unknown {
  if (!value) return null;
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  const canSubmit =
    jobDescription.trim().length > 0 && resumeText.trim().length > 0 && !loading;

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    setCoverLetter("");

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, resumeText }),
      });

      if (!response.ok || !response.body) {
        const text = await response.text();
        throw new Error(text || `Request failed with status ${response.status}`);
      }

      const jobParserRes = decodeBase64Header(
        response.headers.get("X-Job-Parser")
      ) as JobParserResult;
      const resumeParserRes = decodeBase64Header(
        response.headers.get("X-Resume-Parser")
      ) as ResumeParserResult;
      const matchScore = decodeBase64Header(
        response.headers.get("X-Match-Score")
      ) as MatchScore;

      setResult({ jobParserRes, resumeParserRes, matchScore });
      setLoading(false);
      setIsStreaming(true);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        setCoverLetter((prev) => prev + decoder.decode(value, { stream: true }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setLoading(false);
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="flex w-full max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Job Application Intelligence Pipeline
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Paste a job description and a resume to get a skill-gap analysis, a
            culture-fit score, and a tailored cover letter.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Job description
            </span>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              rows={12}
              className="w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
              Resume
            </span>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste the resume text here..."
              rows={12}
              className="w-full resize-y rounded-lg border border-zinc-300 bg-white p-3 text-sm text-black outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
            />
          </label>
        </div>

        <div>
          <button
            onClick={handleAnalyze}
            disabled={!canSubmit}
            className="rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
            {error}
          </div>
        )}

        {(result || isStreaming || coverLetter) && (
          <section className="flex flex-col gap-6 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            {result && (
              <>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Job parser
                    </h2>
                    <dl className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                      <div>
                        <dt className="inline font-medium">Role: </dt>
                        <dd className="inline">{result.jobParserRes.role}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium">Company: </dt>
                        <dd className="inline">{result.jobParserRes.company}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium">Salary range: </dt>
                        <dd className="inline">{result.jobParserRes.salaryRange}</dd>
                      </div>
                      <div>
                        <dt className="inline font-medium">Remote policy: </dt>
                        <dd className="inline">{result.jobParserRes.remotePolicy}</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Required skills:</dt>
                        <dd>{result.jobParserRes.requiredSkills.join(", ")}</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Nice to have:</dt>
                        <dd>{result.jobParserRes.niceToHave.join(", ")}</dd>
                      </div>
                    </dl>
                  </div>

                  <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Resume parser
                    </h2>
                    <dl className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                      <div>
                        <dt className="font-medium">Skills:</dt>
                        <dd>{result.resumeParserRes.skills.join(", ")}</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Experience:</dt>
                        <dd>{result.resumeParserRes.experience.join("; ")}</dd>
                      </div>
                      <div>
                        <dt className="font-medium">Education:</dt>
                        <dd>{result.resumeParserRes.education.join("; ")}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Skill gap score: {result.matchScore.skillGapScore.score}/10
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {result.matchScore.skillGapScore.reasoning}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      Culture fit score: {result.matchScore.cultureFitScore.score}/10
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      {result.matchScore.cultureFitScore.reasoning}
                    </p>
                  </div>
                </div>
              </>
            )}

            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Cover letter {isStreaming && "(streaming...)"}
              </h2>
              <div className="whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-sm leading-relaxed text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                {coverLetter}
                {isStreaming && (
                  <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-zinc-500 align-middle" />
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
