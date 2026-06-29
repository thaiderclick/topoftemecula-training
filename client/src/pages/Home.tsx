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
} from 'lucide-react';
import { trainingModules, finalReadinessTest, Module } from '../data/trainingData';

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

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();

  // ── Server progress sync ──
  const progressQuery = trpc.training.getProgress.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const saveProgressMutation = trpc.training.saveProgress.useMutation();

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
  const [activeModuleId, setActiveModuleId] = useState<string>('day1');
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
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [revealedRecall, setRevealedRecall] = useState<Record<string, boolean>>({});
  const [showShift1Debrief, setShowShift1Debrief] = useState(false);
  const [shift1DebriefAnswers, setShift1DebriefAnswers] = useState<Record<string, string>>({});

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
        toast.success(`Day ${activeModule.day} Content Completed! Moving to Knowledge Check.`);
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
    toast.success(`Day ${activeModule.day} Assignment Submitted!`);
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
  const handleFinalTestSelect = (questionId: string, optionIndex: number) => {
    if (finalTestSubmitted) return;
    setFinalTestAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const submitFinalTest = () => {
    const unanswered = finalReadinessTest.filter(q => finalTestAnswers[q.id] === undefined);
    if (unanswered.length > 0) { toast.error('Please answer all 10 questions before submitting.'); return; }
    let correctCount = 0;
    finalReadinessTest.forEach(q => { if (finalTestAnswers[q.id] === q.correctAnswer) correctCount++; });
    setFinalTestScore(correctCount);
    setFinalTestSubmitted(true);
    if (correctCount === finalReadinessTest.length) {
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
    setActiveModuleId('day1');
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
          transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
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
                     <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold`} style={active ? { borderColor: 'oklch(0.68 0.148 72)', color: 'oklch(0.68 0.148 72)' } : { borderColor: 'oklch(0.45 0.01 65)', color: 'oklch(0.55 0.01 65)' }}>{m.day}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold tracking-wide uppercase" style={{ color: 'oklch(0.68 0.148 72)' }}>Day {m.day}</span>
                      <span className="text-[10px] text-muted-foreground">{m.duration}</span>
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
              onClick={() => { setShowFinalTest(true); setShowShift1Debrief(false); setSidebarOpen(false); }}
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
              <h1 className="text-3xl md:text-4xl font-serif font-extrabold text-foreground mb-2">Clearance Certificate</h1>
              <p className="text-sm text-primary font-semibold tracking-wider uppercase mb-6">Top of Temecula Field Ambassador</p>
              <div className="max-w-md bg-background/50 rounded-2xl p-6 border border-border mb-8 shadow-inner">
                <p className="text-sm text-muted-foreground italic mb-4">"This certifies that"</p>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-4">{user?.name ?? 'Ambassador'}</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Has successfully completed all 3 days of paid interactive study, passed the Safety Scenarios, scored 10/10 on the Final Readiness Test, and is officially cleared for field operations.
                </p>
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
                {finalReadinessTest.map((q, idx) => {
                  const selectedOpt = finalTestAnswers[q.id];
                  const isCorrect = selectedOpt === q.correctAnswer;
                  return (
                    <div key={q.id} className="border border-border/60 bg-background/40 rounded-xl p-4 md:p-5 shadow-sm">
                      <h3 className="text-sm md:text-base font-bold text-foreground mb-3">
                        <span className="text-primary mr-1.5">{idx + 1}.</span> {q.text}
                      </h3>
                      <div className="flex flex-col gap-2">
                        {q.options.map((opt, optIdx) => {
                          const isSelected = selectedOpt === optIdx;
                          const showSuccess = finalTestSubmitted && optIdx === q.correctAnswer;
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
                  <span className="text-xs font-bold uppercase tracking-wider">Day {activeModule.day} Module</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-extrabold text-foreground">{activeModule.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{activeModule.subtitle}</p>
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
                        {activeModule.slides[currentSlideIndex].content?.map((p, idx) => <p key={idx}>{p}</p>)}
                      </div>
                    )}

                    {/* Script flashcards */}
                    {activeModule.slides[currentSlideIndex].type === 'script' && (
                      <div className="flex flex-col gap-4 my-2">
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
                      <span className="text-xs font-bold uppercase tracking-wider">Day {activeModule.day} Knowledge Check</span>
                    </div>
                    <CardTitle className="text-xl font-serif font-bold">Verify Your Understanding</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Score 100% to unlock the Day {activeModule.day} practical assignment.
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
                  <CardFooter className="p-0 border-t border-border pt-6 mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
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
                          <Button onClick={() => setShowAssignment(true)} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-5 font-bold shadow-md flex items-center gap-1">
                            Go to Day {activeModule.day} Assignment <ArrowRight className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }} className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-5 font-bold shadow-md flex items-center gap-1">
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
              {showAssignment && (
                <Card className="border border-border bg-card/90 shadow-md p-6 md:p-8">
                  <CardHeader className="p-0 mb-6">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Day {activeModule.day} Practical Assignment</span>
                    </div>
                    <CardTitle className="text-xl font-serif font-bold">{activeModule.assignment.title}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mt-1">{activeModule.assignment.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0 flex flex-col gap-4">
                    {activeModule.assignment.type === 'roleplay' && (
                      <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 flex items-center gap-3.5 mb-2">
                        <Video className="w-8 h-8 text-primary shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Recording Tip</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                            Use your phone's built-in voice recorder, Loom, or record a quick video. Upload to Google Drive or Dropbox, set the link to "anyone with link can view," and paste it below.
                          </p>
                        </div>
                      </div>
                    )}
                    <textarea
                      value={progress.assignmentsData[activeModule.id] || ''}
                      onChange={e => setProgress(prev => ({ ...prev, assignmentsData: { ...prev.assignmentsData, [activeModule.id]: e.target.value } }))}
                      placeholder={activeModule.assignment.placeholder}
                      className="w-full min-h-[25vh] p-4 border border-border rounded-xl text-xs md:text-sm bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                    />
                  </CardContent>
                  <CardFooter className="p-0 border-t border-border pt-6 mt-6 flex justify-between items-center">
                    <Button variant="ghost" onClick={() => setShowAssignment(false)} className="text-muted-foreground hover:text-foreground rounded-xl px-3 py-5">
                      Back to Quiz
                    </Button>
                    <Button onClick={() => handleAssignmentSubmit(progress.assignmentsData[activeModule.id] || '')} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-5 font-bold shadow-md flex items-center gap-1">
                      Submit Assignment <CheckCircle className="w-4 h-4" />
                    </Button>
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
