import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Activity, ArrowLeft, ArrowRight, Building2, CheckCircle2, ChevronRight, CircleHelp, ClipboardList, Globe2, LockKeyhole, LogOut, Menu, MessageCircle, RefreshCcw, Search, Shield, ShieldCheck, Users, X } from 'lucide-react';
import { api, errorText } from './api';
import type { AdminMe, OverviewData, RestaurantDetail, RestaurantList, RestaurantRow, TeamMember } from './types';

type Screen = 'overview' | 'restaurants' | 'team' | 'integrations';
const money = (value: number) => new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(value);
const dateLabel = (value?: string) => value ? new Date(value).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
const navigation: { id: Screen; label: string; Icon: typeof Activity }[] = [
  { id: 'overview', label: 'Overview', Icon: Activity },
  { id: 'restaurants', label: 'Restaurants', Icon: Building2 },
  { id: 'integrations', label: 'WhatsApp health', Icon: MessageCircle },
  { id: 'team', label: 'Platform team', Icon: Users },
];
function Status({ value }: { value: string }) {
  const ok = ['active', 'connected', 'paid', 'completed'].includes(value);
  const pending = ['number_pending', 'unpaid', 'pending'].includes(value);
  return <span className={`status ${ok ? 'ok' : pending ? 'pending' : 'muted'}`}><span className="status-dot" />{value.replaceAll('_', ' ')}</span>;
}
function Empty({ title, text }: { title: string; text: string }) {
  return <div className="empty"><CircleHelp size={30} strokeWidth={1.6} /><strong>{title}</strong><p>{text}</p></div>;
}
function Panel({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return <section className="panel"><header className="panel-heading"><h2>{title}</h2>{aside}</header>{children}</section>;
}
function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) {
  return <div role="alert" className="notice error"><span>{message}</span>{retry && <button className="text-button" onClick={retry}>Try again</button>}</div>;
}

function Login({ onSuccess }: { onSuccess: (me: AdminMe) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const signIn = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true); setError('');
    try {
      await api('/auth/sign-in/email', { method: 'POST', body: JSON.stringify({ email, password }) });
      const me = await api<AdminMe>('/platform/me');
      onSuccess(me);
    } catch (err) {
      setError(errorText(err).includes('access denied') ? 'This account is not authorized for Restora platform administration.' : errorText(err));
    } finally { setLoading(false); setPassword(''); }
  };
  return <div className="login-page">
    <div className="login-brand"><span className="brand-icon"><ShieldCheck size={23} /></span><span>restora<span className="brand-dot">.</span><small>INTERNAL OPERATIONS</small></span></div>
    <div className="login-card">
      <span className="login-symbol"><LockKeyhole size={28} /></span>
      <p className="eyebrow">SECURE ACCESS</p>
      <h1>Welcome back.</h1>
      <p className="muted-text">Sign in with your verified Restora account. Access is limited to authorized platform staff.</p>
      <form onSubmit={signIn}>
        <label htmlFor="email">Work email</label>
        <input required autoComplete="username" id="email" type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} />
        <label htmlFor="password">Password</label>
        <input required autoComplete="current-password" id="password" type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <ErrorNotice message={error} />}
        <button disabled={loading} className="button primary full" type="submit">{loading ? 'Signing in…' : 'Sign in securely'}<ArrowRight size={17}/></button>
      </form>
      <p className="login-footer">For internal Restora operations only. All actions should be performed through approved accounts.</p>
    </div>
  </div>;
}

