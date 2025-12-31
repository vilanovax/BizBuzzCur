'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Clock,
  Shield,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils/cn';
import {
  DISC_QUESTIONS_FA,
  DISC_TEST_COPY,
  WORKSTYLE_INSIGHTS,
  getQuickTestQuestions,
  type DiscQuestionFA,
} from '@/modules/personality-engine/domain/disc.questions.fa';

type TestState = 'intro' | 'testing' | 'completing' | 'done';

interface Answer {
  questionId: string;
  value: number;
  responseTimeMs: number;
}

/**
 * Generate qualitative insights from answer patterns
 * This is a fallback when API doesn't return insights
 * NEVER shows DISC letters or scores
 */
function generateInsightsFromAnswers(answers: Answer[]): string[] {
  const insights: string[] = [];

  // Count patterns in answers
  let dTendency = 0; // Decisive, direct
  let iTendency = 0; // Interactive, enthusiastic
  let sTendency = 0; // Steady, supportive
  let cTendency = 0; // Careful, analytical

  answers.forEach(answer => {
    const qId = answer.questionId;
    const val = answer.value;

    // D vs S questions (disc_1 to disc_5)
    if (['disc_1', 'disc_2', 'disc_3', 'disc_4', 'disc_5'].includes(qId)) {
      if (val === 1) dTendency++;
      else sTendency++;
    }
    // I vs C questions (disc_6 to disc_10)
    if (['disc_6', 'disc_7', 'disc_8', 'disc_9', 'disc_10'].includes(qId)) {
      if (val === 1) iTendency++;
      else cTendency++;
    }
    // D vs I questions
    if (['disc_11', 'disc_12', 'disc_13'].includes(qId)) {
      if (val === 1) dTendency++;
      else iTendency++;
    }
    // S vs C questions
    if (['disc_14', 'disc_15', 'disc_16'].includes(qId)) {
      if (val === 1) sTendency++;
      else cTendency++;
    }
  });

  // Generate insights based on dominant patterns
  // Max 3 insights, qualitative only
  if (dTendency >= 3) {
    insights.push(WORKSTYLE_INSIGHTS.decisive);
  }
  if (iTendency >= 3) {
    insights.push(WORKSTYLE_INSIGHTS.collaborative);
  }
  if (sTendency >= 3) {
    insights.push(WORKSTYLE_INSIGHTS.steady);
  }
  if (cTendency >= 3) {
    insights.push(WORKSTYLE_INSIGHTS.analytical);
  }

  // Ensure we have at least 2 insights
  if (insights.length < 2) {
    if (dTendency >= 2 && !insights.includes(WORKSTYLE_INSIGHTS.decisive)) {
      insights.push(WORKSTYLE_INSIGHTS.resultsOriented);
    }
    if (iTendency >= 2 && !insights.includes(WORKSTYLE_INSIGHTS.collaborative)) {
      insights.push(WORKSTYLE_INSIGHTS.peopleOriented);
    }
    if (sTendency >= 2 && !insights.includes(WORKSTYLE_INSIGHTS.steady)) {
      insights.push(WORKSTYLE_INSIGHTS.supportive);
    }
    if (cTendency >= 2 && !insights.includes(WORKSTYLE_INSIGHTS.analytical)) {
      insights.push(WORKSTYLE_INSIGHTS.detailOriented);
    }
  }

  return insights.slice(0, 3);
}

