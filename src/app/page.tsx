"use client";
 
import { useState, useEffect, useCallback, useRef } from "react";
import {
  LayoutDashboard, Users, Clock, Mail, Building2, ChevronRight,
  ArrowLeft, Search, TrendingUp, UserPlus, MessageSquare,
  AlertTriangle, Phone, FileText, Zap, ChevronDown, Menu, X,
  Circle, Loader2, RefreshCw, Inbox, Plus, StickyNote, AlertCircle,
  Filter, Pencil, Trash2, Sparkles, Brain,
} from "lucide-react";
 
// ── Types ──────────────────────────────────────────────
interface CustomerSummary { id: number; name: string; email: string; companyName: string; createdAt: string; lastEvent: { date: string; title: string; type: string } | null; eventCount: number; emailCount: number; }
interface EventAnalysis { priority: number; categories: string[]; summary: string; suggestedReply: string; reason: string; }
interface EventItem { id: number; type: string; level: string; title: string; description: string; date: string; emailSubject: string | null; emailBody: string | null; emailFrom: string | null; analysis: EventAnalysis | null; }
interface CustomerDetail { id: number; name: string; email: string; companyName: string; createdAt: string; eventCount: number; emailCount: number; events: EventItem[]; }
interface NeedsAttention { id: number; name: string; companyName: string; lastEventDate: string; lastEventTitle: string; eventCount: number; }
interface Stats { customerCount: number; emailCount: number; eventCount: number; recentEvents: { id: number; type: string; level: string; title: string; date: string; customerId: number; customerName: string; customerCompany: string; priority: number; categories: string[]; }[]; needsAttention: NeedsAttention[]; }
interface SearchResults { customers: any[]; emails: any[]; events: any[]; }
interface InsightItem { color: string; title: string; description: string; }
 
// ── Helpers ──────────────────────────────────────────────
function eventColor(t: string) { return ({ SERVICE_INQUIRY:"#2563EB",SALES_INQUIRY:"#16A34A",COMPLAINT:"#EF4444",INVOICE_INQUIRY:"#F59E0B",PARTNERSHIP_INQUIRY:"#7C3AED",JOB_APPLICATION:"#6B7280",FOLLOW_UP:"#3B82F6",QUESTION:"#64748B",GENERAL:"#94A3B8",NOTE:"#F97316" } as any)[t]||"#94A3B8"; }
function eventIconComponent(t: string) { return ({ SERVICE_INQUIRY:Zap,SALES_INQUIRY:TrendingUp,COMPLAINT:AlertTriangle,INVOICE_INQUIRY:FileText,PARTNERSHIP_INQUIRY:Building2,JOB_APPLICATION:UserPlus,FOLLOW_UP:Phone,QUESTION:MessageSquare,GENERAL:Circle,NOTE:StickyNote } as any)[t]||Circle; }
function eventLabel(t: string) { return ({ SERVICE_INQUIRY:"Zainteresowanie usługą",SALES_INQUIRY:"Szansa sprzedażowa",COMPLAINT:"Reklamacja",INVOICE_INQUIRY:"Faktura",PARTNERSHIP_INQUIRY:"Współpraca",JOB_APPLICATION:"Aplikacja",FOLLOW_UP:"Kontynuacja",QUESTION:"Pytanie",GENERAL:"Ogólne",NOTE:"Notatka" } as any)[t]||t; }
function priorityBadge(p: number) { return ({ 1:{label:"Pilne",bg:"#FEE2E2",text:"#DC2626"},2:{label:"Ważne",bg:"#DBEAFE",text:"#2563EB"},3:{label:"Normalne",bg:"#F1F5F9",text:"#475569"},4:{label:"Niskie",bg:"#F8FAFC",text:"#94A3B8"} } as any)[p]||{label:"Normalne",bg:"#F1F5F9",text:"#475569"}; }
function formatDate(d: string) { return new Date(d).toLocaleDateString("pl-PL",{day:"2-digit",month:"2-digit",year:"numeric"}); }
function formatDateShort(d: string) { return new Date(d).toLocaleDateString("pl-PL",{day:"2-digit",month:"2-digit"}); }
function getInitials(n: string) { return n.split(" ").map(x=>x[0]).join("").toUpperCase().slice(0,2)||"?"; }
function daysAgo(d: string) { const x=Math.floor((Date.now()-new Date(d).getTime())/86400000); return x===0?"Dzisiaj":x===1?"Wczoraj":x+" dni temu"; }
 
