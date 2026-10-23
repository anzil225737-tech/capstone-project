import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Check, CheckCircle2, Circle, ClipboardList, Clock3, Plus, Search, Sparkles, Trash2, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000/api/v1' : '/api/v1');
const storedToken = () => localStorage.getItem('task_manager_token');

async function request(path, { token, ...options } = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) }
  });
  if (response.status === 204) return null;
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.message || 'Something went wrong. Please try again.');
  return body;
}

function Auth({ onAuth }) {
  const [mode, setMode] = useState('login'); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true);
    try { const data = await request(`/auth/${mode}`, { method: 'POST', body: JSON.stringify({ email, password }) }); onAuth(data.data); }
    catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return <main className="auth-page"><div className="auth-card"><div className="brand-mark"><ClipboardList size={19} /></div><p className="eyebrow">DAYMARK TASKS</p><h1>Your next step,<br /><span>made clear.</span></h1><p className="subtle">A quiet place to collect your tasks and keep moving.</p>
    <div className="auth-switch"><button className={mode === 'login' ? 'selected' : ''} onClick={() => setMode('login')}>Sign in</button><button className={mode === 'register' ? 'selected' : ''} onClick={() => setMode('register')}>Create account</button></div>
    <form onSubmit={submit}><label>Email address<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" /></label><label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === 'register' ? 'At least 8 characters' : 'Your password'} minLength={mode === 'register' ? 8 : undefined} required autoComplete={mode === 'register' ? 'new-password' : 'current-password'} /></label>
      {error && <p className="error" role="alert">{error}</p>}<button className="primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}<ArrowUpRight size={16} /></button></form>
    <p className="auth-foot">Your tasks stay private to your account.</p></div><div className="auth-side"><div className="side-copy"><span className="side-icon"><Sparkles size={18} /></span><p className="eyebrow">A LITTLE MORE CLARITY</p><h2>Make room for<br />what matters.</h2><p>Bring your to-dos together, decide what comes first, and make steady progress one task at a time.</p></div><span className="side-number">01 / 03</span></div></main>;
}

function TaskModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState({ title: initial?.title || '', description: initial?.description || '', dueDate: initial?.dueDate ? initial.dueDate.slice(0, 10) : '', priority: initial?.priority || 'Medium', status: initial?.status || 'To Do' });
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false);
  function change(key, value) { setForm(v => ({ ...v, [key]: value })); }
  async function submit(e) { e.preventDefault(); setError(''); setBusy(true); try { await onSave({ ...form, dueDate: form.dueDate || null }); onClose(); } catch (err) { setError(err.message); } finally { setBusy(false); } }
  return <div className="modal-scrim" onMouseDown={e => e.target === e.currentTarget && onClose()}><form className="modal" onSubmit={submit}><div className="modal-head"><div><p className="eyebrow">TASK DETAILS</p><h2>{initial ? 'Edit task' : 'Create a task'}</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button></div><label>Task title<input autoFocus maxLength={120} required value={form.title} onChange={e => change('title', e.target.value)} placeholder="What needs to get done?" /></label><label>Description <span className="optional">Optional</span><textarea maxLength={2000} rows={3} value={form.description} onChange={e => change('description', e.target.value)} placeholder="Add a little context…" /></label><div className="form-row"><label>Due date <span className="optional">Optional</span><input type="date" value={form.dueDate} onChange={e => change('dueDate', e.target.value)} /></label><label>Priority<select value={form.priority} onChange={e => change('priority', e.target.value)}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Status<select value={form.status} onChange={e => change('status', e.target.value)}><option>To Do</option><option>In Progress</option><option>Complete</option></select></label></div>{error && <p className="error" role="alert">{error}</p>}<div className="modal-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Add task'}<ArrowUpRight size={15} /></button></div></form></div>;
}

