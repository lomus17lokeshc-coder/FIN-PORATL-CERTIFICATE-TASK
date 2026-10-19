import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRight, ArrowUpRight, Bell, Check, CheckCircle2, ChevronDown,
  ExternalLink, Menu, ShieldCheck, X, BarChart3,
  Wallet, BookOpen, GraduationCap, LogOut,
} from 'lucide-react';

type Route = 'home' | 'apply' | 'status' | 'overview' | 'profile' | 'projects' |
  'contributions' | 'weekly' | 'hackathons' | 'certificates' | 'magazine' | 'notifications' | 'history';
type Role = 'applicant' | 'student';
type Notice = { title: string; description: string; date: string; read?: boolean };
type Certificate = {
  id: number; student_name: string; certificate_name: string;
  file_name: string; status: string; uploaded_at: string;
};
type Application = {
  fullName: string; email: string; registerNumber: string; department: string;
  year: string; phone: string; displayName: string; skills: string; interests: string;
  portfolio: string; motivation: string; experience: string;
  consentRecord: boolean; consentPublic: boolean;
};
type Profile = {
  displayName: string; bio: string; department: string; skills: string;
  portfolio: string; mentor: string; publicConsent: boolean;
};

const initialApplication: Application = {
  fullName: '', email: '', registerNumber: '', department: '', year: '', phone: '',
  displayName: '', skills: '', interests: '', portfolio: '', motivation: '', experience: '',
  consentRecord: false, consentPublic: false,
};
const initialProfile: Profile = {
  displayName: 'Priyan A', bio: 'Building thoughtful financial technology.',
  department: 'Information Technology / Year 3', skills: 'React, Python · Financial AI',
  portfolio: '', mentor: 'Faculty mentor / Project contributor', publicConsent: false,
};
const initialNotices: Notice[] = [
  { title: 'Weekly update needs revision', description: 'WK-006 · Add test output before the next review.', date: 'Today' },
  { title: 'Contribution verified', description: 'CON-014 · Your data-cleaning notebook was accepted.', date: 'Yesterday' },
  { title: 'Hackathon certificate under review', description: 'Your coordinator is reviewing supporting evidence.', date: '08 Oct 2026' },
];
const studentNav: { label: string; route: Route }[] = [
  { label: 'Overview', route: 'overview' }, { label: 'My profile', route: 'profile' },
  { label: 'Projects & tasks', route: 'projects' }, { label: 'Contributions', route: 'contributions' },
  { label: 'Weekly updates', route: 'weekly' }, { label: 'Certificates', route: 'certificates' },
  { label: 'Magazine', route: 'magazine' }, { label: 'Notifications', route: 'notifications' },
];
const applicantNav: { label: string; route: Route }[] = [
  { label: 'Landing page', route: 'home' }, { label: 'Apply to join', route: 'apply' },
  { label: 'Application status', route: 'status' }, { label: 'Magazine archive', route: 'magazine' },
];
const projects = [
  { name: 'Expense categorization', next: 'Complete test evidence', status: 'Revision required', description: 'AI-assisted expense classification and testing.' },
  { name: 'Payment analytics', next: 'Review data validation', status: 'In progress', description: 'Understand payment trends, risk and anomalies.' },
];
function getSaved<T,>(key: string, fallback: T): T {
  try { const stored = localStorage.getItem(key); return stored ? JSON.parse(stored) as T : fallback; }
  catch { return fallback; }
}
const isStudentRoute = (route: Route) => ['overview', 'profile', 'projects', 'contributions', 'weekly', 'hackathons', 'certificates', 'notifications', 'history'].includes(route);
function readHash(): Route {
  const candidate = window.location.hash.slice(2) as Route;
  return (['home','apply','status','overview','profile','projects','contributions','weekly','hackathons','certificates','magazine','notifications','history'] as Route[]).includes(candidate) ? candidate : 'home';
}