// ── Shared Components ──────────────────────────────────
function FadeIn({children,delay=0,className=""}:{children:React.ReactNode;delay?:number;className?:string}) { const[v,setV]=useState(false); useEffect(()=>{const t=setTimeout(()=>setV(true),delay);return()=>clearTimeout(t)},[delay]); return <div className={className} style={{opacity:v?1:0,transform:v?"translateY(0)":"translateY(12px)",transition:"opacity 0.4s ease, transform 0.4s ease"}}>{children}</div>; }
function EmptyState({icon:Icon,title,description}:{icon:any;title:string;description:string}) { return <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"60px 24px"}}><div style={{width:64,height:64,borderRadius:16,background:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:16}}><Icon size={28} color="#CBD5E1"/></div><div style={{fontSize:16,fontWeight:600,color:"#64748B",marginBottom:4}}>{title}</div><div style={{fontSize:13,color:"#94A3B8",textAlign:"center",maxWidth:320}}>{description}</div></div>; }
function Toast({message,onClose}:{message:string;onClose:()=>void}) { useEffect(()=>{const t=setTimeout(onClose,3000);return()=>clearTimeout(t)},[onClose]); return <div style={{position:"fixed",bottom:24,right:24,background:"#0F172A",color:"#fff",padding:"12px 20px",borderRadius:10,fontSize:13,fontWeight:500,zIndex:100,boxShadow:"0 8px 32px rgba(0,0,0,0.2)",animation:"slideUp 0.3s ease"}}>{message}<style>{`@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style></div>; }
 
function ConfirmDialog({title,message,onConfirm,onCancel,danger=false}:{title:string;message:string;onConfirm:()=>void;onCancel:()=>void;danger?:boolean}) {
  return <div style={{position:"fixed",inset:0,zIndex:70,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.4)"}} onClick={onCancel}/>
    <div style={{position:"relative",zIndex:71,background:"#fff",borderRadius:16,padding:24,width:"100%",maxWidth:400,boxShadow:"0 20px 60px rgba(0,0,0,0.15)",animation:"slideUp 0.25s ease"}}>
      <h3 style={{margin:"0 0 8px",fontSize:18,fontWeight:700,color:"#0F172A"}}>{title}</h3>
      <p style={{margin:"0 0 20px",fontSize:14,color:"#64748B",lineHeight:1.5}}>{message}</p>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onCancel} style={{padding:"10px 20px",borderRadius:10,border:"1px solid #E2E8F0",background:"#fff",color:"#475569",fontSize:14,fontWeight:500,cursor:"pointer"}}>Anuluj</button>
        <button onClick={onConfirm} style={{padding:"10px 20px",borderRadius:10,border:"none",background:danger?"#EF4444":"#2563EB",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer"}}>{danger?"Usuń":"Potwierdź"}</button>
      </div>
    </div>
  </div>;
}
 
function FormModal({title,fields,onSave,onClose,saveLabel="Zapisz"}:{title:string;fields:{key:string;label:string;value:string;required?:boolean;type?:string}[];onSave:(vals:Record<string,string>)=>void;onClose:()=>void;saveLabel?:string}) {
  const[vals,setVals]=useState<Record<string,string>>(Object.fromEntries(fields.map(f=>[f.key,f.value])));
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState("");
  const canSave=fields.filter(f=>f.required).every(f=>vals[f.key]?.trim());
  async function handleSave(){ if(!canSave)return; setSaving(true); setError(""); try{ await onSave(vals); }catch(e:any){ setError(e.message||"Błąd"); setSaving(false); } }
  return <div style={{position:"fixed",inset:0,zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.4)"}} onClick={onClose}/>
    <div style={{position:"relative",zIndex:61,background:"#fff",borderRadius:16,padding:24,width:"100%",maxWidth:480,boxShadow:"0 20px 60px rgba(0,0,0,0.15)",animation:"slideUp 0.25s ease"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <h3 style={{margin:0,fontSize:18,fontWeight:700,color:"#0F172A"}}>{title}</h3>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8",padding:4}}><X size={20}/></button>
      </div>
      {fields.map(f=><div key={f.key} style={{marginBottom:16}}>
        <label style={{display:"block",fontSize:13,fontWeight:600,color:"#475569",marginBottom:6}}>{f.label}{f.required&&" *"}</label>
        <input type={f.type||"text"} value={vals[f.key]} onChange={e=>setVals({...vals,[f.key]:e.target.value})} style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid #E2E8F0",fontSize:14,color:"#0F172A",outline:"none",boxSizing:"border-box"}} onFocus={e=>e.currentTarget.style.borderColor="#2563EB"} onBlur={e=>e.currentTarget.style.borderColor="#E2E8F0"}/>
      </div>)}
      {error&&<div style={{color:"#EF4444",fontSize:13,marginBottom:12}}>{error}</div>}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{padding:"10px 20px",borderRadius:10,border:"1px solid #E2E8F0",background:"#fff",color:"#475569",fontSize:14,fontWeight:500,cursor:"pointer"}}>Anuluj</button>
        <button onClick={handleSave} disabled={!canSave||saving} style={{padding:"10px 20px",borderRadius:10,border:"none",background:canSave?"#2563EB":"#94A3B8",color:"#fff",fontSize:14,fontWeight:600,cursor:canSave?"pointer":"default",opacity:saving?0.7:1}}>{saving?"Zapisuję...":saveLabel}</button>
      </div>
    </div>
  </div>;
}
 
// ── Sidebar ──────────────────────────────────────────────
function Sidebar({currentView,onNavigate,mobileOpen,onCloseMobile}:{currentView:string;onNavigate:(v:string)=>void;mobileOpen:boolean;onCloseMobile:()=>void}) {
  const items=[{id:"dashboard",label:"Dashboard",icon:LayoutDashboard},{id:"customers",label:"Klienci",icon:Users}];
  const content=<div style={{width:260,height:"100%",background:"#0F172A",display:"flex",flexDirection:"column",color:"#CBD5E1"}}>
    <div style={{padding:"24px 20px",borderBottom:"1px solid #1E293B",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,borderRadius:10,background:"linear-gradient(135deg,#2563EB,#3B82F6)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#fff",letterSpacing:1}}>AX</div><div><div style={{fontWeight:700,fontSize:16,color:"#F8FAFC",letterSpacing:0.5}}>AXIVO</div><div style={{fontSize:11,color:"#64748B",marginTop:-2}}>CRM</div></div></div>
      {mobileOpen&&<button onClick={onCloseMobile} style={{background:"none",border:"none",color:"#64748B",cursor:"pointer",padding:4}}><X size={20}/></button>}
    </div>
    <nav style={{padding:"16px 12px",flex:1}}>
      <div style={{fontSize:10,fontWeight:600,textTransform:"uppercase",letterSpacing:1.5,color:"#475569",padding:"8px 12px",marginBottom:4}}>Menu</div>
      {items.map(item=>{const active=currentView===item.id||(currentView==="customer-detail"&&item.id==="customers");const Icon=item.icon;return <button key={item.id} onClick={()=>{onNavigate(item.id);onCloseMobile();}} style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"10px 12px",border:"none",borderRadius:8,background:active?"#1E293B":"transparent",color:active?"#F8FAFC":"#94A3B8",cursor:"pointer",fontSize:14,fontWeight:active?600:400,transition:"all 0.2s",marginBottom:2,textAlign:"left"}} onMouseEnter={e=>{if(!active)e.currentTarget.style.background="#1E293B80"}} onMouseLeave={e=>{if(!active)e.currentTarget.style.background=active?"#1E293B":"transparent"}}><Icon size={18}/>{item.label}</button>;})}
    </nav>
    <div style={{padding:"16px 12px",borderTop:"1px solid #1E293B"}}><div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px"}}><div style={{width:32,height:32,borderRadius:"50%",background:"#1E293B",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:600,color:"#94A3B8"}}>FG</div><div><div style={{fontSize:13,fontWeight:500,color:"#E2E8F0"}}>Franciszek</div><div style={{fontSize:11,color:"#64748B"}}>Admin</div></div></div></div>
  </div>;
  return <>
    <div className="sidebar-desktop" style={{display:"none"}}>{content}</div>
    {mobileOpen&&<div style={{position:"fixed",inset:0,zIndex:50,display:"flex"}}><div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.5)"}} onClick={onCloseMobile}/><div style={{position:"relative",zIndex:51}}>{content}</div></div>}
    <style>{`@media(min-width:768px){.sidebar-desktop{display:block!important}}`}</style>
  </>;
}
 
// ── TopBar with Global Search ──────────────────────────────
function TopBar({title,onMenuClick,onRefresh,loading,onSelectCustomer}:{title:string;onMenuClick:()=>void;onRefresh:()=>void;loading:boolean;onSelectCustomer:(id:number)=>void}) {
  const[q,setQ]=useState("");
  const[results,setResults]=useState<SearchResults|null>(null);
  const[showResults,setShowResults]=useState(false);
  const ref=useRef<HTMLDivElement>(null);
  const timer=useRef<any>(null);
 
  useEffect(()=>{
    if(q.length<2){setResults(null);return;}
    clearTimeout(timer.current);
    timer.current=setTimeout(()=>{
      fetch(`/api/search?q=${encodeURIComponent(q)}`).then(r=>r.json()).then(d=>{setResults(d);setShowResults(true)}).catch(()=>{});
    },300);
  },[q]);
 
  useEffect(()=>{
    function handleClick(e:MouseEvent){if(ref.current&&!ref.current.contains(e.target as Node))setShowResults(false)}
    document.addEventListener("mousedown",handleClick);return()=>document.removeEventListener("mousedown",handleClick);
  },[]);
 
  const totalResults=(results?.customers?.length||0)+(results?.emails?.length||0)+(results?.events?.length||0);
 
  return <div style={{height:64,borderBottom:"1px solid #E2E8F0",background:"#fff",display:"flex",alignItems:"center",padding:"0 24px",gap:16}}>
    <button onClick={onMenuClick} className="mobile-menu-btn" style={{display:"none",background:"none",border:"none",color:"#475569",cursor:"pointer",padding:4}}><Menu size={22}/></button>
    <h1 style={{fontSize:20,fontWeight:700,color:"#0F172A",margin:0,whiteSpace:"nowrap"}}>{title}</h1>
 
    {/* Global search */}
    <div ref={ref} style={{flex:1,maxWidth:400,position:"relative",marginLeft:16}}>
      <div style={{display:"flex",alignItems:"center",gap:8,background:"#F1F5F9",borderRadius:10,padding:"0 12px"}}>
        <Search size={15} color="#94A3B8"/>
        <input type="text" placeholder="Szukaj..." value={q} onChange={e=>setQ(e.target.value)} onFocus={()=>{if(results)setShowResults(true)}}
          style={{flex:1,border:"none",outline:"none",padding:"9px 0",fontSize:13,color:"#0F172A",background:"transparent"}}/>
        {q&&<button onClick={()=>{setQ("");setResults(null)}} style={{background:"none",border:"none",cursor:"pointer",color:"#94A3B8",padding:2}}><X size={14}/></button>}
      </div>
      {showResults&&results&&totalResults>0&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,marginTop:4,background:"#fff",borderRadius:12,border:"1px solid #E2E8F0",boxShadow:"0 8px 32px rgba(0,0,0,0.12)",maxHeight:360,overflow:"auto",zIndex:40}}>
          {results.customers.length>0&&<><div style={{padding:"8px 14px",fontSize:10,fontWeight:600,color:"#94A3B8",textTransform:"uppercase",letterSpacing:1}}>Klienci</div>
            {results.customers.map((c:any)=><div key={c.id} onClick={()=>{onSelectCustomer(c.id);setShowResults(false);setQ("")}} style={{padding:"10px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <Users size={14} color="#2563EB"/><div><div style={{fontSize:13,fontWeight:600,color:"#0F172A"}}>{c.name}</div><div style={{fontSize:11,color:"#94A3B8"}}>{c.companyName||c.email}</div></div>
            </div>)}</>}
          {results.emails.length>0&&<><div style={{padding:"8px 14px",fontSize:10,fontWeight:600,color:"#94A3B8",textTransform:"uppercase",letterSpacing:1,borderTop:"1px solid #F1F5F9"}}>E-maile</div>
            {results.emails.map((e:any)=><div key={e.id} onClick={()=>{onSelectCustomer(e.customerId);setShowResults(false);setQ("")}} style={{padding:"10px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"background 0.15s"}} onMouseEnter={ev=>ev.currentTarget.style.background="#F8FAFC"} onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
              <Mail size={14} color="#16A34A"/><div><div style={{fontSize:13,fontWeight:600,color:"#0F172A"}}>{e.subject}</div><div style={{fontSize:11,color:"#94A3B8"}}>{e.customerName} · {formatDateShort(e.date)}</div></div>
            </div>)}</>}
          {results.events.length>0&&<><div style={{padding:"8px 14px",fontSize:10,fontWeight:600,color:"#94A3B8",textTransform:"uppercase",letterSpacing:1,borderTop:"1px solid #F1F5F9"}}>Wydarzenia</div>
            {results.events.map((e:any)=><div key={e.id} onClick={()=>{onSelectCustomer(e.customerId);setShowResults(false);setQ("")}} style={{padding:"10px 14px",cursor:"pointer",display:"flex",alignItems:"center",gap:10,transition:"background 0.15s"}} onMouseEnter={ev=>ev.currentTarget.style.background="#F8FAFC"} onMouseLeave={ev=>ev.currentTarget.style.background="transparent"}>
              <Clock size={14} color="#7C3AED"/><div><div style={{fontSize:13,fontWeight:600,color:"#0F172A"}}>{e.title}</div><div style={{fontSize:11,color:"#94A3B8"}}>{e.customerName} · {formatDateShort(e.date)}</div></div>
            </div>)}</>}
        </div>
      )}
    </div>
 
    <button onClick={onRefresh} style={{width:36,height:36,borderRadius:10,background:"#F1F5F9",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",border:"none",transition:"background 0.2s",flexShrink:0}} onMouseEnter={e=>e.currentTarget.style.background="#E2E8F0"} onMouseLeave={e=>e.currentTarget.style.background="#F1F5F9"}>
      <RefreshCw size={16} color="#475569" style={{animation:loading?"spin 1s linear infinite":"none"}}/>
    </button>
    <style>{`@media(max-width:767px){.mobile-menu-btn{display:block!important}}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
  </div>;
}
 
 
// ── AI Insights Panel ──────────────────────────────────
function AIInsightsPanel({onSelectCustomer}:{onSelectCustomer:(id:number)=>void}) {
  const[insights,setInsights]=useState<InsightItem[]>([]);
  const[loading,setLoading]=useState(false);
  const[loaded,setLoaded]=useState(false);
  const[error,setError]=useState("");
 
  function fetchInsights(){
    setLoading(true);setError("");
    fetch("/api/insights").then(r=>r.json()).then(d=>{
      if(d.error){setError(d.error)}else{setInsights(d.insights||[])}
      setLoaded(true);
    }).catch(()=>setError("Błąd połączenia")).finally(()=>setLoading(false));
  }
 
  const colorStyles:Record<string,{bg:string;border:string;icon:string;label:string}>={
    red:{bg:"#FEF2F2",border:"#FEE2E2",icon:"#EF4444",label:"Pilne"},
    yellow:{bg:"#FFFBEB",border:"#FEF3C7",icon:"#F59E0B",label:"Uwaga"},
    green:{bg:"#F0FDF4",border:"#BBF7D0",icon:"#16A34A",label:"Szansa"},
  };
 
  return <div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",overflow:"hidden"}}>
    <div style={{padding:"16px 20px",borderBottom:"1px solid #F1F5F9",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:28,height:28,borderRadius:8,background:"linear-gradient(135deg,#7C3AED,#2563EB)",display:"flex",alignItems:"center",justifyContent:"center"}}><Brain size={14} color="#fff"/></div>
        <span style={{fontWeight:600,fontSize:15,color:"#0F172A"}}>AI Insights</span>
      </div>
      <button onClick={fetchInsights} disabled={loading} style={{padding:"6px 14px",borderRadius:8,border:"none",background:loading?"#F1F5F9":"linear-gradient(135deg,#7C3AED,#2563EB)",color:loading?"#94A3B8":"#fff",fontSize:12,fontWeight:600,cursor:loading?"default":"pointer",display:"flex",alignItems:"center",gap:5,transition:"opacity 0.2s",opacity:loading?0.7:1}}>
        {loading?<><Loader2 size={13} style={{animation:"spin 1s linear infinite"}}/>Analizuję...</>:<><Sparkles size={13}/>Analizuj</>}
      </button>
    </div>
    <div style={{padding:"16px 20px"}}>
      {!loaded&&!loading&&<div style={{textAlign:"center",padding:"24px 16px",color:"#94A3B8"}}>
        <Brain size={32} color="#E2E8F0" style={{marginBottom:8}}/>
        <div style={{fontSize:13}}>Kliknij „Analizuj" żeby AI przeanalizowało twoich klientów</div>
      </div>}
      {error&&<div style={{padding:12,borderRadius:8,background:"#FEF2F2",border:"1px solid #FEE2E2",color:"#DC2626",fontSize:13}}>{error}</div>}
      {loading&&<div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:32}}><Loader2 size={24} color="#7C3AED" style={{animation:"spin 1s linear infinite"}}/></div>}
      {loaded&&!loading&&insights.length===0&&!error&&<div style={{textAlign:"center",padding:24,color:"#94A3B8",fontSize:13}}>Brak insightów — za mało danych.</div>}
      {!loading&&insights.map((ins,i)=>{
        const style=colorStyles[ins.color]||colorStyles.yellow;
        return <div key={i} style={{padding:14,borderRadius:10,background:style.bg,border:"1px solid "+style.border,marginBottom:i<insights.length-1?10:0,animation:"slideUp 0.3s ease",animationDelay:i*100+"ms",animationFillMode:"both"}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{width:8,height:8,borderRadius:"50%",background:style.icon,flexShrink:0}}/>
            <span style={{fontSize:10,fontWeight:700,color:style.icon,textTransform:"uppercase",letterSpacing:0.5}}>{style.label}</span>
          </div>
          <div style={{fontSize:14,fontWeight:600,color:"#0F172A",marginBottom:4}}>{ins.title}</div>
          <div style={{fontSize:13,color:"#475569",lineHeight:1.5}}>{ins.description}</div>
        </div>;
      })}
    </div>
  </div>;
}
 
