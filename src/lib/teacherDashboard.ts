import { supabase } from './supabase';
import type { TeacherDashboardData } from '../types/teacherDashboard';

export async function getTeacherDashboardData(): Promise<TeacherDashboardData> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) throw new Error('Your session could not be verified. Please sign in again.');
  if (!authData.user) throw new Error('Sign in with a teacher account to view this dashboard.');

  const userId = authData.user.id;
  const [summaryResult, profileResult, attemptsResult] = await Promise.all([
    supabase.rpc('teacher_dashboard_summary'),
    supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
    supabase
      .from('quiz_attempts')
      .select('id, score, total_questions, time_taken, created_at, quiz:quizzes!inner(title, teacher_id), student:profiles(full_name)')
      .eq('quiz.teacher_id', userId)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  if (summaryResult.error || profileResult.error || attemptsResult.error) {
    const error = summaryResult.error || profileResult.error || attemptsResult.error;
    if (error?.code === '42501') throw new Error('This account does not have teacher access.');
    throw new Error('Dashboard data could not be loaded. Please try again.');
  }

  const summaryValue: unknown = Array.isArray(summaryResult.data) ? summaryResult.data[0] : summaryResult.data;
  if (!summaryValue || typeof summaryValue !== 'object') throw new Error('Dashboard data could not be loaded. Please try again.');
  const summary = summaryValue as Record<string, unknown>;
  const asNumber = (value: unknown, nullAsZero = false): number => {
    if ((value === null || value === undefined || value === '') && nullAsZero) return 0;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    throw new Error('Dashboard data could not be loaded. Please try again.');
  };
  const oneRelatedRow = (value: unknown): Record<string, unknown> => {
    const row = Array.isArray(value) ? value[0] : value;
    return row && typeof row === 'object' ? row as Record<string, unknown> : {};
  };

  const recentResults = (attemptsResult.data || []).map((attempt) => {
    const row = attempt as Record<string, unknown>;
    const quiz = oneRelatedRow(row.quiz);
    const student = oneRelatedRow(row.student);
    const score = asNumber(row.score);
    const totalQuestions = asNumber(row.total_questions);
    if (typeof quiz.title !== 'string' || !quiz.title || typeof student.full_name !== 'string' || !student.full_name) {
      throw new Error('Dashboard data could not be loaded. Please try again.');
    }
    return {
      id: String(row.id || ''),
      quizTitle: quiz.title,
      studentName: student.full_name,
      score,
      totalQuestions,
      timeTaken: asNumber(row.time_taken ?? 0),
      percentage: totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0,
      createdAt: typeof row.created_at === 'string' ? row.created_at : '',
    };
  });

  return {
    teacherName: profileResult.data?.full_name || 'Teacher',
    stats: {
      quizzes: asNumber(summary.quizzes),
      students: asNumber(summary.students),
      avgScore: asNumber(summary.avg_score, true),
      attempts: asNumber(summary.attempts),
    },
    recentResults,
  };
}