function Overview({ goToRestaurant }: { goToRestaurant: (id: string) => void }) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => { let live = true; api<OverviewData>('/platform/overview').then(d => { if (live) { setData(d); setError(''); } }, e => live && setError(errorText(e))); return () => { live = false; }; }, [tick]);
  const cards = [
    { label: 'Restaurants', value: data?.restaurants, icon: Building2, note: 'Across the platform' },
    { label: 'Active branches', value: data?.branches, icon: Globe2, note: 'Operating locations' },
    { label: 'Total orders', value: data?.orders, icon: ClipboardList, note: 'All-time order records' },
    { label: 'Customers', value: data?.customers, icon: Users, note: 'Platform-wide records' },
    { label: 'WhatsApp numbers', value: data?.waConnected, icon: MessageCircle, note: 'Connected to Meta' },
  ];
  return <div className="page-stack">
    <div className="page-title-row"><div><p className="eyebrow">PLATFORM AT A GLANCE</p><h1>Overview</h1><p className="muted-text">A clear view of restaurant operations across Restora.</p></div><button className="button secondary" onClick={() => setTick(t => t + 1)}><RefreshCcw size={16}/> Refresh</button></div>
    {error && <ErrorNotice message={error} retry={() => setTick(t => t + 1)} />}
    <div className="stats-grid">{cards.map(({ label, value, icon: Icon, note }) => <article className="stat-card" key={label}><span className="stat-icon"><Icon size={20}/></span><p>{label}</p><strong>{value === undefined ? '—' : money(value)}</strong><small>{note}</small></article>)}</div>
    <Panel title="Recently added restaurants" aside={<span className="small-caption">Latest registrations</span>}>
      {!data ? <div className="loading-line">Loading restaurants…</div> : !data.latestRestaurants.length ? <Empty title="No restaurants yet" text="New restaurant accounts appear here." /> :
      <div className="table-wrap"><table><thead><tr><th>Restaurant</th><th>Created</th><th>Status</th><th /></tr></thead><tbody>{data.latestRestaurants.map(r => <tr key={r.id}><td><span className="table-primary">{r.name}</span></td><td>{dateLabel(r.createdAt)}</td><td><Status value={r.status || 'active'}/></td><td><button aria-label={`Open ${r.name}`} className="icon-button" onClick={() => goToRestaurant(r.id)}><ChevronRight size={18}/></button></td></tr>)}</tbody></table></div>}
    </Panel>
  </div>;
}

