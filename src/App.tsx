import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import {
  CALENDAR_YEAR, FROM_NAME, IS_DEMO, MEDIA_BUCKET, PERSON_NAME, TYPES,
  emptySurprise, markOpened, nextUnlockText, readDemo, readOpened,
  romanianNow, serverDateToZoned, supabase, todayDoor, unlocked, writeDemo,
  type Surprise, type SurpriseType, type ZonedDate
} from './data';

type Route = 'calendar' | 'admin';
const icons = ['🎀','⭐','🧸','🕯️','🍪','💜','🎄','💌','🔔','☕','🧣','🎁'];
const typeIcon = (type: SurpriseType) => TYPES.find(t => t.value === type)?.icon || '💝';
const empty = (value: string) => !value.trim();

function Icon({ name, size = 20 }: { name: 'lock' | 'unlock' | 'heart' | 'arrow' | 'close' | 'settings' | 'back' | 'check' | 'sparkle'; size?: number }) {
  const paths: Record<typeof name, ReactNode> = {
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    unlock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0"/></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/>,
    arrow: <><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></>,
    close: <><path d="M6 6 18 18"/><path d="M18 6 6 18"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.8 1.8 0 0 1 .4 2l-1 1.7a1.8 1.8 0 0 1-2 .8l-1.2-.5a7.8 7.8 0 0 1-2.1 1.2l-.2 1.3H11l-.2-1.3a7.8 7.8 0 0 1-2.1-1.2l-1.2.5a1.8 1.8 0 0 1-2-.8l-1-1.7a1.8 1.8 0 0 1 .4-2l1-.8a8 8 0 0 1 0-2.4l-1-.8a1.8 1.8 0 0 1-.4-2l1-1.7a1.8 1.8 0 0 1 2-.8l1.2.5a7.8 7.8 0 0 1 2.1-1.2L11 3.5h2.3l.2 1.3a7.8 7.8 0 0 1 2.1 1.2l1.2-.5a1.8 1.8 0 0 1 2 .8l1 1.7a1.8 1.8 0 0 1-.4 2l-1 .8a8 8 0 0 1 0 2.4z"/></>,
    back: <><path d="M19 12H5"/><path d="m11 18-6-6 6-6"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    sparkle: <><path d="m12 2 2 8 8 2-8 2-2 8-2-8-8-2 8-2 2-8Z"/></>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

function Snowfall() {
  return <div className="snowfield" aria-hidden="true">{Array.from({length: 29}, (_, index) => <span
    key={index}
    style={{left: `${(index * 37.9) % 100}%`, animationDelay: `${-(index * .73) % 14}s`, animationDuration: `${12 + (index % 7) * 2.1}s`, fontSize: `${9 + (index % 5) * 3}px`, opacity: .14 + (index % 4) * .11}}
  >{index % 4 === 0 ? '✧' : '❄'}</span>)}</div>;
}

function TreeIllustration() {
  return <svg className="hero-illustration" viewBox="0 0 370 345" fill="none" role="img" aria-label="Brad de Crăciun decorat cu steluțe și cadouri">
    <ellipse cx="193" cy="319" rx="157" ry="15" fill="#170a2a" opacity=".19"/>
    <circle cx="189" cy="166" r="142" fill="#ffffff" opacity=".045"/>
    <path d="M188 20 200 45l27 4-20 18 4 27-23-13-24 13 5-27-20-18 27-4Z" fill="#FFE4A8"/>
    <path d="M186 66c-31 49-58 88-91 126 19-4 29-7 42-12-23 36-45 67-72 98h242c-27-31-49-62-72-98 13 5 23 8 42 12-33-38-60-77-91-126Z" fill="#77A897"/>
    <path d="M186 66c-17 53-29 100-37 141-9 45-22 64-38 71h196c-27-31-49-62-72-98 13 5 23 8 42 12-33-38-60-77-91-126Z" fill="#477969"/>
    <path d="M123 173c41 18 93 18 129-4M103 211c52 27 116 27 167-3M86 252c62 24 139 24 201-3" stroke="#E9C4CE" strokeWidth="5" strokeLinecap="round" strokeDasharray="7 11"/>
    <circle cx="165" cy="141" r="8" fill="#F7CF9E"/><circle cx="221" cy="169" r="9" fill="#DDA2C8"/>
    <circle cx="142" cy="213" r="8" fill="#F6D6A3"/><circle cx="238" cy="227" r="9" fill="#DDB0D2"/>
    <circle cx="190" cy="261" r="8" fill="#F8CF9D"/><circle cx="110" cy="263" r="7" fill="#E3AED7"/>
    <rect x="174" y="279" width="25" height="30" rx="3" fill="#997763"/>
    <rect x="47" y="276" width="69" height="45" rx="8" fill="#E9A8C7"/><rect x="79" y="276" width="10" height="45" fill="#FFF1D6"/><rect x="42" y="270" width="79" height="12" rx="5" fill="#F8C9DF"/>
    <path d="M84 270c-31 0-25-26-11-25 12 0 11 18 11 25Zm0 0c31 0 25-26 11-25-12 0-11 18-11 25Z" stroke="#FFF1D6" strokeWidth="5"/>
    <rect x="257" y="285" width="64" height="37" rx="6" fill="#D5C0E9"/><rect x="284" y="285" width="10" height="37" fill="#FFE1A7"/><rect x="251" y="280" width="76" height="12" rx="5" fill="#ECE0F5"/>
    <path d="M289 280c-22 0-21-21-9-19 8 2 9 13 9 19Zm0 0c22 0 21-21 9-19-8 2-9 13-9 19Z" stroke="#FFE1A7" strokeWidth="4"/>
    {[[49,107],[310,102],[335,173],[32,220],[286,42],[84,53]].map(([x,y],i)=><g key={i} transform={`translate(${x},${y})`} stroke="#FFE6BE" strokeWidth="2" strokeLinecap="round"><path d="M0 -7V7M-7 0H7"/></g>)}
  </svg>;
}

function CardIcon({ day, isOpen }: { day: number; isOpen: boolean }) {
  return <div className={`door-art ${isOpen ? 'door-art--opened' : ''}`}>
    <span className="door-art__spark">✧</span><span className="door-art__emoji">{icons[(day - 1) % icons.length]}</span>
    <span className="door-art__spark door-art__spark--other">✦</span>
  </div>;
}

function SurpriseModal({ surprise, day, imageUrl, onClose }: { surprise?: Surprise; day: number; imageUrl?: string; onClose: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [showGift, setShowGift] = useState(false);
  const result = selected !== null && surprise?.quiz_correct_index === selected;
  useEffect(() => {
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', close); document.body.style.overflow = ''; };
  }, [onClose]);
  return <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="surprise-modal" role="dialog" aria-modal="true" aria-label={`Surpriza din ziua ${day}`}>
      <button className="icon-button modal-close" aria-label="Închide" onClick={onClose}><Icon name="close"/></button>
      <div className="confetti" aria-hidden="true">{Array.from({length: 20}, (_, i) => <i key={i} style={{left:`${(i * 47) % 100}%`, animationDelay:`${i * .1}s`, background: ['#df91bb','#e3c47b','#a88cda','#91c2ba'][i%4]}}/>)}</div>
      <div className="modal-gift-icon" aria-hidden="true">{surprise ? typeIcon(surprise.type) : '💌'}</div>
      <div className="eyebrow dark">ZIUA {String(day).padStart(2,'0')} · DESCHISĂ CU DRAG</div>
      <h2>{surprise?.title || 'Un loc pentru o surpriză 💜'}</h2>
      {surprise?.image_path && imageUrl && <img className="surprise-photo" src={imageUrl} alt={surprise.title || 'Amintire frumoasă'} />}
      <p className="modal-message">{surprise?.message || 'Surpriza acestei zile nu a fost încă pregătită. Revino în curând!'}</p>
      {surprise?.type === 'voucher' && <div className="coupon"><span>💖 CUPON SPECIAL</span><strong>Valabil oricând, fără expirare</strong><small>Termeni și condiții: îmbrățișările sunt obligatorii.</small></div>}
      {surprise?.type === 'quiz' && !!surprise.quiz_question && <div className="quiz">
        <p className="quiz-question">{surprise.quiz_question}</p>
        {surprise.quiz_options.filter(Boolean).map((option,index) => <button key={index} className={`quiz-answer ${selected === index ? 'selected' : ''}`} onClick={()=>setSelected(index)}>{option}</button>)}
        {selected !== null && <p className={`quiz-feedback ${result ? 'correct' : ''}`}>{result ? '🎉 Ai ghicit! Premiul este un pupic.' : '💜 Hmmm, încearcă și alt răspuns!'}</p>}
      </div>}
      {surprise?.type === 'treasure' && <button className="primary-button treasure-button" onClick={()=>setShowGift(v=>!v)}>{showGift ? '🎁 Indiciul tău a fost dezvăluit!' : '🗝️ Am găsit indiciul!'}</button>}
      <div className="modal-footer"><span>Pregătit cu multă iubire</span><span>♡</span></div>
    </div>
  </div>;
}

function Header({ onNavigate, route }: { onNavigate: (route: Route) => void; route: Route }) {
  return <header className="site-header container">
    <button className="logo" onClick={()=>onNavigate('calendar')} aria-label="Acasă">
      <span className="logo-symbol">✦</span><span className="logo-text">Little <i>December</i><span className="logo-dot">.</span></span>
    </button>
    <nav className="top-actions">
      <span className="header-year">DECEMBRIE {CALENDAR_YEAR}</span>
      <button className="header-admin" onClick={()=>onNavigate(route === 'admin' ? 'calendar' : 'admin')}>
        {route === 'admin' ? <><Icon name="back" size={16}/> Înapoi la calendar</> : <><Icon name="settings" size={16}/> Admin</>}
      </button>
    </nav>
  </header>;
}

type AdminProps = {
  items: Surprise[]; isAdmin: boolean; userEmail: string | undefined; error: string;
  onLogin: (email:string, password:string)=>Promise<void>;
  onLogout: ()=>Promise<void>;
  onSave: (value: Surprise)=>Promise<void>;
  onUpload: (file: File, day: number)=>Promise<string>;
  onPreview: (day:number)=>void;
};
function Admin({ items, isAdmin, userEmail, error, onLogin, onLogout, onSave, onUpload, onPreview }: AdminProps) {
  const [day, setDay] = useState(1);
  const [draft, setDraft] = useState<Surprise>(()=>items.find(s=>s.day===1) || emptySurprise(1));
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [notice,setNotice] = useState('');
  const [busy,setBusy] = useState(false);
  const [uploading,setUploading] = useState(false);
  const [savingError,setSavingError] = useState('');

  useEffect(() => { setDraft(items.find(item=>item.day===day) || emptySurprise(day)); }, [day,items]);
  const update = <K extends keyof Surprise>(key: K, value: Surprise[K]) => setDraft(prev=>({...prev,[key]:value}));
  const login = async (event:FormEvent) => {
    event.preventDefault(); setBusy(true);setSavingError('');
    try { await onLogin(email,password); }
    catch (e) { setSavingError(e instanceof Error ? e.message : 'Nu s-a putut autentifica.'); }
    finally { setBusy(false); }
  };
  const save = async (event:FormEvent) => {
    event.preventDefault();setBusy(true);setSavingError('');setNotice('');
    try {
      if (empty(draft.title) || empty(draft.message)) throw new Error('Completează titlul și mesajul surprizei.');
      if (draft.type === 'quiz' && (empty(draft.quiz_question) || draft.quiz_options.some(empty))) throw new Error('Completează întrebarea și toate variantele quiz-ului.');
      await onSave(draft);setNotice(`Surpriza pentru ${day} decembrie a fost salvată! 💜`);
    } catch(e) {setSavingError(e instanceof Error ? e.message : 'Salvarea a eșuat.');}
    finally {setBusy(false);}
  };
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setSavingError('');setNotice('');setUploading(true);
    try { const path = await onUpload(file,day);update('image_path',path);setNotice('Fotografia este încărcată. Apasă „Salvează surpriza” pentru a o păstra.'); }
    catch(e) {setSavingError(e instanceof Error ? e.message : 'Încărcarea a eșuat.');}
    finally {setUploading(false);event.target.value='';}
  };

  if (!isAdmin) return <main className="admin-login container">
    <div className="login-illustration">🔐</div><div className="eyebrow dark">ACCES PRIVAT</div>
    <h1>Atelierul de <em>surprize</em></h1><p>Doar tu poți pregăti ce se ascunde în spatele ușițelor.</p>
    <form className="login-form" onSubmit={login}>
      <label>Email administrator<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="email@exemplu.ro" /></label>
      <label>Parolă<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Parola contului Supabase" /></label>
      {(savingError || error) && <div className="error-note">{savingError || error}</div>}
      <button disabled={busy} className="primary-button" type="submit">{busy ? 'Se verifică…' : 'Intră în panoul secret'} <Icon name="arrow" size={18}/></button>
    </form>
    {userEmail && <div className="error-note">Contul {userEmail} este conectat, dar nu are drepturi de administrator. Adaugă-l în `admin_users` (vezi README).</div>}
  </main>;

  const done = new Set(items.filter(item=>item.title.trim() && item.message.trim()).map(item=>item.day));
  return <main className="admin-main container">
    <div className="admin-heading"><div><div className="eyebrow dark">BACKSTAGE · DOAR PENTRU TINE</div><h1>Atelierul de <em>surprize</em> ✨</h1><p>Tu pregătești magia, ea descoperă câte puțin în fiecare zi.</p></div>
      {!IS_DEMO && <button className="secondary-button" onClick={()=>void onLogout()}>Ieși din cont</button>}
    </div>
    {IS_DEMO && <div className="demo-notice">🧪 <strong>Mod demo local.</strong> Schimbările se păstrează doar în acest browser. Pentru un link real, configurează Supabase conform README.</div>}
    {error && <div className="error-note">{error}</div>}
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-title">UȘIȚELE TALE <span>{done.size}/24 pregătite</span></div>
        <div className="day-picker">{Array.from({length:24},(_,i)=>i+1).map(number=><button
          key={number} className={`day-picker-button ${number===day?'active':''} ${done.has(number)?'has-content':''}`}
          onClick={()=>{setDay(number);setNotice('');setSavingError('');}} aria-label={`Editează ziua ${number}`}>{number}{done.has(number)&&<span>•</span>}</button>)}</div>
        <div className="sidebar-tip">💡 Poți modifica oricând o surpriză. Până în ziua deblocării, ea nu poate vedea conținutul.</div>
        <button className="preview-button" onClick={()=>onPreview(day)}>👀 Vezi calendarul ca în {day} decembrie <Icon name="arrow" size={16}/></button>
      </aside>
      <form className="editor-card" onSubmit={save}>
        <div className="editor-head"><div><span className="editor-kicker">PREGĂTEȘTE SURPRIZA</span><h2>Ziua {String(day).padStart(2,'0')} <span>💌</span></h2></div><span className="editor-status">{done.has(day) ? '✓ pregătită' : '○ necompletată'}</span></div>
        <div className="field"><label htmlFor="surprise-type">Tipul surprizei</label><div className="type-picker">{TYPES.map(t=><button key={t.value} type="button" className={`type-option ${draft.type===t.value?'selected':''}`} onClick={()=>update('type',t.value)}><span>{t.icon}</span><small>{t.label}</small></button>)}</div></div>
        <div className="field"><label htmlFor="surprise-title">Titlu</label><input id="surprise-title" maxLength={90} placeholder="Ex.: Un voucher pentru o seară perfectă" value={draft.title} onChange={e=>update('title',e.target.value)}/></div>
        <div className="field"><label htmlFor="surprise-message">Mesajul tău</label><textarea id="surprise-message" rows={5} placeholder="Scrie aici ce vrei să găsească în spatele ușiței…" value={draft.message} onChange={e=>update('message',e.target.value)} /></div>
        <div className="field"><label>Fotografie (opțională)</label><label className="upload-zone"><input type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} disabled={uploading}/><span className="upload-icon">📷</span><span>{uploading ? 'Se încarcă…' : draft.image_path ? 'Fotografie încărcată · poți alege alta' : 'Apasă pentru a încărca o fotografie'}</span><small>JPG, PNG, WEBP · maximum 5 MB</small></label>{draft.image_path&&<button type="button" className="text-button" onClick={()=>update('image_path',null)}>Elimină fotografia din surpriză</button>}</div>
        {draft.type==='quiz' && <div className="quiz-editor"><div className="field"><label>Întrebarea quiz-ului</label><input value={draft.quiz_question} onChange={e=>update('quiz_question',e.target.value)} placeholder="Ce alegem într-o seară de vineri?" /></div>
          {draft.quiz_options.map((option,index)=><div className="field" key={index}><label>Răspuns {index+1}{index===draft.quiz_correct_index?' · corect ✓':''}</label><div className="answer-editor"><input value={option} onChange={e=>update('quiz_options',draft.quiz_options.map((v,i)=>i===index?e.target.value:v))}/><button type="button" className={`correct-answer ${index===draft.quiz_correct_index?'active':''}`} onClick={()=>update('quiz_correct_index',index)} aria-label={`Marchează răspunsul ${index+1} drept corect`} title="Marchează ca răspuns corect"><Icon name="check" size={16}/></button></div></div>)}
          <p className="field-help">Apasă pe bifa din dreptul răspunsului corect.</p>
        </div>}
        {savingError && <div className="error-note">{savingError}</div>}
        {notice && <div className="success-note">{notice}</div>}
        <div className="editor-actions"><span>💜 O surpriză mică poate face o zi mare.</span><button type="submit" className="primary-button" disabled={busy || uploading}>{busy?'Se salvează…':'Salvează surpriza'} <Icon name="check" size={17}/></button></div>
      </form>
    </div>
  </main>;
}

export default function App() {
  const [route,setRoute] = useState<Route>(location.hash.startsWith('#admin') ? 'admin' : 'calendar');
  const [items,setItems] = useState<Surprise[]>(IS_DEMO ? readDemo() : []);
  const [images,setImages] = useState<Record<string,string>>({});
  const [opened,setOpened] = useState<number[]>(readOpened());
  const [now,setNow] = useState<ZonedDate>(romanianNow());
  // În producție doar data returnată de PostgreSQL poate debloca o ușiță.
  const [serverDate,setServerDate] = useState<string | null>(null);
  const lastServerDate = useRef<string | null>(null);
  const [previewDay,setPreviewDay] = useState<number | null>(null);
  const [modalDay,setModalDay] = useState<number | null>(null);
  const [authUser,setAuthUser] = useState<string | undefined>();
  const [isAdmin,setIsAdmin] = useState(IS_DEMO);
  const [loading,setLoading] = useState(!IS_DEMO);
  const [error,setError] = useState('');
  const previousDate = useRef(`${now.year}-${now.month}-${now.day}`);

  const reload = useCallback(async () => {
    if (!supabase) { setItems(readDemo());setLoading(false); return; }
    try {
      const { data: serverDay, error: clockError } = await supabase.rpc('advent_server_date');
      if (clockError || typeof serverDay !== 'string' || !serverDateToZoned(serverDay, romanianNow())) {
        throw new Error('Nu putem verifica data cu serverul. Verifică instalarea SQL și conexiunea.');
      }
      lastServerDate.current = serverDay;
      setServerDate(serverDay);
      const { data: auth, error: authError } = await supabase.auth.getUser();
      if (authError && authError.name !== 'AuthSessionMissingError') throw authError;
      setAuthUser(auth.user?.email);
      let admin = false;
      if (auth.user) {
        const { data: role, error: roleError } = await supabase.from('admin_users').select('user_id').eq('user_id',auth.user.id).maybeSingle();
        if (roleError) throw roleError;
        admin = Boolean(role);
      }
      setIsAdmin(admin);
      const { data, error: listError } = await supabase.from('doors').select('*').eq('year',CALENDAR_YEAR).order('day');
      if (listError) throw listError;
      const result = (data || []) as Surprise[];
      setItems(result);
      setError('');
      const resolved = await Promise.all(result.filter(item=>item.image_path).map(async item=>{
        const { data: signed, error: signError } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(item.image_path!,3600);
        return [item.image_path!,signError?'':(signed?.signedUrl||'')] as const;
      }));
      setImages(Object.fromEntries(resolved));
    } catch (e) {
      lastServerDate.current = null; // Reîncearcă încărcarea și după o eroare tranzitorie.
      setServerDate(null);setItems([]);setImages({});
      setError(e instanceof Error ? e.message : 'Eroare la încărcarea calendarului.');
    }
    finally {setLoading(false);}
  },[]);

  useEffect(()=>{
    void reload();
    if (!supabase) return;
    const { data: listener } = supabase.auth.onAuthStateChange(()=>{setTimeout(()=>{void reload();},0);});
    return ()=>listener.subscription.unsubscribe();
  },[reload]);
  useEffect(()=>{
    const change = ()=>setRoute(location.hash.startsWith('#admin')?'admin':'calendar');
    addEventListener('hashchange',change);
    return ()=>removeEventListener('hashchange',change);
  },[]);
  useEffect(()=>{
    const timer = setInterval(()=>{
      const current=romanianNow();setNow(current);
      const dateKey=`${current.year}-${current.month}-${current.day}`;
      if (dateKey!==previousDate.current) {previousDate.current=dateKey;if (IS_DEMO) void reload();}
    },30000);
    return ()=>clearInterval(timer);
  },[reload]);

  // Sincronizare periodică. Telefonul poate avea o oră falsă; serverul rămâne autoritatea.
  useEffect(() => {
    if (!supabase) return;
    const poll = async () => {
      const { data, error: clockError } = await supabase.rpc('advent_server_date');
      if (clockError || typeof data !== 'string' || !serverDateToZoned(data, romanianNow())) {
        lastServerDate.current = null;
        setServerDate(null); // fail-closed: toate ușile se încuie până revine serverul
        return;
      }
      if (lastServerDate.current !== data) { lastServerDate.current = data; await reload(); }
      else setServerDate(data);
    };
    const timer = window.setInterval(() => { void poll(); }, 15000);
    const onFocus = () => { void poll(); };
    window.addEventListener('focus',onFocus);
    return () => { window.clearInterval(timer); window.removeEventListener('focus',onFocus); };
  },[reload]);

  const go = (r:Route) => {location.hash=r==='admin'?'admin':'calendar';setRoute(r);window.scrollTo({top:0,behavior:'smooth'});};
  const trustedDate = IS_DEMO ? now : (serverDateToZoned(serverDate || '', now) || {year:0,month:1,day:1,hour:0,minute:0,second:0});
  const testDate:ZonedDate = previewDay!==null && isAdmin ? {year:CALENDAR_YEAR,month:12,day:previewDay,hour:12,minute:0,second:0}:trustedDate;
  const available = useMemo(()=>Array.from({length:24},(_,i)=>i+1).filter(day=>unlocked(day,testDate)),[testDate.year,testDate.month,testDate.day]);
  const today = todayDoor(testDate);
  const openedAvailable = opened.filter(day=>available.includes(day)).length;
  const progress = Math.round(openedAvailable / 24 * 100);
  const openDoor = (day:number) => {
    if (!unlocked(day,testDate)) return;
    setModalDay(day);
    setOpened(markOpened(day));
  };
  const login = async (email:string,password:string) => {
    if (!supabase) return;
    const {error:loginError} = await supabase.auth.signInWithPassword({email,password});
    if(loginError) throw loginError;
    await reload();
  };
  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();setPreviewDay(null);await reload();
  };
  const save = async (item:Surprise) => {
    if (supabase) {
      if (!isAdmin) throw new Error('Nu ai drepturi de administrator.');
      const { error:saveError } = await supabase.from('doors').upsert(item,{onConflict:'year,day'});
      if(saveError) throw saveError;
      await reload();
    } else {const next = [...items.filter(s=>s.day!==item.day),item].sort((a,b)=>a.day-b.day);writeDemo(next);setItems(next);}
  };
  const upload = async (file:File,day:number):Promise<string> => {
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Alege o imagine JPG, PNG sau WEBP.');
    if(file.size>5*1024*1024) throw new Error('Fotografia nu poate depăși 5 MB.');
    if(supabase) {
      if(!isAdmin) throw new Error('Nu ai drepturi de administrator.');
      const extension=file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path=`${CALENDAR_YEAR}/day-${day}/${crypto.randomUUID()}.${extension}`;
      const { error:uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path,file,{upsert:false,contentType:file.type});
      if(uploadError) throw uploadError;
      const {data:signed,error:signError}=await supabase.storage.from(MEDIA_BUCKET).createSignedUrl(path,3600);
      if(signError) throw signError;
      setImages(prev=>({...prev,[path]:signed.signedUrl}));
      return path;
    }
    if(file.size>1024*1024) throw new Error('În modul demo local, fotografia trebuie să fie sub 1 MB.');
    return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>{const data=String(reader.result);setImages(prev=>({...prev,[data]:data}));resolve(data);};reader.onerror=()=>reject(new Error('Imaginea nu poate fi citită.'));reader.readAsDataURL(file);});
  };

  return <><Snowfall/><Header route={route} onNavigate={go}/>
    {route==='admin' ? <Admin items={items} isAdmin={isAdmin} userEmail={authUser} error={error} onLogin={login} onLogout={logout} onSave={save} onUpload={upload} onPreview={day=>{setPreviewDay(day);go('calendar');}}/> : <main>
      {IS_DEMO && <div className="demo-ribbon container">🧪 Demo local · Surprizele se salvează doar pe acest dispozitiv. <button onClick={()=>go('admin')}>Editează-le aici →</button></div>}
      {previewDay!==null && isAdmin && <div className="preview-ribbon container"><span>👀 MOD PREVIZUALIZARE · {previewDay} DECEMBRIE</span><button onClick={()=>setPreviewDay(null)}>Ieși din preview ✕</button></div>}
      <section className="hero container">
        <div className="hero-copy">
          <div className="hero-pill"><span className="pill-star">✦</span> UN DECEMBRIE DOAR AL NOSTRU</div>
          <h1>24 de zile.<br/><em>24 de zâmbete.</em></h1>
          <p>Pentru {PERSON_NAME}: câte un strop de magie, o amintire sau o surpriză, în fiecare zi până la Crăciun. <span>♡</span></p>
          <div className="hero-countdown"><span className="countdown-spark">✧</span><div><small>NUMĂRĂTOAREA INVERSĂ</small><strong>{!IS_DEMO && !serverDate && previewDay===null ? "Verificăm data în siguranță…" : nextUnlockText(testDate)}</strong></div></div>
        </div>
        <TreeIllustration/>
        <div className="hero-stars" aria-hidden="true"><span>✦</span><span>✧</span><span>✦</span><span>✧</span></div>
      </section>
      <section className="calendar-section container" aria-label="Calendarul Advent">
        <div className="calendar-topline"><div><div className="eyebrow dark"><span>✦</span> UN CADOU PE ZI</div><h2>Calendarul nostru <em>magic</em></h2><p>Fiecare ușiță își deschide secretul doar când îi vine ziua. <span>Nu trișa! 😉</span></p></div>
          <div className="progress-box"><div className="progress-info"><span>💜 Surprize descoperite</span><strong>{openedAvailable} <small>/ 24</small></strong></div><div className="progress-track"><div className="progress-fill" style={{width:`${progress}%`}}/></div></div></div>
        {loading ? <div className="loading-calendar">Se pregătește magia… ✨</div> : <>
          {!IS_DEMO && !serverDate && !error && <div className="error-note">Conexiunea cu serverul de timp este indisponibilă. Ușile rămân închise până la reconectare.</div>}
          {error && <div className="error-note">Nu am putut încărca surprizele: {error}. Verifică configurarea din README.</div>}
          <div className="doors-grid">{Array.from({length:24},(_,i)=>i+1).map(day=>{
            const open=available.includes(day);
            const seen=opened.includes(day);
            const isToday=today===day;
            return <button key={day} className={`door-card door-card--${(day-1)%6} ${open?'door-card--available':'door-card--locked'} ${seen?'door-card--seen':''} ${isToday?'door-card--today':''}`} onClick={()=>openDoor(day)} aria-label={`Ziua ${day}: ${open?'deschide surpriza':'încuiată până pe '+day+' decembrie'}`}>
              <span className="door-card__top"><span>{String(day).padStart(2,'0')}</span>{isToday?<span className="today-tag">AZI ♡</span>:seen?<span className="seen-tag"><Icon name="check" size={14}/></span>:<span className="tiny-star">✧</span>}</span>
              <CardIcon day={day} isOpen={open}/>
              <span className="door-card__bottom"><span>{seen?'Redeschide':open?'Deschide surpriza':'Se deschide pe '+day+' dec.'}</span><span className="lock-circle"><Icon name={open?'arrow':'lock'} size={16}/></span></span>
            </button>;
          })}</div>
        </>}
      </section>
      <section className="footnote container"><span className="footnote-heart">♡</span><p>Unele lucruri frumoase merită așteptate.<br/><strong>Deschide câte o ușiță pe zi.</strong></p><span className="footnote-heart">♡</span></section>
    </main>}
    <footer className="site-footer container"><span>Făcut cu <b>♥</b> și un pic de magie.</span><span>{FROM_NAME} · {CALENDAR_YEAR}</span></footer>
    {modalDay!==null && <SurpriseModal key={modalDay} day={modalDay} surprise={items.find(item=>item.day===modalDay)} imageUrl={items.find(item=>item.day===modalDay)?.image_path ? images[items.find(item=>item.day===modalDay)!.image_path!] || (IS_DEMO ? items.find(item=>item.day===modalDay)!.image_path! : undefined) : undefined} onClose={()=>setModalDay(null)}/>}
  </>;
}