function Logo({ short = false }: {short?: boolean}) {
  return <div className={`college-logo ${short ? 'logo-short' : ''}`} role="img" aria-label="Prathyusha Engineering College">
    <span className="logo-seal" aria-hidden="true"><GraduationCap size={21}/></span>
    <span className="logo-lettering"><strong>PRATHYUSHA</strong><b>ENGINEERING COLLEGE</b><small>An Autonomous Institution</small></span>
    {!short && <span className="logo-accreditation">Approved by AICTE, New Delhi<br />Affiliated to Anna University, Chennai<br />An Autonomous Institution</span>}
  </div>;
}
function Pill({children, kind = 'neutral'}: {children: React.ReactNode; kind?: 'neutral'|'success'|'danger'|'gold'}) {
  return <span className={`pill pill-${kind}`}>{children}</span>;
}
function Btn({children, onClick, secondary, gold, type = 'button', disabled, className = ''}: {
  children: React.ReactNode; onClick?: () => void; secondary?: boolean; gold?: boolean;
  type?: 'button'|'submit'; disabled?: boolean; className?: string;
}) {
  return <button className={`btn ${secondary ? 'btn-secondary' : ''} ${gold ? 'btn-gold' : ''} ${className}`} onClick={onClick} disabled={disabled} type={type}>{children}</button>;
}
function Panel({title,children, className = ''}: {title: string; children: React.ReactNode; className?:string}) {
  return <section className={`panel ${className}`}><h2>{title}</h2>{children}</section>;
}
function Tabs({tabs,active,onSelect}: {tabs:string[];active:string;onSelect:(tab:string)=>void}) {
  return <div className="tabs" role="tablist">{tabs.map(tab=><button key={tab} role="tab" aria-selected={active === tab} className={`tab ${active === tab ? 'selected':''}`} onClick={()=>onSelect(tab)}>{tab}</button>)}</div>;
}
function TextField({label,value,onChange,placeholder,required,type='text',error,readOnly}: {
  label:string; value:string;onChange?:(x:string)=>void; placeholder?:string;required?:boolean;
  type?:string;error?:string;readOnly?:boolean;
}) {
  const id=label.replace(/\W/g,'-');
  return <label className="field" htmlFor={id}><span className="field-title">{label}{required ? ' *' : ''}</span>
    <input id={id} type={type} value={value} onChange={e=>onChange?.(e.target.value)} placeholder={placeholder} readOnly={readOnly} aria-invalid={Boolean(error)} />
    {error && <span className="field-error">{error}</span>}
  </label>;
}
function Footnote() {
  return <p className="footnote">FINTECH INNOVATION TEAM&nbsp; • &nbsp;PRATHYUSHA ENGINEERING COLLEGE&nbsp; • &nbsp;SAMPLE DATA</p>;
}
function SiteHeader({role, onNavigate, noticeCount, onNotifications, onRoleSwitch}: {
  role:Role;onNavigate:(route:Route)=>void;noticeCount:number;onNotifications:()=>void;onRoleSwitch:()=>void;
}) {
  return <header className="site-header">
    <button className="logo-link" onClick={()=>onNavigate('home')} aria-label="Go to landing page"><Logo /></button>
    <div className="portal-ident"><strong>FINTECH INNOVATION TEAM</strong><span>PRATHYUSHA ENGINEERING COLLEGE</span></div>
    <div className="header-spacer" />
    <button className="role-pill" onClick={onRoleSwitch} title="Switch demonstration role">{role === 'student' ? 'Student' : 'Applicant'}</button>
    <button className="header-alert" onClick={onNotifications}>Notifications{noticeCount > 0 && <span className="notice-dot"/>}</button>
  </header>;
}
function Sidebar({role,route,navigate,mobileOpen,setMobileOpen}: {role:Role;route:Route;navigate:(x:Route)=>void;mobileOpen:boolean;setMobileOpen:(x:boolean)=>void}) {
  return <>
    <button className="mobile-nav-toggle" onClick={()=>setMobileOpen(!mobileOpen)} aria-label="Toggle workspace navigation"><Menu size={20}/> Workspace <ChevronDown size={15}/></button>
    <aside className={`sidebar ${mobileOpen ? 'sidebar-open':''}`}>
      <p className="sidebar-label">WORKSPACE</p>
      <nav aria-label="Workspace navigation">{(role === 'student' ? studentNav : applicantNav).map(item=><button key={item.route} className={`sidebar-item ${route === item.route ? 'active':''}`} onClick={()=>{navigate(item.route);setMobileOpen(false)}}>{item.label}</button>)}</nav>
      <p className="sidebar-year">2026–27<br />Academic year</p>
      <p className="sidebar-caption">Design preview<br />Illustrative records</p>
    </aside>
  </>;
}
function Headline({category,title,subtitle}: {category:string;title:string;subtitle:string}) {
  return <div className="headline"><p className="eyebrow">FINTECH / {category.toUpperCase()}</p><h1>{title}</h1><p className="subtitle">{subtitle}</p></div>;
}