function App() {
  const [token, setToken] = useState(storedToken()); const [user, setUser] = useState(null); const [tasks, setTasks] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const [filter, setFilter] = useState('All tasks'); const [search, setSearch] = useState(''); const [modal, setModal] = useState(null); const [notice, setNotice] = useState('');

  async function loadTasks(activeToken = token) {
    setLoading(true); setError('');
    try { const data = await request('/tasks?limit=100', { token: activeToken }); setTasks(data.data); }
    catch (err) { if (err.message.includes('session') || err.message.includes('sign in')) signOut(); else setError(err.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (!token) { setLoading(false); return; } request('/auth/me', { token }).then(({ data }) => setUser(data.user)).then(() => loadTasks(token)).catch(() => signOut()); }, []);
  function signOut() { localStorage.removeItem('task_manager_token'); setToken(null); setUser(null); setTasks([]); setLoading(false); }
  function finishAuth(data) { localStorage.setItem('task_manager_token', data.token); setToken(data.token); setUser(data.user); loadTasks(data.token); }
  async function saveTask(values) {
    const editing = modal?.task; const url = editing ? `/tasks/${editing._id}` : '/tasks';
    const data = await request(url, { token, method: editing ? 'PATCH' : 'POST', body: JSON.stringify(values) });
    setTasks(current => editing ? current.map(task => task._id === editing._id ? data.data : task) : [data.data, ...current]);
    setNotice(editing ? 'Your changes are saved.' : 'Task added to your list.'); setTimeout(() => setNotice(''), 2800);
  }
  async function toggleTask(task) {
    try { const data = await request(`/tasks/${task._id}`, { token, method: 'PATCH', body: JSON.stringify({ status: task.status === 'Complete' ? 'To Do' : 'Complete' }) }); setTasks(current => current.map(item => item._id === task._id ? data.data : item)); }
    catch (err) { setError(err.message); }
  }
  async function deleteTask(task) {
    if (!window.confirm(`Delete “${task.title}”? This cannot be undone.`)) return;
    try { await request(`/tasks/${task._id}`, { token, method: 'DELETE' }); setTasks(current => current.filter(item => item._id !== task._id)); setNotice('Task deleted.'); setTimeout(() => setNotice(''), 2800); }
    catch (err) { setError(err.message); }
  }
  const counts = useMemo(() => ({ all: tasks.length, active: tasks.filter(t => t.status !== 'Complete').length, done: tasks.filter(t => t.status === 'Complete').length }), [tasks]);
  const visible = tasks.filter(task => {
    const matchFilter = filter === 'All tasks' || (filter === 'To do' && task.status === 'To Do') || (filter === 'In progress' && task.status === 'In Progress') || (filter === 'Completed' && task.status === 'Complete');
    const matchSearch = `${task.title} ${task.description || ''}`.toLowerCase().includes(search.toLowerCase()); return matchFilter && matchSearch;
  });
  if (!token || !user) return <Auth onAuth={finishAuth} />;
  const today = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  return <div className="app-shell"><aside className="sidebar"><a className="logo" href="#top"><span className="brand-mark"><ClipboardList size={17} /></span><span>daymark<span className="logo-dot">.</span></span></a><p className="nav-label">WORKSPACE</p><nav>{['All tasks', 'To do', 'In progress', 'Completed'].map((name, i) => <button key={name} onClick={() => setFilter(name)} className={`nav-item ${filter === name ? 'active' : ''}`}><span className="nav-symbol">{i === 3 ? <CheckCircle2 size={17} /> : i === 2 ? <Clock3 size={17} /> : <Circle size={17} />}</span>{name}<span className="nav-count">{name === 'All tasks' ? counts.all : name === 'Completed' ? counts.done : name === 'In progress' ? tasks.filter(t => t.status === 'In Progress').length : tasks.filter(t => t.status === 'To Do').length}</span></button>)}</nav><div className="sidebar-bottom"><div className="user-card"><div className="avatar">{user.email[0].toUpperCase()}</div><div className="user-meta"><strong>{user.email.split('@')[0]}</strong><span>{user.email}</span></div><button className="more-button" onClick={signOut} title="Sign out">↗</button></div><button className="logout" onClick={signOut}>Sign out</button></div></aside>
    <main className="main-content" id="top"><header className="topbar"><div><span className="eyebrow">YOUR PERSONAL SPACE</span><span className="top-date">{today}</span></div><button className="profile-button" aria-label="Signed in user">{user.email[0].toUpperCase()}</button></header><section className="page-heading"><div><p className="eyebrow">{filter.toUpperCase()}</p><h1>{filter === 'All tasks' ? 'A clear mind starts here.' : filter}</h1><p className="subtle">{filter === 'All tasks' ? 'A little progress adds up. What’s on your mind?' : `${visible.length} ${visible.length === 1 ? 'task' : 'tasks'} in this view.`}</p></div><button className="primary" onClick={() => setModal({})}><Plus size={17} /> New task</button></section>
      <section className="summary-strip"><div className="summary-item"><span className="summary-icon blue"><ClipboardList size={17} /></span><span><small>All tasks</small><strong>{counts.all}</strong></span></div><div className="summary-divider" /><div className="summary-item"><span className="summary-icon amber"><Clock3 size={17} /></span><span><small>Still to do</small><strong>{counts.active}</strong></span></div><div className="summary-divider" /><div className="summary-item"><span className="summary-icon green"><Check size={17} /></span><span><small>Completed</small><strong>{counts.done}</strong></span></div><div className="summary-note"><Sparkles size={15} /> One step at a time</div></section>
      <section className="list-toolbar"><div><h2>{filter === 'All tasks' ? 'Your tasks' : filter}</h2><span className="list-count">{visible.length} shown</span></div><label className="search-box"><Search size={16} /><input aria-label="Search tasks" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search your tasks" /></label></section>
      {error && <div className="alert" role="alert">{error}<button onClick={() => setError('')} aria-label="Dismiss"><X size={16} /></button></div>}
      {loading ? <div className="state-card"><span className="loader" /><p>Gathering your tasks…</p></div> : visible.length === 0 ? <div className="empty-state"><span className="empty-illustration"><ClipboardList size={26} /></span><h3>{search ? 'No matching tasks' : tasks.length ? 'Nothing in this view' : 'A fresh start'}</h3><p>{search ? 'Try a different phrase.' : tasks.length ? 'Choose another list or add a new task.' : 'Capture your first task and make a little room in your head.'}</p>{!tasks.length && <button className="primary" onClick={() => setModal({})}><Plus size={16} /> Create your first task</button>}</div> : <div className="task-list">{visible.map(task => <article className={`task-card ${task.status === 'Complete' ? 'is-done' : ''}`} key={task._id}><button className="task-check" aria-label={task.status === 'Complete' ? 'Reopen task' : 'Complete task'} onClick={() => toggleTask(task)}>{task.status === 'Complete' ? <CheckCircle2 size={20} /> : <Circle size={20} />}</button><button className="task-copy" onClick={() => setModal({ task })}><strong>{task.title}</strong>{task.description && <span>{task.description}</span>}<small>{task.dueDate && <><Clock3 size={12} /> Due {new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(new Date(task.dueDate))}<i>·</i></>}{task.status}<i>·</i><em className={`priority ${task.priority.toLowerCase()}`}>{task.priority} priority</em></small></button><div className="task-actions"><button className="icon-button" onClick={() => setModal({ task })} aria-label="Edit task">↗</button><button className="icon-button delete-button" onClick={() => deleteTask(task)} aria-label="Delete task"><Trash2 size={15} /></button></div></article>)}</div>}
      <footer className="main-footer"><span>Small steps. Real progress.</span><span>DAYMARK · PRIVATE BY DESIGN</span></footer>
    </main>{notice && <div className="toast" role="status"><CheckCircle2 size={16} />{notice}</div>}{modal && <TaskModal initial={modal.task} onClose={() => setModal(null)} onSave={saveTask} />}</div>;
}

export default App;
