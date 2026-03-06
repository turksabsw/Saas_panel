import { useState, useCallback, useEffect } from "react";

/* ═══════════════════════════════════════════════════════════════════════════
   TR TradeHub — RFQ Page
   Matches: localhost:8082/app/rfq dark theme
   Fields:  rfq.json (tümü)
   Logic:   rfq.py (workflow, validations, whitelist methods)
            rfq.js  (UX triggers, auto-fills, field watchers)
═══════════════════════════════════════════════════════════════════════════ */

/* ── Design tokens (eşleştirildi: screenshot dark palette) ── */
const T = {
  bg:        "#101014",
  bgDeep:    "#0d0d10",
  surface:   "#18181f",
  surfaceUp: "#1f1f28",
  surfaceHi: "#27273a",
  border:    "#2a2a38",
  borderLo:  "#222230",
  borderHi:  "#3a3a50",
  purple:    "#7c6cf0",
  purpleGlow:"#7c6cf015",
  purpleDim: "#3d3568",
  gold:      "#c9900a",
  goldDim:   "#4a3505",
  goldGlow:  "#c9900a18",
  text:      "#e2e1ec",
  textMid:   "#9998b0",
  textFaint: "#55546a",
  blue:      "#4f8ef7",
  blueDim:   "#1a2e55",
  green:     "#22c87a",
  greenDim:  "#0a3020",
  amber:     "#f59e0b",
  amberDim:  "#3d2800",
  red:       "#f04f4f",
  redDim:    "#3d1010",
  teal:      "#14b8a6",
  tealDim:   "#0a2828",
};

/* ── rfq.py: STATUS + valid_transitions ── */
const STATUS_CFG = {
  Draft:       { label:"Taslak",           color:T.textMid, bg:"#26262e", dot:"#6b6b80", order:0 },
  Published:   { label:"Yayınlandı",       color:T.blue,    bg:T.blueDim, dot:T.blue,    order:1 },
  Quoting:     { label:"Teklif Alınıyor",  color:T.amber,   bg:T.amberDim,dot:T.amber,   order:2 },
  Negotiation: { label:"Müzakere",         color:T.purple,  bg:"#2a2250", dot:T.purple,  order:3 },
  Accepted:    { label:"Kabul Edildi",     color:T.green,   bg:T.greenDim,dot:T.green,   order:4 },
  Ordered:     { label:"Sipariş Verildi",  color:T.teal,    bg:T.tealDim, dot:T.teal,    order:5 },
  Closed:      { label:"Kapatıldı",        color:T.textFaint,bg:"#1e1e24",dot:"#44445a", order:6 },
  Cancelled:   { label:"İptal Edildi",     color:T.red,     bg:T.redDim,  dot:T.red,     order:7 },
};

const TRANSITIONS = {
  Draft:       ["Published","Cancelled"],
  Published:   ["Quoting","Negotiation","Closed","Cancelled"],
  Quoting:     ["Negotiation","Closed","Cancelled"],
  Negotiation: ["Accepted","Closed","Cancelled"],
  Accepted:    ["Ordered","Closed"],
  Ordered:     ["Closed"],
  Closed:      [],
  Cancelled:   [],
};

const FLOW_STEPS = ["Draft","Published","Quoting","Negotiation","Accepted","Ordered"];

/* ── Mock data ── */
const EMPTY_RFQ = {
  name:"", naming_series:"RFQ-.YYYY.-.#####", rfq_code:"",
  title:"", buyer:"", buyer_name:"", buyer_company:"", buyer_email:"",
  status:"Draft", category:"", published_at:"",
  description:"",
  items:[], require_all_items:0, allow_partial_quotes:0,
  target_type:"Public", target_sellers:[], target_categories:[],
  deadline:"", submission_deadline:"", quantity:0, unit:"", budget_min:0, budget_max:0,
  delivery_date:"", delivery_location:"",
  requires_nda:0, nda_template:"", attachments:[],
  accepted_quote:"", closed_at:"", closed_reason:"",
  organization:"", tenant:"", tenant_name:"", currency:"TRY",
  is_view_limited:0, max_views:0, current_views:0, views_remaining:0,
  quote_count:0, created_date:"", qty:0, uom:"",
};

const MOCK_LIST = [
  { name:"RFQ-2026-00001", rfq_code:"RFQ-20260101-A4K2", title:"Endüstriyel Rulman Seti Talebi", buyer:"buyer-001", buyer_name:"Mehmet Yılmaz", buyer_company:"Yılmaz Makine A.Ş.", buyer_email:"m.yilmaz@yilmazmakine.com", status:"Quoting", category:"Endüstriyel Ekipman", target_type:"Public", deadline:"2026-03-15T18:00", quote_count:4, requires_nda:0, is_view_limited:1, current_views:18, max_views:25, tenant:"tenant-ist", tenant_name:"İstanbul Sanayi", budget_min:50000, budget_max:120000, created_date:"2026-01-15", description:"Yüksek devirli şanzımanlar için endüstriyel rulman seti. SKF veya FAG marka tercih edilmektedir.", items:[{listing:"L-001",item_name:"Rulman 6204-2RS",category:"Rulman",qty:100,uom:"Adet",target_price:45,currency:"TRY"},{listing:"L-002",item_name:"Rulman 6306-ZZ",category:"Rulman",qty:50,uom:"Adet",target_price:85,currency:"TRY"}], target_sellers:[], target_categories:[], quantity:150, unit:"Adet", delivery_date:"2026-04-01", delivery_location:"İstanbul, Türkiye", require_all_items:1, allow_partial_quotes:0, submission_deadline:"2026-03-10T23:59", accepted_quote:"", closed_at:"", closed_reason:"", published_at:"2026-01-16T09:30", attachments:[], organization:"", currency:"TRY" },
  { name:"RFQ-2026-00002", rfq_code:"RFQ-20260120-B7X9", title:"Ofis Mobilyası Toplu Alım", buyer:"buyer-002", buyer_name:"Ayşe Kara", buyer_company:"Kara Holding", buyer_email:"a.kara@karaholding.com", status:"Draft", category:"Mobilya", target_type:"Category", deadline:"2026-04-01T17:00", quote_count:0, requires_nda:0, is_view_limited:0, current_views:0, max_views:0, tenant:"tenant-ank", tenant_name:"Ankara İş", budget_min:200000, budget_max:500000, created_date:"2026-01-20", description:"Yeni ofis binası için 200 kişilik çalışma alanı mobilyası.", items:[{listing:"L-010",item_name:"Ergonomik Ofis Koltuğu",category:"Mobilya",qty:200,uom:"Adet",target_price:1800,currency:"TRY"}], target_sellers:[], target_categories:[{category:"Mobilya"},{category:"Ofis Ürünleri"}], quantity:200, unit:"Adet", delivery_date:"2026-05-15", delivery_location:"Ankara", require_all_items:0, allow_partial_quotes:1, submission_deadline:"2026-03-25T23:59", accepted_quote:"", closed_at:"", closed_reason:"", published_at:"", attachments:[], organization:"", currency:"TRY" },
  { name:"RFQ-2026-00003", rfq_code:"RFQ-20260205-C1M4", title:"Kimyasal Ham Madde Tedariki", buyer:"buyer-003", buyer_name:"Ali Demir", buyer_company:"Demir Kimya Ltd.", buyer_email:"a.demir@demirkimya.com", status:"Negotiation", category:"Kimyasal Ürünler", target_type:"Selected", deadline:"2026-03-08T12:00", quote_count:7, requires_nda:1, is_view_limited:1, current_views:5, max_views:5, tenant:"tenant-izm", tenant_name:"İzmir Kimya", budget_min:800000, budget_max:1500000, created_date:"2026-02-05", description:"Boya üretimi için baz kimyasallar. GHS belgeli tedarikçi şart.", items:[{listing:"L-020",item_name:"Titanyum Dioksit",category:"Pigment",qty:5000,uom:"kg",target_price:120,currency:"TRY"},{listing:"L-021",item_name:"Akrilik Reçine",category:"Reçine",qty:2000,uom:"kg",target_price:85,currency:"TRY"},{listing:"L-022",item_name:"Solvent Karışımı",category:"Solvent",qty:3000,uom:"lt",target_price:45,currency:"TRY"}], target_sellers:[{seller:"Seller-A"},{seller:"Seller-B"}], target_categories:[], quantity:10000, unit:"kg", delivery_date:"2026-04-30", delivery_location:"İzmir OSB", require_all_items:1, allow_partial_quotes:0, submission_deadline:"2026-03-05T23:59", accepted_quote:"", closed_at:"", closed_reason:"", published_at:"2026-02-06T08:00", attachments:[], organization:"", currency:"TRY" },
  { name:"RFQ-2026-00004", rfq_code:"RFQ-20260210-D9P3", title:"IT Ekipman Yenileme Projesi", buyer:"buyer-004", buyer_name:"Fatma Şahin", buyer_company:"Şahin Teknoloji", buyer_email:"f.sahin@sahintekno.com", status:"Accepted", category:"Bilişim", target_type:"Public", deadline:"2026-02-28T17:00", quote_count:11, requires_nda:0, is_view_limited:0, current_views:43, max_views:0, tenant:"tenant-ist", tenant_name:"İstanbul Sanayi", budget_min:1200000, budget_max:2000000, created_date:"2026-02-10", description:"150 çalışan için laptop, monitör ve çevre birimi.", items:[{listing:"L-030",item_name:"Laptop i7 13th Gen",category:"Bilgisayar",qty:150,uom:"Adet",target_price:28000,currency:"TRY"},{listing:"L-031",item_name:'27" 4K Monitör',category:"Monitör",qty:150,uom:"Adet",target_price:12000,currency:"TRY"}], target_sellers:[], target_categories:[], quantity:300, unit:"Adet", delivery_date:"2026-03-31", delivery_location:"İstanbul Küçükçekmece", require_all_items:1, allow_partial_quotes:0, submission_deadline:"2026-02-25T23:59", accepted_quote:"QUOTE-2026-00089", closed_at:"", closed_reason:"", published_at:"2026-02-11T10:00", attachments:[], organization:"", currency:"TRY" },
  { name:"RFQ-2026-00005", rfq_code:"RFQ-20260215-E5N7", title:"Ambalaj Malzemesi Alımı", buyer:"buyer-001", buyer_name:"Mehmet Yılmaz", buyer_company:"Yılmaz Makine A.Ş.", buyer_email:"m.yilmaz@yilmazmakine.com", status:"Closed", category:"Ambalaj", target_type:"Public", deadline:"2026-02-20T17:00", quote_count:3, requires_nda:0, is_view_limited:0, current_views:12, max_views:0, tenant:"tenant-ist", tenant_name:"İstanbul Sanayi", budget_min:30000, budget_max:60000, created_date:"2026-02-15", description:"Ürün sevkiyatı için oluklu mukavva kutu.", items:[{listing:"L-040",item_name:"Oluklu Kutu 40x30x20",category:"Ambalaj",qty:5000,uom:"Adet",target_price:8,currency:"TRY"}], target_sellers:[], target_categories:[], quantity:5000, unit:"Adet", delivery_date:"2026-03-01", delivery_location:"İstanbul", require_all_items:0, allow_partial_quotes:0, submission_deadline:"2026-02-18T23:59", accepted_quote:"", closed_at:"2026-02-21T09:00", closed_reason:"Bütçe yeterli teklif alınamadı", published_at:"2026-02-16T08:30", attachments:[], organization:"", currency:"TRY" },
];

