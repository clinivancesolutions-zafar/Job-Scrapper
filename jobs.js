const BOARDS = [
  // Add/remove boards here. The prototype uses public ATS endpoints.
  {ats:"greenhouse", token:"oscar", label:"Oscar Health"},
  {ats:"greenhouse", token:"includedhealth", label:"Included Health"},
  {ats:"greenhouse", token:"carbonhealth", label:"Carbon Health"},
  {ats:"greenhouse", token:"cedar", label:"Cedar"},
  {ats:"greenhouse", token:"cityblockhealth", label:"Cityblock Health"},
  {ats:"greenhouse", token:"devotedhealth", label:"Devoted Health"},
  {ats:"greenhouse", token:"flatiron", label:"Flatiron Health"},
  {ats:"greenhouse", token:"tempuslabs", label:"Tempus AI"},
  {ats:"greenhouse", token:"color", label:"Color Health"},
  {ats:"greenhouse", token:"recursionpharmaceuticals", label:"Recursion Pharmaceuticals"},
  {ats:"greenhouse", token:"insitro", label:"Insitro"},
  {ats:"greenhouse", token:"editasmedicine", label:"Editas Medicine"},
  {ats:"greenhouse", token:"intelliatx", label:"Intellia Therapeutics"},
  {ats:"greenhouse", token:"beamtx", label:"Beam Therapeutics"},
  {ats:"greenhouse", token:"sareptatherapeutics", label:"Sarepta Therapeutics"},
  {ats:"greenhouse", token:"alnylampharmaceuticals", label:"Alnylam Pharmaceuticals"},
  {ats:"greenhouse", token:"bluebirdbio", label:"bluebird bio"},
  {ats:"greenhouse", token:"clover", label:"Clover Health"},
  {ats:"greenhouse", token:"accolade", label:"Accolade"},
  {ats:"greenhouse", token:"komodohealth", label:"Komodo Health"},
  {ats:"greenhouse", token:"hims", label:"Hims & Hers"},
  {ats:"greenhouse", token:"ro", label:"Ro"},
  {ats:"greenhouse", token:"maven", label:"Maven Clinic"},
  {ats:"lever", token:"forward", label:"Forward Health"},
  {ats:"lever", token:"nurx", label:"Nurx"},
  {ats:"lever", token:"honor", label:"Honor"},
  {ats:"lever", token:"sesamecare", label:"Sesame Care"},
  {ats:"lever", token:"carrotfertility", label:"Carrot Fertility"},
  {ats:"lever", token:"vida-health", label:"Vida Health"},
  {ats:"lever", token:"transcarent", label:"Transcarent"},
  {ats:"lever", token:"collectivehealth", label:"Collective Health"},
  {ats:"lever", token:"alto", label:"Alto Pharmacy"},
  {ats:"lever", token:"capsule", label:"Capsule Pharmacy"}
];

const text = v => String(v ?? "").trim();
const normalize = (raw, board) => {
  if (board.ats === "greenhouse") {
    const location = raw.location?.name ?? null;
    return {
      title:text(raw.title), company:board.label || board.token,
      url:text(raw.absolute_url), location, department:raw.departments?.[0]?.name ?? null,
      source:`greenhouse:${board.token}`, posted_at:raw.updated_at ?? null,
      job_id:raw.id != null ? String(raw.id) : null
    };
  }
  const location=raw.categories?.location ?? null;
  return {
    title:text(raw.text), company:board.label || board.token, url:text(raw.hostedUrl),
    location, department:raw.categories?.team ?? raw.categories?.department ?? null,
    source:`lever:${board.token}`, posted_at:raw.createdAt != null ? String(raw.createdAt) : null,
    job_id:raw.id ?? null
  };
};

async function scrape(board){
  const url=board.ats==="greenhouse"
    ? `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(board.token)}/jobs`
    : `https://api.lever.co/v0/postings/${encodeURIComponent(board.token)}?mode=json`;
  const r=await fetch(url,{headers:{accept:"application/json"}});
  if(!r.ok) return {ok:false,status:r.status,jobs:[]};
  const data=await r.json();
  const arr=board.ats==="greenhouse" ? (data.jobs||[]) : (Array.isArray(data)?data:[]);
  return {ok:true,status:200,jobs:arr.map(x=>normalize(x,board)).filter(x=>x.title&&x.url)};
}

module.exports = async (req,res)=>{
  const q=text(req.query.q).toLowerCase();
  const loc=text(req.query.location).toLowerCase();
  const source=req.query.source==="greenhouse"||req.query.source==="lever" ? req.query.source : "all";
  const boards=BOARDS.filter(b=>source==="all"||b.ats===source);

  const results=await Promise.all(boards.map(async b=>{
    try{return {...await scrape(b),board:b}}catch(e){return {ok:false,status:0,jobs:[],board:b}}
  }));
  let jobs=results.flatMap(x=>x.jobs);
  jobs=jobs.filter(j=>{
    const hay=[j.title,j.company,j.department,j.location].join(" ").toLowerCase();
    return (!q||hay.includes(q)) && (!loc||String(j.location||"").toLowerCase().includes(loc));
  });
  const seen=new Set();
  jobs=jobs.filter(j=>{const k=(j.company+"|"+j.title+"|"+j.url).toLowerCase();if(seen.has(k))return false;seen.add(k);return true});
  jobs.sort((a,b)=>String(b.posted_at||"").localeCompare(String(a.posted_at||"")));

  res.setHeader("Cache-Control","s-maxage=60, stale-while-revalidate=300");
  res.status(200).json({
    jobs, jobsFound:jobs.length, boardsChecked:boards.length,
    liveBoards:results.filter(x=>x.ok).length,
    boardReports:results.map(x=>({source:x.board.ats,token:x.board.token,label:x.board.label,status:x.status,jobs:x.jobs.length}))
  });
};