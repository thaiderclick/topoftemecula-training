import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { PasswordGate } from '@/components/PasswordGate';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Link } from 'wouter';
import {
  BookOpen,
  CheckCircle,
  Award,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  HelpCircle,
  ChevronRight,
  FileText,
  Video,
  Shield,
  Sparkles,
  Volume2,
  Check,
  X,
  Lock,
  MessageSquare,
  Eye,
  EyeOff,
  LogIn,
  Loader2,
  CalendarClock,
  ListChecks,
  Dumbbell,
  Clock,
  Target,
  Flag,
} from 'lucide-react';
import { trainingModules, finalReadinessTestBank, Question, Module, ContentBlock, TableBlock } from '../data/trainingData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProgressState {
  completedModules: string[];
  completedQuizzes: string[];
  completedAssignments: string[];
  assignmentsData: Record<string, string>;
  safetyCompleted: boolean;
  passedFinalTest: boolean;
  finalTestScore: number | null;
  shift1DebriefData: Record<string, string> | null;
}

const DEFAULT_PROGRESS: ProgressState = {
  completedModules: [],
  completedQuizzes: [],
  completedAssignments: [],
  assignmentsData: {},
  safetyCompleted: false,
  passedFinalTest: false,
  finalTestScore: null,
  shift1DebriefData: null,
};

// ─── Rich content renderers ─────────────────────────────────────────────────

function moduleLabel(day: number): string {
  if (day === 0) return 'Foundations';
  if (day === 99) return 'Safety';
  return `Day ${day}`;
}

function moduleBadge(day: number): string {
  if (day === 0) return 'F';
  if (day === 99) return 'S';
  return String(day);
}

// Compact duration for the narrow sidebar chip, e.g.
// "2.5 Hours (Self-Paced Knowledge Module — complete before Day 1)" -> "2.5 hrs · Self-Paced"
// "4 Hours (Paid)" -> "4 hrs · Paid". The full string still shows in the content header.
function shortDuration(duration: string): string {
  const timeMatch = duration.match(/^\s*([\d.]+)\s*Hours?/i);
  const time = timeMatch ? `${timeMatch[1]} hr${timeMatch[1] === '1' ? '' : 's'}` : duration;
  const paren = duration.match(/\(([^)]*)\)/)?.[1] ?? '';
  let tag = '';
  if (/self-?paced/i.test(paren)) tag = 'Self-Paced';
  else if (/paid/i.test(paren)) tag = 'Paid';
  return tag ? `${time} · ${tag}` : time;
}

