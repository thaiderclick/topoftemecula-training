import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  ArrowLeft,
  RefreshCw,
  Send,
  User,
  Building2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Trophy,
  Loader2,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { Link } from 'wouter';

type Persona = 'busy' | 'skeptical_google' | 'friendly_curious' | 'gatekeeper' | 'hostile';
type Message = { role: 'user' | 'assistant'; content: string };

interface Scorecard {
  compliance_pass: boolean;
  compliance_flags: string[];
  scores: {
    led_with_claim: number;
    used_dashboard_hook: number;
    objection_handling: number;
    secured_outcome: number;
    professional_lowpressure: number;
    clean_close: number;
  };
  total: number;
  result: 'PASS' | 'RETRY';
  what_went_well: string[];
  coaching: string[];
  one_thing_to_try_next_time: string;
}

const PERSONAS: { id: Persona; label: string; emoji: string; description: string; tip: string }[] = [
  {
    id: 'friendly_curious',
    label: 'Friendly & Curious',
    emoji: '😊',
    description: 'Open owner who asks good questions. Winnable.',
    tip: 'Great for your first rep. Focus on the dashboard hook.',
  },
  {
    id: 'busy',
    label: 'Busy Owner',
    emoji: '⏱️',
    description: 'Distracted, half-listening, always looking away.',
    tip: 'Lead fast with the free claim. Respect their time.',
  },
  {
    id: 'skeptical_google',
    label: 'Skeptical (Has Google)',
    emoji: '🤔',
    description: '"We already have Google, why bother?"',
    tip: 'Never promise rankings. Focus on AI citations & the dashboard.',
  },
  {
    id: 'gatekeeper',
    label: 'Gatekeeper',
    emoji: '🛡️',
    description: 'Front-desk person. Owner is OUT. Guards the email.',
    tip: 'Win them over. Make the email invite their good deed.',
  },
  {
    id: 'hostile',
    label: 'Hostile Owner',
    emoji: '🚨',
    description: 'Irritated. Had bad experiences with reps before.',
    tip: 'SAFETY DRILL: Correct play is to disengage, NOT persist.',
  },
];

const SCORE_LABELS: Record<string, string> = {
  led_with_claim: 'Led with Free Claim',
  used_dashboard_hook: 'Used Dashboard Hook',
  objection_handling: 'Objection Handling',
  secured_outcome: 'Secured Outcome',
  professional_lowpressure: 'Professional & Low-Pressure',
  clean_close: 'Clean Close',
};

