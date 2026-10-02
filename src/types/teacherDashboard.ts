export interface TeacherDashboardResult {
  id: string;
  quizTitle: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  timeTaken: number;
  percentage: number;
  createdAt: string;
}

export interface TeacherDashboardData {
  teacherName: string;
  stats: {
    quizzes: number;
    students: number;
    avgScore: number;
    attempts: number;
  };
  recentResults: TeacherDashboardResult[];
}