function Landing({navigate}: {navigate:(x:Route)=>void}) {
  const domains = [
    {icon:<Wallet size={24}/>,title:'Digital payments',text:'Explore UPI, payment flows and the systems behind everyday transactions.'},
    {icon:<BarChart3 size={24}/>,title:'Financial intelligence',text:'Use data and AI to understand patterns, risk and smarter decisions.'},
    {icon:<ShieldCheck size={24}/>,title:'Banking & trust',text:'Discover APIs, digital identity and the foundations of secure finance.'},
  ];
  return <div className="public-page">
    <div className="institution-bar">PRATHYUSHA ENGINEERING COLLEGE <span>•</span> STUDENT FINTECH COMMUNITY</div>
    <div className="landing-nav container-wide">
      <button className="landing-brand" onClick={()=>navigate('home')}><Logo /><span>FINTECH DOMAIN / INNOVATION HUB</span></button>
      <nav className="landing-links" aria-label="Main navigation">
        <button onClick={()=>navigate('home')}>Explore</button><button onClick={()=>document.querySelector('#featured-projects')?.scrollIntoView({behavior:'smooth'})}>Projects</button>
        <button onClick={()=>document.querySelector('#community')?.scrollIntoView({behavior:'smooth'})}>Events</button><button onClick={()=>document.querySelector('#innovators')?.scrollIntoView({behavior:'smooth'})}>Community</button>
      </nav>
      <Btn onClick={()=>navigate('overview')} className="member-login">Member login <LogOut size={13}/></Btn>
    </div>
    <main>
      <section className="landing-hero container-wide">
        <div className="hero-copy"><span className="micro-label">FINANCE × TECHNOLOGY × YOU</span><h1>Learn finance.<br />Build what’s next.</h1>
          <p>A space for Prathyusha students to explore financial technology, turn bold ideas into projects, and build together.</p>
          <div className="hero-actions"><Btn onClick={()=>navigate('apply')}>Enter the hub <ArrowRight size={14}/></Btn><Btn secondary onClick={()=>document.querySelector('#focus')?.scrollIntoView({behavior:'smooth'})}>Explore domains <ArrowUpRight size={14}/></Btn></div>
          <small>STUDENT LED. FACULTY GUIDED. FUTURE FOCUSED.</small>
        </div>
        <div className="hero-graphic"><div className="graphic-top"><span>THE FINTECH LAB</span><span>01 / PEC</span></div>
          <h2>Ideas with<br />real-world impact.</h2><div className="graphic-bars"><i/><i/><i/><i/><i/><i/></div>
          <div className="graphic-tags"><span>PAYMENTS</span><span>FINANCIAL AI</span><span>OPEN BANKING</span></div>
          <div className="graphic-footer">LEARN → EXPERIMENT → BUILD</div>
        </div>
      </section>
      <section className="landing-section section-white" id="focus"><div className="container-wide"><span className="section-kicker">01 / FIND YOUR FOCUS</span><h2>Big possibilities. Your starting point.</h2>
        <div className="card-grid three-col">{domains.map(d=><article key={d.title} className="domain-card"><div className="domain-icon">{d.icon}</div><h3>{d.title}</h3><p>{d.text}</p><button className="inline-link" onClick={()=>navigate('apply')}>Explore this domain <ArrowUpRight size={13}/></button></article>)}</div>
      </div></section>
      <section className="landing-section projects-section" id="featured-projects"><div className="container-wide"><span className="section-kicker">02 / MADE TO MAKE A DIFFERENCE</span><h2>From classroom ideas to working projects.</h2><p className="section-desc">Illustrative projects • Replace with approved student submissions.</p>
        <div className="card-grid three-col">{[
          ['PERSONAL FINANCE','FinFam','Make competing savings goals easier to understand.'],
          ['PAYMENT ANALYTICS','PayLens','Turn transaction data into clear, useful insights.'],
          ['DIGITAL TRUST','TrustLedger','Explore transparent records and verifiable activity.'],
        ].map(p=><article key={p[1]} className="project-card"><span className="card-tag">{p[0]}</span><h3>{p[1]}</h3><p>{p[2]}</p><Btn secondary onClick={()=>navigate('apply')}>Sign in to explore <ExternalLink size={12}/></Btn></article>)}</div>
      </div></section>
      <section className="community-section" id="community"><div className="container-wide community-grid"><div><span className="section-kicker gold-text">03 / BETTER, TOGETHER</span><h2>Find your people.<br />Build your next idea.</h2><p>Join peer learning sessions, project teams and faculty-guided conversations.</p><Btn gold onClick={()=>navigate('apply')}>Join the community <ArrowRight size={14}/></Btn></div>
        <div className="event-card"><Pill kind="gold">PROPOSED SESSION</Pill><h3>Inside a digital payment</h3><p>A hands-on introduction to payment flows, trust and transaction design.</p><small>Schedule to be announced · Campus workshop</small></div></div>
      </section>
      <div className="landing-partner"><div className="container-wide partner-inner"><Logo /><p>FINTECH DOMAIN / STUDENT COMMUNITY CONCEPT<br />prathyusha.edu.in</p></div></div>
      <section className="landing-section section-white" id="innovators"><div className="container-wide"><span className="section-kicker">INNOVATORS, ACHIEVEMENTS & IDEAS</span><h2>Built at Prathyusha. Shared with purpose.</h2>
        <div className="card-grid three-col">{[
          {title:'Our innovators',desc:'Approved student profiles with consent, skills and selected contributions.',cta:'Join the team',route:'apply' as Route},
          {title:'Verified achievements',desc:'Published outcomes and event milestones, supported by reviewed evidence.',cta:'Explore event workflow',route:'hackathons' as Route},
          {title:'FinTech Innovation Monthly',desc:'Student stories, project highlights and an archive of approved editions.',cta:'Read magazine',route:'magazine' as Route},
        ].map(c=><article className="domain-card small" key={c.title}><h3>{c.title}</h3><p>{c.desc}</p><Btn secondary onClick={()=>navigate(c.route)}>{c.cta}</Btn></article>)}</div><p className="public-disclaimer">Illustrative showcase · Only approved content and consented profiles are published.</p>
      </div></section>
    </main>
  </div>;
}

