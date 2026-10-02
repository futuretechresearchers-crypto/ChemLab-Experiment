import { supabase } from './supabase';

export type Classroom = { id: string; name: string; join_code: string; teacher_id?: string };

function makeJoinCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const values = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(values, value => alphabet[value % alphabet.length]).join('');
}

export async function listTeacherClassrooms(teacherId: string): Promise<Classroom[]> {
  const { data, error } = await supabase.from('classrooms').select('id, teacher_id, name, join_code').eq('teacher_id', teacherId).order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Classroom[];
}

export async function createClassroom(teacherId: string, name: string): Promise<Classroom> {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const { data, error } = await supabase.from('classrooms')
      .insert({ teacher_id: teacherId, name: name.trim(), join_code: makeJoinCode() })
      .select('id, teacher_id, name, join_code')
      .single();
    if (!error) return data as Classroom;
    if (error.code !== '23505') throw error;
  }
  throw new Error('Could not generate a unique classroom invitation. Please try again.');
}

export async function getClassroomByCode(joinCode: string): Promise<Classroom | null> {
  const { data, error } = await supabase.from('classrooms').select('id, name, join_code').eq('join_code', joinCode).maybeSingle();
  if (error) throw error;
  return data as Classroom | null;
}

export async function joinClassroomByCode(joinCode: string): Promise<string> {
  const response = await supabase.rpc('join_classroom_by_code', { p_join_code: joinCode });
  // A duplicate membership is an idempotent success for the invitation flow.
  if (response.error?.code === '23505') return '';
  if (response.error) throw response.error;
  const responseValue: unknown = response.data;
  const value: unknown = Array.isArray(responseValue) ? responseValue[0] : responseValue;
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    const row = value as Record<string, unknown>;
    const id = row.classroom_id ?? row.join_classroom_by_code ?? row.id;
    if (typeof id === 'string') return id;
  }
  throw new Error('The classroom enrollment function returned an unexpected result.');
}