function RestaurantDetails({ id, onBack }: { id: string; onBack: () => void }) {
  const [data, setData] = useState<RestaurantDetail | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { let live = true; api<RestaurantDetail>(`/platform/restaurants/${id}`).then(x => { if (live) setData(x); }, e => live && setError(errorText(e))); return () => { live = false; }; }, [id]);
  return <div className="page-stack">
    <button className="back-link" onClick={onBack}><ArrowLeft size={17}/> All restaurants</button>
    {error && <ErrorNotice message={error} />}
    {!data ? !error && <p className="muted-text">Loading restaurant details…</p> : <>
      <div className="page-title-row"><div><p className="eyebrow">RESTAURANT DETAIL</p><h1>{data.restaurant.name}</h1><p className="muted-text">Joined {dateLabel(data.restaurant.createdAt)} · <Status value={data.restaurant.status || 'active'}/></p></div></div>
      <div className="stats-grid compact"><article className="stat-card"><p>Orders</p><strong>{money(data.orderCount)}</strong></article><article className="stat-card"><p>Customers</p><strong>{money(data.customerCount)}</strong></article><article className="stat-card"><p>Team members</p><strong>{money(data.staffCount)}</strong></article><article className="stat-card"><p>Branches</p><strong>{money(data.branches.length)}</strong></article></div>
      <div className="detail-grid">
        <Panel title="Branches"><div className="simple-list">{data.branches.length ? data.branches.map(b => <div className="simple-row" key={b.id}><div><strong>{b.name}</strong><small>{b.city || 'No city recorded'}</small></div><Status value={b.isActive ? 'active' : 'inactive'}/></div>) : <Empty title="No branches" text="This restaurant has no branches." />}</div></Panel>
        <Panel title="WhatsApp connections"><div className="simple-list">{data.connections.length ? data.connections.map(c => <div className="simple-row" key={c.id}><div><strong>{c.number}</strong><small>Branch ID: {c.branchId.slice(-8)}</small></div><Status value={c.status}/></div>) : <Empty title="Not connected" text="No WhatsApp numbers have been linked." />}</div></Panel>
      </div>
      <Panel title="Recent orders" aside={<span className="small-caption">Latest 25 · read-only</span>}>
        {data.recentOrders.length ? <div className="table-wrap"><table><thead><tr><th>Order</th><th>Type</th><th>Status</th><th>Payment</th><th>Total</th><th>Created</th></tr></thead><tbody>{data.recentOrders.map(o => <tr key={o.id}><td className="table-primary">#{o.dailyToken}</td><td>{o.type.replaceAll('_',' ')}</td><td><Status value={o.status}/></td><td><Status value={o.paymentStatus}/></td><td>Rs {money(o.total)}</td><td>{dateLabel(o.createdAt)}</td></tr>)}</tbody></table></div> : <Empty title="No orders" text="New orders appear here after they are saved."/>}
      </Panel>
    </>}
  </div>;
}

function Restaurants({ initialId, onIdChange }: { initialId: string | null; onIdChange: (id: string | null) => void }) {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<RestaurantList | null>(null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (initialId) return;
    let live = true; setData(null);
    api<RestaurantList>(`/platform/restaurants?page=${page}&q=${encodeURIComponent(search)}`)
      .then(d => { if (live) { setData(d); setError(''); } }, e => live && setError(errorText(e)));
    return () => { live = false; };
  }, [page, search, tick, initialId]);
  if (initialId) return <RestaurantDetails id={initialId} onBack={() => onIdChange(null)} />;
  return <div className="page-stack">
    <div className="page-title-row"><div><p className="eyebrow">DIRECTORY</p><h1>Restaurants</h1><p className="muted-text">Find restaurants and inspect their operations safely.</p></div><button className="button secondary" onClick={() => setTick(t => t + 1)}><RefreshCcw size={16}/> Refresh</button></div>
    <Panel title="Restaurant directory" aside={<span className="small-caption">{data?.count ?? '—'} restaurants</span>}>
      <form className="searchbar" onSubmit={e => { e.preventDefault(); setPage(1); setSearch(query); }}><Search size={18}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search restaurant names" aria-label="Search restaurants"/><button className="button primary" type="submit">Search</button></form>
      {error && <ErrorNotice message={error} retry={() => setTick(t => t + 1)}/>}
      {!data && !error ? <div className="loading-line">Loading restaurants…</div> : data && !data.rows.length ? <Empty title="No matches" text="Try a different restaurant name."/> :
      data && <><div className="table-wrap"><table><thead><tr><th>Restaurant</th><th>Created</th><th>Status</th><th /></tr></thead><tbody>{data.rows.map((r: RestaurantRow) => <tr key={r.id}><td className="table-primary">{r.name}</td><td>{dateLabel(r.createdAt)}</td><td><Status value={r.status}/></td><td><button className="text-button" onClick={() => onIdChange(r.id)}>View details <ArrowRight size={16}/></button></td></tr>)}</tbody></table></div><div className="pagination"><span>Page {data.page} of {Math.max(1, Math.ceil(data.count / data.pageSize))}</span><div><button className="button secondary" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</button><button className="button secondary" disabled={page * data.pageSize >= data.count} onClick={() => setPage(p => p + 1)}>Next</button></div></div></>}
    </Panel>
  </div>;
}

function Team({ me }: { me: AdminMe }) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'analyst' | 'support'>('support');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const refresh = useCallback(async () => { setLoading(true); try { setMembers(await api<TeamMember[]>('/platform/team')); setError(''); } catch(e) { setError(errorText(e)); } finally { setLoading(false); } }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const save = async (e: FormEvent) => { e.preventDefault(); setSaving(true); setError(''); setNotice(''); try {
    const result = await api<TeamMember>('/platform/team', { method: 'PUT', body: JSON.stringify({ email: email.trim().toLowerCase(), role, enabled: true }) });
    setNotice(`Access granted to ${result.email}. The person can sign in using their own Restora password.`); setEmail(''); await refresh();
  } catch(err) { setError(errorText(err)); } finally { setSaving(false); } };
  const disable = async (member: TeamMember) => { if (!window.confirm(`${member.enabled ? 'Revoke' : 'Restore'} ${member.email}'s platform access?`)) return; try {
    await api('/platform/team', { method: 'PUT', body: JSON.stringify({ email: member.email, role: member.role, enabled: !member.enabled }) });
    await refresh();
  } catch (e) { setError(errorText(e)); } };
  return <div className="page-stack">
    <div><p className="eyebrow">ACCESS MANAGEMENT</p><h1>Platform team</h1><p className="muted-text">Keep platform access separate from restaurant staff roles.</p></div>
    {me.role !== 'owner' ? <Panel title="Restricted section"><Empty title="Owner access required" text="Only platform owners may manage internal staff access." /></Panel> : <>
      <div className="detail-grid">
        <Panel title="Grant team access">
          <form className="team-form" onSubmit={save}><label htmlFor="teammate">Verified Restora account email</label><input required id="teammate" type="email" placeholder="teammate@example.com" value={email} onChange={e => setEmail(e.target.value)}/><label htmlFor="role">Access level</label><select id="role" value={role} onChange={e => setRole(e.target.value as 'analyst'|'support')}><option value="support">Support — read-only</option><option value="analyst">Analyst — read-only</option></select><p className="helper">Members must register and verify their Restora accounts before access can be granted. Platform owners are configured only on the backend.</p><button className="button primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Grant access'}<ArrowRight size={16}/></button></form>
          {notice && <div role="status" className="notice success"><CheckCircle2 size={18}/>{notice}</div>}
          {error && <ErrorNotice message={error}/>}
        </Panel>
        <Panel title="Security controls"><div className="info-item"><Shield size={21}/><div><strong>Protected server authorization</strong><p>Role checks run on every API request.</p></div></div><div className="info-item"><LockKeyhole size={21}/><div><strong>Verified identities</strong><p>No public administrator registration or shared admin password.</p></div></div><div className="info-item"><ClipboardList size={21}/><div><strong>Read-only restaurant access</strong><p>Platform staff cannot modify restaurant data through this portal.</p></div></div></Panel>
      </div>
      <Panel title="Current team"><div className="table-wrap">{loading ? <div className="loading-line">Loading team…</div> : !members.length ? <Empty title="No team members yet" text="Add a verified account above."/> : <table><thead><tr><th>Account</th><th>Role</th><th>Status</th><th /></tr></thead><tbody>{members.map(m => <tr key={m.userId}><td className="table-primary">{m.email}</td><td>{m.role}</td><td><Status value={m.enabled ? 'active' : 'inactive'}/></td><td><button className="text-button" onClick={() => void disable(m)}>{m.enabled ? 'Revoke' : 'Restore'}</button></td></tr>)}</tbody></table>}</div></Panel>
    </>}
  </div>;
}

function Integrations({ openRestaurants }: { openRestaurants: () => void }) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api<OverviewData>('/platform/overview').then(setData, e => setError(errorText(e))); }, []);
  return <div className="page-stack"><div><p className="eyebrow">INTEGRATIONS</p><h1>WhatsApp health</h1><p className="muted-text">See the current platform connection footprint.</p></div>
    {error && <ErrorNotice message={error}/>}
    <div className="integration-card"><span className="integration-icon"><MessageCircle size={26}/></span><div><h2>WhatsApp Cloud API</h2><p>{data ? `${data.waConnected} restaurant WhatsApp numbers connected` : 'Loading connection status…'}</p><p className="helper">View individual restaurant connections in the directory. Token values are never exposed here.</p><button className="button secondary" onClick={openRestaurants}>Open restaurant directory <ArrowRight size={16}/></button></div></div>
  </div>;
}