function StudentOverview({navigate}: {navigate:(route:Route)=>void}) {
  return <>
    <Headline category="student" title="Make this week count, Priyan." subtitle="Your projects, individual contributions and review activity in one place." />
    <div className="stats-grid">{[['02','Active projects'],['07','Submitted contributions'],['05','Verified contributions'],['01','Update needs revision']].map(s=><article className="stat-card" key={s[1]}><strong>{s[0]}</strong><span>{s[1]}</span></article>)}</div>
    <section className="priority-card"><h2>This week’s priority</h2><p className="priority-gold">Week of 05–11 October 2026 · AI expense categorization prototype</p><p>Finish the classification flow and attach evidence of edge-case tests.</p><p>Mentor feedback: clarify category boundaries before the next review.</p><Btn onClick={()=>navigate('weekly')}>Open weekly update</Btn></section>
    <Panel title="My active work"><div className="table-wrap"><table><thead><tr><th>PROJECT</th><th>NEXT MILESTONE</th><th>STATUS</th></tr></thead><tbody>{projects.map(p=><tr key={p.name} onClick={()=>navigate('projects')} tabIndex={0} onKeyDown={e=>e.key==='Enter'&&navigate('projects')}><td>{p.name}</td><td>{p.next}</td><td>{p.status}</td></tr>)}</tbody></table></div></Panel>
    <Panel title="Recent activity"><div className="stacked-lines"><p>CON-014 · Verified · Data-cleaning notebook accepted.</p><p>WK-006 · Revision required · Add test output.</p><p>Hackathon certificate · Under review · Awaiting coordinator verification.</p></div></Panel>
    <div className="page-actions"><Btn onClick={()=>navigate('contributions')}>Add contribution</Btn><Btn secondary onClick={()=>navigate('history')}>Activity history</Btn></div><Footnote />
  </>;
}