// ── Dashboard ──────────────────────────────────────────────
function DashboardView({stats,onSelectCustomer,loading}:{stats:Stats|null;onSelectCustomer:(id:number)=>void;loading:boolean}) {
  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:80}}><Loader2 size={32} color="#2563EB" style={{animation:"spin 1s linear infinite"}}/></div>;
  const statCards=[{label:"Klienci",value:stats?.customerCount||0,icon:Users,color:"#2563EB"},{label:"E-maile",value:stats?.emailCount||0,icon:Mail,color:"#16A34A"},{label:"Wydarzenia",value:stats?.eventCount||0,icon:Clock,color:"#7C3AED"},{label:"Wymaga uwagi",value:stats?.needsAttention?.length||0,icon:AlertCircle,color:"#EF4444"}];
  return <div style={{padding:24,maxWidth:1200}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16,marginBottom:32}}>
      {statCards.map((s,i)=>{const Icon=s.icon;return <FadeIn key={s.label} delay={i*80}><div style={{background:"#fff",borderRadius:14,padding:20,border:"1px solid #E2E8F0",transition:"box-shadow 0.25s,transform 0.25s",cursor:"default"}} onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 4px 24px rgba(37,99,235,0.08)";e.currentTarget.style.transform="translateY(-2px)"}} onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";e.currentTarget.style.transform="translateY(0)"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}><span style={{fontSize:13,color:"#64748B",fontWeight:500}}>{s.label}</span><div style={{width:36,height:36,borderRadius:10,background:s.color+"14",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon size={18} color={s.color}/></div></div><div style={{fontSize:30,fontWeight:700,color:"#0F172A",lineHeight:1}}>{s.value}</div></div></FadeIn>;})}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(340px,1fr))",gap:20}}>
      {(stats?.needsAttention?.length||0)>0&&<FadeIn delay={350}><div style={{background:"#fff",borderRadius:14,border:"1px solid #FEE2E2",overflow:"hidden"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #FEF2F2",display:"flex",alignItems:"center",gap:8,background:"#FEF2F2"}}><AlertCircle size={16} color="#EF4444"/><span style={{fontWeight:600,fontSize:15,color:"#991B1B"}}>Wymaga uwagi</span></div>
        {stats!.needsAttention.slice(0,5).map((c,i)=><div key={c.id} onClick={()=>onSelectCustomer(c.id)} style={{padding:"14px 20px",borderBottom:i<Math.min(stats!.needsAttention.length,5)-1?"1px solid #FEF2F2":"none",display:"flex",alignItems:"center",gap:12,cursor:"pointer",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="#FEF2F2"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div style={{width:36,height:36,borderRadius:"50%",background:"#FEE2E2",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:12,color:"#DC2626",flexShrink:0}}>{getInitials(c.name)}</div>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"#0F172A"}}>{c.name}</div><div style={{fontSize:12,color:"#64748B"}}>{c.lastEventTitle}</div></div>
          <div style={{fontSize:12,fontWeight:600,color:"#EF4444",flexShrink:0}}>{daysAgo(c.lastEventDate)}</div>
        </div>)}
      </div></FadeIn>}
      <FadeIn delay={400}><AIInsightsPanel onSelectCustomer={onSelectCustomer}/></FadeIn>
      <FadeIn delay={550}><div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",overflow:"hidden"}}>
        <div style={{padding:"16px 20px",borderBottom:"1px solid #F1F5F9",display:"flex",alignItems:"center",justifyContent:"space-between"}}><span style={{fontWeight:600,fontSize:15,color:"#0F172A"}}>Ostatnie wydarzenia</span><Clock size={16} color="#94A3B8"/></div>
        {!stats?.recentEvents?.length?<EmptyState icon={Inbox} title="Brak wydarzeń" description="Kiedy n8n wyśle pierwszy mail, pojawi się tutaj."/>:
        stats.recentEvents.map((ev,i)=>{const Icon=eventIconComponent(ev.type);const pb=priorityBadge(ev.priority);return <div key={ev.id} onClick={()=>onSelectCustomer(ev.customerId)} style={{padding:"14px 20px",borderBottom:i<stats.recentEvents.length-1?"1px solid #F8FAFC":"none",display:"flex",alignItems:"flex-start",gap:12,cursor:"pointer",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
          <div style={{width:32,height:32,borderRadius:8,background:eventColor(ev.type)+"14",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}><Icon size={15} color={eventColor(ev.type)}/></div>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:13,fontWeight:600,color:"#0F172A",marginBottom:2}}>{ev.title}</div><div style={{fontSize:12,color:"#64748B"}}>{ev.customerName}{ev.customerCompany?` · ${ev.customerCompany}`:""}</div></div>
          <div style={{textAlign:"right",flexShrink:0}}><div style={{fontSize:11,color:"#94A3B8"}}>{formatDateShort(ev.date)}</div><span style={{display:"inline-block",marginTop:4,fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:6,background:pb.bg,color:pb.text}}>{pb.label}</span></div>
        </div>;})}
      </div></FadeIn>
    </div>
  </div>;
}
 
// ── Customer List ──────────────────────────────────────────
function CustomerListView({customers,onSelect,loading,onRefresh,onToast}:{customers:CustomerSummary[];onSelect:(id:number)=>void;loading:boolean;onRefresh:()=>void;onToast:(m:string)=>void}) {
  const[search,setSearch]=useState("");
  const[showAdd,setShowAdd]=useState(false);
  const filtered=customers.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||c.companyName.toLowerCase().includes(search.toLowerCase())||c.email.toLowerCase().includes(search.toLowerCase()));
 
  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:80}}><Loader2 size={32} color="#2563EB" style={{animation:"spin 1s linear infinite"}}/></div>;
 
  return <div style={{padding:24,maxWidth:1200}}>
    <FadeIn><div style={{display:"flex",gap:12,marginBottom:20}}>
      <div style={{flex:1,display:"flex",alignItems:"center",gap:12,background:"#fff",borderRadius:12,border:"1px solid #E2E8F0",padding:"0 16px"}}>
        <Search size={18} color="#94A3B8"/>
        <input type="text" placeholder="Szukaj klienta..." value={search} onChange={e=>setSearch(e.target.value)} style={{flex:1,border:"none",outline:"none",padding:"14px 0",fontSize:14,color:"#0F172A",background:"transparent"}}/>
      </div>
      <button onClick={()=>setShowAdd(true)} style={{padding:"0 20px",borderRadius:12,border:"none",background:"#2563EB",color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,whiteSpace:"nowrap",transition:"background 0.2s"}} onMouseEnter={e=>e.currentTarget.style.background="#1D4ED8"} onMouseLeave={e=>e.currentTarget.style.background="#2563EB"}><Plus size={18}/>Dodaj klienta</button>
    </div></FadeIn>
    <FadeIn delay={100}><div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",overflow:"hidden"}}>
      {filtered.length===0?<EmptyState icon={Users} title={customers.length===0?"Brak klientów":"Nie znaleziono"} description={customers.length===0?"Klienci pojawią się automatycznie z n8n, lub dodaj ręcznie.":"Spróbuj inną frazę."}/>:
      filtered.map((c,i)=><div key={c.id} onClick={()=>onSelect(c.id)} style={{padding:"14px 20px",borderBottom:i<filtered.length-1?"1px solid #F1F5F9":"none",display:"flex",alignItems:"center",gap:12,cursor:"pointer",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="#F8FAFC"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
        <div style={{width:40,height:40,borderRadius:"50%",background:"#EFF6FF",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:14,color:"#2563EB",flexShrink:0}}>{getInitials(c.name)}</div>
        <div style={{flex:1,minWidth:0}}><div style={{fontWeight:600,fontSize:14,color:"#0F172A"}}>{c.name}</div><div style={{fontSize:12,color:"#64748B"}}>{c.companyName||c.email}</div></div>
        <div style={{textAlign:"right",marginRight:8}}><div style={{fontSize:12,color:"#64748B"}}>{c.eventCount} wydarzeń</div>{c.lastEvent&&<div style={{fontSize:11,color:"#94A3B8"}}>{daysAgo(c.lastEvent.date)}</div>}</div>
        <ChevronRight size={16} color="#CBD5E1"/>
      </div>)}
    </div></FadeIn>
 
    {showAdd&&<FormModal title="Dodaj klienta" saveLabel="Dodaj" fields={[{key:"name",label:"Imię i nazwisko",value:"",required:true},{key:"email",label:"Email",value:"",required:true,type:"email"},{key:"companyName",label:"Firma",value:""}]}
      onClose={()=>setShowAdd(false)} onSave={async(vals)=>{
        const res=await fetch("/api/customers",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(vals)});
        if(!res.ok){const d=await res.json();throw new Error(d.error||"Błąd")} setShowAdd(false);onRefresh();onToast("Klient dodany");
      }}/>}
  </div>;
}
 
