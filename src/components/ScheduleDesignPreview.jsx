import { useState } from "react";

export const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday"];
export const DAY_SHORT = {Sunday:"Sun",Monday:"Mon",Tuesday:"Tue",Wednesday:"Wed",Thursday:"Thu"};

export const THEMES = [
  {id:"minimal",       label:"Minimal",       desc:"Clean & focused",      previewBg:"#f8fafc"},
  {id:"glassmorphism", label:"Glassmorphism", desc:"Frosted glass layers",  previewBg:"linear-gradient(135deg,#667eea,#764ba2)"},
  {id:"campus-card",   label:"Campus Card",   desc:"University style",      previewBg:"linear-gradient(135deg,#1e3a5f,#2d6a9f)"},
  {id:"gradient",      label:"Gradient",      desc:"Vivid gradient cards",  previewBg:"linear-gradient(135deg,#f093fb,#f5576c)"},
  {id:"dark-academic", label:"Dark Academic", desc:"Warm & scholarly",      previewBg:"linear-gradient(135deg,#1a1209,#2a1f0f)"},
];

export const BG_PRESETS = [
  {id:"clean",  label:"White",  bg:"#ffffff"},
  {id:"slate",  label:"Slate",  bg:"#f1f5f9"},
  {id:"dark",   label:"Dark",   bg:"#0f172a"},
  {id:"purple", label:"Purple", bg:"linear-gradient(135deg,#667eea,#764ba2)"},
  {id:"sunset", label:"Sunset", bg:"linear-gradient(135deg,#f093fb,#f5576c)"},
  {id:"ocean",  label:"Ocean",  bg:"linear-gradient(135deg,#0575e6,#021b79)"},
  {id:"forest", label:"Forest", bg:"linear-gradient(135deg,#134e5e,#71b280)"},
  {id:"warmth", label:"Warmth", bg:"linear-gradient(135deg,#f8b500,#e05c00)"},
];

export const PALETTE = ["#4f6ef7","#7c3aed","#0ea5e9","#10b981","#f59e0b","#ef4444","#ec4899","#06b6d4","#84cc16","#f97316","#6366f1","#14b8a6"];
export const DAY_COLORS = {Sunday:"#2563eb",Monday:"#16a34a",Tuesday:"#9333ea",Wednesday:"#ea580c",Thursday:"#e11d48"};

export const DEFAULT_DESIGN = {theme:"minimal",darkMode:false,colorStyle:"by-course",courseColors:{},courseColorsByName:{},bgPreset:"clean",bgCustom:"#f8fafc",cardStyle:"rounded",viewMode:"week",showEmoji:true,showRoom:true,showDuration:true};

export const fmtTime=(t)=>{if(!t)return"";const[h,m]=t.split(":").map(Number);return`${h%12||12}:${String(m).padStart(2,"0")} ${h>=12?"PM":"AM"}`;};
export const getDur=(s,e)=>{if(!s||!e)return"";const tm=x=>{const[h,m]=x.split(":").map(Number);return h*60+m;};const d=tm(e)-tm(s);if(d<=0)return"";const h=Math.floor(d/60),m=d%60;return h&&m?`${h}h ${m}m`:h?`${h}h`:`${m}m`;};
export const hashColor=(str)=>{let h=0;for(let i=0;i<str.length;i++)h=str.charCodeAt(i)+((h<<5)-h);return PALETTE[Math.abs(h)%PALETTE.length];};
export const courseBaseColor=(name)=>{const l=name.toLowerCase();if(l.includes("data str")||l.includes("dsa"))return"#4f6ef7";if(l.includes("calcul")||l.includes("math"))return"#0ea5e9";if(l.includes("logic")||l.includes("digital"))return"#7c3aed";if(l.includes("english")||l.includes("comm"))return"#f59e0b";if(l.includes("physics")||l.includes("lab"))return"#10b981";if(l.includes("database")||l.includes(" db"))return"#ef4444";if(l.includes("network"))return"#06b6d4";if(l.includes("mgmt")||l.includes("manage"))return"#f97316";if(l.includes("cis"))return"#4f6ef7";return hashColor(name);};
export const getAccent=(course,design)=>{
  if(design.colorStyle==="custom"){
    if(design.courseColors&&design.courseColors[course.id])return design.courseColors[course.id];
    if(design.courseColorsByName&&design.courseColorsByName[course.name])return design.courseColorsByName[course.name];
  }
  if(design.colorStyle==="by-day")return DAY_COLORS[course.day]||"#4f6ef7";
  return courseBaseColor(course.name);
};
export const hex2rgba=(hex,a)=>{if(!hex||!hex.startsWith("#"))return`rgba(100,100,200,${a})`;const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return`rgba(${r},${g},${b},${a})`;};

