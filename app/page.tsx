"use client";

import {
  Briefcase,
  Check,
  Copy,
  FileUser,
  Pencil,
  Sparkles,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import { AutoGrowTextarea } from "./components/AutoGrowTextarea";
import { Modal } from "./components/Modal";
import { ScoreBar } from "./components/ScoreBar";

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

function Spinner() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 animate-spin">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const textareaStyle: React.CSSProperties = {
  background: "var(--surface-1)",
  borderColor: "var(--border-subtle)",
  color: "var(--text-primary)",
};

export default function Home() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [editedCoverLetter, setEditedCoverLetter] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayedCoverLetter = isEditing ? editedCoverLetter : coverLetter;

  const canSubmit =
    jobDescription.trim().length > 0 && resumeText.trim().length > 0 && !loading;

  async function handleAnalyze() {
    setLoading(true);
    setError(null);
    setResult(null);
    setCoverLetter("");
    setIsEditing(false);
    setCopied(false);

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
      setModalOpen(true);

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

  function handleStartEdit() {
    setEditedCoverLetter(coverLetter);
    setIsEditing(true);
  }

  function handleSaveEdit() {
    setCoverLetter(editedCoverLetter);
    setIsEditing(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(displayedCoverLetter);
    setCopied(true);
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className="flex flex-1 flex-col items-center px-4 py-10 sm:px-6 sm:py-20"
      style={{ background: "var(--surface-0)" }}
    >
      <div className="flex w-full max-w-4xl flex-col gap-10">
        <header className="flex flex-col items-center gap-3 text-center">

          <h1
            className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl"
            style={{ color: "var(--text-primary)" }}
          >
            Job Application Intelligence Pipeline
          </h1>
          <p
            className="max-w-lg text-base leading-relaxed"
            style={{ color: "var(--text-secondary)" }}
          >
            Paste a job description and a resume to get a skill-gap analysis, a
            culture-fit score, and a tailored cover letter.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div
            className="flex flex-col gap-3 rounded-2xl p-5"
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <label className="flex flex-col gap-2">
              <span
                className="flex items-center gap-1.5 text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                <Briefcase size={15} strokeWidth={1.75} />
                Job description
              </span>
            </label>
            <AutoGrowTextarea
              value={jobDescription}
              onChange={setJobDescription}
              placeholder="Drop in the role's job posting...."
            />
          </div>

          <div
            className="flex flex-col gap-3 rounded-2xl p-5"
            style={{
              background: "var(--surface-1)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <label className="flex flex-col gap-2">
              <span
                className="flex items-center gap-1.5 text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                <FileUser size={15} strokeWidth={1.75} />
                Resume
              </span>
            </label>
            <AutoGrowTextarea
              value={resumeText}
              onChange={setResumeText}
              placeholder="Paste in the candidate's resume...."
            />
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={!canSubmit}
            className="flex w-full items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-md transition-all duration-200 disabled:cursor-not-allowed disabled:scale-100 disabled:opacity-40 cursor-pointer sm:w-auto"
            style={{
              background: canSubmit
                ? "linear-gradient(135deg, var(--accent), var(--accent-hover))"
                : "var(--text-tertiary)",
              boxShadow: canSubmit ? "0 8px 28px -8px var(--accent)" : "none",
            }}
            onMouseEnter={(e) => {
              if (!canSubmit) return;
              e.currentTarget.style.filter = "brightness(0.92)";
              e.currentTarget.style.boxShadow = "0 6px 20px -8px var(--accent)";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseLeave={(e) => {
              if (!canSubmit) return;
              e.currentTarget.style.filter = "none";
              e.currentTarget.style.boxShadow = "0 8px 28px -8px var(--accent)";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {loading ? <Spinner /> : <Zap size={16} strokeWidth={2} fill="currentColor" />}
            {loading ? "Analyzing..." : "Analyze application"}
          </button>
          {result && !modalOpen && (
            <button
              onClick={() => setModalOpen(true)}
              className="text-sm font-medium underline-offset-4 hover:underline"
              style={{ color: "var(--text-secondary)" }}
            >
              View last results
            </button>
          )}
        </div>

        {error && (
          <div
            className="rounded-xl border p-4 text-sm leading-relaxed"
            style={{
              background: "rgba(226, 96, 79, 0.08)",
              borderColor: "rgba(226, 96, 79, 0.25)",
              color: "#d3503e",
            }}
          >
            {error}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="flex flex-col gap-8 p-5 sm:gap-10 sm:p-10">
          <div className="flex flex-col gap-1 pr-10 sm:pr-8">
            <span
              className="flex items-center gap-1.5 text-s font-semibold tracking-wide uppercase"
              style={{ color: "var(--accent-soft-text)" }}
            >
              <Sparkles size={18} strokeWidth={2} />
              Analysis results
            </span>
            {result && (
              <h2
                className="text-xl font-semibold tracking-tight"
                style={{ color: "var(--text-primary)" }}
              >
                {result.jobParserRes.role} at {result.jobParserRes.company}
              </h2>
            )}
          </div>

          {result && (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div
                  className="flex flex-col gap-3 rounded-xl p-5"
                  style={{
                    background: "var(--surface-2-tint)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <h3
                    className="flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <Briefcase size={14} strokeWidth={1.75} />
                    Job parser
                  </h3>
                  <dl
                    className="flex flex-col gap-2 text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <div className="flex flex-wrap gap-x-1.5">
                      <dt
                        className="shrink-0 font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Role:
                      </dt>
                      <dd>{result.jobParserRes.role}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-1.5">
                      <dt
                        className="shrink-0 font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Company:
                      </dt>
                      <dd>{result.jobParserRes.company}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-1.5">
                      <dt
                        className="shrink-0 font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Salary range:
                      </dt>
                      <dd>{result.jobParserRes.salaryRange}</dd>
                    </div>
                    <div className="flex flex-wrap gap-x-1.5">
                      <dt
                        className="shrink-0 font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Remote policy:
                      </dt>
                      <dd>{result.jobParserRes.remotePolicy}</dd>
                    </div>
                    <div>
                      <dt className="font-medium" style={{ color: "var(--text-primary)" }}>
                        Required skills:
                      </dt>
                      <dd>{result.jobParserRes.requiredSkills.join(", ")}</dd>
                    </div>
                    <div>
                      <dt className="font-medium" style={{ color: "var(--text-primary)" }}>
                        Nice to have:
                      </dt>
                      <dd>{result.jobParserRes.niceToHave.join(", ")}</dd>
                    </div>
                  </dl>
                </div>

                <div
                  className="flex flex-col gap-3 rounded-xl p-5"
                  style={{
                    background: "var(--surface-2-tint)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  <h3
                    className="flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    <FileUser size={14} strokeWidth={1.75} />
                    Resume parser
                  </h3>
                  <dl
                    className="flex flex-col gap-2 text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <div>
                      <dt className="font-medium" style={{ color: "var(--text-primary)" }}>
                        Skills:
                      </dt>
                      <dd>{result.resumeParserRes.skills.join(", ")}</dd>
                    </div>
                    <div>
                      <dt className="font-medium" style={{ color: "var(--text-primary)" }}>
                        Experience:
                      </dt>
                      <dd>{result.resumeParserRes.experience.join("; ")}</dd>
                    </div>
                    <div>
                      <dt className="font-medium" style={{ color: "var(--text-primary)" }}>
                        Education:
                      </dt>
                      <dd>{result.resumeParserRes.education.join("; ")}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <ScoreBar
                  label="Skill gap score"
                  score={result.matchScore.skillGapScore.score}
                  reasoning={result.matchScore.skillGapScore.reasoning}
                />
                <ScoreBar
                  label="Culture fit score"
                  score={result.matchScore.cultureFitScore.score}
                  reasoning={result.matchScore.cultureFitScore.reasoning}
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <h3
                className="flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase"

              >
                Cover letter
                {isStreaming && (
                  <span style={{ color: "var(--accent-soft-text)" }}>· streaming</span>
                )}
              </h3>
              <div className="flex items-center gap-4 sm:gap-5">
                <button
                  onClick={handleCopy}
                  disabled={isStreaming || !coverLetter}
                  className="flex items-center gap-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer opacity-70 hover:opacity-100"
                  style={{ color: copied ? "#2f9e6c" : "var(--text-secondary)" }}
                >
                  {copied ? (
                    <Check size={14} strokeWidth={2} />
                  ) : (
                    <Copy size={14} strokeWidth={1.75} />
                  )}
                  {copied ? "Copied!" : "Copy"}
                </button>
                {isEditing ? (
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center gap-1.5 text-sm font-medium transition-colors cursor-pointer opacity-70 hover:opacity-100"
                    style={{ color: "var(--accent-soft-text)" }}
                  >
                    <Check size={14} strokeWidth={2} />
                    Done
                  </button>
                ) : (
                  <button
                    onClick={handleStartEdit}
                    disabled={isStreaming || !coverLetter}
                    className="flex items-center gap-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer opacity-70 hover:opacity-100"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <Pencil size={14} strokeWidth={1.75} />
                    Edit
                  </button>
                )}
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={editedCoverLetter}
                onChange={(e) => setEditedCoverLetter(e.target.value)}
                rows={14}
                autoFocus
                style={textareaStyle}
                className="custom-scroll focus-glow w-full resize-y rounded-xl border p-5 text-sm leading-relaxed outline-none transition-shadow"
              />
            ) : (
              <div
                className="rounded-xl p-5 text-sm leading-relaxed whitespace-pre-wrap"
                style={{ background: "var(--surface-2-tint)", color: "var(--text-secondary)" }}
              >
                {coverLetter}
                {isStreaming && (
                  <span
                    className="ml-0.5 inline-block h-4 w-2 animate-pulse align-middle"
                    style={{ background: "var(--accent)" }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