function Apply({navigate,onSubmit}: {navigate:(route:Route)=>void;onSubmit:(a:Application)=>void}) {
  const [fields,setFields] = useState<Application>(()=>getSaved('pec-application-draft',initialApplication));
  const [errors,setErrors] = useState<Record<string,string>>({});
  const update=<K extends keyof Application>(key:K,val:Application[K])=>{setFields(f=>({...f,[key]:val}));setErrors(e=>({...e,[key]:''}));};
  useEffect(()=>{localStorage.setItem('pec-application-draft',JSON.stringify(fields));},[fields]);
  const text=<K extends keyof Application>(key:K,label:string,placeholder:string,required=false,type='text')=>
    <TextField label={label} value={String(fields[key])} onChange={v=>update(key,v as Application[K])} placeholder={placeholder} required={required} type={type} error={errors[key]}/>;
  const submit=(ev:FormEvent)=>{ev.preventDefault();const e:Record<string,string>={};
    for(const key of ['fullName','email','registerNumber','department','year','skills','interests','motivation'] as const){if(!fields[key].trim())e[key]='This field is required.';}
    if(fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) e.email='Enter a valid email address.';
    if(fields.portfolio && !/^https?:\/\//i.test(fields.portfolio)) e.portfolio='Enter a URL beginning with https://';
    if(!fields.consentRecord)e.consentRecord='Membership record consent is required.';
    setErrors(e);if(Object.keys(e).length){document.querySelector('[aria-invalid="true"]')?.scrollIntoView({behavior:'smooth',block:'center'});return;}
    onSubmit(fields);navigate('status');window.scrollTo(0,0);
  };
  return <>
    <Headline category="applicant" title="Join the FinTech Innovation Team" subtitle="Apply with your interests and experience. Portal access begins after coordinator approval." />
    <Tabs tabs={['01 About you','02 Skills & interests','03 Consent']} active="01 About you" onSelect={name=>document.getElementById(name.startsWith('01')?'academic-details':name.startsWith('02')?'interests-details':'consent-area')?.scrollIntoView({behavior:'smooth',block:'start'})}/>
    <form onSubmit={submit} noValidate>
      <Panel title="Academic and contact details" className="form-panel" ><div id="academic-details" className="form-grid">
        {text('fullName','Full name','Your full name',true)}{text('email','Institutional email','name@prathyusha.edu.in',true,'email')}
        {text('registerNumber','Register number · private','Institutional identifier',true)}{text('department','Department / programme','Information Technology / B.Tech',true)}
        {text('year','Academic year / year of study','2026–27 / Select year',true)}{text('phone','Contact number','Optional',false,'tel')}
        <div className="span-two">{text('displayName','Preferred display name','Optional · How should we address you?')}</div>
      </div></Panel>
      <Panel title="Tell us what you want to build" className="form-panel"><div className="form-grid" id="interests-details">
        {text('skills','Technical skills','Python, React, research...',true)}{text('interests','FinTech interests','Financial AI / Payments / Blockchain',true)}
        {text('portfolio','Portfolio / prior experience','GitHub or portfolio URL')}{text('motivation','Why would you like to join?','Your motivation and learning goals',true)}
        <div className="span-two consent-stack" id="consent-area">
          <label className="check-row"><input type="checkbox" checked={fields.consentRecord} onChange={e=>update('consentRecord',e.target.checked)}/> I consent to internal membership record keeping. *</label>
          {errors.consentRecord && <span className="field-error">{errors.consentRecord}</span>}
          <label className="check-row"><input type="checkbox" checked={fields.consentPublic} onChange={e=>update('consentPublic',e.target.checked)}/> I separately consent to a public profile. Optional; off by default.</label>
          <p>Required fields show inline errors before submission.</p>
        </div>
        <div className="span-two">{text('experience','Prior experience','Optional · Previous projects, clubs or competitions')}</div>
      </div></Panel>
      <div className="page-actions"><Btn type="submit">Submit application</Btn><Btn secondary onClick={()=>navigate('home')}>Back to landing</Btn></div><Footnote />
    </form>
  </>;
}

function ApplicationStatus({navigate,application, submitted}: {navigate:(route:Route)=>void;application:Application|null;submitted:boolean}) {
  const [clarification,setClarification] = useState(()=>getSaved('pec-clarification',''));
  const [sent,setSent] = useState(()=>getSaved('pec-clarification-sent',false));
  const [error,setError] = useState('');
  const send=()=>{if(!clarification.trim()){setError('Please enter the requested details.');return;}localStorage.setItem('pec-clarification',clarification);localStorage.setItem('pec-clarification-sent','true');setSent(true);setError('');};
  return <>
    <Headline category="applicant" title="Your application is under review" subtitle={submitted?`Application PEC-FT-DEMO · Submitted locally · ${application?.fullName||'Applicant'} · Access is not active yet.`:'Application PEC-FT-026 · Submitted 06 October 2026 · Access is not active yet.'}/>
    <Tabs tabs={['Pending','Clarification required','Approved','Rejected']} active="Pending" onSelect={()=>{document.getElementById('application-timeline')?.scrollIntoView({behavior:'smooth',block:'center'})}}/>
    <Panel title="Application timeline"><div className="stacked-lines status-timeline" id="application-timeline"><p>✓ Application received · {submitted?'Saved to this browser':'06 Oct, 10:20 AM'}</p><p>● Coordinator review · Pending</p><p>○ Membership decision · You will be notified</p><p>○ Account activation · Available after approval</p></div></Panel>
    <Panel title="Clarification requested · Example state" className="status-clarification"><Pill>Clarification Required</Pill><div className="form-grid narrow-top"><TextField label="Coordinator’s request" value="Add your portfolio link or describe a previous project." readOnly/><TextField label="Your response" value={clarification} onChange={v=>{setClarification(v);setSent(false)}} placeholder="Add the requested information here" error={error}/></div>
      <Btn onClick={send}>{sent?<><Check size={14}/> Saved locally</>:'Send clarification'}</Btn>
      {sent&&<p className="inline-success">Your response is saved in this browser. Backend submission has not been configured.</p>}
    </Panel>
    <Panel title="Decision and access states"><div className="stacked-lines"><p>Approved → activate account, sign in and complete your profile.</p><p>Rejected → show recorded decision and permitted next steps.</p><p>Suspended / Inactive → explain access state and contact route.</p><p>Updates appear here; email is sent only where configured.</p></div></Panel>
    <div className="page-actions"><Btn secondary onClick={()=>navigate('overview')}>Go to sign in</Btn></div><Footnote />
  </>;
}
function ProfilePage() {
  const [profile,setProfile]=useState<Profile>(()=>getSaved('pec-profile',initialProfile));
  const [saved,setSaved]=useState(false);
  const [tab,setTab]=useState('Profile');
  const [correction,setCorrection]=useState(false);
  const update=<K extends keyof Profile>(key:K,val:Profile[K])=>{setProfile(p=>({...p,[key]:val}));setSaved(false);};
  const field=<K extends keyof Profile>(key:K,label:string,placeholder?:string)=> <TextField label={label} value={String(profile[key])} placeholder={placeholder} onChange={v=>update(key,v as Profile[K])}/>;
  return <><Headline category="student" title="My profile & privacy" subtitle="Keep your academic profile current and choose what may appear on the public showcase." />
    <Tabs tabs={['Profile','Visibility','Activity history']} active={tab} onSelect={v=>{setTab(v);document.getElementById(v==='Profile'?'profile-details':v==='Visibility'?'profile-visibility':'profile-protected')?.scrollIntoView({behavior:'smooth',block:'start'});}}/>
    <Panel title="Profile details"><div className="form-grid" id="profile-details">
      {field('displayName','Display name / photo','Priyan A · Change profile photo')}{field('bio','Bio','Building thoughtful financial technology.')}
      {field('department','Department / year','Information Technology / Year 3')}{field('skills','Skills and interests','React, Python · Financial AI')}
      {field('portfolio','Portfolio link','Add GitHub or portfolio URL')}{field('mentor','Assigned mentor / role','Faculty mentor / Project contributor')}
    </div></Panel>
    <Panel title="Public profile controls"><div id="profile-visibility" className="stacked-lines"><label className="check-row"><input type="checkbox" checked={profile.publicConsent} onChange={e=>update('publicConsent',e.target.checked)}/> Request publication of my profile · Off by default</label><p>Public preview: name, programme/year, bio, approved skills and contributions.</p><p>Always private: register number, email, contact details, feedback and evidence.</p><p>Publishing requires your consent and coordinator approval.</p></div></Panel>
    <Panel title="Protected information"><div className="stacked-lines" id="profile-protected"><p className="text-muted">Register number and membership status require admin review.</p><p><Pill kind="success">Approved member</Pill></p><Btn secondary onClick={()=>setCorrection(true)}>Request correction</Btn>{correction&&<p className="inline-success">Correction request noted locally. Coordinator workflow requires a backend.</p>}</div></Panel>
    <div className="page-actions"><Btn onClick={()=>{localStorage.setItem('pec-profile',JSON.stringify(profile));setSaved(true);}}>Save profile</Btn>{saved&&<span className="inline-success"><CheckCircle2 size={15}/> Saved in this browser</span>}</div><Footnote />
  </>;
}
function ExtraPage({route,navigate,onNoticeRead,notices}: {route:Route;navigate:(route:Route)=>void;onNoticeRead:(i:number)=>void;notices:Notice[]}) {
  const [contribution,setContribution]=useState({title:'',description:'',link:''});
  const [submitted,setSubmitted]=useState(false);
  const [weekUpdate,setWeekUpdate]=useState('');
  const [weekSaved,setWeekSaved]=useState(false);
  if(route==='notifications')return <><Headline category="student" title="Notifications" subtitle="Team updates, reviews and verification activity."/><Panel title="Notification center"><div className="notification-list">{notices.map((n,i)=><button onClick={()=>onNoticeRead(i)} className={`notification-item ${n.read?'notice-read':''}`} key={n.title}><Bell size={17}/><span><b>{n.title}</b><small>{n.description}</small></span><time>{n.date}</time></button>)}</div></Panel><Footnote/></>;
  if(route==='projects')return <><Headline category="student" title="Projects & tasks" subtitle="Track milestones and collaborate on meaningful FinTech prototypes."/>
    <div className="card-grid two-col">{projects.map(p=><article className="panel extra-project" key={p.name}><Pill kind={p.status==='In progress'?'success':'danger'}>{p.status}</Pill><h2>{p.name}</h2><p>{p.description}</p><p className="text-muted">Next milestone: {p.next}</p><Btn secondary onClick={()=>navigate('weekly')}>Open weekly update <ArrowUpRight size={14}/></Btn></article>)}</div><Footnote/></>;
  if(route==='contributions')return <><Headline category="student" title="Contributions" subtitle="Document the work you have completed and attach evidence for review."/>
    <Panel title="Submit a contribution"><form className="contribution-form" onSubmit={e=>{e.preventDefault();const all=getSaved<Array<typeof contribution>>('pec-contributions',[]);localStorage.setItem('pec-contributions',JSON.stringify([contribution,...all]));setSubmitted(true);setContribution({title:'',description:'',link:''});}}>
      <TextField label="Contribution title" value={contribution.title} onChange={v=>setContribution({...contribution,title:v})} placeholder="e.g. Data-cleaning notebook" required/>
      <TextField label="Description" value={contribution.description} onChange={v=>setContribution({...contribution,description:v})} placeholder="What did you complete?" required/>
      <TextField label="Evidence link" value={contribution.link} onChange={v=>setContribution({...contribution,link:v})} placeholder="https://github.com/..." />
      <Btn type="submit" disabled={!contribution.title.trim()||!contribution.description.trim()}>Submit for review</Btn>{submitted&&<p className="inline-success">Contribution saved locally (demo). Coordinator review requires an API.</p>}
    </form></Panel><Panel title="Recent contributions"><div className="stacked-lines"><p>CON-014 · Data-cleaning notebook · Verified</p><p>CON-013 · Payment analytics validation · Under review</p></div></Panel><Footnote/></>;
  if(route==='weekly')return <><Headline category="student" title="Weekly updates" subtitle="Share progress, blockers and next steps with your assigned mentor."/>
    <Panel title="Week of 05–11 October 2026"><div className="stacked-lines"><p><Pill kind="danger">Revision required</Pill></p><p><strong>Priority:</strong> AI expense categorization prototype</p><p>Finish the classification flow and attach evidence of edge-case tests.</p><p><strong>Mentor feedback:</strong> Clarify category boundaries before the next review.</p></div></Panel>
    <Panel title="Revise your weekly update"><label className="field"><span className="field-title">Progress and test evidence</span><textarea placeholder="Describe your completed work, tests and remaining blockers..." rows={6} value={weekUpdate} onChange={e=>{setWeekUpdate(e.target.value);setWeekSaved(false)}} /></label><div className="top-spaced"><Btn disabled={!weekUpdate.trim()} onClick={()=>{localStorage.setItem('pec-week-update',weekUpdate);setWeekSaved(true);}}>Save revision</Btn>{weekSaved&&<span className="inline-success"> Revision saved locally</span>}</div></Panel><Footnote/></>;
  if(route==='history')return <><Headline category="student" title="Activity history" subtitle="A chronological view of your project contributions and review status."/><Panel title="Recent activity"><div className="stacked-lines"><p>11 Oct · CON-014 · Verified · Data-cleaning notebook accepted.</p><p>10 Oct · WK-006 · Revision required · Add test output.</p><p>08 Oct · Hackathon certificate · Under review.</p></div></Panel><Footnote/></>;
  if (route === "hackathons" || route === "certificates") return <CertificateManagement />;
  if(route==='magazine')return <><Headline category="community" title="FinTech Innovation Monthly" subtitle="Student stories, project highlights and approved magazine editions."/><Panel title="Magazine archive"><BookOpen size={30} color="var(--maroon)"/><p className="top-spaced">Magazine issues will appear here after editorial approval. No published issues are connected in this frontend demo.</p><Btn secondary onClick={()=>navigate('home')}>Back to public hub <ArrowRight size={14}/></Btn></Panel><Footnote/></>;
  return null;
}

function CertificateManagement() {
  const [studentName, setStudentName] = useState('');
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetch('/api/certificates', { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => null) as { message?: string } | null;
          throw new Error(body?.message || `Unable to load certificates (${response.status}).`);
        }
        return response.json() as Promise<Certificate[]>;
      })
      .then(setCertificates)
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load certificates.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [reload]);

  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!studentName.trim() || !title.trim() || !file) {
      setError('Enter the student name and certificate name, then select a file.');
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData();
    formData.append('student_name', studentName.trim());
    formData.append('certificate_name', title.trim());
    formData.append('certificate', file);
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/certificates', { method: 'POST', body: formData });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(body?.message || `Upload failed (${response.status}).`);
      }
      const certificate: Certificate = await response.json();
      setCertificates((previous) => [certificate, ...previous]);
      setStudentName('');
      setTitle('');
      setFile(null);
      form.reset();
      setSuccess('Certificate uploaded and submitted for review.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Certificate upload failed.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <Headline
        category="student"
        title="Certificate Management"
        subtitle="Upload certificates and track their verification status."
      />

      <Panel title="Upload Certificate">
        <form onSubmit={handleUpload} className="contribution-form">
          <label className="field">
            Student name
            <input
              required
              maxLength={150}
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter the certificate holder's name"
            />
          </label>

          <label className="field">
            Certificate name
            <input
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Hackathon Certificate"
            />
          </label>

          <label className="field">
            Certificate file (PDF or image)
            <input
              required
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <span className="text-muted">PDF, PNG or JPEG · Maximum 5 MB</span>
          </label>

          <Btn type="submit" disabled={uploading}>{uploading ? 'Uploading…' : 'Upload Certificate'}</Btn>
          {error && <p className="form-feedback form-error" role="alert">{error}</p>}
          {success && <p className="form-feedback inline-success" role="status">{success}</p>}
        </form>
      </Panel>

      <Panel title="Certificate Records">
        {loading ? (
          <p role="status">Loading certificates…</p>
        ) : error ? (
          <div className="stacked-lines">
            <p>Certificates could not be loaded. {error}</p>
            <Btn secondary onClick={() => setReload((attempt) => attempt + 1)}>Retry</Btn>
          </div>
        ) : certificates.length === 0 ? (
          <p>No certificates uploaded yet.</p>
        ) : (
          <div className="stacked-lines certificate-list">
            {certificates.map((certificate) => (
              <div key={certificate.id}>
                <h3>{certificate.certificate_name}</h3>
                <p>{certificate.student_name} · {certificate.file_name}</p>
                <Pill kind={certificate.status === 'Verified' ? 'success' : 'neutral'}>{certificate.status}</Pill>
                <time dateTime={certificate.uploaded_at}>{new Date(certificate.uploaded_at).toLocaleDateString()}</time>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <p className="footnote">FINTECH INNOVATION TEAM&nbsp; • &nbsp;PRATHYUSHA ENGINEERING COLLEGE</p>
    </>
  );
}

export default function App() {
  const [route,setRoute]=useState<Route>(readHash);
  const [role,setRole]=useState<Role>(()=>getSaved('pec-role',isStudentRoute(readHash())?'student':'applicant'));
  const [application,setApplication]=useState<Application|null>(()=>getSaved('pec-submitted-application',null));
  const [submitted,setSubmitted]=useState<boolean>(()=>getSaved('pec-submitted-flag',false));
  const [notices,setNotices]=useState<Notice[]>(()=>getSaved('pec-notices',initialNotices));
  const [mobileOpen,setMobileOpen]=useState(false);
  const [toast,setToast]=useState('');
  useEffect(()=>{const fn=()=>{const r=readHash();setRoute(r);setRole(isStudentRoute(r)?'student':'applicant');};window.addEventListener('hashchange',fn);return ()=>window.removeEventListener('hashchange',fn);},[]);
  useEffect(()=>{localStorage.setItem('pec-role',JSON.stringify(role));},[role]);
  useEffect(()=>{localStorage.setItem('pec-notices',JSON.stringify(notices));},[notices]);
  useEffect(()=>{if(toast){const timer=setTimeout(()=>setToast(''),4500);return ()=>clearTimeout(timer);}},[toast]);
  const navigate=(next:Route)=>{setRole(isStudentRoute(next)?'student':'applicant');setRoute(next);window.location.hash='/'+next;window.scrollTo({top:0,behavior:'smooth'});setMobileOpen(false);};
  const onSubmit=(a:Application)=>{setApplication(a);setSubmitted(true);localStorage.setItem('pec-submitted-application',JSON.stringify(a));localStorage.setItem('pec-submitted-flag','true');setToast('Application saved locally for this demo.');};
  const onRead=(index:number)=>setNotices(old=>old.map((n,i)=>i===index?{...n,read:true}:n));
  const isPublic=route==='home';
  const count=notices.filter(n=>!n.read).length;
  return <div className="app">
    {isPublic ? <Landing navigate={navigate}/> : <>
      <SiteHeader role={role} onNavigate={navigate} noticeCount={count} onNotifications={()=>navigate('notifications')} onRoleSwitch={()=>navigate(role==='student'?'apply':'overview')}/>
      <div className="workspace"><Sidebar role={role} route={route} navigate={navigate} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}/><main className="workspace-content">
        {route==='overview'&&<StudentOverview navigate={navigate}/>}
        {route==='apply'&&<Apply navigate={navigate} onSubmit={onSubmit}/>}
        {route==='status'&&<ApplicationStatus navigate={navigate} application={application} submitted={submitted}/>}
        {route==='profile'&&<ProfilePage/>}
        {!['home','overview','apply','status','profile'].includes(route)&&<ExtraPage route={route} navigate={navigate} onNoticeRead={onRead} notices={notices}/>}
      </main></div>
    </>}
    {toast&&<div className="toast" role="status"><CheckCircle2 size={18}/>{toast}<button aria-label="Dismiss" onClick={()=>setToast('')}><X size={15}/></button></div>}
    <a className="skip-link" href="#root">Back to top</a>
    <div className="screen-reader-status" aria-live="polite">{`Current page: ${route}`}</div>
  </div>;
}