function ContentBlocks({ blocks }: { blocks?: ContentBlock[] }) {
  if (!blocks || !blocks.length) return null;
  return (
    <>
      {blocks.map((b, idx) => {
        if (b.kind === 'list') {
          const ListTag = b.ordered ? 'ol' : 'ul';
          return (
            <ListTag key={idx} className={`flex flex-col gap-1.5 pl-5 ${b.ordered ? 'list-decimal' : 'list-disc'} marker:text-primary`}>
              {b.items.map((it, i) => <li key={i} className="pl-1">{it}</li>)}
            </ListTag>
          );
        }
        if (b.kind === 'code') {
          return (
            <pre key={idx} className="overflow-x-auto rounded-xl border border-border bg-background/60 p-3 text-xs leading-relaxed font-mono text-foreground my-1">
              <code>{b.text}</code>
            </pre>
          );
        }
        if (b.kind === 'video') {
          return (
            <figure key={idx} className="my-2">
              <div className="relative w-full overflow-hidden rounded-xl border border-border bg-black" style={{ aspectRatio: '16 / 9' }}>
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${b.videoId}`}
                  title={b.title ?? 'Video'}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
              {b.title && (
                <figcaption className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Video className="h-3.5 w-3.5 shrink-0" />
                  {b.title}
                </figcaption>
              )}
            </figure>
          );
        }
        return <p key={idx}>{b.text}</p>;
      })}
    </>
  );
}

// Assignment body: paragraphs/lists with a bold lead-in for "Part N — …" and "Example …:" headers.
function AssignmentDescription({ blocks }: { blocks?: ContentBlock[] }) {
  if (!blocks || !blocks.length) return null;
  return (
    <div className="flex flex-col gap-3 text-sm text-muted-foreground leading-relaxed">
      {blocks.map((b, idx) => {
        if (b.kind === 'list') {
          const ListTag = b.ordered ? 'ol' : 'ul';
          return (
            <ListTag key={idx} className={`flex flex-col gap-1.5 pl-5 ${b.ordered ? 'list-decimal' : 'list-disc'} marker:text-primary`}>
              {b.items.map((it, i) => <li key={i} className="pl-1">{it}</li>)}
            </ListTag>
          );
        }
        if (b.kind === 'code') {
          return (
            <pre key={idx} className="overflow-x-auto rounded-xl border border-border bg-background/60 p-3 text-xs leading-relaxed font-mono text-foreground">
              <code>{b.text}</code>
            </pre>
          );
        }
        if (b.kind === 'video') return null;
        const lead = b.text.match(/^(Part \d+[^.]*\.|Example[^:]*:)\s*([\s\S]*)$/);
        if (lead) {
          return (
            <p key={idx}><span className="font-semibold text-foreground">{lead[1]}</span> {lead[2]}</p>
          );
        }
        return <p key={idx}>{b.text}</p>;
      })}
    </div>
  );
}

function DataTable({ table }: { table: TableBlock }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border my-2">
      <table className="w-full text-xs md:text-sm border-collapse">
        <thead>
          <tr className="bg-primary/5">
            {table.headers.map((h, i) => (
              <th key={i} className="text-left font-bold text-foreground p-2.5 border-b border-border">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, ri) => (
            <tr key={ri} className="even:bg-background/40">
              {row.map((cell, ci) => (
                <td key={ci} className="align-top p-2.5 border-b border-border/50 text-muted-foreground">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();

  // ── Server progress sync ──
  const utils = trpc.useUtils();
  const progressQuery = trpc.training.getProgress.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const saveProgressMutation = trpc.training.saveProgress.useMutation({
    onSuccess: () => { utils.credential.mine.invalidate(); },
  });

  // ── Issued credential (populated server-side once the final test is passed) ──
  const credentialQuery = trpc.credential.mine.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const credential = credentialQuery.data;

  // ── Local progress state (mirrors server) ──
  const [progress, setProgress] = useState<ProgressState>(DEFAULT_PROGRESS);
  const [progressLoaded, setProgressLoaded] = useState(false);

  useEffect(() => {
    if (progressQuery.data && !progressLoaded) {
      setProgress({
        completedModules: progressQuery.data.completedModules ?? [],
        completedQuizzes: progressQuery.data.completedQuizzes ?? [],
        completedAssignments: progressQuery.data.completedAssignments ?? [],
        assignmentsData: (progressQuery.data.assignmentsData as Record<string, string>) ?? {},
        safetyCompleted: progressQuery.data.safetyCompleted ?? false,
        passedFinalTest: progressQuery.data.passedFinalTest ?? false,
        finalTestScore: progressQuery.data.finalTestScore ?? null,
        shift1DebriefData: (progressQuery.data.shift1DebriefData as Record<string, string> | null) ?? null,
      });
      setProgressLoaded(true);
    }
  }, [progressQuery.data, progressLoaded]);

  const saveProgress = (updates: Partial<ProgressState>) => {
    const next = { ...progress, ...updates };
    setProgress(next);
    saveProgressMutation.mutate({
      completedModules: next.completedModules,
      completedQuizzes: next.completedQuizzes,
      completedAssignments: next.completedAssignments,
      assignmentsData: next.assignmentsData,
      safetyCompleted: next.safetyCompleted,
      passedFinalTest: next.passedFinalTest,
      finalTestScore: next.finalTestScore ?? undefined,
      shift1DebriefData: next.shift1DebriefData ?? undefined,
    });
  };

  // ── Navigation state ──
  const [activeModuleId, setActiveModuleId] = useState<string>('foundations');
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);
  const [showAssignment, setShowAssignment] = useState<boolean>(false);
  const [showFinalTest, setShowFinalTest] = useState(false);
  const [finalTestAnswers, setFinalTestAnswers] = useState<Record<string, number>>({});
  const [finalTestSubmitted, setFinalTestSubmitted] = useState(false);
  const [finalTestScore, setFinalTestScore] = useState(0);
  // Randomized 10-from-20 question set with shuffled answer options
  const [activeTestQuestions, setActiveTestQuestions] = useState<(Question & { shuffledOptions: string[]; mappedCorrect: number })[]>([]);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [rubricChecked, setRubricChecked] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [revealedRecall, setRevealedRecall] = useState<Record<string, boolean>>({});
  const [showShift1Debrief, setShowShift1Debrief] = useState(false);
  const [shift1DebriefAnswers, setShift1DebriefAnswers] = useState<Record<string, string>>({});
  const [quizFeedback, setQuizFeedback] = useState<string>('');
  const [quizFeedbackSubmitted, setQuizFeedbackSubmitted] = useState<boolean>(false);

  const submitFeedbackMutation = trpc.feedback.submit.useMutation({
    onSuccess: () => {
      setQuizFeedbackSubmitted(true);
      setQuizFeedback('');
    },
    onError: () => {
      toast.error('Failed to submit feedback. Please try again.');
    },
  });

  // Sync local assignment data to textarea
  const activeModule = trainingModules.find(m => m.id === activeModuleId) || trainingModules[0];

  // ── Progress calculations ──
  const totalSteps = trainingModules.length * 3 + 2; // slides, quiz, assignment per module + safety + final
  let completedSteps = 0;
  trainingModules.forEach(m => {
    if (progress.completedModules.includes(m.id)) completedSteps++;
    if (progress.completedQuizzes.includes(m.id)) completedSteps++;
    if (progress.completedAssignments.includes(m.id)) completedSteps++;
  });
  if (progress.safetyCompleted) completedSteps++;
  if (progress.passedFinalTest) completedSteps++;
  const overallProgress = Math.round((completedSteps / totalSteps) * 100);

  // ── Gating logic ──
  const isModuleUnlocked = (moduleId: string) => {
    const index = trainingModules.findIndex(m => m.id === moduleId);
    if (index === 0) return true;
    const prevMod = trainingModules[index - 1];
    return progress.completedAssignments.includes(prevMod.id);
  };

  const isSafetyUnlocked = () => trainingModules.every(m => progress.completedAssignments.includes(m.id));
  const isFinalTestUnlocked = () => isSafetyUnlocked() && progress.safetyCompleted;

  // ── Slide navigation ──
  const nextSlide = () => {
    if (currentSlideIndex < activeModule.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      if (!progress.completedModules.includes(activeModule.id)) {
        saveProgress({ completedModules: [...progress.completedModules, activeModule.id] });
        toast.success(`${moduleLabel(activeModule.day)} Content Completed! Moving to Knowledge Check.`);
      }
      setShowQuiz(true);
      setQuizAnswers({});
      setQuizSubmitted(false);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) setCurrentSlideIndex(currentSlideIndex - 1);
  };

  // ── Quiz ──
  const handleQuizAnswerSelect = (questionId: string, optionIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const submitQuiz = () => {
    const unanswered = activeModule.quiz.filter(q => quizAnswers[q.id] === undefined);
    if (unanswered.length > 0) { toast.error('Please answer all questions before submitting.'); return; }
    let correctCount = 0;
    activeModule.quiz.forEach(q => { if (quizAnswers[q.id] === q.correctAnswer) correctCount++; });
    setQuizScore(correctCount);
    setQuizSubmitted(true);
    if (correctCount === activeModule.quiz.length) {
      if (!progress.completedQuizzes.includes(activeModule.id)) {
        saveProgress({ completedQuizzes: [...progress.completedQuizzes, activeModule.id] });
      }
      toast.success('Perfect score! Knowledge check passed.');
    } else {
      toast.error(`Score: ${correctCount}/${activeModule.quiz.length}. Review explanations and try again for a perfect score!`);
    }
  };

  // ── Assignment ──
  const handleAssignmentSubmit = (text: string) => {
    if (!text.trim()) { toast.error('Please enter your assignment response before submitting.'); return; }
    const updatedData = { ...progress.assignmentsData, [activeModule.id]: text };
    const updatedAssignments = progress.completedAssignments.includes(activeModule.id)
      ? progress.completedAssignments
      : [...progress.completedAssignments, activeModule.id];
    saveProgress({ assignmentsData: updatedData, completedAssignments: updatedAssignments });
    toast.success(`${moduleLabel(activeModule.day)} Assignment Submitted!`);
    setShowAssignment(false);
    const currentIndex = trainingModules.findIndex(m => m.id === activeModule.id);
    if (currentIndex < trainingModules.length - 1) {
      const nextMod = trainingModules[currentIndex + 1];
      setActiveModuleId(nextMod.id);
      setCurrentSlideIndex(0);
      setShowQuiz(false);
    }
  };

  // ── Final Test ──
  // Build a fresh randomized 10-from-20 question set with shuffled answer options
  const generateTestQuestions = () => {
    const shuffled = [...finalReadinessTestBank].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);
    return selected.map(q => {
      // Build an array of [option, originalIndex] pairs and shuffle them
      const indexed = q.options.map((opt, i) => ({ opt, i }));
      indexed.sort(() => Math.random() - 0.5);
      const shuffledOptions = indexed.map(x => x.opt);
      const mappedCorrect = indexed.findIndex(x => x.i === q.correctAnswer);
      return { ...q, shuffledOptions, mappedCorrect };
    });
  };

  const handleFinalTestSelect = (questionId: string, optionIndex: number) => {
    if (finalTestSubmitted) return;
    setFinalTestAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const submitFinalTest = () => {
    const unanswered = activeTestQuestions.filter(q => finalTestAnswers[q.id] === undefined);
    if (unanswered.length > 0) { toast.error('Please answer all 10 questions before submitting.'); return; }
    let correctCount = 0;
    activeTestQuestions.forEach(q => { if (finalTestAnswers[q.id] === q.mappedCorrect) correctCount++; });
    setFinalTestScore(correctCount);
    setFinalTestSubmitted(true);
    if (correctCount === 10) {
      saveProgress({ passedFinalTest: true, finalTestScore: correctCount });
      toast.success('CONGRATULATIONS! You scored 10/10 and passed the Final Readiness Test!');
    } else {
      toast.error(`Score: ${correctCount}/10. You must score 10/10 to pass. Review and retry!`);
    }
  };
  const retryFinalTest = () => {
    setFinalTestSubmitted(false);
    setFinalTestAnswers({});
    setFinalTestScore(0);
    setActiveTestQuestions(generateTestQuestions());
  };

  // ── Shift 1 Debrief ──
  const handleShift1Submit = () => {
    const required = ['what_went_well', 'what_was_hard', 'one_thing_to_improve'];
    const missing = required.filter(k => !shift1DebriefAnswers[k]?.trim());
    if (missing.length > 0) { toast.error('Please answer all three debrief questions.'); return; }
    saveProgress({ shift1DebriefData: shift1DebriefAnswers });
    toast.success('Shift 1 Debrief submitted! Great reflection.');
    setShowShift1Debrief(false);
  };

  // ── Helpers ──
  const toggleCardFlip = (cardId: string) => setFlippedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  const toggleRecall = (key: string) => setRevealedRecall(prev => ({ ...prev, [key]: !prev[key] }));

  const resetProgress = () => {
    if (!window.confirm('Reset all training progress? This cannot be undone.')) return;
    const empty = DEFAULT_PROGRESS;
    setProgress(empty);
    setProgressLoaded(false);
    saveProgressMutation.mutate({
      completedModules: [],
      completedQuizzes: [],
      completedAssignments: [],
      assignmentsData: {},
      safetyCompleted: false,
      passedFinalTest: false,
    });
    setActiveModuleId('foundations');
    setCurrentSlideIndex(0);
    setShowQuiz(false);
    setShowAssignment(false);
    setShowFinalTest(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setFinalTestAnswers({});
    setFinalTestSubmitted(false);
    toast.success('Progress reset successfully.');
  };

  // ─── Loading / Auth Gate ───────────────────────────────────────────────────

  if (authLoading || (isAuthenticated && !progressLoaded && progressQuery.isLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your training portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasswordGate onSuccess={() => progressQuery.refetch()} />;
  }

  // ─── Main Training Portal ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground">

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border" style={{ background: 'oklch(0.22 0.01 65)' }}>
        <div className="flex items-center gap-3">
          <img
            src="/logo-dark.png"
            alt="Top of Temecula"
            className="h-7 w-auto"
            style={{ filter: 'invert(1) brightness(2)' }}
          />
          <h1 className="text-lg font-serif font-bold text-white">Top of Temecula</h1>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="border-white/40 text-white hover:bg-white/10"
        >
          {sidebarOpen ? 'Close' : 'Progress'}
        </Button>
      </header>

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-80 p-6 flex flex-col justify-between
          transform transition-transform duration-300 ease-in-out md:translate-x-0 md:sticky md:top-0 md:self-start md:h-screen
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{ background: 'oklch(0.22 0.01 65)', borderRight: '1px solid oklch(0.30 0.01 65)' }}
      >
        <div className="flex flex-col gap-6 overflow-y-auto pr-2">
          {/* Brand */}
          <div className="flex flex-col items-start gap-2 pb-6" style={{ borderBottom: '1px solid oklch(0.32 0.01 65)' }}>
            <img
              src="/logo-dark.png"
              alt="Top of Temecula Logo"
              className="h-9 w-auto max-w-full"
              style={{ filter: 'invert(1) brightness(2)' }}
            />
            <p className="text-xs tracking-widest uppercase font-semibold" style={{ color: 'oklch(0.68 0.148 72)' }}>Academy Portal</p>
          </div>

          {/* Progress widget */}
          <div className="rounded-xl p-4 shadow-sm" style={{ background: 'oklch(0.28 0.01 65)', border: '1px solid oklch(0.35 0.01 65)' }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold flex items-center gap-1.5" style={{ color: 'oklch(0.90 0.01 80)' }}>
                <Sparkles className="w-4 h-4 animate-pulse" style={{ color: 'oklch(0.68 0.148 72)' }} />
                Overall Progress
              </span>
              <span className="text-sm font-bold" style={{ color: 'oklch(0.68 0.148 72)' }}>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2 bg-muted [&>div]:bg-primary transition-all duration-500" />
            <div className="flex justify-between text-[10px] mt-2 font-medium" style={{ color: 'oklch(0.60 0.01 65)' }}>
              <span>Day 1 Start</span>
              <span>Cleared for Field 🚀</span>
            </div>
          </div>

          {/* Module nav */}
          <nav className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider px-2 mb-1" style={{ color: 'oklch(0.55 0.01 65)' }}>Training Modules</h3>
            {trainingModules.map((m) => {
              const unlocked = isModuleUnlocked(m.id);
              const active = activeModuleId === m.id && !showFinalTest && !showShift1Debrief;
              const completed = progress.completedAssignments.includes(m.id);
              return (
                <button
                  key={m.id}
                  disabled={!unlocked}
                  onClick={() => {
                    setActiveModuleId(m.id);
                    setCurrentSlideIndex(0);
                    setShowQuiz(false);
                    setShowAssignment(false);
                    setShowFinalTest(false);
                    setShowShift1Debrief(false);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3
                    ${active ? 'shadow-sm font-medium' :
                      unlocked ? 'border-transparent hover:bg-white/5' :
                      'border-transparent cursor-not-allowed'}
                  `}
                  style={active ? { background: 'oklch(0.68 0.148 72 / 0.18)', borderColor: 'oklch(0.68 0.148 72 / 0.60)', color: 'white' } :
                         unlocked ? { color: 'oklch(0.75 0.01 65)' } :
                         { color: 'oklch(0.40 0.01 65)' }}
                >
                  <div className="mt-0.5">
                    {completed ? <CheckCircle className="w-5 h-5" style={{ color: 'oklch(0.68 0.148 72)' }} /> :
                     !unlocked ? <Lock className="w-5 h-5" style={{ color: 'oklch(0.38 0.01 65)' }} /> :
                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold`} style={active ? { borderColor: 'oklch(0.68 0.148 72)', color: 'oklch(0.68 0.148 72)' } : { borderColor: 'oklch(0.45 0.01 65)', color: 'oklch(0.55 0.01 65)' }}>{moduleBadge(m.day)}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-xs font-bold tracking-wide uppercase whitespace-nowrap" style={{ color: 'oklch(0.68 0.148 72)' }}>{moduleLabel(m.day)}</span>
                      <span className="text-[10px] text-muted-foreground text-right whitespace-nowrap">{shortDuration(m.duration)}</span>
                    </div>
                    <h4 className="text-sm font-bold truncate mt-0.5" style={{ color: 'inherit' }}>{m.title}</h4>
                    {unlocked && (
                      <div className="flex gap-1 mt-2">
                        <span className="h-1 flex-1 rounded-full" style={{ background: progress.completedModules.includes(m.id) ? 'oklch(0.68 0.148 72)' : 'oklch(0.32 0.01 65)' }} />
                        <span className="h-1 flex-1 rounded-full" style={{ background: progress.completedQuizzes.includes(m.id) ? 'oklch(0.68 0.148 72)' : 'oklch(0.32 0.01 65)' }} />
                        <span className="h-1 flex-1 rounded-full" style={{ background: progress.completedAssignments.includes(m.id) ? 'oklch(0.68 0.148 72)' : 'oklch(0.32 0.01 65)' }} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Safety Scenarios */}
            <Link
              href="/safety"
              onClick={() => setSidebarOpen(false)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3 mt-2
                ${!isSafetyUnlocked() ? 'cursor-not-allowed pointer-events-none' : ''}
              `}
              style={
                !isSafetyUnlocked() ? { borderColor: 'transparent', color: 'oklch(0.40 0.01 65)' } :
                progress.safetyCompleted ? { borderColor: 'oklch(0.68 0.148 72 / 0.40)', background: 'oklch(0.68 0.148 72 / 0.10)', color: 'white' } :
                { borderColor: 'transparent', color: 'oklch(0.75 0.01 65)' }
              }
            >
              <div className="mt-0.5">
                {progress.safetyCompleted ? <CheckCircle className="w-5 h-5" style={{ color: 'oklch(0.68 0.148 72)' }} /> :
                 !isSafetyUnlocked() ? <Lock className="w-5 h-5" style={{ color: 'oklch(0.38 0.01 65)' }} /> :
                 <Shield className="w-5 h-5" style={{ color: 'oklch(0.68 0.148 72)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold tracking-wide uppercase" style={{ color: 'oklch(0.68 0.148 72)' }}>Required</span>
                <h4 className="text-sm font-bold truncate mt-0.5">Safety Scenarios</h4>
              </div>
            </Link>

            {/* AI Roleplay */}
            <Link
              href="/roleplay"
              onClick={() => setSidebarOpen(false)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3
                ${!isSafetyUnlocked() ? 'cursor-not-allowed pointer-events-none' : 'hover:bg-white/5'}
              `}
              style={!isSafetyUnlocked() ? { borderColor: 'transparent', color: 'oklch(0.40 0.01 65)' } : { borderColor: 'transparent', color: 'oklch(0.75 0.01 65)' }}
            >
              <div className="mt-0.5">
                {!isSafetyUnlocked() ? <Lock className="w-5 h-5" style={{ color: 'oklch(0.38 0.01 65)' }} /> :
                 <MessageSquare className="w-5 h-5" style={{ color: 'oklch(0.68 0.148 72)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold tracking-wide uppercase" style={{ color: 'oklch(0.68 0.148 72)' }}>Practice</span>
                <h4 className="text-sm font-bold truncate mt-0.5">AI Roleplay Simulator</h4>
              </div>
            </Link>

            {/* Final Test */}
            <button
              disabled={!isFinalTestUnlocked()}
              onClick={() => { setShowFinalTest(true); setShowShift1Debrief(false); setSidebarOpen(false); setActiveTestQuestions(generateTestQuestions()); setFinalTestAnswers({}); setFinalTestSubmitted(false); setFinalTestScore(0); }}
              className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3 mt-2
                ${!isFinalTestUnlocked() ? 'cursor-not-allowed' : ''}
              `}
              style={
                showFinalTest ? { background: 'oklch(0.68 0.148 72 / 0.18)', borderColor: 'oklch(0.68 0.148 72 / 0.60)', color: 'white' } :
                isFinalTestUnlocked() ? { borderColor: 'transparent', color: 'oklch(0.75 0.01 65)' } :
                { borderColor: 'transparent', color: 'oklch(0.40 0.01 65)' }
              }
            >
              <div className="mt-0.5">
                {progress.passedFinalTest ? <Award className="w-5 h-5 animate-bounce" style={{ color: 'oklch(0.68 0.148 72)' }} /> :
                 <Lock className="w-5 h-5" style={{ color: isFinalTestUnlocked() ? 'oklch(0.68 0.148 72)' : 'oklch(0.38 0.01 65)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold tracking-wide uppercase" style={{ color: 'oklch(0.68 0.148 72)' }}>Final Stage</span>
                <h4 className="text-sm font-bold truncate mt-0.5">Readiness Certificate</h4>
              </div>
            </button>

            {/* Shift 1 Debrief (unlocked after final test passed) */}
            {progress.passedFinalTest && (
              <button
                onClick={() => { setShowShift1Debrief(true); setShowFinalTest(false); setSidebarOpen(false); }}
                className={`
                  w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3
                  ${showShift1Debrief ? 'bg-primary/15 border-primary text-foreground shadow-sm font-medium' :
                    progress.shift1DebriefData ? 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/10' :
                    'border-amber-200 bg-amber-50/30 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/10 hover:bg-amber-50/50'}
                `}
              >
                <div className="mt-0.5">
                  {progress.shift1DebriefData ? <CheckCircle className="w-5 h-5 text-emerald-600" /> :
                   <FileText className="w-5 h-5 text-amber-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold tracking-wide uppercase text-amber-600">After Shift 1</span>
                  <h4 className="text-sm font-bold truncate mt-0.5">Shift 1 Debrief</h4>
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Footer */}
        <div className="pt-4 mt-6 flex justify-between items-center" style={{ borderTop: '1px solid oklch(0.32 0.01 65)' }}>
          <div className="text-xs" style={{ color: 'oklch(0.55 0.01 65)' }}>
            <span>Ambassador: <strong style={{ color: 'oklch(0.75 0.01 65)' }}>{user?.name ?? 'Trainee'}</strong></span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={resetProgress} className="text-[10px] flex items-center gap-1 p-1 h-auto" style={{ color: 'oklch(0.45 0.01 65)' }}>
              <RefreshCw className="w-3 h-3" /> Reset
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="text-[10px] flex items-center gap-1 p-1 h-auto" style={{ color: 'oklch(0.55 0.01 65)' }}>
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-0 bg-background/30 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-center">

          {/* ── Clearance Certificate ── */}
          {progress.passedFinalTest && showFinalTest && (
            <Card className="border-2 border-primary bg-card/80 shadow-xl p-8 text-center flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl transform -translate-x-10 translate-y-10" />
              <Award className="w-20 h-20 text-primary mb-6 animate-bounce" />
              <p className="text-xs text-primary font-semibold tracking-[0.2em] uppercase mb-2">Professional Certification</p>
              <h1 className="text-3xl md:text-4xl font-serif font-extrabold text-foreground mb-2">AEO / GEO Foundations — Level I</h1>
              <p className="text-sm text-primary font-semibold tracking-wider uppercase mb-6">Answer Engine &amp; Generative Engine Optimization</p>
              <div className="max-w-md bg-background/50 rounded-2xl p-6 border border-border mb-8 shadow-inner">
                <p className="text-sm text-muted-foreground italic mb-4">"This certifies that"</p>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-4">{user?.name ?? 'the holder'}</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Has demonstrated Level I proficiency in <span className="font-semibold text-foreground">Answer Engine &amp; Generative Engine Optimization (AEO/GEO)</span> — covering how answer engines retrieve and recommend, structured data and schema.org, entities and NAP consistency, E-E-A-T, and measuring AI visibility across ChatGPT, Gemini, Claude, and Perplexity — including an applied practicum and a 10/10 score on the final assessment.
                </p>
                {credential && (
                  <div className="mt-5 pt-4 border-t border-border/60 flex flex-col gap-1 text-left">
                    <div className="flex justify-between gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Credential ID</span>
                      <span className="text-xs font-mono font-bold text-foreground">{credential.code}</span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Issued</span>
                      <span className="text-xs text-foreground">{new Date(credential.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const url = `${window.location.origin}/verify/${credential.code}`;
                        navigator.clipboard?.writeText(url);
                        toast.success('Verification link copied — add it to your résumé or LinkedIn.');
                      }}
                      className="mt-2 text-[11px] text-primary hover:underline font-semibold self-start"
                    >
                      Copy public verification link →
                    </button>
                  </div>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Button onClick={() => toast.success('Certificate saved! Share this screen with your supervisor to confirm field clearance.')} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-6 text-sm font-bold shadow-md">
                  Confirm Field Clearance
                </Button>
                <Button variant="outline" onClick={() => setShowFinalTest(false)} className="flex-1 border-primary text-primary hover:bg-primary/10 rounded-xl py-6 text-sm font-semibold">
                  Review Training Guides
                </Button>
              </div>
            </Card>
          )}

          {/* ── Final Test ── */}
          {showFinalTest && !progress.passedFinalTest && (
            <Card className="border border-border bg-card/90 shadow-lg p-6 md:p-8">
              <CardHeader className="p-0 mb-6">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Award className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">Final Assessment</span>
                </div>
                <CardTitle className="text-2xl font-serif font-extrabold">Final Readiness Test</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Answer all 10 questions correctly to unlock your Field Clearance Certificate. You can retry as many times as needed.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex flex-col gap-6 max-h-[55vh] overflow-y-auto pr-2">
                {activeTestQuestions.map((q, idx) => {
                  const selectedOpt = finalTestAnswers[q.id];
                  const isCorrect = selectedOpt === q.mappedCorrect;
                  return (
                    <div key={q.id} className="border border-border/60 bg-background/40 rounded-xl p-4 md:p-5 shadow-sm">
                      <h3 className="text-sm md:text-base font-bold text-foreground mb-3">
                        <span className="text-primary mr-1.5">{idx + 1}.</span> {q.text}
                      </h3>
                      <div className="flex flex-col gap-2">
                        {q.shuffledOptions.map((opt: string, optIdx: number) => {
                          const isSelected = selectedOpt === optIdx;
                          const showSuccess = finalTestSubmitted && optIdx === q.mappedCorrect;
                          const showDanger = finalTestSubmitted && isSelected && !isCorrect;
                          return (
                            <button
                              key={optIdx}
                              disabled={finalTestSubmitted}
                              onClick={() => handleFinalTestSelect(q.id, optIdx)}
                              className={`
                                w-full text-left p-3 rounded-xl border text-xs md:text-sm transition-all duration-150 flex items-center justify-between
                                ${isSelected && !finalTestSubmitted ? 'border-primary bg-primary/10 text-foreground font-medium' : 'border-border bg-background/50 text-muted-foreground hover:bg-accent/40 hover:text-foreground'}
                                ${showSuccess ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 font-medium' : ''}
                                ${showDanger ? 'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/30 dark:text-rose-300' : ''}
                              `}
                            >
                              <span>{opt}</span>
                              {showSuccess && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />}
                              {showDanger && <X className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 ml-2" />}
                            </button>
                          );
                        })}
                      </div>
                      {finalTestSubmitted && !isCorrect && (
                        <div className="mt-3 text-xs text-rose-700 dark:text-rose-400 flex gap-1.5 items-start bg-rose-50/50 dark:bg-rose-950/10 p-3 rounded-lg border border-rose-200/40">
                          <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                          <span>{q.explanation}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
              <CardFooter className="p-0 border-t border-border pt-6 mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                {finalTestSubmitted ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                    <div className="text-sm font-bold text-foreground flex items-center gap-2 flex-1">
                      {finalTestScore === 10 ? (
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle className="w-5 h-5" /> Score: 10/10 — Passed!</span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1"><X className="w-5 h-5" /> Score: {finalTestScore}/10 — Review required</span>
                      )}
                    </div>
                    {finalTestScore === 10 ? (
                      <Button onClick={() => saveProgress({ passedFinalTest: true, finalTestScore })} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-5 font-bold shadow-md flex items-center gap-1.5">
                        Claim Clearance Certificate <Award className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button onClick={retryFinalTest} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-5 font-bold shadow-md flex items-center gap-1.5">
                        Retry Test <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs text-muted-foreground font-medium">{Object.keys(finalTestAnswers).length} of 10 answered</span>
                    <Button onClick={submitFinalTest} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-5 font-bold shadow-md">
                      Submit Assessment
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          )}

          {/* ── Shift 1 Debrief ── */}
          {showShift1Debrief && (
            <Card className="border border-border bg-card/90 shadow-lg p-6 md:p-8">
              <CardHeader className="p-0 mb-6">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <FileText className="w-5 h-5" />
                  <span className="text-xs font-bold uppercase tracking-wider">After Your First Shift</span>
                </div>
                <CardTitle className="text-2xl font-serif font-extrabold">Shift 1 Debrief</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Complete this after your first real field shift. Honest reflection is how you improve fast.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 flex flex-col gap-5">
                {[
                  { key: 'what_went_well', label: 'What went well on your first shift?', placeholder: 'Describe 2-3 things that felt natural or went better than expected...' },
                  { key: 'what_was_hard', label: 'What was harder than expected?', placeholder: 'Be honest — what caught you off guard or felt awkward?' },
                  { key: 'one_thing_to_improve', label: 'What is ONE specific thing you will do differently next shift?', placeholder: 'Make it concrete and actionable...' },
                ].map(({ key, label, placeholder }) => (
                  <div key={key} className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-foreground">{label}</label>
                    <textarea
                      value={progress.shift1DebriefData?.[key] ?? shift1DebriefAnswers[key] ?? ''}
                      onChange={e => setShift1DebriefAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      rows={3}
                      disabled={!!progress.shift1DebriefData}
                      className="w-full p-3 border border-border rounded-xl text-sm bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all resize-none disabled:opacity-60"
                    />
                  </div>
                ))}
              </CardContent>
              {!progress.shift1DebriefData && (
                <CardFooter className="p-0 border-t border-border pt-6 mt-6 flex justify-end">
                  <Button onClick={handleShift1Submit} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-5 font-bold shadow-md flex items-center gap-1.5">
                    Submit Debrief <CheckCircle className="w-4 h-4" />
                  </Button>
                </CardFooter>
              )}
              {progress.shift1DebriefData && (
                <div className="mt-4 p-3 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" /> Debrief submitted. Great reflection!
                </div>
              )}
            </Card>
          )}

          {/* ── Day Modules ── */}
          {!showFinalTest && !showShift1Debrief && (
            <div className="flex flex-col gap-6">
              <div className="mb-2">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">{moduleLabel(activeModule.day)} Module</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-extrabold text-foreground">{activeModule.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{activeModule.subtitle}</p>
                <p className="text-xs text-muted-foreground/80 mt-1">{activeModule.duration}</p>
              </div>

              {/* Slide Reader */}
              {!showQuiz && !showAssignment && (
                <Card className="border border-border bg-card/90 shadow-md flex flex-col justify-between min-h-[50vh] p-6 md:p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl transform translate-x-8 -translate-y-8" />
                  <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full py-4">
                    <div className="flex justify-between items-baseline mb-4">
                      <span className="text-xs font-bold text-primary tracking-wide uppercase">Slide {currentSlideIndex + 1} of {activeModule.slides.length}</span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-5">
                      {activeModule.slides[currentSlideIndex].title}
                    </h2>

                    {/* Text slide */}
                    {(!activeModule.slides[currentSlideIndex].type || activeModule.slides[currentSlideIndex].type === 'text') && (
                      <div className="flex flex-col gap-3 text-sm md:text-base text-muted-foreground leading-relaxed">
                        <ContentBlocks blocks={activeModule.slides[currentSlideIndex].content} />
                        {activeModule.slides[currentSlideIndex].tables?.map((t, idx) => <DataTable key={idx} table={t} />)}
                      </div>
                    )}

                    {/* Run-of-Day pacing table */}
                    {activeModule.slides[currentSlideIndex].type === 'runofday' && (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-primary">
                          <CalendarClock className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Suggested Pacing</span>
                        </div>
                        {activeModule.slides[currentSlideIndex].table && (
                          <DataTable table={activeModule.slides[currentSlideIndex].table!} />
                        )}
                      </div>
                    )}

                    {/* Activity / Drill practice block */}
                    {(activeModule.slides[currentSlideIndex].type === 'activity' || activeModule.slides[currentSlideIndex].type === 'drill') && (
                      <div className="flex flex-col gap-4">
                        <div className={`flex items-center gap-2 ${activeModule.slides[currentSlideIndex].type === 'drill' ? 'text-amber-600 dark:text-amber-500' : 'text-primary'}`}>
                          {activeModule.slides[currentSlideIndex].type === 'drill'
                            ? <Dumbbell className="w-4 h-4" />
                            : <ListChecks className="w-4 h-4" />}
                          <span className="text-xs font-bold uppercase tracking-wider">
                            {activeModule.slides[currentSlideIndex].type === 'drill' ? 'Hands-On Drill' : 'Hands-On Activity'}
                          </span>
                        </div>
                        {activeModule.slides[currentSlideIndex].block?.fields.map((f, idx) => {
                          const isTime = /^time$/i.test(f.label);
                          const isGoal = /^goal$/i.test(f.label);
                          return (
                            <div key={idx} className="flex flex-col gap-1.5">
                              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-foreground">
                                {isTime && <Clock className="w-3.5 h-3.5 text-primary" />}
                                {isGoal && <Target className="w-3.5 h-3.5 text-primary" />}
                                {f.label}
                              </div>
                              {f.text && <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{f.text}</p>}
                              {f.items && f.items.length > 0 && (
                                <ul className="flex flex-col gap-1.5 pl-5 list-disc marker:text-primary text-sm md:text-base text-muted-foreground leading-relaxed">
                                  {f.items.map((it, i) => <li key={i} className="pl-1">{it}</li>)}
                                </ul>
                              )}
                              {f.code && (
                                <pre className="text-xs bg-background/60 border border-border rounded-xl p-3 overflow-x-auto whitespace-pre-wrap text-muted-foreground">{f.code}</pre>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Field Scenario cards */}
                    {activeModule.slides[currentSlideIndex].type === 'scenarios' && (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2 text-sm md:text-base text-muted-foreground leading-relaxed">
                          <ContentBlocks blocks={activeModule.slides[currentSlideIndex].content} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
                          {activeModule.slides[currentSlideIndex].scenarios?.map((s, idx) => {
                            const cardId = `${activeModule.id}_scn_${idx}`;
                            const isFlipped = flippedCards[cardId];
                            return (
                              <div key={idx} onClick={() => toggleCardFlip(cardId)} className="group cursor-pointer perspective-1000 h-36 w-full">
                                <div className={`relative w-full h-full duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                                  <div className="absolute inset-0 backface-hidden border border-secondary-foreground/20 bg-secondary/50 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-primary transition-colors">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold text-secondary-foreground uppercase tracking-wider">Scenario</span>
                                      {s.rung && <span className="text-[10px] font-bold text-primary flex items-center gap-0.5"><Flag className="w-3 h-3" /> Rung {s.rung}</span>}
                                    </div>
                                    <h4 className="text-sm font-bold text-foreground leading-snug">{s.scenario}</h4>
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-0.5">Tap to reveal <ChevronRight className="w-3 h-3" /></span>
                                  </div>
                                  <div className="absolute inset-0 backface-hidden rotate-y-180 border border-primary bg-card rounded-xl p-4 flex flex-col justify-center shadow-md overflow-y-auto">
                                    <span className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Your Response:</span>
                                    <p className="text-xs text-foreground font-medium italic leading-relaxed">"{s.script}"</p>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Script flashcards — show content paragraphs first if present, then flashcards */}
                    {activeModule.slides[currentSlideIndex].type === 'script' && (
                      <div className="flex flex-col gap-4 my-2">
                        {((activeModule.slides[currentSlideIndex].content?.length ?? 0) > 0 || (activeModule.slides[currentSlideIndex].tables?.length ?? 0) > 0) && (
                          <div className="flex flex-col gap-2 text-sm md:text-base text-muted-foreground leading-relaxed mb-2 pb-4 border-b border-border/40">
                            <ContentBlocks blocks={activeModule.slides[currentSlideIndex].content} />
                            {activeModule.slides[currentSlideIndex].tables?.map((t, idx) => <DataTable key={idx} table={t} />)}
                          </div>
                        )}
                        {activeModule.slides[currentSlideIndex].scripts?.map((s, idx) => {
                          const cardId = `${activeModule.id}_s_${idx}`;
                          const isFlipped = flippedCards[cardId];
                          return (
                            <div key={idx} onClick={() => toggleCardFlip(cardId)} className="group cursor-pointer perspective-1000 h-28 w-full">
                              <div className={`relative w-full h-full duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                                <div className="absolute inset-0 backface-hidden border border-primary/30 bg-primary/5 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-primary transition-colors">
                                  <div className="flex items-center gap-3">
                                    <Volume2 className="w-5 h-5 text-primary animate-pulse" />
                                    <span className="text-sm font-bold text-foreground">{s.label}</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                                    Tap to reveal <ChevronRight className="w-3 h-3" />
                                  </span>
                                </div>
                                <div className="absolute inset-0 backface-hidden rotate-y-180 border border-primary bg-card rounded-xl p-4 flex flex-col justify-center shadow-md">
                                  <p className="text-xs md:text-sm text-foreground font-medium italic leading-relaxed">"{s.text}"</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Objection cards */}
                    {activeModule.slides[currentSlideIndex].type === 'objection' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
                        {activeModule.slides[currentSlideIndex].scripts?.map((s, idx) => {
                          const cardId = `${activeModule.id}_obj_${idx}`;
                          const isFlipped = flippedCards[cardId];
                          return (
                            <div key={idx} onClick={() => toggleCardFlip(cardId)} className="group cursor-pointer perspective-1000 h-32 w-full">
                              <div className={`relative w-full h-full duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                                <div className="absolute inset-0 backface-hidden border border-secondary-foreground/20 bg-secondary/50 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-primary transition-colors">
                                  <span className="text-xs font-bold text-secondary-foreground uppercase tracking-wider">Objection</span>
                                  <h4 className="text-sm font-bold text-foreground leading-snug">{s.label}</h4>
                                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-0.5">Tap to reveal <ChevronRight className="w-3 h-3" /></span>
                                </div>
                                <div className="absolute inset-0 backface-hidden rotate-y-180 border border-primary bg-card rounded-xl p-4 flex flex-col justify-center shadow-md">
                                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Your Safe Response:</span>
                                  <p className="text-xs text-foreground font-medium italic leading-relaxed">"{s.text}"</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Do's and Don'ts */}
                    {activeModule.slides[currentSlideIndex].type === 'dosdonts' && (
                      <div className="flex flex-col gap-2.5 my-2">
                        {activeModule.slides[currentSlideIndex].items?.map((item, idx) => (
                          <div key={idx} className={`flex items-start gap-3 p-3.5 rounded-xl border text-xs md:text-sm ${item.bad ? 'border-rose-200 bg-rose-50/50 text-rose-900 dark:border-rose-950/20 dark:bg-rose-950/10 dark:text-rose-300' : 'border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:border-emerald-950/20 dark:bg-emerald-950/10 dark:text-emerald-300'}`}>
                            <div className="mt-0.5 shrink-0">{item.bad ? <X className="w-4 h-4 text-rose-600" /> : <Check className="w-4 h-4 text-emerald-600" />}</div>
                            <div><strong className="font-bold mr-1">{item.label}:</strong><span className="font-medium italic">"{item.text}"</span></div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Active Recall */}
                    {activeModule.slides[currentSlideIndex].type === 'recall' && (
                      <div className="flex flex-col gap-4 my-2">
                        <p className="text-xs text-muted-foreground">Try to answer each question from memory before revealing the answer.</p>
                        {activeModule.slides[currentSlideIndex].recallPrompts?.map((rp, idx) => {
                          const key = `${activeModule.id}_recall_${idx}`;
                          const revealed = revealedRecall[key];
                          return (
                            <div key={idx} className="border border-border rounded-xl overflow-hidden">
                              <div className="p-4 bg-background/50">
                                <p className="text-sm font-bold text-foreground">{idx + 1}. {rp.prompt}</p>
                              </div>
                              <div className={`border-t border-border transition-all duration-300 ${revealed ? 'max-h-40' : 'max-h-0 overflow-hidden'}`}>
                                <div className="p-4 bg-primary/5">
                                  <p className="text-xs text-foreground leading-relaxed">{rp.answer}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => toggleRecall(key)}
                                className="w-full p-2.5 border-t border-border text-xs font-bold text-primary flex items-center justify-center gap-1.5 hover:bg-primary/5 transition-colors"
                              >
                                {revealed ? <><EyeOff className="w-3.5 h-3.5" /> Hide Answer</> : <><Eye className="w-3.5 h-3.5" /> Reveal Answer</>}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {activeModule.slides[currentSlideIndex].highlight && (
                      <div className="mt-6 border-l-4 border-primary bg-primary/5 p-4 rounded-r-xl">
                        <p className="text-xs md:text-sm font-semibold text-foreground leading-relaxed">{activeModule.slides[currentSlideIndex].highlight}</p>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-border pt-6 mt-6 flex justify-between items-center">
                    <Button variant="ghost" onClick={prevSlide} disabled={currentSlideIndex === 0} className="text-muted-foreground hover:text-foreground flex items-center gap-1 px-3 py-5 rounded-xl">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button onClick={nextSlide} className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 px-6 py-5 rounded-xl font-bold shadow-md">
                      {currentSlideIndex === activeModule.slides.length - 1 ? 'Go to Quiz' : 'Next'} <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* Quiz */}
              {showQuiz && !showAssignment && (
                <Card className="border border-border bg-card/90 shadow-md p-6 md:p-8">
                  <CardHeader className="p-0 mb-6">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <HelpCircle className="w-4 h-4 animate-bounce" />
                      <span className="text-xs font-bold uppercase tracking-wider">{moduleLabel(activeModule.day)} Knowledge Check</span>
                    </div>
                    <CardTitle className="text-xl font-serif font-bold">Verify Your Understanding</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Score 100% to unlock the {moduleLabel(activeModule.day)} practical assignment.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 flex flex-col gap-6">
                    {activeModule.quiz.map((q, idx) => {
                      const selectedOpt = quizAnswers[q.id];
                      const isCorrect = selectedOpt === q.correctAnswer;
                      return (
                        <div key={q.id} className="border border-border/60 bg-background/40 rounded-xl p-4 md:p-5 shadow-sm">
                          <h3 className="text-sm md:text-base font-bold text-foreground mb-3">
                            <span className="text-primary mr-1.5">{idx + 1}.</span> {q.text}
                          </h3>
                          <div className="flex flex-col gap-2">
                            {q.options.map((opt, optIdx) => {
                              const isSelected = selectedOpt === optIdx;
                              const showSuccess = quizSubmitted && optIdx === q.correctAnswer;
                              const showDanger = quizSubmitted && isSelected && !isCorrect;
                              return (
                                <button
                                  key={optIdx}
                                  disabled={quizSubmitted}
                                  onClick={() => handleQuizAnswerSelect(q.id, optIdx)}
                                  className={`
                                    w-full text-left p-3 rounded-xl border text-xs md:text-sm transition-all duration-150 flex items-center justify-between
                                    ${isSelected && !quizSubmitted ? 'border-primary bg-primary/10 text-foreground font-medium' : 'border-border bg-background/50 text-muted-foreground hover:bg-accent/40 hover:text-foreground'}
                                    ${showSuccess ? 'border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 font-medium' : ''}
                                    ${showDanger ? 'border-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/30 dark:text-rose-300' : ''}
                                  `}
                                >
                                  <span>{opt}</span>
                                  {showSuccess && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 ml-2" />}
                                  {showDanger && <X className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 ml-2" />}
                                </button>
                              );
                            })}
                          </div>
                          {quizSubmitted && !isCorrect && (
                            <div className="mt-3 text-xs text-rose-700 dark:text-rose-400 flex gap-1.5 items-start bg-rose-50/50 dark:bg-rose-950/10 p-3 rounded-lg border border-rose-200/40">
                              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                              <span>{q.explanation}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                  <CardFooter className="p-0 border-t border-border pt-6 mt-6 flex flex-col gap-4">
                    {quizSubmitted && quizScore === activeModule.quiz.length && !quizFeedbackSubmitted && (
                      <div className="w-full border border-primary/30 bg-primary/5 rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold text-primary uppercase tracking-wider">Before you continue — Quick Feedback</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Any part of this lesson confusing or something you'd improve? Your input helps make this training better. (Required to proceed)</p>
                        <textarea
                          value={quizFeedback}
                          onChange={e => setQuizFeedback(e.target.value)}
                          placeholder="e.g. The pricing slide was unclear, or I wish there was more detail on objection handling..."
                          rows={3}
                          className="w-full p-3 border border-border rounded-xl text-xs bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all resize-none"
                        />
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            disabled={quizFeedback.trim().length < 5}
                            onClick={() => {
                              submitFeedbackMutation.mutate({
                                moduleId: activeModule.id,
                                context: `${moduleLabel(activeModule.day)} – ${activeModule.title} Quiz`,
                                message: quizFeedback.trim(),
                              });
                            }}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-5 py-4 text-xs font-bold"
                          >
                            Submit Feedback
                          </Button>
                        </div>
                      </div>
                    )}
                    {quizSubmitted ? (
                      <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                        <div className="text-sm font-bold text-foreground flex items-center gap-2 flex-1">
                          {quizScore === activeModule.quiz.length ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle className="w-5 h-5" /> Score: {quizScore}/{activeModule.quiz.length} — Passed!</span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1"><X className="w-5 h-5" /> Score: {quizScore}/{activeModule.quiz.length} — Try again</span>
                          )}
                        </div>
                        {quizScore === activeModule.quiz.length ? (
                          <Button
                            disabled={!quizFeedbackSubmitted}
                            onClick={() => { setShowAssignment(true); }}
                            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-5 font-bold shadow-md flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {quizFeedbackSubmitted ? <><span>Go to {moduleLabel(activeModule.day)} Assignment</span> <ArrowRight className="w-4 h-4" /></> : <><Lock className="w-4 h-4" /> Submit feedback to continue</>}
                          </Button>
                        ) : (
                          <Button onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); setQuizFeedback(''); setQuizFeedbackSubmitted(false); }} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-5 font-bold shadow-md flex items-center gap-1">
                            Retry Quiz <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs text-muted-foreground font-medium">{Object.keys(quizAnswers).length} of {activeModule.quiz.length} answered</span>
                        <Button onClick={submitQuiz} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-5 font-bold shadow-md">Submit Answers</Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              )}

              {/* Assignment */}
              {showAssignment && activeModule.assignment && (
                <Card className="border border-border bg-card/90 shadow-md p-6 md:p-8">
                  <CardHeader className="p-0 mb-6">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">{moduleLabel(activeModule.day)} Practical Assignment</span>
                    </div>
                    <CardTitle className="text-xl font-serif font-bold">{activeModule.assignment.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex flex-col gap-4">
                    <AssignmentDescription blocks={activeModule.assignment.description} />
                    {activeModule.assignment.type === 'roleplay' && (
                      <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 flex items-center gap-3.5">
                        <Video className="w-8 h-8 text-primary shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Recording Tip</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                            Use your phone's built-in voice recorder, Loom, or record a quick video. Upload to Google Drive or Dropbox, set the link to "anyone with link can view," and paste it below.
                          </p>
                        </div>
                      </div>
                    )}
                    {activeModule.assignment.rubric && activeModule.assignment.rubric.length > 0 && (
                      <div className="border border-border/60 bg-background/40 rounded-xl p-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-foreground mb-3">Self-Assessment Rubric</h4>
                        <p className="text-xs text-muted-foreground mb-3">Score yourself honestly before submitting. Check each item you completed.</p>
                        <div className="flex flex-col gap-2">
                          {activeModule.assignment.rubric.map((item, i) => {
                            const key = `${activeModule.id}_rubric_${i}`;
                            return (
                              <label key={i} className="flex items-start gap-3 cursor-pointer group">
                                <input
                                  type="checkbox"
                                  checked={!!rubricChecked[key]}
                                  onChange={e => setRubricChecked(prev => ({ ...prev, [key]: e.target.checked }))}
                                  className="mt-0.5 w-4 h-4 rounded border-border accent-primary shrink-0"
                                />
                                <span className={`text-xs leading-relaxed transition-colors ${rubricChecked[key] ? 'text-foreground line-through opacity-60' : 'text-muted-foreground group-hover:text-foreground'}`}>{item}</span>
                              </label>
                            );
                          })}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3 font-medium">
                          {Object.keys(rubricChecked).filter(k => k.startsWith(`${activeModule.id}_rubric_`) && rubricChecked[k]).length} / {activeModule.assignment.rubric.length} completed
                        </p>
                      </div>
                    )}
                    <textarea
                      value={progress.assignmentsData[activeModule.id] || ''}
                      onChange={e => setProgress(prev => ({ ...prev, assignmentsData: { ...prev.assignmentsData, [activeModule.id]: e.target.value } }))}
                      placeholder={activeModule.assignment.placeholder}
                      className="w-full min-h-[25vh] p-4 border border-border rounded-xl text-xs md:text-sm bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                    />
                  </CardContent>
                  <CardFooter className="p-0 border-t border-border pt-6 mt-6 flex flex-col gap-4">
                    <div className="flex justify-between items-center w-full">
                      <Button variant="ghost" onClick={() => setShowAssignment(false)} className="text-muted-foreground hover:text-foreground rounded-xl px-3 py-5">
                        Back to Quiz
                      </Button>
                      <Button onClick={() => handleAssignmentSubmit(progress.assignmentsData[activeModule.id] || '')} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-5 font-bold shadow-md flex items-center gap-1">
                        Submit Assignment <CheckCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
