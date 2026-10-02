import { useEffect, useMemo, useState } from 'react';
import ChemSim from './components/ChemLabSimulator';
import TeacherDashboard from './components/TeacherDashboard';
import { AuthScreen } from './components/AuthScreen';
import { StudentActivityPage } from './components/StudentActivityPage';
import { TeacherQuizBuilder } from './components/TeacherQuizBuilder';
import { formatChemicalFormula } from './engine/formatting';
import { getCurrentProfile, sanitizeReturnTo, signOutUser } from './lib/auth';
import { supabase } from './lib/supabase';
type Page = 'lab' | 'quizzes' | 'teacher';
function App() {
  const [authUser, setAuthUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [page, setPage] = useState<Page>('lab');
  const [quiz, setQuiz] = useState('What type of bond forms when sodium transfers an electron to chlorine?');
  const [path, setPath] = useState(window.location.pathname);
  const currentRoute = useMemo(() => window.location.pathname, [path]);
  useEffect(() => {
    let active = true;
    async function refreshSession() {
      const { data } = await supabase.auth.getUser();
      const nextProfile = data.user ? await getCurrentProfile() : null;
      if (!active) return;
      setAuthUser(data.user ?? null);
      setProfile(nextProfile);
      setAuthLoading(false);
    }
    void refreshSession();
    const { data: authData } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const nextUser = session?.user ?? null;
      const nextProfile = nextUser ? await getCurrentProfile() : null;
      if (!active) return;
      setAuthUser(nextUser);
      setProfile(nextProfile);
      setAuthLoading(false);
    });
    return () => {
      active = false;
      authData.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    const onPop = () => {
      setPath(window.location.pathname);
      const nextPage = window.location.pathname === '/teacher' ? 'teacher' : window.location.pathname.startsWith('/teacher/') ? 'teacher' : 'lab';
      setPage(nextPage);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const go = (nextPath: string, nextPage?: Page) => {
    window.history.pushState({}, '', nextPath);
    setPath(nextPath);
    if (nextPage) setPage(nextPage);
  };
  const teacherAuthorized = Boolean(authUser && profile?.role === 'teacher');
  const returnTo = sanitizeReturnTo(new URLSearchParams(window.location.search).get('returnTo') ?? undefined);
  if (currentRoute.startsWith('/login')) {
    return <AuthScreen returnTo={returnTo} />;
  }
  if (currentRoute.startsWith('/activity/')) {
    const shareCode = currentRoute.split('/activity/')[1]?.split('/')[0] ?? '';
    return <StudentActivityPage shareCode={shareCode} />;
  }
  if (currentRoute.startsWith('/teacher/quiz-builder')) {
    if (authLoading) return <main className="auth-page"><div className="auth-card"><p>Loading…</p></div></main>;
    if (!authUser) return <AuthScreen returnTo="/teacher/quiz-builder" />;
    if (profile?.role !== 'teacher') {
      return <main className="auth-page"><div className="auth-card"><span className="eyebrow">ACCESS DENIED</span><h1>Teacher account required</h1><p>This page is restricted to verified teacher accounts.</p></div></main>;
    }
    return <TeacherQuizBuilder />;
  }
  if (currentRoute === '/teacher') {
    if (authLoading) return <main className="auth-page"><div className="auth-card"><p>Loading…</p></div></main>;
    if (!authUser) return <AuthScreen returnTo="/teacher" />;
    if (profile?.role !== 'teacher') {
      return <main className="auth-page"><div className="auth-card"><span className="eyebrow">ACCESS DENIED</span><h1>Teacher account required</h1><p>This page is restricted to verified teacher accounts.</p></div></main>;
    }
    return <TeacherDashboard />;
  }
  const nav = (id: Page, label: string, target: string) => (
    <button key={id} className={page === id ? 'active' : ''} onClick={() => go(target, id)}>{label}</button>
  );
  return (
    <>
      <header>
        <a className="brand" href="/" onClick={(event) => { event.preventDefault(); go('/', 'lab'); }}>
          <i>⚛</i>
          <span>CHEM<span>LAB</span><small>interactive chemistry laboratory</small></span>
        </a>
        <nav>
          {nav('lab', 'Laboratory', '/')}
          {nav('quizzes', 'Quizzes', '/quizzes')}
          {teacherAuthorized && nav('teacher', 'Teacher Dashboard', '/teacher')}
        </nav>
        {authUser ? (
          <button className="secondary" onClick={async () => { await signOutUser(); window.location.assign('/'); }}>
            Log out
          </button>
        ) : (
          <button className="secondary" onClick={() => go('/login', 'lab')}>
            Log in
          </button>
        )}
      </header>
      {page === 'lab' && (
        <>
          <section className="intro">
            <div>
              <span className="eyebrow">DISCOVER CHEMICAL BONDING</span>
              <h1>See atoms <em>connect.</em></h1>
              <p>Build accurate reactant groups, observe electron transfer or sharing, and read the chemistry behind every supported product.</p>
            </div>
            <div className="formula">{formatChemicalFormula('H2O')} <b>+</b> {formatChemicalFormula('CO2')} <b>+</b> {formatChemicalFormula('NaCl')}</div>
          </section>
          <ChemSim />
        </>
      )}
      {page === 'quizzes' && (
        <section className="simple-page card">
          <span className="eyebrow">KNOWLEDGE CHECK</span>
          <h1>Bonding quizzes</h1>
          <p>{quiz}</p>
          <button className="primary" onClick={() => setQuiz('What type of bond forms when sodium transfers an electron to chlorine?')}>Reset prompt</button>
        </section>
      )}
      {page === 'teacher' && teacherAuthorized && <TeacherDashboard />}
    </>
  );
}
export default App;
