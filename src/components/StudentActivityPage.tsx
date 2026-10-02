import { useEffect, useMemo, useState } from 'react';
import ChemLabSimulator from './ChemLabSimulator';
import { getCurrentProfile } from '../lib/auth';
import { getPublishedActivityByShareCode, type QuizActivity, type QuizQuestion } from '../lib/quizService';
import { supabase } from '../lib/supabase';
import { AuthScreen } from './AuthScreen';

function getQuestionTypeLabel(questionType: string) {
  return questionType.replace(/_/g, ' ');
}

function normalizeAnswer(value: string | undefined) {
  return (value ?? '').trim().toLowerCase();
}

export function StudentActivityPage({ shareCode }: { shareCode: string }) {
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<QuizActivity | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [workspaceAnswers, setWorkspaceAnswers] = useState<Record<string, string>>({});
  const [timerLeft, setTimerLeft] = useState<number | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      const user = (await supabase.auth.getUser()).data.user;
      const profileData = user ? await getCurrentProfile() : null;
      if (!isMounted) return;
      setCurrentUser(user);
      setProfile(profileData);

      try {
        const nextActivity = await getPublishedActivityByShareCode(shareCode);
        if (!isMounted) return;
        setActivity(nextActivity);
        if (nextActivity?.time_limit) {
          setTimerLeft(nextActivity.time_limit * 60);
        }
      } catch (error) {
        console.error(error);
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

  if (loading) {
    return <main className="auth-page"><div className="auth-card"><p>Loading activity…</p></div></main>;
  }

  if (!currentUser) {
    return <AuthScreen returnTo={`/activity/${shareCode}`} />;
  }

  if (!activity) {
    return <main className="auth-page"><div className="auth-card"><span className="eyebrow">ACTIVITY UNAVAILABLE</span><h1>We could not find this activity.</h1><p>This link may be unpublished, expired, or invalid.</p></div></main>;
  }

  if (profile?.role !== 'student') {
    return <main className="auth-page"><div className="auth-card"><span className="eyebrow">ACCESS DENIED</span><h1>Student account required</h1><p>Only a student profile can begin a live activity.</p></div></main>;
  }

  const submitActivity = async () => {
    const total = visibleQuestions.length;
    const score = visibleQuestions.reduce((sum, question) => {
      const answer = answers[question.id ?? ''] ?? workspaceAnswers[question.id ?? ''];
      if (!answer) return sum;
      const correct = normalizeAnswer(question.correct_answer ?? '');
      const value = normalizeAnswer(answer);
      return value === correct ? sum + (Number(question.points ?? 1)) : sum;
    }, 0);

    const attempt = {
      quiz_id: activity.id,
      student_id: currentUser.id,
      score,
      total_questions: total,
      time_taken: activity.time_limit ? Math.max(1, activity.time_limit * 60 - (timerLeft ?? 0)) : null,
    };

    const { error } = await supabase.from('quiz_attempts').insert(attempt);
    if (error) {
      console.error(error);
      return;
    }

    setStarted(false);
    alert(`Activity submitted. Score: ${score}/${total}.`);
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
                {(currentQuestion.choices ?? []).map((choice) => (
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

            {currentQuestion.workspace_enabled && (
              <div className="workspace-panel">
                <div className="workspace-panel-header">
                  <span>ChemLab workspace</span>
                  <small>Use the chemistry simulator to validate the structure.</small>
                </div>
                <ChemLabSimulator
                  onResultChange={(result) => {
                    if (result && result.formula) {
                      setWorkspaceAnswers((current) => ({ ...current, [currentQuestion.id ?? '']: result.formula }));
                    }
                  }}
                />
              </div>
            )}

            {currentQuestion.hint && <p className="question-hint">Hint: {currentQuestion.hint}</p>}

            <div className="activity-actions">
              <button type="button" className="secondary" onClick={previousQuestion} disabled={currentIndex === 0}>Previous</button>
              {currentIndex < visibleQuestions.length - 1 ? (
                <button type="button" className="primary" onClick={nextQuestion}>Next</button>
              ) : (
                <button type="button" className="primary" onClick={submitActivity}>Submit activity</button>
              )}
            </div>
          </>
        ) : null}
      </section>
    </main>
  );
}