export default function App() {
  const [me, setMe] = useState<AdminMe | null>(null);
  const [checking, setChecking] = useState(true);
  const [screen, setScreen] = useState<Screen>('overview');
  const [selected, setSelected] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const check = useCallback(async () => { setChecking(true); try {
    const admin = await api<AdminMe>('/platform/me'); setMe(admin); setSessionError('');
  } catch(e) { setMe(null); if (e instanceof Error && !e.message.includes('401')) setSessionError('Sign in with a verified and authorized Restora account.'); }
    finally { setChecking(false); }
  }, []);
  useEffect(() => { void check(); }, [check]);
  const signOut = async () => { try { await api('/auth/sign-out', { method: 'POST' }); } catch { /* Clear UI even if server unavailable */ } setMe(null); };
  const choose = (next: Screen) => { setScreen(next); setSelected(null); setMobileOpen(false); };
  const gotoRestaurant = (id: string) => { setScreen('restaurants'); setSelected(id); };
  if (checking) return <div className="splash"><span className="brand-icon"><ShieldCheck size={25}/></span>Checking secure access…</div>;
  if (!me) return <><Login onSuccess={setMe}/>{sessionError && <p className="sr-only">{sessionError}</p>}</>;
  const current = navigation.find(n => n.id === screen)!;
  return <div className="app-shell">
    {mobileOpen && <button aria-label="Close navigation overlay" className="mobile-overlay" onClick={() => setMobileOpen(false)}/>}
    <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
      <div className="sidebar-brand"><span className="brand-icon"><ShieldCheck size={21}/></span><span>restora<span className="brand-dot">.</span><small>PLATFORM ADMIN</small></span><button className="mobile-close" aria-label="Close menu" onClick={() => setMobileOpen(false)}><X size={20}/></button></div>
      <div className="workspace-switch"><span className="workspace-icon"><Globe2 size={18}/></span><div><strong>Restora Platform</strong><small>Internal workspace</small></div></div>
      <nav aria-label="Platform navigation"><span className="nav-caption">WORKSPACE</span>{navigation.map(({id,label,Icon}) => <button key={id} aria-current={screen === id ? 'page' : undefined} onClick={() => choose(id)} className={`nav-link ${screen===id ? 'active':''}`}><Icon size={18}/><span>{label}</span>{screen===id && <ChevronRight size={15} className="nav-arrow"/>}</button>)}</nav>
      <div className="sidebar-bottom"><span className="security-tag"><ShieldCheck size={15}/> Secured internal access</span><div className="user-card"><span className="avatar">{me.email.slice(0,1).toUpperCase()}</span><div><strong title={me.email}>{me.email}</strong><small>{me.role} account</small></div><button title="Sign out" aria-label="Sign out" className="signout" onClick={() => void signOut()}><LogOut size={18}/></button></div></div>
    </aside>
    <div className="content-shell">
      <header className="topbar"><button className="mobile-menu" aria-label="Open menu" onClick={() => setMobileOpen(true)}><Menu size={21}/></button><div className="breadcrumbs"><span>Platform</span><ChevronRight size={15}/><strong>{current.label}</strong></div><span className="topbar-badge"><span className="status-dot"/>Internal</span></header>
      <main id="main" className="page-content">
        {screen==='overview' && <Overview goToRestaurant={gotoRestaurant}/>}
        {screen==='restaurants' && <Restaurants initialId={selected} onIdChange={setSelected}/>}
        {screen==='team' && <Team me={me}/>}
        {screen==='integrations' && <Integrations openRestaurants={() => choose('restaurants')}/>}
      </main>
      <footer className="app-footer">Restora Platform Operations <span>Internal use only · Restaurant data is read-only</span></footer>
    </div>
  </div>;
}