/* ── Helpers ── */
const fmt   = n => n ? Number(n).toLocaleString("tr-TR") : "0";
const fmtDt = d => d ? new Date(d).toLocaleString("tr-TR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";
const fmtD  = d => d ? new Date(d).toLocaleDateString("tr-TR") : "—";
const daysleft = d => d ? Math.ceil((new Date(d)-new Date())/864e5) : null;
const viewPct  = r => r.is_view_limited && r.max_views ? Math.min(100,Math.round(r.current_views/r.max_views*100)) : 0;
const init     = n => (n||"?")[0].toUpperCase();

/* ════════════════════════════════════════════════════════════════════════════
   ATOMS
════════════════════════════════════════════════════════════════════════════ */

const StatusBadge = ({status, size="sm"}) => {
  const s = STATUS_CFG[status]||{};
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:5,
      background:s.bg,color:s.color,
      fontSize:size==="lg"?11:10,fontWeight:700,
      padding:size==="lg"?"4px 10px":"2px 8px",borderRadius:4,
      whiteSpace:"nowrap",letterSpacing:".02em",
    }}>
      <span style={{width:5,height:5,borderRadius:"50%",background:s.dot,flexShrink:0}}/>
      {s.label}
    </span>
  );
};

const Pill = ({children, color=T.textMid, bg=T.surfaceUp}) => (
  <span style={{display:"inline-block",fontSize:10,fontWeight:700,
    color,background:bg,padding:"2px 7px",borderRadius:3,whiteSpace:"nowrap"}}>
    {children}
  </span>
);

const Field = ({label, children, required, half, note}) => (
  <div style={{display:"flex",flexDirection:"column",gap:5,gridColumn:half?"auto":"auto"}}>
    <label style={{fontSize:11,fontWeight:600,color:T.textFaint,letterSpacing:".05em",textTransform:"uppercase"}}>
      {label}{required&&<span style={{color:T.red,marginLeft:3}}>*</span>}
    </label>
    {children}
    {note&&<span style={{fontSize:10,color:T.textFaint,lineHeight:1.4}}>{note}</span>}
  </div>
);

const Input = ({value,onChange,disabled,placeholder,type="text",min,step}) => (
  <input value={value||""} onChange={e=>onChange&&onChange(e.target.value)}
    type={type} min={min} step={step}
    placeholder={placeholder||""}
    disabled={!!disabled}
    style={{
      width:"100%",padding:"8px 10px",
      background:disabled?T.bgDeep:T.surfaceUp,
      border:`1px solid ${T.border}`,borderRadius:6,
      color:disabled?T.textFaint:T.text,
      fontSize:13,outline:"none",boxSizing:"border-box",
      fontFamily:"inherit",
      cursor:disabled?"not-allowed":"text",
    }}
  />
);

