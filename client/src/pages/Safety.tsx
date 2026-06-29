import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Trophy,
  RefreshCw,
  Loader2,
  LogIn,
} from 'lucide-react';
import { Link } from 'wouter';
import { getLoginUrl } from '@/const';

interface Scenario {
  id: string;
  title: string;
  emoji: string;
  setup: string;
  choices: {
    text: string;
    isCorrect: boolean;
    consequence: string;
  }[];
  correctExplanation: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'aggressive_owner',
    title: 'Owner Gets Aggressive',
    emoji: '😤',
    setup: "You're pitching a restaurant owner. After your opening line, they raise their voice: \"I'm sick of people like you coming in here! Get out of my store right now!\"",
    choices: [
      {
        text: "Stay calm, apologize, and try one more time to explain the free listing.",
        isCorrect: false,
        consequence: "Wrong. Continuing to pitch after being told to leave is a compliance fail and a safety risk. Persistence here escalates the situation.",
      },
      {
        text: "Say \"I completely understand — I'm sorry to have bothered you. Have a great day.\" and leave immediately.",
        isCorrect: true,
        consequence: "Correct. You disengaged calmly and professionally. Safety first. A clear 'no' means the visit is over.",
      },
      {
        text: "Ask them to calm down and explain that you're just trying to help.",
        isCorrect: false,
        consequence: "Wrong. Telling an agitated person to 'calm down' often escalates tension. Your job is to leave, not to de-escalate a confrontation.",
      },
      {
        text: "Stand your ground and explain the listing is already created for them.",
        isCorrect: false,
        consequence: "Wrong. Standing your ground in a hostile situation is dangerous. The listing can wait. Your safety cannot.",
      },
    ],
    correctExplanation: "When someone is aggressive and tells you to leave, you leave. No pitch is worth a confrontation. Walk out calmly, note the business in your log as 'not interested,' and move on.",
  },
  {
    id: 'followed_to_car',
    title: 'Someone Follows You to Your Car',
    emoji: '🚗',
    setup: "You just left a strip mall business after a neutral interaction. As you walk to your car, you notice someone from the business is following you across the parking lot.",
    choices: [
      {
        text: "Stop and wait to see what they want — maybe they changed their mind.",
        isCorrect: false,
        consequence: "Wrong. You don't know their intent. Don't stop and wait alone in a parking lot.",
      },
      {
        text: "Walk to a populated area (like a nearby store), call Tim, and don't get in your car until you feel safe.",
        isCorrect: true,
        consequence: "Correct. Walk toward people, call Tim immediately, and don't isolate yourself in your car until the situation is clear.",
      },
      {
        text: "Quickly get in your car and lock the doors.",
        isCorrect: false,
        consequence: "Partially right but risky. Getting into your car alone with someone approaching can trap you. Walking toward a populated area first is safer.",
      },
      {
        text: "Turn around and ask them what they want.",
        isCorrect: false,
        consequence: "Wrong. Engaging alone in a parking lot with someone who followed you is a safety risk. Your first move is to get to a populated area.",
      },
    ],
    correctExplanation: "If someone follows you to your car, walk toward other people — a busy store, a group of shoppers. Call Tim immediately. Don't get in your car until you feel safe. Trust your gut.",
  },
  {
    id: 'back_office',
    title: 'Invited to the Back Office',
    emoji: '🚪',
    setup: "A business owner says \"Come on back, I'll show you what we already have set up\" and starts walking toward a back room away from the public area.",
    choices: [
      {
        text: "Follow them — it's a good sign they're engaged and want to show you their setup.",
        isCorrect: false,
        consequence: "Wrong. Going into a back room alone with a stranger is a safety risk, regardless of how friendly they seem.",
      },
      {
        text: "Politely decline and suggest staying in the public area: \"I appreciate it — let me show you on my phone right here if that works?\"",
        isCorrect: true,
        consequence: "Correct. You kept the conversation going while staying in a safe, visible location. Never go into back rooms, storage areas, or private spaces.",
      },
      {
        text: "Say you'll wait out front while they go check.",
        isCorrect: false,
        consequence: "Acceptable, but you're missing an opportunity. The better move is to offer to show them on your phone right where you are.",
      },
      {
        text: "Follow them but text Tim your location first.",
        isCorrect: false,
        consequence: "Wrong. Texting your location is good practice, but it doesn't make going into a back room safe. Stay in public areas.",
      },
    ],
    correctExplanation: "Never go into back rooms, storage areas, or private spaces with a stranger. Always stay in the public-facing area of the business. If they want to see something, show them on your phone right there.",
  },
  {
    id: 'cash_offer',
    title: 'Owner Offers You Cash',
    emoji: '💵',
    setup: "After your pitch, a friendly owner says \"I like what you're doing. Here's $20 — can you make sure our listing looks extra good?\"",
    choices: [
      {
        text: "Accept it — it's a tip for good service and doesn't hurt anyone.",
        isCorrect: false,
        consequence: "Wrong. Accepting cash from business owners is a serious compliance violation. It creates a conflict of interest and could expose Ononen Inc. to legal liability.",
      },
      {
        text: "Politely decline: \"I really appreciate that, but I can't accept payment — the listing claim is completely free and I'm just here to help you get set up.\"",
        isCorrect: true,
        consequence: "Correct. You declined gracefully, reinforced the free value, and kept the interaction professional. This is exactly right.",
      },
      {
        text: "Tell them to pay Tim directly if they want to upgrade later.",
        isCorrect: false,
        consequence: "Close, but not complete. You need to decline the cash first, then explain that any paid services go through Tim — not you.",
      },
      {
        text: "Accept it and report it to Tim later.",
        isCorrect: false,
        consequence: "Wrong. Accepting cash is the violation — reporting it later doesn't fix it. Decline on the spot.",
      },
    ],
    correctExplanation: "Never accept cash, gifts, or any payment from business owners. The listing claim is free. Any paid services are handled by Tim directly. Accepting cash — even a small tip — is a compliance violation.",
  },
  {
    id: 'phone_while_driving',
    title: 'Phone Buzzes While Driving',
    emoji: '📱',
    setup: "You're driving between stops and your phone buzzes with what looks like a new address from Tim. You're on a busy road.",
    choices: [
      {
        text: "Quickly glance at the message at a red light.",
        isCorrect: false,
        consequence: "Wrong. Even at a red light, using your phone while in traffic is illegal in California and dangerous. This is a zero-tolerance policy.",
      },
      {
        text: "Pull into a parking lot or safe area, stop the car, then check the message.",
        isCorrect: true,
        consequence: "Correct. Pull over safely, stop the car completely, then check your phone. No message is urgent enough to risk an accident.",
      },
      {
        text: "Use voice-to-text to respond without looking at the screen.",
        isCorrect: false,
        consequence: "Wrong. Interacting with your phone while driving — even hands-free — is a distraction. Pull over.",
      },
      {
        text: "Ignore it until you reach your next stop.",
        isCorrect: false,
        consequence: "This is acceptable if your next stop is close, but pulling over to check is better. Ignoring a message for a long time could mean missing an important update from Tim.",
      },
    ],
    correctExplanation: "California law prohibits using a handheld phone while driving. Our policy is zero tolerance. Pull into a parking lot or safe area before checking any messages. No route update is worth an accident.",
  },
  {
    id: 'unsafe_location',
    title: 'Unsafe Location After Hours',
    emoji: '🌙',
    setup: "It's 6:45 PM and you have one more stop on your list — a business in a strip mall that looks dark and mostly empty. The area feels off.",
    choices: [
      {
        text: "Go in quickly — you're almost done for the day and it'll only take a minute.",
        isCorrect: false,
        consequence: "Wrong. Never override your gut feeling about safety to finish a route. No visit is worth a safety risk.",
      },
      {
        text: "Skip it and log it as \"closed\" without calling Tim.",
        isCorrect: false,
        consequence: "Partially right — skipping is correct — but you must always call or text Tim when you skip a stop so he knows your status.",
      },
      {
        text: "Trust your gut, skip the stop, and text Tim: \"Skipping [business name] — location felt unsafe at this hour. Will try tomorrow morning.\"",
        isCorrect: true,
        consequence: "Correct. You trusted your instincts, communicated with Tim, and kept yourself safe. This is exactly the right call.",
      },
      {
        text: "Call Tim first and ask if you should still go in.",
        isCorrect: false,
        consequence: "Calling Tim is good, but if something feels unsafe, don't wait for permission to skip it. Trust your gut first, then inform Tim.",
      },
    ],
    correctExplanation: "If a location feels unsafe — at any hour — skip it and text Tim immediately. Your safety is the top priority. Gut feelings are data. Never override them to complete a route.",
  },
];