// ── Note Modal ──────────────────────────────────────────────
function NoteModal({customerId,onClose,onSaved}:{customerId:number;onClose:()=>void;onSaved:()=>void}) {
  return <FormModal title="Dodaj notatkę" saveLabel="Zapisz notatkę" fields={[{key:"title",label:"Tytuł",value:"",required:true},{key:"description",label:"Opis (opcjonalnie)",value:""}]}
    onClose={onClose} onSave={async(vals)=>{
      const res=await fetch(`/api/customers/${customerId}/notes`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(vals)});
      if(!res.ok) throw new Error("Błąd zapisu"); onSaved();onClose();
    }}/>;
}
 
// ── Customer Detail + Timeline ──────────────────────────────
function CustomerDetailView({customerId,onBack,onToast,onDeleted}:{customerId:number;onBack:()=>void;onToast:(m:string)=>void;onDeleted:()=>void}) {
  const[customer,setCustomer]=useState<CustomerDetail|null>(null);
  const[loading,setLoading]=useState(true);
  const[expandedEvent,setExpandedEvent]=useState<number|null>(null);
  const[showNoteModal,setShowNoteModal]=useState(false);
  const[showEditModal,setShowEditModal]=useState(false);
  const[showDeleteConfirm,setShowDeleteConfirm]=useState(false);
  const[deleteEventId,setDeleteEventId]=useState<number|null>(null);
  const[filterType,setFilterType]=useState("ALL");
 
  const fetchCustomer=useCallback(()=>{setLoading(true);fetch(`/api/customers/${customerId}`).then(r=>r.json()).then(d=>setCustomer(d)).catch(()=>{}).finally(()=>setLoading(false))},[customerId]);
  useEffect(()=>{fetchCustomer()},[fetchCustomer]);
 
  async function handleDeleteCustomer(){
    await fetch(`/api/customers/${customerId}`,{method:"DELETE"});
    onToast("Klient usunięty"); onDeleted();
  }
  async function handleDeleteEvent(){
    if(!deleteEventId)return;
    await fetch(`/api/customers/${customerId}/events/${deleteEventId}`,{method:"DELETE"});
    setDeleteEventId(null); fetchCustomer(); onToast("Wydarzenie usunięte");
  }
 
  if(loading) return <div style={{display:"flex",alignItems:"center",justifyContent:"center",padding:80}}><Loader2 size={32} color="#2563EB" style={{animation:"spin 1s linear infinite"}}/></div>;
  if(!customer) return null;
 
  const eventTypes=Array.from(new Set(customer.events.map(e=>e.type)));
  const filteredEvents=filterType==="ALL"?customer.events:customer.events.filter(e=>e.type===filterType);
 
  return <div style={{padding:24,maxWidth:900}}>
    <FadeIn><button onClick={onBack} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",color:"#64748B",cursor:"pointer",fontSize:13,fontWeight:500,padding:"4px 0",marginBottom:20,transition:"color 0.15s"}} onMouseEnter={e=>e.currentTarget.style.color="#2563EB"} onMouseLeave={e=>e.currentTarget.style.color="#64748B"}><ArrowLeft size={16}/>Wróć do listy</button></FadeIn>
 
    {/* Customer card */}
    <FadeIn delay={80}><div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",padding:24,marginBottom:24}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:16,flexWrap:"wrap"}}>
        <div style={{width:56,height:56,borderRadius:14,background:"linear-gradient(135deg,#2563EB,#3B82F6)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:18,color:"#fff",flexShrink:0}}>{getInitials(customer.name)}</div>
        <div style={{flex:1,minWidth:200}}>
          <h2 style={{margin:0,fontSize:22,fontWeight:700,color:"#0F172A"}}>{customer.name}</h2>
          {customer.companyName&&<div style={{display:"flex",alignItems:"center",gap:6,marginTop:4,color:"#64748B",fontSize:14}}><Building2 size={14}/>{customer.companyName}</div>}
          <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2,color:"#94A3B8",fontSize:13}}><Mail size={13}/>{customer.email}</div>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"flex-start"}}>
          <div style={{padding:"8px 16px",borderRadius:10,background:"#EFF6FF",border:"1px solid #BFDBFE"}}><div style={{fontSize:10,fontWeight:600,color:"#2563EB",textTransform:"uppercase",letterSpacing:0.5}}>E-maile</div><div style={{fontSize:18,fontWeight:700,color:"#1D4ED8",marginTop:2}}>{customer.emailCount}</div></div>
          <div style={{padding:"8px 16px",borderRadius:10,background:"#F0FDF4",border:"1px solid #BBF7D0"}}><div style={{fontSize:10,fontWeight:600,color:"#16A34A",textTransform:"uppercase",letterSpacing:0.5}}>Wydarzenia</div><div style={{fontSize:18,fontWeight:700,color:"#15803D",marginTop:2}}>{customer.eventCount}</div></div>
          <button onClick={()=>setShowNoteModal(true)} style={{padding:"8px 16px",borderRadius:10,background:"#0F172A",border:"none",color:"#fff",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,minHeight:52,transition:"background 0.2s"}} onMouseEnter={e=>e.currentTarget.style.background="#1E293B"} onMouseLeave={e=>e.currentTarget.style.background="#0F172A"}><Plus size={16}/>Notatka</button>
          <button onClick={()=>setShowEditModal(true)} style={{padding:"8px 16px",borderRadius:10,background:"#F1F5F9",border:"1px solid #E2E8F0",color:"#475569",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,minHeight:52,transition:"background 0.2s"}} onMouseEnter={e=>e.currentTarget.style.background="#E2E8F0"} onMouseLeave={e=>e.currentTarget.style.background="#F1F5F9"}><Pencil size={14}/>Edytuj</button>
          <button onClick={()=>setShowDeleteConfirm(true)} style={{padding:"8px 16px",borderRadius:10,background:"#FEF2F2",border:"1px solid #FEE2E2",color:"#EF4444",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6,minHeight:52,transition:"background 0.2s"}} onMouseEnter={e=>e.currentTarget.style.background="#FEE2E2"} onMouseLeave={e=>e.currentTarget.style.background="#FEF2F2"}><Trash2 size={14}/>Usuń</button>
        </div>
      </div>
    </div></FadeIn>
 
    {/* Timeline */}
    <FadeIn delay={200}><div style={{background:"#fff",borderRadius:14,border:"1px solid #E2E8F0",overflow:"hidden"}}>
      <div style={{padding:"16px 24px",borderBottom:"1px solid #F1F5F9",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
        <Clock size={16} color="#2563EB"/><span style={{fontWeight:600,fontSize:15,color:"#0F172A"}}>Timeline</span>
        {customer.events.length>0&&<span style={{fontSize:11,fontWeight:600,background:"#EFF6FF",color:"#2563EB",padding:"2px 8px",borderRadius:6}}>{customer.events.length}</span>}
        {eventTypes.length>1&&<div style={{marginLeft:"auto",display:"flex",gap:4,flexWrap:"wrap"}}>
          <button onClick={()=>setFilterType("ALL")} style={{padding:"4px 10px",borderRadius:6,border:"1px solid "+(filterType==="ALL"?"#2563EB":"#E2E8F0"),background:filterType==="ALL"?"#EFF6FF":"#fff",color:filterType==="ALL"?"#2563EB":"#64748B",fontSize:11,fontWeight:600,cursor:"pointer"}}>Wszystko</button>
          {eventTypes.map(t=><button key={t} onClick={()=>setFilterType(t)} style={{padding:"4px 10px",borderRadius:6,border:"1px solid "+(filterType===t?eventColor(t):"#E2E8F0"),background:filterType===t?eventColor(t)+"14":"#fff",color:filterType===t?eventColor(t):"#64748B",fontSize:11,fontWeight:600,cursor:"pointer"}}>{eventLabel(t)}</button>)}
        </div>}
      </div>
      <div style={{padding:"20px 24px"}}>
        {customer.events.length===0?<EmptyState icon={Clock} title="Brak wydarzeń" description="Historia pojawi się po przetworzeniu wiadomości."/>:
        filteredEvents.length===0?<EmptyState icon={Filter} title="Brak wyników" description="Żadne wydarzenia nie pasują do filtra."/>:
        filteredEvents.map((ev,i)=>{
          const Icon=eventIconComponent(ev.type);const color=eventColor(ev.type);const isMajor=ev.level==="MAJOR";const isExpanded=expandedEvent===ev.id;const isLast=i===filteredEvents.length-1;
          return <div key={ev.id} style={{display:"flex",gap:16,position:"relative"}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:40,flexShrink:0}}>
              <div style={{width:isMajor?40:28,height:isMajor?40:28,borderRadius:"50%",background:isMajor?color:"#fff",border:isMajor?"none":`2px solid ${color}`,display:"flex",alignItems:"center",justifyContent:"center",position:"relative",zIndex:2,boxShadow:isMajor?`0 0 0 4px ${color}20`:"none",marginTop:isMajor?0:6}}><Icon size={isMajor?18:13} color={isMajor?"#fff":color}/></div>
              {!isLast&&<div style={{width:2,flex:1,background:"#E2E8F0",marginTop:4,marginBottom:4,minHeight:20}}/>}
            </div>
            <div style={{flex:1,paddingBottom:isLast?0:24,minWidth:0}}>
              <div onClick={()=>setExpandedEvent(isExpanded?null:ev.id)} style={{padding:"12px 16px",borderRadius:10,border:`1px solid ${isExpanded?color+"40":"#F1F5F9"}`,background:isExpanded?color+"06":"#FAFBFC",cursor:"pointer",transition:"all 0.2s"}} onMouseEnter={e=>{if(!isExpanded){e.currentTarget.style.borderColor="#E2E8F0";e.currentTarget.style.background="#F8FAFC"}}} onMouseLeave={e=>{if(!isExpanded){e.currentTarget.style.borderColor="#F1F5F9";e.currentTarget.style.background="#FAFBFC"}}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:isMajor?15:13,fontWeight:isMajor?700:600,color:"#0F172A",marginBottom:4}}>{ev.title}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:6,background:color+"14",color}}>{eventLabel(ev.type)}</span>
                      {ev.analysis&&<span style={{fontSize:10,fontWeight:600,padding:"2px 8px",borderRadius:6,background:priorityBadge(ev.analysis.priority).bg,color:priorityBadge(ev.analysis.priority).text}}>{priorityBadge(ev.analysis.priority).label}</span>}
                      <span style={{fontSize:11,color:"#94A3B8"}}>{formatDate(ev.date)}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
                    <button onClick={(e)=>{e.stopPropagation();setDeleteEventId(ev.id)}} style={{width:28,height:28,borderRadius:6,border:"none",background:"transparent",color:"#CBD5E1",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#FEE2E2";e.currentTarget.style.color="#EF4444"}} onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.color="#CBD5E1"}}><Trash2 size={13}/></button>
                    <ChevronDown size={16} color="#94A3B8" style={{transform:isExpanded?"rotate(180deg)":"rotate(0deg)",transition:"transform 0.2s",marginTop:4}}/>
                  </div>
                </div>
                {isExpanded&&<div style={{marginTop:16,paddingTop:16,borderTop:"1px solid #E2E8F0"}}>
                  {ev.emailSubject&&<div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}><div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,fontWeight:600,color:"#0F172A"}}><Mail size={14} color="#2563EB"/>{ev.emailSubject}</div>{ev.emailFrom&&<span style={{fontSize:12,color:"#94A3B8"}}>od {ev.emailFrom}</span>}</div>}
                  {ev.emailBody?<div style={{background:"#FAFBFC",borderRadius:10,padding:16,border:"1px solid #E2E8F0",fontSize:13,color:"#334155",lineHeight:1.7,whiteSpace:"pre-wrap",maxHeight:400,overflow:"auto",marginBottom:12}}>{ev.emailBody}</div>
                  :ev.description?<p style={{margin:"0 0 12px",fontSize:13,color:"#475569",lineHeight:1.6}}>{ev.description}</p>:null}
                  {ev.emailBody&&<div style={{display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#94A3B8"}}><Circle size={8} fill="#E2E8F0" color="#E2E8F0"/>Brak informacji o odpowiedzi</div>}
                </div>}
              </div>
            </div>
          </div>;})}
      </div>
    </div></FadeIn>
 
    {showNoteModal&&<NoteModal customerId={customerId} onClose={()=>setShowNoteModal(false)} onSaved={()=>{fetchCustomer();onToast("Notatka zapisana")}}/>}
    {showEditModal&&<FormModal title="Edytuj klienta" saveLabel="Zapisz" fields={[{key:"name",label:"Imię i nazwisko",value:customer.name,required:true},{key:"email",label:"Email",value:customer.email,required:true,type:"email"},{key:"companyName",label:"Firma",value:customer.companyName}]}
      onClose={()=>setShowEditModal(false)} onSave={async(vals)=>{const res=await fetch(`/api/customers/${customerId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(vals)});if(!res.ok){const d=await res.json();throw new Error(d.error||"Błąd")} setShowEditModal(false);fetchCustomer();onToast("Klient zaktualizowany")}}/>}
    {showDeleteConfirm&&<ConfirmDialog danger title="Usuń klienta" message={`Czy na pewno chcesz usunąć ${customer.name}? Zostaną usunięte wszystkie jego maile, analizy i wydarzenia. Tej operacji nie można cofnąć.`} onCancel={()=>setShowDeleteConfirm(false)} onConfirm={handleDeleteCustomer}/>}
    {deleteEventId&&<ConfirmDialog danger title="Usuń wydarzenie" message="Czy na pewno chcesz usunąć to wydarzenie z timeline? Tej operacji nie można cofnąć." onCancel={()=>setDeleteEventId(null)} onConfirm={handleDeleteEvent}/>}
  </div>;
}
 
// ── Main App ──────────────────────────────────────────────
export default function AxivoCRM() {
  const[view,setView]=useState("dashboard");
  const[selectedCustomer,setSelectedCustomer]=useState<number|null>(null);
  const[mobileMenuOpen,setMobileMenuOpen]=useState(false);
  const[stats,setStats]=useState<Stats|null>(null);
  const[customers,setCustomers]=useState<CustomerSummary[]>([]);
  const[loading,setLoading]=useState(true);
  const[toast,setToast]=useState<string|null>(null);
 
  const fetchData=useCallback(async()=>{setLoading(true);try{const[s,c]=await Promise.all([fetch("/api/stats"),fetch("/api/customers")]);setStats(await s.json());setCustomers(await c.json())}catch(e){console.error(e)}finally{setLoading(false)}},[]);
  useEffect(()=>{fetchData()},[fetchData]);
 
  function handleSelectCustomer(id:number){setSelectedCustomer(id);setView("customer-detail")}
  function handleNavigate(v:string){setView(v);setSelectedCustomer(null)}
 
  return <div style={{display:"flex",height:"100vh",background:"#F1F5F9",overflow:"hidden"}}>
    <Sidebar currentView={view} onNavigate={handleNavigate} mobileOpen={mobileMenuOpen} onCloseMobile={()=>setMobileMenuOpen(false)}/>
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <TopBar title={view==="dashboard"?"Dashboard":view==="customers"?"Klienci":customers.find(c=>c.id===selectedCustomer)?.name||"Klient"} onMenuClick={()=>setMobileMenuOpen(true)} onRefresh={fetchData} loading={loading} onSelectCustomer={handleSelectCustomer}/>
      <div style={{flex:1,overflow:"auto"}}>
        {view==="dashboard"&&<DashboardView stats={stats} onSelectCustomer={handleSelectCustomer} loading={loading}/>}
        {view==="customers"&&<CustomerListView customers={customers} onSelect={handleSelectCustomer} loading={loading} onRefresh={fetchData} onToast={m=>setToast(m)}/>}
        {view==="customer-detail"&&selectedCustomer&&<CustomerDetailView customerId={selectedCustomer} onBack={()=>{setView("customers");fetchData()}} onToast={m=>setToast(m)} onDeleted={()=>{setView("customers");fetchData()}}/>}
      </div>
    </div>
    {toast&&<Toast message={toast} onClose={()=>setToast(null)}/>}
  </div>;
}
