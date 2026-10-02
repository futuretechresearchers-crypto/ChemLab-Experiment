import { supabase } from './supabase';

export type QuestionType = 'multiple_choice' | 'bond_type' | 'identification' | 'formula_completion';

export type QuizQuestion = {
  id?: string;
  question_type: QuestionType;
  question_text: string;
  choices?: string[];
  correct_answer?: string;
  explanation?: string;
  hint?: string;
  question_order: number;
  points: number;
  workspace_enabled?: boolean;
  workspace_config?: Record<string, unknown>;
};

export type QuizActivity = {
  id?: string;
  title: string;
  description?: string;
  category?: string;
  difficulty?: string;
  time_limit?: number | null;
  published?: boolean;
  share_code?: string;
  activity_type?: string;
  workspace_enabled?: boolean;
  workspace_config?: Record<string, unknown>;
  questions: QuizQuestion[];
  created_at?: string;
  updated_at?: string;
};

function generateShareCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]);
  return values.join('');
}

export async function listTeacherActivities(): Promise<QuizActivity[]> {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) return [];

  const { data, error } = await supabase
    .from('quizzes')
    .select('id, title, description, category, difficulty, time_limit, published, share_code, activity_type, workspace_enabled, workspace_config, created_at, updated_at, quiz_questions(*)')
    .eq('teacher_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    category: row.category ?? 'General',
    difficulty: row.difficulty ?? 'medium',
    time_limit: row.time_limit ?? null,
    published: Boolean(row.published),
    share_code: row.share_code ?? '',
    activity_type: row.activity_type ?? 'quiz',
    workspace_enabled: Boolean(row.workspace_enabled),
    workspace_config: row.workspace_config ?? {},
    questions: (row.quiz_questions ?? []).map((question: any) => ({
      id: question.id,
      question_type: question.question_type ?? 'multiple_choice',
      question_text: question.question_text ?? '',
      choices: Array.isArray(question.choices) ? question.choices : [],
      correct_answer: question.correct_answer ?? '',
      explanation: question.explanation ?? '',
      hint: question.hint ?? '',
      question_order: Number(question.question_order ?? 0),
      points: Number(question.points ?? 1),
      workspace_enabled: Boolean(question.workspace_enabled),
      workspace_config: question.workspace_config ?? {},
    })),
    created_at: row.created_at,
    updated_at: row.updated_at,
  }));
}

export async function saveQuizActivity(activity: QuizActivity) {
  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Please sign in to save an activity.');

  const payload = {
    id: activity.id,
    teacher_id: user.id,
    title: activity.title,
    description: activity.description ?? '',
    category: activity.category ?? 'General',
    difficulty: activity.difficulty ?? 'medium',
    time_limit: activity.time_limit ?? null,
    published: Boolean(activity.published),
    activity_type: activity.activity_type ?? 'quiz',
    workspace_enabled: Boolean(activity.workspace_enabled),
    workspace_config: activity.workspace_config ?? {},
    share_code: activity.share_code || generateShareCode(),
    updated_at: new Date().toISOString(),
  };

  const { data: quiz, error: quizError } = await supabase
    .from('quizzes')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (quizError) throw quizError;

  const rows = (activity.questions ?? []).map((question, orderIndex) => ({
    id: question.id ?? crypto.randomUUID(),
    quiz_id: quiz.id,
    question_type: question.question_type,
    question_text: question.question_text,
    choices: question.choices ?? [],
    correct_answer: question.correct_answer ?? '',
    explanation: question.explanation ?? '',
    hint: question.hint ?? '',
    question_order: question.question_order ?? orderIndex + 1,
    points: Number(question.points ?? 1),
    workspace_enabled: Boolean(question.workspace_enabled),
    workspace_config: question.workspace_config ?? {},
    updated_at: new Date().toISOString(),
  }));

  if (rows.length) {
    const { error: questionError } = await supabase.from('quiz_questions').upsert(rows, { onConflict: 'id' });
    if (questionError) throw questionError;
  }

  return { ...activity, id: quiz.id, share_code: quiz.share_code, published: Boolean(quiz.published) } as QuizActivity;
}

export async function publishQuizActivity(activity: QuizActivity) {
  const nextActivity = { ...activity, published: true, share_code: activity.share_code || generateShareCode() };
  return saveQuizActivity(nextActivity);
}

export async function getPublishedActivityByShareCode(shareCode: string): Promise<QuizActivity | null> {
  const { data, error } = await supabase
    .from('quizzes')
    .select('id, title, description, category, difficulty, time_limit, published, share_code, activity_type, workspace_enabled, workspace_config, created_at, quiz_questions(*)')
    .eq('share_code', shareCode)
    .eq('published', true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    description: data.description ?? '',
    category: data.category ?? 'General',
    difficulty: data.difficulty ?? 'medium',
    time_limit: data.time_limit ?? null,
    published: true,
    share_code: data.share_code,
    activity_type: data.activity_type ?? 'quiz',
    workspace_enabled: Boolean(data.workspace_enabled),
    workspace_config: data.workspace_config ?? {},
    questions: (data.quiz_questions ?? []).map((question: any) => ({
      id: question.id,
      question_type: question.question_type ?? 'multiple_choice',
      question_text: question.question_text ?? '',
      choices: Array.isArray(question.choices) ? question.choices : [],
      correct_answer: question.correct_answer ?? '',
      explanation: question.explanation ?? '',
      hint: question.hint ?? '',
      question_order: Number(question.question_order ?? 0),
      points: Number(question.points ?? 1),
      workspace_enabled: Boolean(question.workspace_enabled),
      workspace_config: question.workspace_config ?? {},
    })),
    created_at: data.created_at,
  };
}

export async function deleteQuizActivity(quizId: string) {
  const { error } = await supabase.from('quiz_questions').delete().eq('quiz_id', quizId);
  if (error) throw error;
  const { error: quizError } = await supabase.from('quizzes').delete().eq('id', quizId);
  if (quizError) throw quizError;
}