export default function Safety() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [currentScenarioIdx, setCurrentScenarioIdx] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [completedScenarios, setCompletedScenarios] = useState<Set<string>>(new Set());
  const [allDone, setAllDone] = useState(false);

  const saveProgressMutation = trpc.training.saveProgress.useMutation();

  const scenario = SCENARIOS[currentScenarioIdx];
  const isCorrect = selectedChoice !== null && scenario.choices[selectedChoice].isCorrect;

  const handleSubmit = () => {
    if (selectedChoice === null) {
      toast.error('Please select an answer before submitting.');
      return;
    }
    setSubmitted(true);
  };

  const handleNext = () => {
    if (!isCorrect) {
      toast.error('You must select the correct answer to continue.');
      return;
    }

    const updated = new Set(completedScenarios);
    updated.add(scenario.id);
    setCompletedScenarios(updated);

    if (currentScenarioIdx < SCENARIOS.length - 1) {
      setCurrentScenarioIdx(currentScenarioIdx + 1);
      setSelectedChoice(null);
      setSubmitted(false);
    } else {
      // Mark safety completed on the server
      saveProgressMutation.mutate({ safetyCompleted: true });
      setAllDone(true);
      toast.success('Safety training complete! Final test is now unlocked.');
    }
  };

  const resetScenario = () => {
    setSelectedChoice(null);
    setSubmitted(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center flex flex-col items-center gap-6">
          <Shield className="w-12 h-12 text-primary" />
          <h2 className="text-xl font-serif font-bold">Login Required</h2>
          <p className="text-sm text-muted-foreground">You need to be logged in to access Safety Scenarios.</p>
          <a href={getLoginUrl()}>
            <Button className="bg-primary text-primary-foreground gap-2">
              <LogIn className="w-4 h-4" /> Sign In
            </Button>
          </a>
        </div>
      </div>
    );
  }

  if (allDone) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border bg-card px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1">
              <ArrowLeft className="w-4 h-4" /> Training Portal
            </Button>
          </Link>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-12 flex flex-col items-center text-center gap-6">
          <Trophy className="w-16 h-16 text-primary" />
          <h1 className="text-3xl font-serif font-extrabold">Safety Scenarios Complete!</h1>
          <p className="text-muted-foreground text-sm max-w-md">
            You've passed all 6 safety scenarios. You now know the correct response to the most common field safety situations. These aren't just rules — they're habits that keep you safe.
          </p>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 max-w-md text-left">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Remember the core principle:</p>
            <p className="text-sm font-medium text-foreground">
              No listing, no route, no quota is worth your safety. When in doubt, disengage, leave, and call Tim.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/">
              <Button className="bg-primary text-primary-foreground rounded-xl px-6 py-5 font-bold">
                Back to Training Portal — Final Test Unlocked!
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="px-4 py-3 flex items-center justify-between sticky top-0 z-10" style={{ background: 'oklch(0.22 0.01 65)', borderBottom: '1px solid oklch(0.30 0.01 65)' }}>
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1 hover:bg-white/10" style={{ color: 'oklch(0.75 0.01 65)' }}>
              <ArrowLeft className="w-4 h-4" /> Training Portal
            </Button>
          </Link>
          <div className="hidden sm:block w-px h-5" style={{ background: 'oklch(0.35 0.01 65)' }} />
          <div className="hidden sm:flex items-center gap-2">
            <Shield className="w-4 h-4" style={{ color: 'oklch(0.68 0.148 72)' }} />
            <span className="text-sm font-bold text-white">Safety Scenarios</span>
          </div>
        </div>
        <Badge variant="outline" className="text-xs" style={{ borderColor: 'oklch(0.68 0.148 72 / 0.50)', color: 'oklch(0.68 0.148 72)' }}>
          {currentScenarioIdx + 1} of {SCENARIOS.length}
        </Badge>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Progress bar */}
        <div className="flex gap-1 mb-6">
          {SCENARIOS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                completedScenarios.has(s.id)
                  ? 'bg-primary'
                  : i === currentScenarioIdx
                    ? 'bg-primary/40'
                    : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col gap-5">
          {/* Scenario header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{scenario.emoji}</span>
              <div>
                <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1 w-fit">
                  <AlertTriangle className="w-2.5 h-2.5 mr-1" /> Safety Scenario
                </Badge>
                <h1 className="text-xl font-serif font-extrabold text-foreground">{scenario.title}</h1>
              </div>
            </div>
          </div>

          {/* Setup */}
          <Card className="border-border bg-card">
            <CardContent className="p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Situation</p>
              <p className="text-sm text-foreground leading-relaxed">{scenario.setup}</p>
            </CardContent>
          </Card>

          {/* Choices */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">What do you do?</p>
            {scenario.choices.map((choice, idx) => {
              const isSelected = selectedChoice === idx;
              const showResult = submitted;
              const showCorrect = showResult && choice.isCorrect;
              const showWrong = showResult && isSelected && !choice.isCorrect;

              return (
                <button
                  key={idx}
                  disabled={submitted}
                  onClick={() => setSelectedChoice(idx)}
                  className={`
                    w-full text-left p-4 rounded-xl border text-sm transition-all duration-150
                    ${isSelected && !submitted ? 'border-primary bg-primary/10 text-foreground font-medium' : 'border-border bg-card text-muted-foreground hover:bg-accent/20 hover:text-foreground'}
                    ${showCorrect ? 'border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-200' : ''}
                    ${showWrong ? 'border-rose-400 bg-rose-50 text-rose-900 dark:border-rose-700 dark:bg-rose-950/20 dark:text-rose-200' : ''}
                  `}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected && !submitted ? 'border-primary bg-primary' :
                      showCorrect ? 'border-emerald-500 bg-emerald-500' :
                      showWrong ? 'border-rose-500 bg-rose-500' :
                      'border-muted-foreground/30'
                    }`}>
                      {showCorrect && <CheckCircle className="w-3 h-3 text-white" />}
                      {showWrong && <XCircle className="w-3 h-3 text-white" />}
                      {isSelected && !submitted && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <span className="leading-relaxed">{choice.text}</span>
                  </div>

                  {/* Consequence reveal */}
                  {submitted && isSelected && (
                    <div className={`mt-3 ml-7 text-xs leading-relaxed font-medium ${
                      choice.isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                    }`}>
                      {choice.consequence}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Correct explanation */}
          {submitted && isCorrect && (
            <div className="border border-primary/30 bg-primary/5 rounded-xl p-4">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Why This Is Correct</p>
              <p className="text-sm text-foreground leading-relaxed">{scenario.correctExplanation}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {!submitted ? (
              <Button
                onClick={handleSubmit}
                disabled={selectedChoice === null}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-5 font-bold"
              >
                Submit Answer
              </Button>
            ) : isCorrect ? (
              <Button
                onClick={handleNext}
                disabled={saveProgressMutation.isPending}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-5 font-bold gap-2"
              >
                {saveProgressMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {currentScenarioIdx < SCENARIOS.length - 1 ? 'Next Scenario' : 'Complete Safety Training'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={resetScenario}
                className="flex-1 bg-rose-600 text-white hover:bg-rose-700 rounded-xl py-5 font-bold gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Try Again — Select the Correct Answer
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