export default function WorkStyleTestPage() {
  const router = useRouter();
  const [state, setState] = useState<TestState>('intro');
  const [questions] = useState<DiscQuestionFA[]>(() => getQuickTestQuestions());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<string[]>([]);

  // Start timer when question changes
  useEffect(() => {
    if (state === 'testing') {
      setQuestionStartTime(Date.now());
    }
  }, [currentIndex, state]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleAnswer = useCallback((value: 1 | 2) => {
    const responseTimeMs = Date.now() - questionStartTime;

    const newAnswer: Answer = {
      questionId: currentQuestion.id,
      value,
      responseTimeMs,
    };

    setAnswers(prev => [...prev, newAnswer]);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Test complete
      setState('completing');
    }
  }, [currentIndex, currentQuestion, questionStartTime, questions.length]);

  // Keyboard navigation
  useEffect(() => {
    if (state !== 'testing') return;

    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '1' || e.key === 'ArrowUp') {
        handleAnswer(1);
      } else if (e.key === '2' || e.key === 'ArrowDown') {
        handleAnswer(2);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state, handleAnswer]);

  // Submit answers when completing
  useEffect(() => {
    if (state !== 'completing') return;

    const submitAnswers = async () => {
      setIsSubmitting(true);
      setError(null);

      try {
        const res = await fetch('/api/workstyle/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testType: 'disc',
            testVersion: '1.0.0',
            answers,
          }),
        });

        const data = await res.json();

        if (data.success) {
          // Extract qualitative insights from response
          // API returns signals, we map them to human-readable insights
          if (data.data?.insights) {
            setInsights(data.data.insights);
          } else {
            // Fallback: generate insights from answers pattern
            setInsights(generateInsightsFromAnswers(answers));
          }
          setState('done');
        } else {
          setError(data.error || 'خطا در ثبت نتایج');
        }
      } catch {
        setError('خطا در اتصال به سرور');
      } finally {
        setIsSubmitting(false);
      }
    };

    submitAnswers();
  }, [state, answers]);

  // Intro screen - Pre-test trust screen
  // UX: Show reassurance before starting, never feel like a "test"
  if (state === 'intro') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8">
            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>

            {/* Title */}
            <h1 className="text-xl font-bold mb-2 text-center">{DISC_TEST_COPY.title}</h1>
            <p className="text-muted-foreground mb-6 text-center">
              {DISC_TEST_COPY.description}
            </p>

            {/* Trust points - Key reassurance bullets */}
            <div className="bg-muted/50 rounded-xl p-4 mb-6">
              <ul className="space-y-2">
                {DISC_TEST_COPY.trustPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Info badges */}
            <div className="flex justify-center gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{DISC_TEST_COPY.duration}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>{DISC_TEST_COPY.privacy}</span>
              </div>
            </div>

            {/* Actions */}
            <Button
              size="lg"
              className="w-full mb-3"
              onClick={() => setState('testing')}
            >
              {DISC_TEST_COPY.startButton}
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => router.back()}
            >
              {DISC_TEST_COPY.skipText}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Completing screen
  if (state === 'completing') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            {isSubmitting ? (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">در حال ثبت نتایج...</p>
              </>
            ) : error ? (
              <>
                <p className="text-destructive mb-4">{error}</p>
                <Button onClick={() => setState('testing')}>
                  تلاش مجدد
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Done screen - Show qualitative insights, NEVER DISC labels
  if (state === 'done') {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8">
            {/* Success icon */}
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-600" />
            </div>

            <h1 className="text-lg font-bold mb-2 text-center">
              {DISC_TEST_COPY.completionTitle}
            </h1>

            {/* Qualitative insights - Key UX element */}
            {insights.length > 0 && (
              <div className="mt-6 mb-6">
                <p className="text-sm text-muted-foreground mb-3 text-center">
                  {DISC_TEST_COPY.completionSubtitle}
                </p>
                <div className="bg-muted/50 rounded-xl p-4">
                  <ul className="space-y-2">
                    {insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <Button
              size="lg"
              className="w-full mb-3"
              onClick={() => router.push('/dashboard/jobs')}
            >
              <Briefcase className="w-4 h-4 ml-2" />
              {DISC_TEST_COPY.completionButton}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => router.push('/dashboard')}
            >
              {DISC_TEST_COPY.editLater}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Testing screen
  const questionsRemaining = questions.length - currentIndex - 1;

  return (
    <div className="min-h-[80vh] flex flex-col">
      {/* Progress bar - Show time remaining, not percentages */}
      <div className="sticky top-0 bg-background border-b z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">
              {DISC_TEST_COPY.progressText(currentIndex + 1, questions.length)}
            </span>
            <span className="text-sm text-muted-foreground">
              {questionsRemaining > 0
                ? DISC_TEST_COPY.timeRemaining(questionsRemaining)
                : 'آخرین سوال'}
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-lg w-full space-y-8">
          {/* Scenario */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {DISC_TEST_COPY.questionInstruction}
            </p>
            <h2 className="text-xl font-semibold">
              {currentQuestion.scenario}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <button
              onClick={() => handleAnswer(1)}
              className={cn(
                'w-full p-5 rounded-xl border-2 text-right transition-all',
                'hover:border-primary hover:bg-primary/5',
                'focus:outline-none focus:border-primary focus:bg-primary/5',
                'active:scale-[0.98]'
              )}
            >
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-medium flex-shrink-0">
                  ۱
                </span>
                <span className="text-base">{currentQuestion.optionA}</span>
              </div>
            </button>

            <button
              onClick={() => handleAnswer(2)}
              className={cn(
                'w-full p-5 rounded-xl border-2 text-right transition-all',
                'hover:border-primary hover:bg-primary/5',
                'focus:outline-none focus:border-primary focus:bg-primary/5',
                'active:scale-[0.98]'
              )}
            >
              <div className="flex items-center gap-4">
                <span className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-sm font-medium flex-shrink-0">
                  ۲
                </span>
                <span className="text-base">{currentQuestion.optionB}</span>
              </div>
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="text-center text-xs text-muted-foreground">
            کلید ۱ یا ۲ را فشار دهید
          </p>
        </div>
      </div>
    </div>
  );
}