export default function ScheduleDesignPreview({courses, design}) {
  const [dayTab,setDayTab]=useState(DAYS[0]);
  const {theme,darkMode,cardStyle,viewMode,showEmoji,showRoom,showDuration,bgPreset,bgCustom}=design;
  const bgObj=BG_PRESETS.find(b=>b.id===bgPreset);
  const pageBg=bgObj?bgObj.bg:(bgCustom||"#f8fafc");

  const T={
    minimal:{textP:darkMode?"#e2e8f0":"#0f172a",textS:darkMode?"#94a3b8":"#64748b",dayH:{background:darkMode?"#1e293b":"#ffffff",border:`1px solid ${darkMode?"rgba(255,255,255,0.08)":"#e2e8f0"}`,color:darkMode?"#e2e8f0":"#0f172a"},free:{background:darkMode?"rgba(255,255,255,0.02)":"rgba(0,0,0,0.03)",border:`1px dashed ${darkMode?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.12)"}`}},
    glassmorphism:{textP:"#ffffff",textS:"rgba(255,255,255,0.7)",dayH:{background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",color:"#ffffff"},free:{background:"rgba(255,255,255,0.04)",border:"1px dashed rgba(255,255,255,0.18)"}},
    "campus-card":{textP:darkMode?"#e2e8f0":"#0f172a",textS:darkMode?"#94a3b8":"#64748b",dayH:{background:"#1e3a5f",border:"none",color:"#ffffff"},free:{background:"rgba(0,0,0,0.04)",border:"1px dashed rgba(0,0,0,0.15)"}},
    gradient:{textP:"#ffffff",textS:"rgba(255,255,255,0.85)",dayH:{background:"rgba(0,0,0,0.15)",border:"1px solid rgba(255,255,255,0.2)",color:"#ffffff"},free:{background:"rgba(255,255,255,0.08)",border:"1px dashed rgba(255,255,255,0.2)"}},
    "dark-academic":{textP:"#f5e6d3",textS:"#b09070",dayH:{background:"#2a1f0f",border:"1px solid #3d2b14",color:"#d4a85a"},free:{background:"rgba(255,255,255,0.02)",border:"1px dashed #3d2b14"}},
  }[theme]||{textP:"#0f172a",textS:"#64748b",dayH:{background:"#f8fafc",border:"1px solid #e2e8f0",color:"#0f172a"},free:{background:"#f8fafc",border:"1px dashed #e2e8f0"}};

  const rad={rounded:12,compact:8,detailed:14,large:18}[cardStyle]||12;
  const pad={rounded:"11px 13px",compact:"7px 10px",detailed:"13px 15px",large:"16px 18px"}[cardStyle]||"11px 13px";

  const cardS=(accent)=>{
    switch(theme){
      case"minimal":return{background:darkMode?"#1e293b":"#ffffff",border:`1.5px solid ${darkMode?"rgba(255,255,255,0.08)":"#e2e8f0"}`,borderLeft:`4px solid ${accent}`,borderRadius:rad,padding:pad,boxShadow:darkMode?"0 2px 8px rgba(0,0,0,0.4)":"0 2px 8px rgba(15,23,42,0.06)"};
      case"glassmorphism":return{background:darkMode?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.18)",border:`1px solid ${darkMode?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.35)"}`,borderRadius:rad+8,padding:pad,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",boxShadow:`0 8px 32px ${hex2rgba(accent,0.15)}`};
      case"campus-card":return{background:darkMode?"#1e293b":"#ffffff",border:`1.5px solid ${darkMode?"rgba(255,255,255,0.08)":"#e2e8f0"}`,borderRadius:rad,padding:0,overflow:"hidden",boxShadow:darkMode?"0 2px 8px rgba(0,0,0,0.5)":"0 2px 12px rgba(0,0,0,0.08)"};
      case"gradient":return{background:`linear-gradient(135deg,${accent} 0%,${hex2rgba(accent,0.72)} 100%)`,border:"none",borderRadius:rad+4,padding:pad,boxShadow:`0 8px 24px ${hex2rgba(accent,0.42)}`};
      case"dark-academic":return{background:"#241a0e",border:"1.5px solid #3d2b14",borderLeft:"4px solid #d4a85a",borderRadius:Math.max(rad-4,4),padding:pad,boxShadow:"0 4px 16px rgba(0,0,0,0.5)"};
      default:return{background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:12,padding:pad};
    }
  };

  const CardContent=({course})=>{
    const acc=getAccent(course,design);
    const cs=cardS(acc);
    const isGlass=theme==="glassmorphism"||theme==="gradient";
    const isDark=theme==="dark-academic";
    const nC=isGlass?"#ffffff":isDark?"#f5e6d3":T.textP;
    const sC=isGlass?"rgba(255,255,255,0.8)":isDark?"#b09070":T.textS;
    const tC=theme==="dark-academic"?"#d4a85a":isGlass?"rgba(255,255,255,0.9)":acc;
    const dur=getDur(course.startTime,course.endTime);
    const nSz={compact:"10px",large:"13px"}[cardStyle]||"11px";
    if(theme==="campus-card"){
      return(<div style={cs}><div style={{background:acc,padding:"5px 10px",display:"flex",alignItems:"center",gap:"5px"}}>{showEmoji&&<span style={{fontSize:"10px"}}>{course.emoji||"📚"}</span>}<span style={{fontSize:"10px",fontWeight:"700",color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1}}>{course.name}</span></div><div style={{padding:{compact:"5px 10px",large:"12px 12px"}[cardStyle]||"9px 10px"}}><div style={{display:"flex",flexDirection:"column",gap:"2px"}}><span style={{fontSize:"9px",color:T.textS,fontWeight:"600"}}>{fmtTime(course.startTime)}–{fmtTime(course.endTime)}</span>{showRoom&&course.room&&<span style={{fontSize:"9px",color:T.textS}}>📍{course.room}</span>}{showDuration&&dur&&<span style={{fontSize:"9px",color:acc,fontWeight:"600"}}>{dur}</span>}</div></div></div>);
    }
    return(<div style={cs}><div style={{display:"flex",alignItems:"flex-start",gap:"5px",marginBottom:cardStyle==="compact"?"2px":"6px"}}>{showEmoji&&<span style={{fontSize:cardStyle==="large"?"15px":"11px",flexShrink:0,marginTop:"1px"}}>{course.emoji||"📚"}</span>}<span style={{fontSize:nSz,fontWeight:"700",color:nC,lineHeight:"1.3",flex:1}}>{course.name}</span></div><div style={{display:"flex",flexDirection:"column",gap:"1px"}}><span style={{fontSize:"9px",color:tC,fontWeight:"600"}}>{fmtTime(course.startTime)}–{fmtTime(course.endTime)}</span>{showRoom&&course.room&&<span style={{fontSize:"9px",color:sC}}>📍{course.room}</span>}{showDuration&&dur&&<span style={{fontSize:"9px",color:tC,fontWeight:"600"}}>{dur}</span>}</div></div>);
  };

  const dayEntries=(d)=>courses.filter(c=>c.day===d).sort((a,b)=>{const tm=x=>{if(!x)return 0;const[h,m]=x.split(":").map(Number);return h*60+m;};return tm(a.startTime)-tm(b.startTime);});

  return(
    <div style={{background:pageBg,borderRadius:14,padding:"12px",minHeight:"160px",overflow:"hidden",position:"relative"}}>
      {viewMode==="week"?(
        <div style={{overflowX:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:`repeat(${DAYS.length},1fr)`,gap:"6px",minWidth:"440px"}}>
            {DAYS.map(day=>{
              const entries=dayEntries(day);
              return(<div key={day}><div style={{...T.dayH,borderRadius:7,padding:"6px 4px",textAlign:"center",marginBottom:"5px",backdropFilter:theme==="glassmorphism"?"blur(10px)":undefined}}><div style={{fontSize:"10px",fontWeight:"700",color:T.dayH.color}}>{DAY_SHORT[day]}</div><div style={{fontSize:"9px",color:theme==="glassmorphism"||theme==="campus-card"?"rgba(255,255,255,0.55)":T.textS,marginTop:"1px"}}>{entries.length}cl</div></div><div style={{display:"flex",flexDirection:"column",gap:"4px"}}>{entries.length===0?<div style={{...T.free,padding:"9px 5px",textAlign:"center",fontSize:"9px",color:T.textS,borderRadius:6}}>Free</div>:entries.map(c=><CardContent key={c.id} course={c}/>)}</div></div>);
            })}
          </div>
        </div>
      ):(
        <div>
          <div style={{display:"flex",gap:"4px",flexWrap:"wrap",marginBottom:"10px"}}>
            {DAYS.map(d=>{const a=d===dayTab,dc=DAY_COLORS[d];return(<button key={d} onClick={()=>setDayTab(d)} style={{padding:"4px 9px",borderRadius:"999px",border:"none",cursor:"pointer",fontSize:"10px",fontWeight:a?"700":"500",background:a?dc:T.dayH.background,color:a?"#fff":T.textP,transition:"all 0.15s"}}>{DAY_SHORT[d]}</button>);})}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
            {dayEntries(dayTab).length===0?<div style={{...T.free,padding:"26px",textAlign:"center",fontSize:"11px",color:T.textS,borderRadius:10}}>No classes on {dayTab}</div>:dayEntries(dayTab).map(c=><CardContent key={c.id} course={c}/>)}
          </div>
        </div>
      )}
    </div>
  );
}
