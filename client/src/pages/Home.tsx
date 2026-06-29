import { useState, useEffect, useRef } from 'react';
import { 
  BookOpen, 
  CheckCircle, 
  Award, 
  ArrowRight, 
  ArrowLeft, 
  RefreshCw, 
  HelpCircle, 
  ChevronRight, 
  MapPin, 
  FileText, 
  Video, 
  Shield, 
  Compass, 
  Sparkles,
  Volume2,
  Check,
  X,
  Lock,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { trainingModules, finalReadinessTest, Module, Question } from '../data/trainingData';

export default function Home() {
  // State for user progress (persisted in localStorage)
  const [completedModules, setCompletedCompletedModules] = useState<string[]>([]);
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
  const [completedAssignments, setCompletedAssignments] = useState<string[]>([]);
  const [passedFinalTest, setPassedFinalTest] = useState(false);
  const [assignmentsData, setAssignmentsData] = useState<Record<string, string>>({});

  // Navigation states
  const [activeModuleId, setActiveModuleId] = useState<string>('day1');
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [showQuiz, setShowQuiz] = useState<boolean>(false);
  const [showAssignment, setShowAssignment] = useState<boolean>(false);

  // Final test states
  const [showFinalTest, setShowFinalTest] = useState(false);
  const [finalTestAnswers, setFinalTestAnswers] = useState<Record<string, number>>({});
  const [finalTestSubmitted, setFinalTestSubmitted] = useState(false);
  const [finalTestScore, setFinalTestScore] = useState(0);

  // Script card flip states
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  // Mobile drawer/sidebar toggle
  const [sidebarOpen, setSidebarSidebarOpen] = useState(false);

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedCompletedModules = localStorage.getItem('tot_completed_modules');
    const savedCompletedQuizzes = localStorage.getItem('tot_completed_quizzes');
    const savedCompletedAssignments = localStorage.getItem('tot_completed_assignments');
    const savedPassedFinal = localStorage.getItem('tot_passed_final');
    const savedAssignments = localStorage.getItem('tot_assignments_data');

    if (savedCompletedModules) setCompletedCompletedModules(JSON.parse(savedCompletedModules));
    if (savedCompletedQuizzes) setCompletedQuizzes(JSON.parse(savedCompletedQuizzes));
    if (savedCompletedAssignments) setCompletedAssignments(JSON.parse(savedCompletedAssignments));
    if (savedPassedFinal) setPassedFinalTest(JSON.parse(savedPassedFinal));
    if (savedAssignments) setAssignmentsData(JSON.parse(savedAssignments));
  }, []);

  // Save progress helpers
  const saveCompletedModules = (modules: string[]) => {
    setCompletedCompletedModules(modules);
    localStorage.setItem('tot_completed_modules', JSON.stringify(modules));
  };

  const saveCompletedQuizzes = (quizzes: string[]) => {
    setCompletedQuizzes(quizzes);
    localStorage.setItem('tot_completed_quizzes', JSON.stringify(quizzes));
  };

  const saveCompletedAssignments = (assignments: string[]) => {
    setCompletedAssignments(assignments);
    localStorage.setItem('tot_completed_assignments', JSON.stringify(assignments));
  };

  const savePassedFinal = (passed: boolean) => {
    setPassedFinalTest(passed);
    localStorage.setItem('tot_passed_final', JSON.stringify(passed));
  };

  const saveAssignmentsData = (data: Record<string, string>) => {
    setAssignmentsData(data);
    localStorage.setItem('tot_assignments_data', JSON.stringify(data));
  };

  const resetProgress = () => {
    if (window.confirm("Are you sure you want to reset your training progress? This will clear all quiz scores and assignment answers.")) {
      setCompletedCompletedModules([]);
      setCompletedQuizzes([]);
      setCompletedAssignments([]);
      setPassedFinalTest(false);
      setAssignmentsData({});
      setQuizAnswers({});
      setQuizSubmitted(false);
      setFinalTestAnswers({});
      setFinalTestSubmitted(false);
      setActiveModuleId('day1');
      setCurrentSlideIndex(0);
      setShowQuiz(false);
      setShowAssignment(false);
      setShowFinalTest(false);
      localStorage.clear();
      toast.success("Progress reset successfully.");
    }
  };

  // Find active module
  const activeModule = trainingModules.find(m => m.id === activeModuleId) || trainingModules[0];

  // Progress percentage calculation
  const totalSteps = trainingModules.length * 3 + 1; // 3 modules (slides, quiz, assignment) + 1 final test
  let completedSteps = 0;
  trainingModules.forEach(m => {
    if (completedModules.includes(m.id)) completedSteps++;
    if (completedQuizzes.includes(m.id)) completedSteps++;
    if (completedAssignments.includes(m.id)) completedSteps++;
  });
  if (passedFinalTest) completedSteps++;
  const overallProgress = Math.round((completedSteps / totalSteps) * 100);

  // Handle slide navigation
  const nextSlide = () => {
    if (currentSlideIndex < activeModule.slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      // End of slides, transition to Quiz
      if (!completedModules.includes(activeModule.id)) {
        const updated = [...completedModules, activeModule.id];
        saveCompletedModules(updated);
        toast.success(`Day ${activeModule.day} Content Completed! Moving to Knowledge Check.`);
      }
      setShowQuiz(true);
      setQuizAnswers({});
      setQuizSubmitted(false);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  // Handle quiz selection
  const handleQuizAnswerSelect = (questionId: string, optionIndex: number) => {
    if (quizSubmitted) return;
    setQuizAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  // Submit quiz
  const submitQuiz = () => {
    // Validate all answered
    const unanswered = activeModule.quiz.filter(q => quizAnswers[q.id] === undefined);
    if (unanswered.length > 0) {
      toast.error("Please answer all questions before submitting.");
      return;
    }

    let correctCount = 0;
    activeModule.quiz.forEach(q => {
      if (quizAnswers[q.id] === q.correctAnswer) correctCount++;
    });

    setQuizScore(correctCount);
    setQuizSubmitted(true);

    if (correctCount === activeModule.quiz.length) {
      if (!completedQuizzes.includes(activeModule.id)) {
        saveCompletedQuizzes([...completedQuizzes, activeModule.id]);
      }
      toast.success("Perfect score! Knowledge check passed.");
    } else {
      toast.error(`Score: ${correctCount}/${activeModule.quiz.length}. Review explanations and try again for a perfect score!`);
    }
  };

  // Submit assignment
  const handleAssignmentSubmit = (text: string) => {
    if (!text.trim()) {
      toast.error("Please enter your assignment response before submitting.");
      return;
    }

    const updatedData = { ...assignmentsData, [activeModule.id]: text };
    saveAssignmentsData(updatedData);

    if (!completedAssignments.includes(activeModule.id)) {
      saveCompletedAssignments([...completedAssignments, activeModule.id]);
    }

    toast.success(`Day ${activeModule.day} Assignment Submitted Successfully!`);
    setShowAssignment(false);

    // Auto unlock next module if available
    const currentIndex = trainingModules.findIndex(m => m.id === activeModule.id);
    if (currentIndex < trainingModules.length - 1) {
      const nextMod = trainingModules[currentIndex + 1];
      setActiveModuleId(nextMod.id);
      setCurrentSlideIndex(0);
      setShowQuiz(false);
      setShowAssignment(false);
    } else {
      // Completed all modules, unlock Final Test
      setShowFinalTest(true);
      setFinalTestAnswers({});
      setFinalTestSubmitted(false);
    }
  };

  // Final Test Answer Select
  const handleFinalTestSelect = (questionId: string, optionIndex: number) => {
    if (finalTestSubmitted) return;
    setFinalTestAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  // Submit Final Test
  const submitFinalTest = () => {
    const unanswered = finalReadinessTest.filter(q => finalTestAnswers[q.id] === undefined);
    if (unanswered.length > 0) {
      toast.error("Please answer all 10 questions before submitting.");
      return;
    }

    let correctCount = 0;
    finalReadinessTest.forEach(q => {
      if (finalTestAnswers[q.id] === q.correctAnswer) correctCount++;
    });

    setFinalTestScore(correctCount);
    setFinalTestSubmitted(true);

    if (correctCount === finalReadinessTest.length) {
      savePassedFinal(true);
      toast.success("CONGRATULATIONS! You scored 10/10 and passed the Final Readiness Test!");
    } else {
      toast.error(`Score: ${correctCount}/10. You must score 10/10 to pass and unlock your clearance certificate. Review and retry!`);
    }
  };

  // Check if a module is unlocked
  const isModuleUnlocked = (moduleId: string) => {
    const index = trainingModules.findIndex(m => m.id === moduleId);
    if (index === 0) return true;
    
    // Unlocked if previous module's assignment is completed
    const prevMod = trainingModules[index - 1];
    return completedAssignments.includes(prevMod.id);
  };

  // Check if final test is unlocked
  const isFinalTestUnlocked = () => {
    return trainingModules.every(m => completedAssignments.includes(m.id));
  };

  // Toggle card flip helper
  const toggleCardFlip = (cardId: string) => {
    setFlippedCards(prev => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background text-foreground transition-colors duration-300">
      
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <img 
            src="https://d2xsxph8kpxj0f.cloudfront.net/310419663030168626/3JzrLh3y46yJi63KZRjP8V/tot_logo-kAwXxxQ6sfY63udqAkMtVv.webp" 
            alt="Top of Temecula" 
            className="w-8 h-8 rounded-full border border-primary"
          />
          <h1 className="text-lg font-serif font-bold text-foreground">Top of Temecula</h1>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSidebarSidebarOpen(!sidebarOpen)}
          className="border-primary text-primary hover:bg-primary/10"
        >
          {sidebarOpen ? 'Close Menu' : 'View Progress'}
        </Button>
      </header>

      {/* Sidebar - Desktop fixed, Mobile overlay drawer */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-card border-r border-border p-6 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col gap-6 overflow-y-auto pr-2">
          {/* Brand Header */}
          <div className="flex items-center gap-4 border-b border-border pb-6">
            <img 
              src="https://d2xsxph8kpxj0f.cloudfront.net/310419663030168626/3JzrLh3y46yJi63KZRjP8V/tot_logo-kAwXxxQ6sfY63udqAkMtVv.webp" 
              alt="Top of Temecula Logo" 
              className="w-12 h-12 rounded-full border-2 border-primary shadow-sm"
            />
            <div>
              <h2 className="text-xl font-serif font-bold leading-tight">Top of Temecula</h2>
              <p className="text-xs text-muted-foreground tracking-wider uppercase font-medium">Academy Portal</p>
            </div>
          </div>

          {/* Progress Tracker Widget */}
          <div className="bg-background/60 rounded-xl p-4 border border-border shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                Overall Progress
              </span>
              <span className="text-sm font-bold text-primary">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2 bg-muted [&>div]:bg-primary transition-all duration-500" />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-medium">
              <span>Day 1 Start</span>
              <span>Cleared for Field 🚀</span>
            </div>
          </div>

          {/* Training Module Navigation List */}
          <nav className="flex flex-col gap-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 mb-1">Training Modules</h3>
            
            {trainingModules.map((m) => {
              const unlocked = isModuleUnlocked(m.id);
              const active = activeModuleId === m.id && !showFinalTest;
              const completed = completedAssignments.includes(m.id);

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
                    setSidebarSidebarOpen(false);
                  }}
                  className={`
                    w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3 relative overflow-hidden
                    ${active 
                      ? 'bg-primary/10 border-primary text-foreground shadow-sm font-medium' 
                      : unlocked 
                        ? 'bg-transparent border-transparent text-muted-foreground hover:bg-accent/40 hover:text-foreground' 
                        : 'bg-transparent border-transparent text-muted-foreground/40 cursor-not-allowed'
                    }
                  `}
                >
                  {/* Visual Status Indicator */}
                  <div className="mt-0.5">
                    {completed ? (
                      <CheckCircle className="w-5 h-5 text-primary" />
                    ) : !unlocked ? (
                      <Lock className="w-5 h-5 text-muted-foreground/30" />
                    ) : (
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold
                        ${active ? 'border-primary text-primary' : 'border-muted-foreground/40 text-muted-foreground/60'}
                      `}>
                        {m.day}
                      </div>
                    )}
                  </div>

                  {/* Module Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold tracking-wide uppercase text-primary/80">Day {m.day}</span>
                      <span className="text-[10px] text-muted-foreground">{m.duration}</span>
                    </div>
                    <h4 className="text-sm font-bold truncate text-foreground mt-0.5">{m.title}</h4>
                    
                    {/* Visual Milestones Sub-Progress */}
                    {unlocked && (
                      <div className="flex gap-1 mt-2">
                        <span className={`h-1 flex-1 rounded-full ${completedModules.includes(m.id) ? 'bg-primary' : 'bg-muted'}`} />
                        <span className={`h-1 flex-1 rounded-full ${completedQuizzes.includes(m.id) ? 'bg-primary' : 'bg-muted'}`} />
                        <span className={`h-1 flex-1 rounded-full ${completedAssignments.includes(m.id) ? 'bg-primary' : 'bg-muted'}`} />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Final Test Navigation Link */}
            <button
              disabled={!isFinalTestUnlocked()}
              onClick={() => {
                setShowFinalTest(true);
                setSidebarSidebarOpen(false);
              }}
              className={`
                w-full text-left p-3.5 rounded-xl border transition-all duration-200 flex items-start gap-3 mt-4
                ${showFinalTest 
                  ? 'bg-primary/15 border-primary text-foreground shadow-sm font-medium' 
                  : isFinalTestUnlocked()
                    ? 'bg-transparent border-transparent text-primary hover:bg-primary/10' 
                    : 'bg-transparent border-transparent text-muted-foreground/40 cursor-not-allowed'
                }
              `}
            >
              <div className="mt-0.5">
                {passedFinalTest ? (
                  <Award className="w-5 h-5 text-primary animate-bounce" />
                ) : (
                  <Lock className={`w-5 h-5 ${isFinalTestUnlocked() ? 'text-primary' : 'text-muted-foreground/30'}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-bold tracking-wide uppercase text-primary">Final Stage</span>
                <h4 className="text-sm font-bold truncate mt-0.5">Readiness Certificate</h4>
              </div>
            </button>
          </nav>
        </div>

        {/* Footer Settings & Reset */}
        <div className="border-t border-border pt-4 mt-6 flex justify-between items-center">
          <div className="text-xs text-muted-foreground">
            <span>Ambassador: <strong>Dylan</strong></span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetProgress}
            className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 p-1 h-auto"
          >
            <RefreshCw className="w-3 h-3" /> Reset Progress
          </Button>
        </div>
      </aside>

      {/* Main Content Canvas */}
      <main className="flex-1 flex flex-col min-h-0 bg-background/30 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-4xl w-full mx-auto flex-1 flex flex-col justify-center">
          
          {/* STAGE 1: Final Readiness Certificate (Unlocked & Passed) */}
          {passedFinalTest && showFinalTest && (
            <Card className="border-2 border-primary bg-card/80 shadow-xl p-8 text-center flex flex-col items-center justify-center animate-fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl transform -translate-x-10 translate-y-10" />
              
              <Award className="w-20 h-20 text-primary mb-6 animate-bounce" />
              <h1 className="text-3xl md:text-4xl font-serif font-extrabold text-foreground mb-2">Clearance Certificate</h1>
              <p className="text-sm text-primary font-semibold tracking-wider uppercase mb-6">Top of Temecula Field Ambassador</p>
              
              <div className="max-w-md bg-background/50 rounded-2xl p-6 border border-border mb-8 shadow-inner">
                <p className="text-sm text-muted-foreground italic mb-4">"This certifies that"</p>
                <h2 className="text-2xl font-serif font-bold text-foreground mb-4">Dylan</h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Has successfully completed all 3 days of paid interactive study, scored 100% on the Final Readiness Test, mastered safety and compliance protocols, and is officially cleared for field operations.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                <Button 
                  onClick={() => {
                    toast.success("Certificate saved! Show this screen to Tim on your first day.");
                  }}
                  className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-6 text-sm font-bold shadow-md"
                >
                  Verify Clearance with Tim
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowFinalTest(false)}
                  className="flex-1 border-primary text-primary hover:bg-primary/10 rounded-xl py-6 text-sm font-semibold"
                >
                  Review Training Guides
                </Button>
              </div>
            </Card>
          )}

          {/* STAGE 2: Final Test Interface (Unlocked, not yet passed or reviewing) */}
          {showFinalTest && !passedFinalTest && (
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

                      {/* Explanation for incorrect answers */}
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
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle className="w-5 h-5" /> Score: 10/10 — Passed!
                        </span>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <X className="w-5 h-5" /> Score: {finalTestScore}/10 — Review required
                        </span>
                      )}
                    </div>
                    {finalTestScore === 10 ? (
                      <Button 
                        onClick={() => savePassedFinal(true)}
                        className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-5 font-bold shadow-md flex items-center gap-1.5"
                      >
                        Claim Clearance Certificate <Award className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => {
                          setFinalTestSubmitted(false);
                          setFinalTestAnswers({});
                        }}
                        className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-5 font-bold shadow-md flex items-center gap-1.5"
                      >
                        Retry Test <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-between items-center w-full">
                    <span className="text-xs text-muted-foreground font-medium">
                      {Object.keys(finalTestAnswers).length} of 10 answered
                    </span>
                    <Button 
                      onClick={submitFinalTest}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-5 font-bold shadow-md"
                    >
                      Submit Assessment
                    </Button>
                  </div>
                )}
              </CardFooter>
            </Card>
          )}

          {/* STAGE 3: Day Modules (Slides, Quiz, Assignment) */}
          {!showFinalTest && (
            <div className="flex flex-col gap-6">
              
              {/* Module Welcome Header */}
              <div className="mb-2">
                <div className="flex items-center gap-2 text-primary mb-1">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Day {activeModule.day} Module</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-serif font-extrabold text-foreground">{activeModule.title}</h1>
                <p className="text-sm text-muted-foreground mt-1">{activeModule.subtitle}</p>
              </div>

              {/* Slide Reader Stage */}
              {!showQuiz && !showAssignment && (
                <Card className="border border-border bg-card/90 shadow-md flex flex-col justify-between min-h-[50vh] p-6 md:p-8 relative overflow-hidden">
                  
                  {/* Decorative Subtle Background Asset */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl transform translate-x-8 -translate-y-8" />
                  
                  {/* Slide Content Render */}
                  <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full py-4">
                    <div className="flex justify-between items-baseline mb-4">
                      <span className="text-xs font-bold text-primary tracking-wide uppercase">Slide {currentSlideIndex + 1} of {activeModule.slides.length}</span>
                    </div>
                    
                    <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground mb-5">
                      {activeModule.slides[currentSlideIndex].title}
                    </h2>

                    {/* Render standard text content */}
                    {(!activeModule.slides[currentSlideIndex].type || activeModule.slides[currentSlideIndex].type === 'text') && (
                      <div className="flex flex-col gap-3 text-sm md:text-base text-muted-foreground leading-relaxed">
                        {activeModule.slides[currentSlideIndex].content?.map((p, idx) => (
                          <p key={idx}>{p}</p>
                        ))}
                      </div>
                    )}

                    {/* Render Interactive Script Flashcards */}
                    {activeModule.slides[currentSlideIndex].type === 'script' && (
                      <div className="flex flex-col gap-4 my-2">
                        {activeModule.slides[currentSlideIndex].scripts?.map((s, idx) => {
                          const cardId = `${activeModule.id}_s_${idx}`;
                          const isFlipped = flippedCards[cardId];

                          return (
                            <div 
                              key={idx} 
                              onClick={() => toggleCardFlip(cardId)}
                              className="group cursor-pointer perspective-1000 h-28 w-full"
                            >
                              <div className={`relative w-full h-full duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                                {/* Front of Card */}
                                <div className="absolute inset-0 backface-hidden border border-primary/30 bg-primary/5 rounded-xl p-4 flex items-center justify-between shadow-sm hover:border-primary transition-colors">
                                  <div className="flex items-center gap-3">
                                    <Volume2 className="w-5 h-5 text-primary animate-pulse" />
                                    <span className="text-sm font-bold text-foreground">{s.label}</span>
                                  </div>
                                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider group-hover:translate-x-1 transition-transform flex items-center gap-0.5">
                                    Tap to reveal script <ChevronRight className="w-3 h-3" />
                                  </span>
                                </div>
                                {/* Back of Card */}
                                <div className="absolute inset-0 backface-hidden rotate-y-180 border border-primary bg-card rounded-xl p-4 flex flex-col justify-center shadow-md">
                                  <p className="text-xs md:text-sm text-foreground font-medium italic leading-relaxed">"{s.text}"</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Render Objection Handling Cards */}
                    {activeModule.slides[currentSlideIndex].type === 'objection' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2">
                        {activeModule.slides[currentSlideIndex].scripts?.map((s, idx) => {
                          const cardId = `${activeModule.id}_obj_${idx}`;
                          const isFlipped = flippedCards[cardId];

                          return (
                            <div 
                              key={idx} 
                              onClick={() => toggleCardFlip(cardId)}
                              className="group cursor-pointer perspective-1000 h-32 w-full"
                            >
                              <div className={`relative w-full h-full duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                                {/* Front */}
                                <div className="absolute inset-0 backface-hidden border border-secondary-foreground/20 bg-secondary/50 rounded-xl p-4 flex flex-col justify-between shadow-sm hover:border-primary transition-colors">
                                  <span className="text-xs font-bold text-secondary-foreground uppercase tracking-wider">Objection</span>
                                  <h4 className="text-sm font-bold text-foreground leading-snug">{s.label}</h4>
                                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-0.5">
                                    Tap to reveal response <ChevronRight className="w-3 h-3" />
                                  </span>
                                </div>
                                {/* Back */}
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

                    {/* Render Do's and Don'ts Lists */}
                    {activeModule.slides[currentSlideIndex].type === 'dosdonts' && (
                      <div className="flex flex-col gap-2.5 my-2">
                        {activeModule.slides[currentSlideIndex].items?.map((item, idx) => (
                          <div 
                            key={idx} 
                            className={`
                              flex items-start gap-3 p-3.5 rounded-xl border text-xs md:text-sm
                              ${item.bad 
                                ? 'border-rose-200 bg-rose-50/50 text-rose-900 dark:border-rose-950/20 dark:bg-rose-950/10 dark:text-rose-300' 
                                : 'border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:border-emerald-950/20 dark:bg-emerald-950/10 dark:text-emerald-300'
                              }
                            `}
                          >
                            <div className="mt-0.5 shrink-0">
                              {item.bad ? <X className="w-4 h-4 text-rose-600" /> : <Check className="w-4 h-4 text-emerald-600" />}
                            </div>
                            <div>
                              <strong className="font-bold mr-1">{item.label}:</strong>
                              <span className="font-medium italic">"{item.text}"</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* High-Contrast Highlights Block */}
                    {activeModule.slides[currentSlideIndex].highlight && (
                      <div className="mt-6 border-l-4 border-primary bg-primary/5 p-4 rounded-r-xl">
                        <p className="text-xs md:text-sm font-semibold text-primary-foreground leading-relaxed">
                          {activeModule.slides[currentSlideIndex].highlight}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Navigation Footer */}
                  <div className="border-t border-border pt-6 mt-6 flex justify-between items-center">
                    <Button 
                      variant="ghost" 
                      onClick={prevSlide} 
                      disabled={currentSlideIndex === 0}
                      className="text-muted-foreground hover:text-foreground flex items-center gap-1 px-3 py-5 rounded-xl"
                    >
                      <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                    <Button 
                      onClick={nextSlide}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 px-6 py-5 rounded-xl font-bold shadow-md"
                    >
                      {currentSlideIndex === activeModule.slides.length - 1 ? 'Go to Quiz' : 'Next'} <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              )}

              {/* Interactive Quiz Stage */}
              {showQuiz && !showAssignment && (
                <Card className="border border-border bg-card/90 shadow-md p-6 md:p-8">
                  <CardHeader className="p-0 mb-6">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <HelpCircle className="w-4 h-4 animate-bounce" />
                      <span className="text-xs font-bold uppercase tracking-wider">Day {activeModule.day} Knowledge Check</span>
                    </div>
                    <CardTitle className="text-xl font-serif font-bold">Verify Your Understanding</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Score 100% on this quick check to unlock the final Day {activeModule.day} practical assignment.
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

                          {/* Explanation */}
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
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-5 h-5" /> Score: {quizScore}/{activeModule.quiz.length} — Passed!
                            </span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <X className="w-5 h-5" /> Score: {quizScore}/{activeModule.quiz.length} — Try again
                            </span>
                          )}
                        </div>
                        {quizScore === activeModule.quiz.length ? (
                          <Button 
                            onClick={() => setShowAssignment(true)}
                            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-5 font-bold shadow-md flex items-center gap-1"
                          >
                            Go to Day {activeModule.day} Assignment <ArrowRight className="w-4 h-4" />
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => {
                              setQuizSubmitted(false);
                              setQuizAnswers({});
                            }}
                            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-5 font-bold shadow-md flex items-center gap-1"
                          >
                            Retry Quiz <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs text-muted-foreground font-medium">
                          {Object.keys(quizAnswers).length} of {activeModule.quiz.length} answered
                        </span>
                        <Button 
                          onClick={submitQuiz}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-5 font-bold shadow-md"
                        >
                          Submit Answers
                        </Button>
                      </div>
                    )}
                  </CardFooter>
                </Card>
              )}

              {/* Interactive Assignment Stage */}
              {showAssignment && (
                <Card className="border border-border bg-card/90 shadow-md p-6 md:p-8">
                  <CardHeader className="p-0 mb-6">
                    <div className="flex items-center gap-2 text-primary mb-1">
                      <FileText className="w-4 h-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Day {activeModule.day} Practical Assignment</span>
                    </div>
                    <CardTitle className="text-xl font-serif font-bold">{activeModule.assignment.title}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mt-1">
                      {activeModule.assignment.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-0 flex flex-col gap-4">
                    {activeModule.assignment.type === 'roleplay' && (
                      <div className="border border-primary/20 bg-primary/5 rounded-xl p-4 flex items-center gap-3.5 mb-2">
                        <Video className="w-8 h-8 text-primary shrink-0" />
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Recording Tip</h4>
                          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                            Use your phone's built-in voice recorder, Loom, or record a quick video on your computer. Upload it to Google Drive or Dropbox, make sure the link is set to "anyone with link can view," and paste it below.
                          </p>
                        </div>
                      </div>
                    )}

                    <textarea
                      value={assignmentsData[activeModule.id] || ''}
                      onChange={(e) => setAssignmentsData(prev => ({ ...prev, [activeModule.id]: e.target.value }))}
                      placeholder={activeModule.assignment.placeholder}
                      className="w-full min-h-[25vh] p-4 border border-border rounded-xl text-xs md:text-sm bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                    />
                  </CardContent>

                  <CardFooter className="p-0 border-t border-border pt-6 mt-6 flex justify-between items-center">
                    <Button 
                      variant="ghost" 
                      onClick={() => setShowAssignment(false)}
                      className="text-muted-foreground hover:text-foreground rounded-xl px-3 py-5"
                    >
                      Back to Quiz
                    </Button>
                    <Button 
                      onClick={() => handleAssignmentSubmit(assignmentsData[activeModule.id] || '')}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl px-6 py-5 font-bold shadow-md flex items-center gap-1"
                    >
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