const Select = ({value,onChange,disabled,options}) => (
  <select value={value||""} onChange={e=>onChange&&onChange(e.target.value)}
    disabled={!!disabled}
    style={{
      width:"100%",padding:"8px 10px",
      background:disabled?T.bgDeep:T.surfaceUp,
      border:`1px solid ${T.border}`,borderRadius:6,
      color:value?T.text:T.textFaint,
      fontSize:13,outline:"none",boxSizing:"border-box",
      fontFamily:"inherit",cursor:disabled?"not-allowed":"pointer",
      appearance:"none",
      backgroundImage:`url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235a5a7a' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
      backgroundRepeat:"no-repeat",backgroundPosition:"right 10px center",
      paddingRight:28,
    }}>
    {options.map(o=>typeof o==="string"
      ?<option key={o} value={o}>{o}</option>
      :<option key={o.value} value={o.value}>{o.label}</option>
    )}
  </select>
);

const Textarea = ({value,onChange,disabled,placeholder,rows=4}) => (
  <textarea value={value||""} onChange={e=>onChange&&onChange(e.target.value)}
    placeholder={placeholder||""} rows={rows}
    disabled={!!disabled}
    style={{
      width:"100%",padding:"9px 10px",resize:"vertical",
      background:disabled?T.bgDeep:T.surfaceUp,
      border:`1px solid ${T.border}`,borderRadius:6,
      color:T.text,fontSize:13,outline:"none",
      boxSizing:"border-box",fontFamily:"inherit",lineHeight:1.6,
    }}
  />
);

const Toggle = ({checked,onChange,disabled,label}) => (
  <label style={{display:"inline-flex",alignItems:"center",gap:9,cursor:disabled?"not-allowed":"pointer",userSelect:"none"}}>
    <span style={{
      position:"relative",width:36,height:20,
      background:checked?T.purple:T.border,
      borderRadius:10,transition:"background .15s",display:"inline-block",flexShrink:0,
    }}>
      <span style={{
        position:"absolute",top:2,left:checked?18:2,width:16,height:16,
        borderRadius:"50%",background:"#fff",transition:"left .15s",
      }}/>
      <input type="checkbox" checked={!!checked} onChange={e=>onChange&&onChange(e.target.checked?1:0)}
        disabled={!!disabled} style={{position:"absolute",opacity:0,width:"100%",height:"100%",cursor:"pointer",margin:0}}/>
    </span>
    {label&&<span style={{fontSize:13,color:T.textMid,fontWeight:500}}>{label}</span>}
  </label>
);

const Btn = ({children,onClick,variant="ghost",disabled,icon,small}) => {
  const styles = {
    primary:  {background:T.purple,    color:"#fff",border:`1px solid ${T.purple}`},
    gold:     {background:T.gold,      color:"#fff",border:`1px solid ${T.gold}`},
    ghost:    {background:T.surfaceUp, color:T.textMid, border:`1px solid ${T.border}`},
    danger:   {background:T.redDim,    color:T.red,  border:`1px solid ${T.red}40`},
    success:  {background:T.greenDim,  color:T.green,border:`1px solid ${T.green}40`},
  };
  const s = styles[variant]||styles.ghost;
  return (
    <button onClick={onClick} disabled={!!disabled}
      style={{
        display:"inline-flex",alignItems:"center",gap:6,
        padding:small?"5px 10px":"7px 14px",
        fontSize:small?11:12,fontWeight:700,
        borderRadius:7,cursor:disabled?"not-allowed":"pointer",
        opacity:disabled?.5:1,transition:"all .12s",letterSpacing:".01em",
        fontFamily:"inherit",...s
      }}>
      {icon&&<span style={{fontSize:13}}>{icon}</span>}
      {children}
    </button>
  );
};

const SectionHead = ({title, action}) => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
    marginBottom:14,paddingBottom:10,borderBottom:`1px solid ${T.border}`}}>
    <span style={{fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:".1em",color:T.textFaint}}>{title}</span>
    {action}
  </div>
);

const Grid = ({cols=2,children,gap=12}) => (
  <div style={{display:"grid",gridTemplateColumns:`repeat(${cols},1fr)`,gap}}>{children}</div>
);

/* ════════════════════════════════════════════════════════════════════════════
   WORKFLOW BAR — rfq.py valid_transitions
════════════════════════════════════════════════════════════════════════════ */
const WorkflowBar = ({status, onTransition}) => {
  const cur = STATUS_CFG[status]||{};
  const curOrder = cur.order??-1;
  const avail = TRANSITIONS[status]||[];

  return (
    <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 16px"}}>
      {/* Linear flow */}
      <div style={{display:"flex",alignItems:"flex-start",overflowX:"auto",paddingBottom:4,gap:0}}>
        {FLOW_STEPS.map((s,i)=>{
          const c = STATUS_CFG[s];
          const isActive = s===status;
          const isDone   = c.order < curOrder && !["Closed","Cancelled"].includes(status);
          const isAvail  = avail.includes(s);
          return (
            <div key={s} style={{display:"flex",alignItems:"center",flexShrink:0}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,
                cursor:isAvail?"pointer":"default",minWidth:72}}
                onClick={()=>isAvail&&onTransition(s)}>
                {/* Track + node */}
                <div style={{position:"relative",display:"flex",alignItems:"center",width:"100%",justifyContent:"center"}}>
                  {/* Left track */}
                  {i>0&&<div style={{position:"absolute",right:"50%",top:"50%",transform:"translateY(-50%)",
                    height:2,left:0,
                    background:isDone||isActive?T.purple:T.border,transition:"background .3s"}}/>}
                  {/* Right track */}
                  {i<FLOW_STEPS.length-1&&<div style={{position:"absolute",left:"50%",top:"50%",transform:"translateY(-50%)",
                    height:2,right:0,
                    background:isDone?T.purple:T.border,transition:"background .3s"}}/>}
                  {/* Node */}
                  <div style={{
                    width:32,height:32,borderRadius:"50%",zIndex:1,
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,
                    background:isActive?T.purple:isDone?T.purpleGlow:isAvail?T.surfaceHi:T.surface,
                    border:`2px solid ${isActive?T.purple:isDone?T.purpleDim:isAvail?T.borderHi:T.border}`,
                    boxShadow:isActive?`0 0 0 4px ${T.purple}25`:"none",
                    transition:"all .2s",
                  }}>
                    <span style={{fontSize:12,opacity:isActive?1:.7}}>
                      {isActive?"●":isDone?"✓":isAvail?"○":"·"}
                    </span>
                  </div>
                </div>
                {/* Label */}
                <div style={{textAlign:"center"}}>
                  <div style={{fontSize:9,fontWeight:isActive?800:500,color:isActive?c.color:isDone?T.textMid:isAvail?T.textMid:T.textFaint,whiteSpace:"nowrap",letterSpacing:".02em"}}>
                    {c.label}
                  </div>
                  {isActive&&<div style={{fontSize:8,color:T.purple,marginTop:1,fontWeight:800}}>● Şu an</div>}
                  {isAvail&&!isActive&&<div style={{fontSize:8,color:T.amber,marginTop:1}}>Geç →</div>}
                </div>
              </div>
              {/* Arrow connector */}
              {i<FLOW_STEPS.length-1&&<div style={{flexShrink:0}}/>}
            </div>
          );
        })}
      </div>
      {/* Terminal actions */}
      {(avail.includes("Closed")||avail.includes("Cancelled")||status==="Closed"||status==="Cancelled")&&(
        <div style={{display:"flex",gap:8,marginTop:10,paddingTop:10,borderTop:`1px solid ${T.border}`}}>
          <span style={{fontSize:10,color:T.textFaint,display:"flex",alignItems:"center"}}>Terminal:</span>
          {["Closed","Cancelled"].map(s=>{
            const c=STATUS_CFG[s];
            const canDo=avail.includes(s);
            if(!canDo&&status!==s)return null;
            return (
              <button key={s} onClick={()=>canDo&&onTransition(s)}
                style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:10,fontWeight:700,
                  padding:"3px 10px",borderRadius:5,cursor:canDo?"pointer":"default",
                  border:`1px solid ${status===s?c.color:T.border}`,
                  background:status===s?c.bg:"none",color:status===s?c.color:T.textFaint}}>
                {c.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   DETAIL / FORM VIEW
   Tabs: details_tab | items_tab | requirements_tab | documents_tab | outcome_tab
   Maps rfq.json field_order exactly
════════════════════════════════════════════════════════════════════════════ */
const DetailView = ({rfq:initRfq, isNew, onBack, onSave}) => {
  const [doc,  setDoc]  = useState({...initRfq});
  const [tab,  setTab]  = useState("details");
  const [dirty,setDirty]= useState(false);
  const [modal,setModal]= useState(null); // {status, action}
  const [toast,setToast]= useState(null);
  const [errors,setErrs]= useState({});

  const set = useCallback((key,val)=>{
    setDoc(d=>({...d,[key]:val}));
    setDirty(true);
    setErrs(e=>({...e,[key]:null}));
  },[]);

  const showToast = (msg,type="ok")=>{ setToast({msg,type}); setTimeout(()=>setToast(null),2800); };

  /* ── rfq.js: field watchers ── */
  const onOrganizationChange = v=>{
    set("organization",v);
    if(v){ set("tenant","tenant-auto"); set("tenant_name","Otomatik Kiracı"); }
    else { set("tenant",""); set("tenant_name",""); }
  };
  const onBuyerChange = v=>{
    set("buyer",v);
    if(!v){ set("buyer_name",""); set("buyer_company",""); set("buyer_email",""); }
    else { set("buyer_name","Alıcı Adı"); set("buyer_company","Alıcı Şirketi"); set("buyer_email","alici@sirket.com"); }
  };
  const onTenantChange = v=>{ set("tenant",v); if(!v)set("tenant_name",""); };

  const onRequireAllItems = v=>{
    set("require_all_items",v);
    if(v) set("allow_partial_quotes",0);
  };
  const onAllowPartial = v=>{
    set("allow_partial_quotes",v);
    if(v) set("require_all_items",0);
  };

  const onViewLimitedChange = v=>{
    set("is_view_limited",v);
    if(!v){ set("max_views",0); set("views_remaining",0); }
  };
  const onMaxViewsChange = v=>{
    set("max_views",v);
    const rem = Math.max(0,(v||0)-(doc.current_views||0));
    set("views_remaining",rem);
  };

  /* ── Child table: items ── */
  const addItem = ()=>set("items",[...doc.items,{listing:"",item_name:"",category:"",qty:1,uom:"Adet",target_price:0,currency:"TRY"}]);
  const delItem = i=>set("items",doc.items.filter((_,idx)=>idx!==i));
  const setItem = (i,key,val)=>{
    const items=[...doc.items];
    items[i]={...items[i],[key]:val};
    // rfq.js: listing change → autofill
    if(key==="listing"&&val){ items[i]={...items[i],item_name:"Ürün Adı",category:"Kategori",target_price:100,currency:"TRY",uom:"Adet"}; }
    // rfq.js: qty<=0 guard
    if(key==="qty"&&Number(val)<=0){ items[i].qty=1; showToast("Miktar sıfırdan büyük olmalı","warn"); }
    set("items",items);
  };

  /* ── Child table: target_sellers, target_categories ── */
  const addSeller=()=>set("target_sellers",[...doc.target_sellers,{seller:""}]);
  const delSeller=i=>set("target_sellers",doc.target_sellers.filter((_,idx)=>idx!==i));
  const setSeller=(i,v)=>{ const a=[...doc.target_sellers]; a[i]={seller:v}; set("target_sellers",a); };

  const addCat=()=>set("target_categories",[...doc.target_categories,{category:""}]);
  const delCat=i=>set("target_categories",doc.target_categories.filter((_,idx)=>idx!==i));
  const setCat=(i,v)=>{ const a=[...doc.target_categories]; a[i]={category:v}; set("target_categories",a); };

  /* ── rfq.py: validate ── */
  const validate = ()=>{
    const e={};
    if(!doc.title) e.title="Başlık zorunludur";
    if(!doc.buyer) e.buyer="Alıcı zorunludur";
    if(doc.requires_nda&&!doc.nda_template) e.nda_template="NDA şablonu zorunludur";
    if(doc.target_type==="Selected"&&!doc.target_sellers.length) e.target_sellers="En az bir satıcı seçilmeli";
    if(doc.target_type==="Category"&&!doc.target_categories.length) e.target_categories="En az bir kategori seçilmeli";
    if(doc.is_view_limited&&!doc.max_views) e.max_views="Maksimum görüntüleme sayısı gerekli";
    setErrs(e);
    return Object.keys(e).length===0;
  };

  /* ── rfq.py: whitelist methods ── */
  const doTransition = (targetStatus,reason="")=>{
    if(targetStatus==="Published"&&!doc.deadline){ showToast("Yayınlamak için son tarih gerekli","warn"); setModal(null); return; }
    const updates={status:targetStatus};
    if(targetStatus==="Published") updates.published_at=new Date().toISOString();
    if(["Closed","Cancelled"].includes(targetStatus)){ updates.closed_at=new Date().toISOString(); updates.closed_reason=reason; }
    setDoc(d=>({...d,...updates})); setModal(null);
    showToast(`Durum: ${STATUS_CFG[targetStatus]?.label}`);
    onSave&&onSave({...doc,...updates});
  };

  const handleSave = ()=>{
    if(!validate())return;
    const saved={...doc, name:doc.name||`RFQ-2026-${String(Date.now()).slice(-5)}`};
    onSave&&onSave(saved);
    setDirty(false);
    showToast("Kaydedildi");
  };

  const canEdit = ["Draft"].includes(doc.status)||isNew;
  const avail   = TRANSITIONS[doc.status]||[];
  const vp      = viewPct(doc);
  const dl      = daysleft(doc.deadline);
  const isActive= ["Published","Quoting","Negotiation"].includes(doc.status);
  const isTerm  = ["Accepted","Ordered","Closed","Cancelled"].includes(doc.status);

  const TABS = [
    {key:"details",      label:"Detaylar",     icon:"📋"},
    {key:"items",        label:"Ürünler",       icon:"📦", badge:doc.items?.length||null},
    {key:"requirements", label:"Gereksinimler", icon:"📐"},
    {key:"documents",    label:"Belgeler",      icon:"📁", badge:doc.requires_nda?"NDA":null},
    {key:"outcome",      label:"Sonuç",         icon:"🏁"},
  ];

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflow:"hidden"}}>

      {/* ── Topbar ── */}
      <div style={{background:T.surface,borderBottom:`1px solid ${T.border}`,padding:"10px 20px",
        display:"flex",alignItems:"center",gap:12,flexShrink:0,zIndex:10}}>
        <button onClick={onBack}
          style={{padding:"5px 10px",border:`1px solid ${T.border}`,borderRadius:6,background:"none",
            cursor:"pointer",color:T.textMid,fontSize:12,fontWeight:600,fontFamily:"inherit"}}>
          ← Geri
        </button>
        <span style={{fontFamily:"monospace",fontSize:10,color:T.textFaint,background:T.bgDeep,
          padding:"2px 7px",borderRadius:4,flexShrink:0}}>
          {doc.rfq_code||"Yeni RFQ"}
        </span>
        <h2 style={{margin:0,fontSize:14,fontWeight:800,color:T.text,flex:1,
          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
          {doc.title||"İsimsiz RFQ"}
        </h2>
        <StatusBadge status={doc.status} size="lg"/>
        <div style={{display:"flex",gap:8}}>
          {doc.status==="Draft"&&!isNew&&avail.includes("Published")&&(
            <Btn variant="gold" icon="📢" onClick={()=>setModal({status:"Published"})}>Yayınla</Btn>
          )}
          {dirty&&<Btn variant="primary" icon="💾" onClick={handleSave}>Kaydet</Btn>}
        </div>
      </div>

      {/* ── Alerts ── */}
      {(doc.is_view_limited&&doc.current_views>=doc.max_views&&doc.max_views>0)||
       (isActive&&dl!==null&&dl<0)||(isActive&&dl!==null&&dl<=3&&dl>=0)?
        <div style={{padding:"8px 20px",display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
          {doc.is_view_limited&&doc.current_views>=doc.max_views&&doc.max_views>0&&(
            <div style={{background:"#2a2200",border:`1px solid ${T.amber}40`,borderRadius:6,padding:"7px 12px",fontSize:12,color:T.amber}}>
              ⚠️ Maksimum görüntüleme limitine ulaşıldı. Yeni satıcılar bu RFQ'yu göremez.
            </div>
          )}
          {isActive&&dl!==null&&dl<0&&(
            <div style={{background:T.redDim,border:`1px solid ${T.red}40`,borderRadius:6,padding:"7px 12px",fontSize:12,color:T.red}}>
              🔴 Son başvuru tarihi geçti. RFQ'yu kapatmayı değerlendirin.
            </div>
          )}
          {isActive&&dl!==null&&dl<=3&&dl>=0&&(
            <div style={{background:T.amberDim,border:`1px solid ${T.amber}40`,borderRadius:6,padding:"7px 12px",fontSize:12,color:T.amber}}>
              🟡 Son başvuru tarihine {dl===0?"bugün":`${dl} gün`} kaldı.
            </div>
          )}
        </div>:null
      }

      {/* ── Workflow bar ── */}
      {!isNew&&(
        <div style={{padding:"12px 20px 6px",flexShrink:0}}>
          <WorkflowBar status={doc.status} onTransition={s=>setModal({status:s})}/>
        </div>
      )}

      {/* ── Stats strip ── */}
      {!isNew&&(
        <div style={{display:"flex",alignItems:"center",background:T.surface,
          borderTop:`1px solid ${T.border}`,borderBottom:`1px solid ${T.border}`,
          overflowX:"auto",flexShrink:0}}>
          {[
            {v:doc.quote_count||0,   l:"Teklif"},
            {v:doc.current_views||0, l:"Görüntüleme"},
            doc.is_view_limited?{v:`${vp}%`,l:"Limit",warn:vp>=90}:null,
            {v:doc.target_type||"—", l:"Hedef"},
            {v:fmtD(doc.created_date),l:"Oluşturuldu"},
            doc.requires_nda?{v:"NDA",l:"Zorunlu",nda:true}:null,
          ].filter(Boolean).map((s,i,arr)=>(
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:"center",
              padding:"8px 18px",borderRight:i<arr.length-1?`1px solid ${T.border}`:"none"}}>
              <div style={{fontSize:s.nda?10:18,fontWeight:900,color:s.warn?T.red:s.nda?T.amber:T.text,
                background:s.nda?T.amberDim:"none",padding:s.nda?"2px 6px":0,borderRadius:s.nda?3:0}}>
                {s.v}
              </div>
              <div style={{fontSize:9,color:T.textFaint,textTransform:"uppercase",letterSpacing:".05em",marginTop:1}}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{display:"flex",borderBottom:`1px solid ${T.border}`,
        background:T.surface,padding:"0 20px",overflowX:"auto",flexShrink:0}}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{display:"inline-flex",alignItems:"center",gap:6,
              padding:"10px 14px",fontSize:12,fontWeight:600,background:"none",border:"none",
              borderBottom:`2px solid ${tab===t.key?T.purple:"transparent"}`,
              marginBottom:-1,cursor:"pointer",whiteSpace:"nowrap",
              color:tab===t.key?T.purple:T.textMid,fontFamily:"inherit",
              transition:"color .15s",
            }}>
            <span>{t.icon}</span>{t.label}
            {t.badge&&<span style={{fontSize:9,fontWeight:800,padding:"1px 5px",borderRadius:999,
              background:tab===t.key?T.purpleGlow:T.surfaceUp,color:tab===t.key?T.purple:T.textFaint}}>
              {t.badge}
            </span>}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{flex:1,overflowY:"auto",padding:20,display:"flex",flexDirection:"column",gap:16}}>

        {/* ══ DETAILS TAB ══ */}
        {tab==="details"&&<>
          {/* basic_section */}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:18}}>
            <SectionHead title="Temel Bilgiler"/>
            <Grid>
              <Field label="Başlık" required>
                <Input value={doc.title} onChange={v=>set("title",v)} disabled={!canEdit} placeholder="Teklif talebi başlığı"/>
                {errors.title&&<span style={{fontSize:10,color:T.red}}>{errors.title}</span>}
              </Field>
              <Field label="RFQ Kodu">
                <Input value={doc.rfq_code} disabled placeholder="Otomatik üretilir"/>
              </Field>
              <Field label="Seri Numarası" note="rfq.json: autoname by naming_series">
                <Input value={doc.naming_series} disabled/>
              </Field>
              <Field label="Durum">
                <StatusBadge status={doc.status} size="lg"/>
              </Field>
            </Grid>
            <div style={{marginTop:12}}/>
            <Grid>
              <Field label="Alıcı" required>
                <Input value={doc.buyer} onChange={onBuyerChange} disabled={!canEdit} placeholder="Alıcı profili seçin"/>
                {errors.buyer&&<span style={{fontSize:10,color:T.red}}>{errors.buyer}</span>}
              </Field>
              <Field label="Kategori">
                <Input value={doc.category} onChange={v=>set("category",v)} disabled={!canEdit} placeholder="Kategori"/>
              </Field>
            </Grid>
            {/* fetch_from fields */}
            <div style={{marginTop:12,background:T.bgDeep,border:`1px solid ${T.borderLo}`,borderRadius:7,padding:12}}>
              <div style={{fontSize:10,color:T.textFaint,fontWeight:700,textTransform:"uppercase",letterSpacing:".06em",marginBottom:8}}>
                Alıcı Bilgileri <span style={{fontWeight:400,fontStyle:"italic"}}>(fetch_from: buyer)</span>
              </div>
              <Grid cols={3}>
                <Field label="Alıcı Adı"><Input value={doc.buyer_name} disabled/></Field>
                <Field label="Şirket"><Input value={doc.buyer_company} disabled/></Field>
                <Field label="E-posta"><Input value={doc.buyer_email} disabled/></Field>
              </Grid>
            </div>
            {/* Org & Tenant */}
            <div style={{marginTop:12}}/>
            <Grid>
              <Field label="Organizasyon" note="rfq.js: organization→tenant otofill">
                <Input value={doc.organization} onChange={onOrganizationChange} disabled={!canEdit} placeholder="Organizasyon"/>
              </Field>
              <Field label="Kiracı" note="fetch_from: tenant.tenant_name">
                <Input value={doc.tenant} onChange={onTenantChange}
                  disabled={!canEdit||!!doc.organization} placeholder="Kiracı"/>
              </Field>
            </Grid>
            <div style={{marginTop:10}}/>
            <Grid>
              <Field label="Kiracı Adı">
                <Input value={doc.tenant_name} disabled/>
              </Field>
              <Field label="Para Birimi">
                <Select value={doc.currency} onChange={v=>set("currency",v)} disabled={!canEdit}
                  options={["TRY","USD","EUR","GBP"]}/>
              </Field>
            </Grid>
            {doc.published_at&&<div style={{marginTop:10}}>
              <Field label="Yayınlanma Tarihi"><Input value={fmtDt(doc.published_at)} disabled/></Field>
            </div>}
          </div>

          {/* description_section */}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:18}}>
            <SectionHead title="Açıklama"/>
            <Field label="Açıklama">
              <Textarea value={doc.description} onChange={v=>set("description",v)}
                disabled={!canEdit} rows={5} placeholder="Teklif talebini detaylı açıklayın..."/>
            </Field>
          </div>

          {/* View limiting */}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:18}}>
            <SectionHead title="Görüntüleme Limiti"/>
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              <Toggle checked={doc.is_view_limited} onChange={onViewLimitedChange}
                disabled={!canEdit} label="Görüntüleme Limiti Aktif"/>
              {!!doc.is_view_limited&&<>
                <Grid>
                  <Field label="Maksimum Görüntüleme" required>
                    <Input value={doc.max_views} onChange={onMaxViewsChange}
                      type="number" min="1" disabled={!canEdit}/>
                    {errors.max_views&&<span style={{fontSize:10,color:T.red}}>{errors.max_views}</span>}
                  </Field>
                  <Field label="Mevcut Görüntüleme">
                    <Input value={doc.current_views} disabled/>
                  </Field>
                  <Field label="Kalan Görüntüleme">
                    <Input value={doc.views_remaining||Math.max(0,(doc.max_views||0)-(doc.current_views||0))} disabled/>
                  </Field>
                </Grid>
                {doc.max_views>0&&(
                  <div>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:T.textMid,marginBottom:5}}>
                      <span>Limit Kullanımı</span>
                      <span style={{color:vp>=90?T.red:vp>=70?T.amber:T.green,fontWeight:700}}>{vp}%</span>
                    </div>
                    <div style={{height:6,background:T.bgDeep,borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",width:`${vp}%`,
                        background:vp>=90?T.red:vp>=70?T.amber:T.purple,
                        borderRadius:3,transition:"width .4s"}}/>
                    </div>
                  </div>
                )}
              </>}
            </div>
          </div>
        </>}

        {/* ══ ITEMS TAB ══ */}
        {tab==="items"&&<>
          {/* items_section */}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:18}}>
            <SectionHead title="Talep Edilen Ürünler (RFQ Item)"
              action={canEdit&&<Btn small variant="ghost" onClick={addItem} icon="＋">Ürün Ekle</Btn>}
            />
            <div style={{display:"flex",gap:16,marginBottom:12}}>
              <Toggle checked={doc.require_all_items} onChange={onRequireAllItems}
                disabled={!canEdit} label="Tüm ürünler zorunlu"/>
              <Toggle checked={doc.allow_partial_quotes} onChange={onAllowPartial}
                disabled={!canEdit} label="Kısmi teklif kabul"/>
            </div>
            {/* Child table */}
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
                <thead>
                  <tr style={{borderBottom:`2px solid ${T.border}`}}>
                    {["#","Listeleme","Ürün Adı","Kategori","Miktar","Birim","Hedef Fiyat","Para Birimi",""].map(h=>(
                      <th key={h} style={{textAlign:"left",padding:"8px 10px",fontSize:10,fontWeight:700,
                        textTransform:"uppercase",letterSpacing:".06em",color:T.textFaint,whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {doc.items?.length===0&&(
                    <tr><td colSpan={9} style={{textAlign:"center",padding:32,color:T.textFaint,fontSize:13}}>
                      Henüz ürün eklenmedi
                    </td></tr>
                  )}
                  {doc.items?.map((item,i)=>(
                    <tr key={i} style={{borderBottom:`1px solid ${T.borderLo}`}}>
                      <td style={{padding:"8px 10px",color:T.textFaint,fontWeight:700,fontSize:11}}>{i+1}</td>
                      <td style={{padding:"4px 6px",minWidth:110}}>
                        <Input value={item.listing} onChange={v=>setItem(i,"listing",v)} disabled={!canEdit} placeholder="L-001"/>
                      </td>
                      <td style={{padding:"4px 6px",minWidth:130}}>
                        <Input value={item.item_name} onChange={v=>setItem(i,"item_name",v)} disabled={!canEdit} placeholder="Ürün adı"/>
                      </td>
                      <td style={{padding:"4px 6px",minWidth:100}}>
                        <Input value={item.category} onChange={v=>setItem(i,"category",v)} disabled={!canEdit} placeholder="Kategori"/>
                      </td>
                      <td style={{padding:"4px 6px",width:80}}>
                        <Input value={item.qty} onChange={v=>setItem(i,"qty",v)} type="number" min="1" disabled={!canEdit}/>
                      </td>
                      <td style={{padding:"4px 6px",width:80}}>
                        <Input value={item.uom} onChange={v=>setItem(i,"uom",v)} disabled={!canEdit} placeholder="Adet"/>
                      </td>
                      <td style={{padding:"4px 6px",width:110}}>
                        <Input value={item.target_price} onChange={v=>setItem(i,"target_price",v)} type="number" disabled={!canEdit}/>
                      </td>
                      <td style={{padding:"4px 6px",width:70}}>
                        <Input value={item.currency} onChange={v=>setItem(i,"currency",v)} disabled={!canEdit} placeholder="TRY"/>
                      </td>
                      <td style={{padding:"4px 6px"}}>
                        {canEdit&&<button onClick={()=>delItem(i)}
                          style={{background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:14,padding:"2px 5px"}}>✕</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* targeting_section */}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:18}}>
            <SectionHead title="Satıcı Hedefleme"/>
            <Field label="Hedef Tipi" note="Public: Tüm satıcılar · Category: Kategoriye özel · Selected: Davetli satıcılar">
              <div style={{display:"flex",gap:10}}>
                {[["Public","🌐","Herkese Açık"],["Category","📂","Kategoriye Özel"],["Selected","👥","Seçili Satıcılar"]].map(([v,icon,l])=>(
                  <div key={v} onClick={()=>canEdit&&set("target_type",v)}
                    style={{flex:1,padding:"10px 12px",borderRadius:8,cursor:canEdit?"pointer":"default",
                      border:`1.5px solid ${doc.target_type===v?T.purple:T.border}`,
                      background:doc.target_type===v?T.purpleGlow:T.surfaceUp,
                      transition:"all .15s"}}>
                    <div style={{fontSize:18,marginBottom:4}}>{icon}</div>
                    <div style={{fontSize:12,fontWeight:700,color:doc.target_type===v?T.purple:T.textMid}}>{l}</div>
                  </div>
                ))}
              </div>
            </Field>

            {doc.target_type==="Selected"&&(
              <div style={{marginTop:14}}>
                <SectionHead title="Hedef Satıcılar (RFQ Target Seller)"
                  action={canEdit&&<Btn small variant="ghost" onClick={addSeller} icon="＋">Satıcı Ekle</Btn>}/>
                {errors.target_sellers&&<div style={{color:T.red,fontSize:11,marginBottom:8}}>{errors.target_sellers}</div>}
                {doc.target_sellers.map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
                    <Input value={s.seller} onChange={v=>setSeller(i,v)} disabled={!canEdit} placeholder="Satıcı ID"/>
                    {canEdit&&<button onClick={()=>delSeller(i)}
                      style={{background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:14}}>✕</button>}
                  </div>
                ))}
              </div>
            )}
            {doc.target_type==="Category"&&(
              <div style={{marginTop:14}}>
                <SectionHead title="Hedef Kategoriler (RFQ Target Category)"
                  action={canEdit&&<Btn small variant="ghost" onClick={addCat} icon="＋">Kategori Ekle</Btn>}/>
                {errors.target_categories&&<div style={{color:T.red,fontSize:11,marginBottom:8}}>{errors.target_categories}</div>}
                {doc.target_categories.map((c,i)=>(
                  <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
                    <Input value={c.category} onChange={v=>setCat(i,v)} disabled={!canEdit} placeholder="Kategori"/>
                    {canEdit&&<button onClick={()=>delCat(i)}
                      style={{background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:14}}>✕</button>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>}

        {/* ══ REQUIREMENTS TAB ══ */}
        {tab==="requirements"&&<>
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:18}}>
            <SectionHead title="Gereksinimler"/>
            <Grid>
              <Field label="Teklif Son Tarihi" note="rfq.py: deadline reqd for publish">
                <Input value={doc.deadline} onChange={v=>set("deadline",v)} type="datetime-local" disabled={!canEdit}/>
              </Field>
              <Field label="Son Başvuru Tarihi">
                <Input value={doc.submission_deadline} onChange={v=>set("submission_deadline",v)} type="datetime-local" disabled={!canEdit}/>
              </Field>
              <Field label="Toplam Miktar">
                <Input value={doc.quantity} onChange={v=>set("quantity",v)} type="number" min="0" disabled={!canEdit}/>
              </Field>
              <Field label="Birim">
                <Select value={doc.unit} onChange={v=>set("unit",v)} disabled={!canEdit}
                  options={[{value:"",label:"Seçin..."},{value:"Adet",label:"Adet"},{value:"kg",label:"kg"},{value:"lt",label:"lt"},{value:"m",label:"m"},{value:"m²",label:"m²"}]}/>
              </Field>
            </Grid>
            <div style={{marginTop:12}}/>
            <Grid>
              <Field label="Minimum Bütçe">
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",
                    color:T.textFaint,fontSize:12,pointerEvents:"none"}}>₺</span>
                  <input value={doc.budget_min||""} onChange={e=>set("budget_min",e.target.value)}
                    type="number" min="0" disabled={!canEdit}
                    style={{width:"100%",paddingLeft:22,padding:"8px 10px 8px 22px",
                      background:!canEdit?T.bgDeep:T.surfaceUp,border:`1px solid ${T.border}`,
                      borderRadius:6,color:T.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                </div>
              </Field>
              <Field label="Maksimum Bütçe">
                <div style={{position:"relative"}}>
                  <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",
                    color:T.textFaint,fontSize:12,pointerEvents:"none"}}>₺</span>
                  <input value={doc.budget_max||""} onChange={e=>set("budget_max",e.target.value)}
                    type="number" min="0" disabled={!canEdit}
                    style={{width:"100%",padding:"8px 10px 8px 22px",
                      background:!canEdit?T.bgDeep:T.surfaceUp,border:`1px solid ${T.border}`,
                      borderRadius:6,color:T.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
                </div>
              </Field>
            </Grid>
          </div>

          {/* delivery_section */}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:18}}>
            <SectionHead title="Teslimat"/>
            <Grid>
              <Field label="Beklenen Teslimat Tarihi">
                <Input value={doc.delivery_date} onChange={v=>set("delivery_date",v)} type="date" disabled={!canEdit}/>
              </Field>
              <Field label="Teslimat Yeri">
                <Input value={doc.delivery_location} onChange={v=>set("delivery_location",v)} disabled={!canEdit} placeholder="Şehir veya adres"/>
              </Field>
            </Grid>
          </div>
        </>}

        {/* ══ DOCUMENTS TAB ══ */}
        {tab==="documents"&&<>
          {/* nda_section */}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:18}}>
            <SectionHead title="NDA Gereksinimleri"/>
            <div style={{
              padding:14,borderRadius:8,marginBottom:14,
              border:`1.5px solid ${doc.requires_nda?T.purple:T.border}`,
              background:doc.requires_nda?T.purpleGlow:T.surfaceUp,
              transition:"all .15s"
            }}>
              <Toggle checked={doc.requires_nda} onChange={v=>set("requires_nda",v)}
                disabled={!canEdit}
                label="NDA Zorunlu — Satıcılar detayları görmeden önce imzalamalı"/>
            </div>
            {!!doc.requires_nda&&(
              <Field label="NDA Şablonu" required note="rfq.json: mandatory_depends_on requires_nda">
                <Input value={doc.nda_template} onChange={v=>set("nda_template",v)}
                  disabled={!canEdit} placeholder="Contract Template seçin"/>
                {errors.nda_template&&<span style={{fontSize:10,color:T.red}}>{errors.nda_template}</span>}
              </Field>
            )}
          </div>

          {/* attachments_section — RFQ Attachment child table */}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:18}}>
            <SectionHead title="Ekler (RFQ Attachment)"
              action={canEdit&&(
                <Btn small variant="ghost" icon="＋"
                  onClick={()=>set("attachments",[...doc.attachments,{file_name:"",file_url:"",description:""}])}>
                  Ek Ekle
                </Btn>
              )}/>
            {doc.attachments?.length===0&&(
              <div style={{textAlign:"center",padding:24,color:T.textFaint,fontSize:13}}>Ek bulunamadı</div>
            )}
            {doc.attachments?.map((a,i)=>(
              <div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
                <Input value={a.file_name}
                  onChange={v=>{const arr=[...doc.attachments];arr[i]={...arr[i],file_name:v};set("attachments",arr);}}
                  disabled={!canEdit} placeholder="Dosya adı"/>
                <Input value={a.file_url}
                  onChange={v=>{const arr=[...doc.attachments];arr[i]={...arr[i],file_url:v};set("attachments",arr);}}
                  disabled={!canEdit} placeholder="URL"/>
                <Input value={a.description}
                  onChange={v=>{const arr=[...doc.attachments];arr[i]={...arr[i],description:v};set("attachments",arr);}}
                  disabled={!canEdit} placeholder="Açıklama"/>
                {canEdit&&<button onClick={()=>set("attachments",doc.attachments.filter((_,j)=>j!==i))}
                  style={{background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:14,flexShrink:0}}>✕</button>}
              </div>
            ))}
          </div>
        </>}

        {/* ══ OUTCOME TAB ══ */}
        {tab==="outcome"&&(
          isTerm?(
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:18}}>
              <SectionHead title="Sonuç"/>
              <Grid>
                <Field label="Kabul Edilen Teklif" note="rfq.json: link → RFQ Quote">
                  <Input value={doc.accepted_quote} onChange={v=>set("accepted_quote",v)} disabled={!canEdit} placeholder="QUOTE-2026-..."/>
                </Field>
                <Field label="Kapatılma Tarihi">
                  <Input value={doc.closed_at?fmtDt(doc.closed_at):""} disabled/>
                </Field>
              </Grid>
              <div style={{marginTop:12}}/>
              <Field label="Kapatma Nedeni">
                <Input value={doc.closed_reason} onChange={v=>set("closed_reason",v)}
                  disabled={doc.status==="Closed"||doc.status==="Cancelled"} placeholder="Kapatma nedeni"/>
              </Field>
            </div>
          ):(
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
              gap:12,padding:"60px 20px",background:T.surface,
              border:`1px solid ${T.border}`,borderRadius:10,textAlign:"center"}}>
              <span style={{fontSize:48}}>⏳</span>
              <h3 style={{margin:0,fontSize:16,fontWeight:800,color:T.textMid}}>Henüz Sonuçlanmadı</h3>
              <p style={{margin:0,fontSize:13,color:T.textFaint}}>RFQ kabul edildiğinde veya kapatıldığında sonuç görünecek.</p>
              {doc.quote_count>0&&(
                <div style={{display:"inline-flex",alignItems:"center",gap:8,background:T.purpleGlow,
                  border:`1px solid ${T.purple}40`,borderRadius:999,padding:"6px 18px",
                  fontSize:13,color:T.purple,fontWeight:700}}>
                  <strong style={{fontSize:20}}>{doc.quote_count}</strong> teklif alındı
                </div>
              )}
            </div>
          )
        )}

        {/* ── Workflow action buttons ── */}
        {!isNew&&avail.length>0&&(
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,padding:16}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",
              color:T.textFaint,marginBottom:12}}>İşlemler</div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              {avail.map(s=>{
                const c=STATUS_CFG[s];
                const isDanger=["Cancelled"].includes(s);
                const isWarn=["Closed"].includes(s);
                return (
                  <Btn key={s} variant={isDanger?"danger":isWarn?"ghost":"primary"}
                    onClick={()=>setModal({status:s})}>
                    {c.label}
                  </Btn>
                );
              })}
            </div>
          </div>
        )}

      </div>{/* end tab content */}

      {/* ── Transition Modal ── */}
      {modal&&(
        <TransitionModal
          target={modal.status}
          onConfirm={reason=>doTransition(modal.status,reason)}
          onCancel={()=>setModal(null)}/>
      )}

      {/* ── Toast ── */}
      {toast&&(
        <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",
          background:toast.type==="warn"?T.amberDim:toast.type==="err"?T.redDim:T.surfaceHi,
          border:`1px solid ${toast.type==="warn"?T.amber:toast.type==="err"?T.red:T.purple}40`,
          color:toast.type==="warn"?T.amber:toast.type==="err"?T.red:T.text,
          padding:"9px 20px",borderRadius:999,fontSize:12,fontWeight:600,
          zIndex:200,whiteSpace:"nowrap",boxShadow:"0 4px 20px rgba(0,0,0,.5)"}}>
          {toast.type==="ok"?"✓ ":toast.type==="warn"?"⚠ ":""}{toast.msg}
        </div>
      )}
    </div>
  );
};

/* ── Status Transition Modal ── */
const TransitionModal = ({target,onConfirm,onCancel})=>{
  const [reason,setReason]=useState("");
  const cfg=STATUS_CFG[target]||{};
  const needsReason=["Closed","Cancelled"].includes(target);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.7)",display:"flex",
      alignItems:"center",justifyContent:"center",zIndex:100,backdropFilter:"blur(4px)"}}>
      <div style={{background:T.surfaceUp,border:`1px solid ${T.border}`,borderRadius:14,
        padding:28,width:"min(400px,90vw)",boxShadow:"0 24px 64px rgba(0,0,0,.6)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <span style={{fontSize:11,fontWeight:800,background:cfg.bg,color:cfg.color,
            padding:"3px 9px",borderRadius:4}}>{cfg.label}</span>
          <h3 style={{margin:0,fontSize:15,fontWeight:800,color:T.text}}>
            {target==="Published"?"RFQ'yu Yayınla":
             target==="Quoting"?"Teklife Aç":
             target==="Negotiation"?"Müzakereye Geç":
             target==="Accepted"?"Teklifi Kabul Et":
             target==="Ordered"?"Sipariş Ver":
             target==="Closed"?"RFQ'yu Kapat":"RFQ'yu İptal Et"}
          </h3>
        </div>
        <p style={{margin:"0 0 16px",fontSize:13,color:T.textMid,lineHeight:1.6}}>
          {target==="Published"?"Satıcılar bu RFQ'yu görüp teklif verebilecek.":
           target==="Closed"?"Bu işlem geri alınamaz. Tüm teklifler dondurulacak.":
           target==="Cancelled"?"RFQ iptal edilecek ve satıcılar bilgilendirilecek.":
           `Durum "${cfg.label}" olarak güncellenecek.`}
        </p>
        {needsReason&&(
          <div style={{marginBottom:16}}>
            <label style={{fontSize:11,fontWeight:700,color:T.textFaint,textTransform:"uppercase",
              letterSpacing:".05em",display:"block",marginBottom:5}}>Neden (opsiyonel)</label>
            <input value={reason} onChange={e=>setReason(e.target.value)}
              placeholder="Açıklama girin..."
              style={{width:"100%",padding:"8px 10px",background:T.surfaceUp,border:`1px solid ${T.border}`,
                borderRadius:7,color:T.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
          </div>
        )}
        <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
          <Btn onClick={onCancel}>İptal</Btn>
          <Btn variant="primary" onClick={()=>onConfirm(reason)}>Onayla</Btn>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   LIST PAGE
════════════════════════════════════════════════════════════════════════════ */
const ListPage = ({list, onOpen, onNew})=>{
  const [search,  setSearch]  = useState("");
  const [statusF, setStatusF] = useState("");
  const [hovRow,  setHovRow]  = useState(null);

  const filtered = list.filter(r=>{
    if(statusF&&r.status!==statusF) return false;
    if(search&&!r.title.toLowerCase().includes(search.toLowerCase())&&
       !r.rfq_code.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = list.reduce((a,r)=>{a[r.status]=(a[r.status]||0)+1;return a},{});

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",overflowY:"auto"}}>

      {/* Breadcrumb */}
      <div style={{padding:"10px 20px 0",display:"flex",alignItems:"center",gap:6}}>
        <span style={{fontSize:11,color:T.textFaint}}>Ana Sayfa</span>
        <span style={{fontSize:11,color:T.textFaint}}>›</span>
        <span style={{fontSize:11,color:T.textMid,fontWeight:600}}>Liste</span>
      </div>

      {/* Header */}
      <div style={{padding:"12px 20px 0",display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
        <div>
          <h1 style={{margin:0,fontSize:20,fontWeight:900,color:T.text,letterSpacing:"-.01em"}}>RFQ</h1>
          <div style={{fontSize:12,color:T.textFaint,marginTop:2}}>{filtered.length} kayıt bulundu</div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <Btn variant="ghost" icon="↻">Yenile</Btn>
          <Btn variant="primary" icon="＋" onClick={onNew}>Yeni Ekle</Btn>
        </div>
      </div>

      {/* Status stat chips */}
      <div style={{padding:"12px 20px 0",display:"flex",gap:8,flexWrap:"wrap"}}>
        {Object.entries(counts).map(([s,c])=>{
          const cfg=STATUS_CFG[s];
          const isActive=statusF===s;
          return (
            <div key={s} onClick={()=>setStatusF(isActive?"":s)}
              style={{display:"flex",alignItems:"center",gap:7,
                background:isActive?cfg.bg:T.surface,
                border:`1px solid ${isActive?cfg.dot:T.border}`,
                borderRadius:7,padding:"5px 12px",cursor:"pointer",transition:"all .15s"}}>
              <span style={{fontSize:16,fontWeight:900,color:cfg.color}}>{c}</span>
              <span style={{fontSize:11,color:isActive?cfg.color:T.textMid,fontWeight:600}}>{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div style={{padding:"10px 20px",display:"flex",gap:10,alignItems:"center"}}>
        <div style={{position:"relative",flex:1,maxWidth:480}}>
          <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",
            fontSize:13,color:T.textFaint,pointerEvents:"none"}}>🔍</span>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="RFQ ara..."
            style={{width:"100%",padding:"8px 10px 8px 32px",background:T.surfaceUp,
              border:`1px solid ${T.border}`,borderRadius:8,color:T.text,fontSize:12,
              outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
        </div>
        <select value={statusF} onChange={e=>setStatusF(e.target.value)}
          style={{padding:"8px 28px 8px 10px",background:T.surfaceUp,border:`1px solid ${T.border}`,
            borderRadius:8,color:statusF?T.text:T.textFaint,fontSize:12,outline:"none",
            fontFamily:"inherit",appearance:"none",cursor:"pointer",
            backgroundImage:`url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235a5a7a' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center"}}>
          <option value="">Tüm Durumlar</option>
          {Object.entries(STATUS_CFG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        {(search||statusF)&&(
          <button onClick={()=>{setSearch("");setStatusF("");}}
            style={{padding:"7px 12px",border:`1px solid ${T.border}`,borderRadius:7,
              background:"none",cursor:"pointer",fontSize:11,fontWeight:600,color:T.textFaint,fontFamily:"inherit"}}>
            Temizle
          </button>
        )}
        <select style={{padding:"8px 28px 8px 10px",background:T.surfaceUp,border:`1px solid ${T.border}`,
            borderRadius:8,color:T.textMid,fontSize:12,outline:"none",fontFamily:"inherit",
            appearance:"none",cursor:"pointer",
            backgroundImage:`url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%235a5a7a' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
            backgroundRepeat:"no-repeat",backgroundPosition:"right 8px center"}}>
          <option>Son Düzenlenen</option>
          <option>En Yeni</option>
          <option>En Eski</option>
        </select>
      </div>

      {/* Table */}
      <div style={{margin:"0 20px 20px",background:T.surface,border:`1px solid ${T.border}`,
        borderRadius:10,overflow:"hidden",flex:1}}>
        {filtered.length===0?(
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",
            justifyContent:"center",padding:"80px 20px",gap:14}}>
            <span style={{fontSize:48,opacity:.3}}>📭</span>
            <h3 style={{margin:0,fontSize:16,fontWeight:700,color:T.textMid}}>Henüz kayıt yok</h3>
            <p style={{margin:0,fontSize:13,color:T.textFaint,textAlign:"center"}}>
              {search||statusF?"Filtre kriterlerine uygun sonuç bulunamadı.":"İlk Rfq kaydınızı oluşturun"}
            </p>
            {!search&&!statusF&&<Btn variant="primary" icon="＋" onClick={onNew}>Yeni Ekle</Btn>}
          </div>
        ):(
          <table style={{width:"100%",borderCollapse:"collapse"}}>
            <thead>
              <tr style={{borderBottom:`1px solid ${T.border}`,background:T.bgDeep}}>
                {["RFQ Kodu","Başlık","Alıcı / Şirket","Durum","Hedef","Teklifler","Son Tarih","Görüntüleme",""].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"9px 12px",fontSize:10,fontWeight:700,
                    textTransform:"uppercase",letterSpacing:".06em",color:T.textFaint,whiteSpace:"nowrap"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((r,i)=>{
                const dl=daysleft(r.deadline);
                const pct=viewPct(r);
                const isHov=hovRow===r.name;
                return (
                  <tr key={r.name}
                    onClick={()=>onOpen(r)}
                    onMouseEnter={()=>setHovRow(r.name)}
                    onMouseLeave={()=>setHovRow(null)}
                    style={{borderBottom:`1px solid ${T.borderLo}`,cursor:"pointer",
                      background:isHov?T.surfaceHi:i%2===0?T.surface:"#1b1b22",
                      transition:"background .1s"}}>
                    {/* RFQ Code */}
                    <td style={{padding:"10px 12px"}}>
                      <span style={{fontFamily:"monospace",fontSize:10,color:T.textFaint,
                        background:T.bgDeep,padding:"2px 6px",borderRadius:4}}>
                        {r.rfq_code.slice(-12)}
                      </span>
                    </td>
                    {/* Title */}
                    <td style={{padding:"10px 12px",maxWidth:200}}>
                      <div style={{display:"flex",alignItems:"center",gap:6}}>
                        <span style={{fontSize:13,fontWeight:700,color:T.text,
                          overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:180}}>
                          {r.title}
                        </span>
                        {r.requires_nda&&<Pill color={T.amber} bg={T.amberDim}>NDA</Pill>}
                      </div>
                    </td>
                    {/* Buyer */}
                    <td style={{padding:"10px 12px"}}>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:28,height:28,borderRadius:"50%",
                          background:T.purpleGlow,border:`1.5px solid ${T.purple}40`,
                          color:T.purple,fontSize:11,fontWeight:800,
                          display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          {init(r.buyer_name)}
                        </div>
                        <div>
                          <div style={{fontSize:12,fontWeight:600,color:T.text,lineHeight:1.2}}>{r.buyer_name}</div>
                          <div style={{fontSize:10,color:T.textFaint}}>{r.buyer_company}</div>
                        </div>
                      </div>
                    </td>
                    {/* Status */}
                    <td style={{padding:"10px 12px"}}><StatusBadge status={r.status}/></td>
                    {/* Target */}
                    <td style={{padding:"10px 12px"}}>
                      <span style={{fontSize:11,color:T.textFaint}}>
                        {{"Public":"🌐","Category":"📂","Selected":"👥"}[r.target_type]} {r.target_type}
                      </span>
                    </td>
                    {/* Quote count */}
                    <td style={{padding:"10px 12px"}}>
                      <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center",
                        minWidth:24,height:24,fontSize:12,fontWeight:800,
                        color:r.quote_count>0?"#fff":T.textFaint,
                        background:r.quote_count>0?T.purple:T.bgDeep,
                        borderRadius:999,padding:"0 6px"}}>
                        {r.quote_count}
                      </span>
                    </td>
                    {/* Deadline */}
                    <td style={{padding:"10px 12px"}}>
                      {r.deadline?(
                        <span style={{fontSize:11,fontWeight:700,padding:"2px 7px",borderRadius:4,
                          background:dl!==null&&dl<0?T.redDim:dl!==null&&dl<=3?T.amberDim:T.bgDeep,
                          color:dl!==null&&dl<0?T.red:dl!==null&&dl<=3?T.amber:T.textFaint}}>
                          {dl===null?"—":dl<0?"Geçti":dl===0?"Bugün":`${dl}g`}
                        </span>
                      ):<span style={{color:T.textFaint,fontSize:11}}>—</span>}
                    </td>
                    {/* View limit */}
                    <td style={{padding:"10px 12px"}}>
                      {r.is_view_limited?(
                        <div>
                          <div style={{fontSize:10,color:T.textFaint,marginBottom:3}}>{r.current_views}/{r.max_views}</div>
                          <div style={{width:56,height:3,background:T.bgDeep,borderRadius:2,overflow:"hidden"}}>
                            <div style={{height:"100%",width:`${Math.min(pct,100)}%`,
                              background:pct>=90?T.red:pct>=70?T.amber:T.purple}}/>
                          </div>
                        </div>
                      ):<span style={{fontSize:10,color:T.textFaint}}>—</span>}
                    </td>
                    {/* Action */}
                    <td style={{padding:"10px 12px",textAlign:"right"}}>
                      <button onClick={e=>{e.stopPropagation();onOpen(r);}}
                        style={{fontSize:11,fontWeight:700,padding:"4px 10px",cursor:"pointer",
                          border:`1px solid ${isHov?T.purple:T.border}`,borderRadius:6,
                          background:isHov?T.purpleGlow:"none",color:isHov?T.purple:T.textFaint,
                          transition:"all .15s",fontFamily:"inherit"}}>
                        Detay →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {/* Footer */}
        <div style={{padding:"8px 16px",borderTop:`1px solid ${T.border}`,
          display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:11,color:T.textFaint}}>{filtered.length} / {list.length} kayıt</span>
          <div style={{display:"flex",gap:6}}>
            <Btn small variant="ghost">‹ Önceki</Btn>
            <Btn small variant="ghost">Sonraki ›</Btn>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════════════════════
   ROOT — mimics the app shell from screenshot
════════════════════════════════════════════════════════════════════════════ */
export default function RFQPage() {
  const [list,    setList]    = useState(MOCK_LIST);
  const [view,    setView]    = useState("list");   // "list"|"detail"|"new"
  const [current, setCurrent] = useState(null);

  const openDetail = rfq => { setCurrent(rfq); setView("detail"); };
  const openNew    = ()  => { setCurrent({...EMPTY_RFQ}); setView("new"); };
  const goBack     = ()  => { setView("list"); setCurrent(null); };

  const handleSave = saved => {
    setList(l => {
      const idx = l.findIndex(r => r.name === saved.name);
      if (idx >= 0) { const nl=[...l]; nl[idx]=saved; return nl; }
      return [saved, ...l];
    });
    if(view==="new"){ setCurrent(saved); setView("detail"); }
  };

  return (
    <div style={{
      height:"100vh",display:"flex",flexDirection:"column",
      background:T.bg,color:T.text,
      fontFamily:"'Plus Jakarta Sans','DM Sans',system-ui,sans-serif",
      overflow:"hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        *{box-sizing:border-box;}
        ::-webkit-scrollbar{width:5px;height:5px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:#2e2e40;border-radius:3px;}
        ::-webkit-scrollbar-thumb:hover{background:#3e3e55;}
        input:focus,select:focus,textarea:focus{
          border-color:${T.purple}!important;
          box-shadow:0 0 0 3px ${T.purple}18!important;
        }
        input[type=number]{-moz-appearance:textfield;}
        input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;}
        button:hover{opacity:.88;}
      `}</style>

      {/* ── Mini app chrome (matches screenshot) ── */}
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>

        {/* Narrow icon rail */}
        <div style={{width:52,background:T.bgDeep,borderRight:`1px solid ${T.border}`,
          display:"flex",flexDirection:"column",alignItems:"center",padding:"12px 0",gap:4,flexShrink:0}}>
          {/* Avatar */}
          <div style={{width:32,height:32,borderRadius:"50%",background:T.purple,
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:12,fontWeight:800,color:"#fff",marginBottom:8}}>AK</div>
          {[["🏠","Ana Sayfa"],["📦","Ürünler"],["🛒","Müşteri"],["💰","Finans"],
            ["🚚","Lojistik"],["📋","Pazarlama"],["📊","Analiz"],["💬","Mesajlar"]].map(([icon,label])=>(
            <div key={label} title={label}
              style={{width:38,height:38,borderRadius:8,display:"flex",alignItems:"center",
                justifyContent:"center",fontSize:16,cursor:"pointer",color:T.textFaint,
                background:label==="Pazarlama"?T.purpleGlow:"none",transition:"background .15s"}}>
              {icon}
            </div>
          ))}
          <div style={{flex:1}}/>
          {["⚙️","🔗","👤"].map(icon=>(
            <div key={icon} style={{width:38,height:38,borderRadius:8,display:"flex",
              alignItems:"center",justifyContent:"center",fontSize:16,cursor:"pointer",color:T.textFaint}}>
              {icon}
            </div>
          ))}
        </div>

        {/* Sidebar panel */}
        <div style={{width:220,background:T.bgDeep,borderRight:`1px solid ${T.border}`,
          display:"flex",flexDirection:"column",overflow:"hidden",flexShrink:0}}>
          <div style={{padding:"14px 14px 8px",display:"flex",alignItems:"center",
            justifyContent:"space-between",borderBottom:`1px solid ${T.border}`}}>
            <span style={{fontSize:12,fontWeight:800,color:T.text}}>Satış & Sipariş</span>
            <span style={{fontSize:14,color:T.textFaint,cursor:"pointer"}}>‹</span>
          </div>
          <div style={{overflowY:"auto",padding:"8px 0",flex:1}}>
            {/* TEKLİF TALEPLERİ group */}
            <div style={{padding:"6px 14px 4px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:T.textFaint}}>
                Teklif Talepl...
              </span>
              <span style={{fontSize:10,background:T.purple,color:"#fff",borderRadius:999,
                padding:"1px 6px",fontWeight:700}}>8</span>
            </div>
            {[
              {label:"RFQ",active:true},
              {label:"RFQ Kalemleri"},
              {label:"RFQ Teklifleri"},
              {label:"RFQ Teklif Kalemleri"},
              {label:"RFQ Teklif Revizyonları"},
              {label:"RFQ Mesajları"},
              {label:"RFQ Ekleri"},
              {label:"RFQ Görüntüleme Kaydı"},
            ].map(({label,active})=>(
              <div key={label}
                style={{padding:"7px 14px",fontSize:12,cursor:"pointer",
                  color:active?T.text:T.textMid,fontWeight:active?700:400,
                  background:active?T.purpleGlow:"none",
                  borderLeft:active?`2px solid ${T.purple}`:"2px solid transparent",
                  transition:"all .1s"}}>
                {label}
              </div>
            ))}
            {/* SİPARİŞLER */}
            <div style={{padding:"12px 14px 4px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:T.textFaint}}>
                Siparişler
              </span>
              <span style={{fontSize:10,background:T.surfaceHi,color:T.textFaint,borderRadius:999,
                padding:"1px 6px",fontWeight:700}}>7</span>
            </div>
            {["Sipariş","Sipariş Kalemleri","Sipariş Ödemeleri"].map(l=>(
              <div key={l} style={{padding:"7px 14px",fontSize:12,cursor:"pointer",color:T.textMid}}>
                {l}
              </div>
            ))}
            <div style={{padding:"12px 14px 4px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:T.textFaint}}>
                Teklifler
              </span>
              <span style={{fontSize:10,background:T.surfaceHi,color:T.textFaint,borderRadius:999,
                padding:"1px 6px",fontWeight:700}}>2</span>
            </div>
            <div style={{padding:"12px 14px 4px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".08em",color:T.textFaint}}>
                İade Yönetimi
              </span>
              <span style={{fontSize:10,background:T.surfaceHi,color:T.textFaint,borderRadius:999,
                padding:"1px 6px",fontWeight:700}}>1</span>
            </div>
          </div>
        </div>

        {/* ── Main content ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
          {/* Top search bar */}
          <div style={{background:T.bgDeep,borderBottom:`1px solid ${T.border}`,
            padding:"8px 20px",display:"flex",alignItems:"center",gap:12,flexShrink:0}}>
            <div style={{flex:1,position:"relative",maxWidth:420}}>
              <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",
                color:T.textFaint,fontSize:13,pointerEvents:"none"}}>🔍</span>
              <input placeholder="Herşeyi Ara..."
                style={{width:"100%",padding:"7px 10px 7px 32px",background:T.surface,
                  border:`1px solid ${T.border}`,borderRadius:8,color:T.text,
                  fontSize:12,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/>
            </div>
            <div style={{flex:1}}/>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:16,cursor:"pointer"}}>🔔</span>
              <span style={{fontSize:16,cursor:"pointer"}}>⊞</span>
              <div style={{width:28,height:28,borderRadius:"50%",background:T.purple,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:11,fontWeight:800,color:"#fff",cursor:"pointer"}}>AK</div>
            </div>
          </div>

          {/* Page content */}
          <div style={{flex:1,overflow:"hidden",display:"flex",flexDirection:"column"}}>
            {(view==="list")&&(
              <ListPage list={list} onOpen={openDetail} onNew={openNew}/>
            )}
            {(view==="detail"||view==="new")&&current&&(
              <DetailView
                rfq={current}
                isNew={view==="new"}
                onBack={goBack}
                onSave={handleSave}/>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