export default function Roleplay() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sceneComplete, setSceneComplete] = useState(false);
  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [phase, setPhase] = useState<'pick' | 'chat' | 'scorecard'>('pick');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const attemptCountQuery = trpc.roleplay.getAttemptCount.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const chatMutation = trpc.roleplay.chat.useMutation({
    onError: (err) => toast.error(`AI error: ${err.message}`),
  });

  const evaluateMutation = trpc.roleplay.evaluate.useMutation({
    onError: (err) => toast.error(`Evaluator error: ${err.message}`),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatMutation.isPending]);

  const startScene = (persona: Persona) => {
    setSelectedPersona(persona);
    setMessages([]);
    setInputText('');
    setSceneComplete(false);
    setScorecard(null);
    setPhase('chat');
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedPersona || chatMutation.isPending) return;

    const userMessage: Message = { role: 'user', content: inputText.trim() };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText('');

    try {
      const result = await chatMutation.mutateAsync({
        persona: selectedPersona,
        messages: updatedMessages,
      });

      const assistantMessage: Message = { role: 'assistant', content: result.content };
      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      if (result.sceneComplete) {
        setSceneComplete(true);
        toast.info('Scene complete! Getting your evaluation...');
        // Auto-evaluate
        const evalResult = await evaluateMutation.mutateAsync({
          persona: selectedPersona,
          transcript: finalMessages,
        });
        setScorecard(evalResult as unknown as Scorecard);
        setPhase('scorecard');
        attemptCountQuery.refetch();
      }
    } catch {
      // Error handled by onError
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetScene = () => {
    setPhase('pick');
    setSelectedPersona(null);
    setMessages([]);
    setScorecard(null);
    setSceneComplete(false);
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
        <Card className="max-w-md w-full text-center p-8">
          <ShieldAlert className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-serif font-bold mb-2">Login Required</h2>
          <p className="text-sm text-muted-foreground mb-4">You need to be logged in to access the Roleplay Simulator.</p>
          <Link href="/">
            <Button className="bg-primary text-primary-foreground">Back to Training</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const currentPersona = PERSONAS.find(p => p.id === selectedPersona);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground gap-1">
              <ArrowLeft className="w-4 h-4" /> Training Portal
            </Button>
          </Link>
          <div className="hidden sm:block w-px h-5 bg-border" />
          <div className="hidden sm:flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">AI Roleplay Simulator</span>
          </div>
        </div>
        {isAuthenticated && attemptCountQuery.data !== undefined && (
          <Badge variant="outline" className="text-xs border-primary/40 text-primary">
            {attemptCountQuery.data.count} attempt{attemptCountQuery.data.count !== 1 ? 's' : ''} logged
          </Badge>
        )}
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">

        {/* ── Phase: Persona Picker ─────────────────────────────────────── */}
        {phase === 'pick' && (
          <div className="flex flex-col gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-extrabold text-foreground">Choose Your Scenario</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Pick a business owner persona and run a live simulated visit. You pitch — they react. No coaching mid-scene.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PERSONAS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => startScene(p.id)}
                  className={`
                    text-left p-4 rounded-xl border transition-all duration-200 hover:shadow-md hover:border-primary/60 group
                    ${p.id === 'hostile' ? 'border-rose-200 bg-rose-50/30 hover:border-rose-400 dark:border-rose-900/40 dark:bg-rose-950/10' : 'border-border bg-card hover:bg-accent/20'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">{p.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-foreground">{p.label}</h3>
                        {p.id === 'hostile' && (
                          <Badge className="text-[10px] bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300">Safety Drill</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                      <p className="text-xs text-primary font-medium mt-1.5 flex items-center gap-1">
                        <ChevronRight className="w-3 h-3" /> {p.tip}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <Card className="border-border bg-card/60 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">How it works</h3>
              <ol className="text-xs text-muted-foreground flex flex-col gap-1.5 list-decimal list-inside">
                <li>Pick a persona above to start the scene.</li>
                <li>Type your pitch and responses as if you just walked in.</li>
                <li>The AI owner reacts in character — no hints, no coaching mid-scene.</li>
                <li>When the scene resolves, you get a full scorecard with sub-scores and coaching.</li>
                <li>Retry as many times as you want. Every attempt is logged.</li>
              </ol>
            </Card>
          </div>
        )}

        {/* ── Phase: Chat ───────────────────────────────────────────────── */}
        {phase === 'chat' && currentPersona && (
          <div className="flex flex-col gap-4">
            {/* Persona banner */}
            <div className={`flex items-center justify-between p-3 rounded-xl border ${
              currentPersona.id === 'hostile' ? 'border-rose-300 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/20' : 'border-border bg-card'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xl">{currentPersona.emoji}</span>
                <div>
                  <p className="text-xs font-bold text-foreground">{currentPersona.label}</p>
                  <p className="text-xs text-muted-foreground">{currentPersona.description}</p>
                </div>
              </div>
              {currentPersona.id === 'hostile' && (
                <Badge className="text-[10px] bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 shrink-0">
                  <AlertTriangle className="w-3 h-3 mr-1" /> Safety Drill
                </Badge>
              )}
            </div>

            {/* Hostile safety reminder */}
            {currentPersona.id === 'hostile' && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl border border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/10">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p className="text-xs text-rose-800 dark:text-rose-300 font-medium">
                  <strong>Safety reminder:</strong> If the owner is hostile, the correct play is to stay calm and disengage politely — NOT to keep pushing the pitch. Persistence here is a compliance fail.
                </p>
              </div>
            )}

            {/* Chat messages */}
            <div className="flex flex-col gap-3 min-h-[40vh] max-h-[55vh] overflow-y-auto pr-1">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Building2 className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">You just walked in. Start your pitch.</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Type what you'd say when you first approach the owner or front desk.</p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                  </div>
                  <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tr-sm'
                      : 'bg-card border border-border text-foreground rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              ))}

              {chatMutation.isPending && (
                <div className="flex gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {evaluateMutation.isPending && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Evaluating your performance...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            {!sceneComplete && (
              <div className="flex gap-2 items-end">
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type what you'd say... (Enter to send)"
                  rows={2}
                  className="flex-1 resize-none p-3 border border-border rounded-xl text-sm bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  disabled={chatMutation.isPending}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputText.trim() || chatMutation.isPending}
                  className="bg-primary text-primary-foreground h-[72px] px-4 rounded-xl shrink-0"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div className="flex justify-between items-center">
              <Button variant="ghost" size="sm" onClick={resetScene} className="text-muted-foreground hover:text-foreground gap-1 text-xs">
                <ArrowLeft className="w-3.5 h-3.5" /> Change Persona
              </Button>
              <p className="text-xs text-muted-foreground">{messages.filter(m => m.role === 'user').length} turns</p>
            </div>
          </div>
        )}

        {/* ── Phase: Scorecard ──────────────────────────────────────────── */}
        {phase === 'scorecard' && scorecard && currentPersona && (
          <div className="flex flex-col gap-5">
            {/* Result banner */}
            <div className={`p-5 rounded-2xl border-2 flex items-center gap-4 ${
              scorecard.result === 'PASS'
                ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/20'
                : 'border-rose-400 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/20'
            }`}>
              {scorecard.result === 'PASS' ? (
                <Trophy className="w-10 h-10 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <RefreshCw className="w-10 h-10 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <div>
                <h2 className={`text-xl font-serif font-extrabold ${
                  scorecard.result === 'PASS' ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'
                }`}>
                  {scorecard.result === 'PASS' ? 'PASS — Great work!' : 'RETRY — Keep practicing'}
                </h2>
                <p className="text-sm mt-0.5 text-muted-foreground">
                  Score: <strong>{scorecard.total}/12</strong> · Persona: {currentPersona.label}
                  {!scorecard.compliance_pass && <span className="text-rose-600 font-bold ml-2">· Compliance Fail</span>}
                </p>
              </div>
            </div>

            {/* Compliance flags */}
            {scorecard.compliance_flags.length > 0 && (
              <Card className="border-rose-300 bg-rose-50/50 dark:border-rose-900/50 dark:bg-rose-950/10">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Compliance Flags (Auto-Fail)
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex flex-col gap-1.5">
                  {scorecard.compliance_flags.map((flag, i) => (
                    <p key={i} className="text-xs text-rose-700 dark:text-rose-300 flex items-start gap-1.5">
                      <span className="text-rose-500 font-bold shrink-0">✗</span> {flag}
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Sub-scores */}
            <Card className="border-border bg-card">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold text-foreground">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 flex flex-col gap-2">
                {Object.entries(scorecard.scores).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between gap-3">
                    <span className="text-xs text-muted-foreground flex-1">{SCORE_LABELS[key] ?? key}</span>
                    <div className="flex gap-1">
                      {[0, 1, 2].map(n => (
                        <div key={n} className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                          n < val
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {n === 0 ? '0' : n === 1 ? '1' : '2'}
                        </div>
                      ))}
                    </div>
                    <span className={`text-xs font-bold w-8 text-right ${val === 2 ? 'text-emerald-600' : val === 1 ? 'text-amber-600' : 'text-rose-600'}`}>
                      {val}/2
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* What went well */}
            {scorecard.what_went_well.length > 0 && (
              <Card className="border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/40 dark:bg-emerald-950/10">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> What Went Well
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex flex-col gap-1.5">
                  {scorecard.what_went_well.map((item, i) => (
                    <p key={i} className="text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-1.5">
                      <span className="text-emerald-500 font-bold shrink-0">✓</span> {item}
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Coaching */}
            {scorecard.coaching.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/30 dark:border-amber-900/40 dark:bg-amber-950/10">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold text-amber-700 dark:text-amber-400">Coaching Points</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 flex flex-col gap-1.5">
                  {scorecard.coaching.map((item, i) => (
                    <p key={i} className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                      <span className="shrink-0">→</span> {item}
                    </p>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* One thing to try */}
            <div className="border border-primary/30 bg-primary/5 rounded-xl p-4">
              <p className="text-xs font-bold text-primary uppercase tracking-wider mb-1">One Thing to Try Next Time</p>
              <p className="text-sm text-foreground font-medium">{scorecard.one_thing_to_try_next_time}</p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => startScene(selectedPersona!)}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl py-5 font-bold gap-2"
              >
                <RefreshCw className="w-4 h-4" /> Retry Same Persona
              </Button>
              <Button
                variant="outline"
                onClick={resetScene}
                className="flex-1 border-border rounded-xl py-5 font-semibold gap-2"
              >
                Try Different Persona
              </Button>
            </div>

            {/* View transcript toggle */}
            <details className="border border-border rounded-xl overflow-hidden">
              <summary className="p-3 text-xs font-bold text-muted-foreground cursor-pointer hover:bg-accent/20 select-none">
                View Full Transcript
              </summary>
              <div className="p-4 flex flex-col gap-2 max-h-60 overflow-y-auto border-t border-border">
                {messages.map((msg, idx) => (
                  <div key={idx} className="text-xs">
                    <span className={`font-bold ${msg.role === 'user' ? 'text-primary' : 'text-muted-foreground'}`}>
                      {msg.role === 'user' ? 'YOU' : 'OWNER'}:
                    </span>{' '}
                    <span className="text-foreground">{msg.content}</span>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </main>
    </div>
  );
}
