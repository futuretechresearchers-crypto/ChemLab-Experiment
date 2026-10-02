import { useEffect, useMemo, useState } from 'react';
import ChemLabSimulator from './ChemLabSimulator';
import { getStudentActivityByShareCode, type StudentQuizActivity } from '../lib/quizService';
import { supabase } from '../lib/supabase';
import { AuthScreen } from './AuthScreen';
import { StudentOnboarding } from './StudentOnboarding';
import { useAuth } from '../lib/AuthContext';

function getQuestionTypeLabel(questionType: string) {
  return questionType.replace(/_/g, ' ');
}

export function StudentActivityPage({ shareCode }: { shareCode: string }) {
  const { user, profile, loading: authLoading, profileError } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<StudentQuizActivity | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timerLeft, setTimerLeft] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const nextActivity = await getStudentActivityByShareCode(shareCode);
        if (!isMounted) return;
        setActivity(nextActivity);
        if (nextActivity?.time_limit) {
          setTimerLeft(nextActivity.time_limit * 60);
        }
      } catch (error) {
        if (import.meta.env.DEV) console.error('Activity load failed', error);
        if (isMounted) setLoadError(true);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [shareCode]);

  useEffect(() => {
    if (!started || !activity?.time_limit || timerLeft === null) return;
    if (timerLeft <= 0) {
      setStarted(false);
      return;
    }

    const timeout = window.setTimeout(() => setTimerLeft((value) => (value === null ? null : value - 1)), 1000);
    return () => window.clearTimeout(timeout);
  }, [started, timerLeft, activity]);

  const visibleQuestions = useMemo(() => activity?.questions ?? [], [activity]);
  const currentQuestion = visibleQuestions[currentIndex] ?? null;

  if (loading || authLoading) {
    return <main className="auth-page"><div className="auth-card"><p>Loading activity…</p></div></main>;
  }

  if (!user) {
    return <AuthScreen returnTo={`/activity/${shareCode}`} />;
  }

  if (profileError) return <main className="auth-page"><div className="auth-card" role="alert"><h1>We could not load your profile.</h1><p>Please refresh or sign out and try again.</p></div></main>;
  if (!profile || !profile.onboarding_completed) return <StudentOnboarding />;

  if (loadError) return <main className="auth-page"><div className="auth-card" role="alert"><span className="eyebrow">ACTIVITY UNAVAILABLE</span><h1>We could not load this activity.</h1><p>Please check your connection and try again.</p></div></main>;

  if (!activity) {
    return <main className="auth-page"><div className="auth-card"><span className="eyebrow">ACTIVITY UNAVAILABLE</span><h1>We could not find this activity.</h1><p>This link may be unpublished, expired, or invalid.</p></div></main>;
  }

  if (profile.role !== 'student') {
    return <main className="auth-page"><div className="auth-card"><span className="eyebrow">ACCESS DENIED</span><h1>Student account required</h1><p>Only a student profile can begin a live activity.</p></div></main>;
  }

  const submitActivity = async () => {
    if (!activity?.id || !user || submitting) return;
    const total = visibleQuestions.length;
    const attempt = {
      quiz_id: activity.id,
      student_id: user.id,
      total_questions: total,
      time_taken: activity.time_limit ? Math.max(1, activity.time_limit * 60 - (timerLeft ?? 0)) : null,
    };

    setSubmitting(true);
    setSubmitMessage(null);
    // TODO: authoritative scoring, answer persistence, and trusted timing require
    // a backend operation. Never download answer keys to this student client.
    const { error } = await supabase.from('quiz_attempts').insert(attempt);
    if (error) {
      if (import.meta.env.DEV) console.error('Activity attempt submission failed', error);
      setSubmitMessage('We could not record this attempt. Please try again.');
      setSubmitting(false);
      return;
    }

    setStarted(false);
    setSubmitMessage('Attempt record saved. Answers and score are not saved yet; server grading is not configured.');
    setSubmitting(false);
  };

  const updateAnswer = (questionId: string, value: string) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const nextQuestion = () => setCurrentIndex((index) => Math.min(index + 1, visibleQuestions.length - 1));
  const previousQuestion = () => setCurrentIndex((index) => Math.max(index - 1, 0));

  return (
    <main className="student-activity-shell">
      <header className="activity-header">
        <div>
          <span className="eyebrow">STUDENT ACTIVITY</span>
          <h1>{activity.title}</h1>
        </div>
        <div className="activity-meta">
          {timerLeft !== null && <span>{Math.max(0, timerLeft)}s remaining</span>}
          <span>{currentIndex + 1}/{visibleQuestions.length}</span>
        </div>
      </header>

      <section className="activity-card">
        {!started ? (
          <>
            <p>{activity.description || 'Complete the activity below.'}</p>
            <div className="activity-card-actions">
              <button className="primary" type="button" onClick={() => setStarted(true)}>Start activity</button>
            </div>
          </>
        ) : currentQuestion ? (
          <>
            <div className="question-topline">
              <span>{getQuestionTypeLabel(currentQuestion.question_type)}</span>
              <strong>{currentQuestion.points ?? 1} pts</strong>
            </div>
            <h2>{currentQuestion.question_text}</h2>

            {currentQuestion.question_type === 'multiple_choice' && (
              <div className="choice-list">
                {currentQuestion.options.map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    className={answers[currentQuestion.id ?? ''] === choice ? 'choice selected' : 'choice'}
                    onClick={() => updateAnswer(currentQuestion.id ?? '', choice)}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}

            {currentQuestion.question_type === 'bond_type' && (
              <div className="choice-list">
                {['ionic', 'polar covalent', 'nonpolar covalent'].map((choice) => (
                  <button
                    key={choice}
                    type="button"
                    className={answers[currentQuestion.id ?? ''] === choice ? 'choice selected' : 'choice'}
                    onClick={() => updateAnswer(currentQuestion.id ?? '', choice)}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            )}

            {(currentQuestion.question_type === 'identification' || currentQuestion.question_type === 'formula_completion') && (
              <label className="answer-field">
                <span>Response</span>
                <input
                  type="text"
                  value={answers[currentQuestion.id ?? ''] ?? ''}
                  placeholder="Type your answer"
                  onChange={(event) => updateAnswer(currentQuestion.id ?? '', event.target.value)}
                />
              </label>
            )}

            {activity.workspace_enabled && (
              <div className="workspace-panel">
                <div className="workspace-panel-header">
                  <span>ChemLab workspace</span>
                  <small>Use the chemistry simulator to validate the structure.</small>
                </div>
                <ChemLabSimulator />
              </div>
            )}

            <div className="activity-actions">
              <button type="button" className="secondary" onClick={previousQuestion} disabled={currentIndex === 0}>Previous</button>
              {currentIndex < visibleQuestions.length - 1 ? (
                <button type="button" className="primary" onClick={nextQuestion}>Next</button>
              ) : (
                <button type="button" className="primary" onClick={submitActivity} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit activity'}</button>
              )}
            </div>
            {submitMessage && <p className={submitMessage.startsWith('We could not') ? 'form-message error' : 'form-message success'} role="status">{submitMessage}</p>}
          </>
        ) : null}
      </section>
    </main>
  );
}
