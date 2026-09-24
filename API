export default async function handler(req, res) {
  const BOARDS = [
    ["greenhouse","oscar","Oscar Health"],["greenhouse","includedhealth","Included Health"],
    ["greenhouse","carbonhealth","Carbon Health"],["greenhouse","cedar","Cedar"],
    ["greenhouse","cityblockhealth","Cityblock Health"],["greenhouse","devotedhealth","Devoted Health"],
    ["greenhouse","flatiron","Flatiron Health"],["greenhouse","tempuslabs","Tempus AI"],
    ["greenhouse","color","Color Health"],["greenhouse","recursionpharmaceuticals","Recursion Pharmaceuticals"],
    ["greenhouse","insitro","Insitro"],["greenhouse","editasmedicine","Editas Medicine"],
    ["greenhouse","intelliatx","Intellia Therapeutics"],["greenhouse","beamtx","Beam Therapeutics"],
    ["greenhouse","sareptatherapeutics","Sarepta Therapeutics"],["greenhouse","alnylampharmaceuticals","Alnylam Pharmaceuticals"],
    ["greenhouse","clover","Clover Health"],["greenhouse","accolade","Accolade"],
    ["greenhouse","komodohealth","Komodo Health"],["greenhouse","hims","Hims & Hers"],
    ["greenhouse","maven","Maven Clinic"],["lever","forward","Forward Health"],
    ["lever","nurx","Nurx"],["lever","honor","Honor"],["lever","sesamecare","Sesame Care"],
    ["lever","carrotfertility","Carrot Fertility"],["lever","vida-health","Vida Health"],
    ["lever","transcarent","Transcarent"],["lever","collectivehealth","Collective Health"],
    ["lever","alto","Alto Pharmacy"],["lever","capsule","Capsule Pharmacy"]
  ];

  const q = String(req.query?.q || "").trim().toLowerCase();
  const loc = String(req.query?.location || "").trim().toLowerCase();
  const source = ["greenhouse","lever"].includes(req.query?.source) ? req.query.source : "all";
  const boards = BOARDS.filter(b => source === "all" || b[0] === source);

  async function getJson(url) {
    const r = await fetch(url, {
      headers: { "Accept": "application/json", "User-Agent": "SyronzaJobScraper/1.0" }
    });
    const body = await r.text();
    if (!r.ok) return { ok:false, status:r.status, error:body.slice(0,180), data:null };
    try { return { ok:true, status:r.status, error:null, data:JSON.parse(body) }; }
    catch { return { ok:false, status:r.status, error:"Upstream returned non-JSON", data:null }; }
  }

  async function scrape(b) {
    const [ats, token, company] = b;
    const url = ats === "greenhouse"
      ? `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(token)}/jobs`
      : `https://api.lever.co/v0/postings/${encodeURIComponent(token)}?mode=json`;
    try {
      const r = await getJson(url);
      if (!r.ok) return {ok:false,status:r.status,jobs:[],error:r.error,board:b};
      const arr = ats === "greenhouse" ? (r.data?.jobs || []) : (Array.isArray(r.data) ? r.data : []);
      const jobs = arr.map(raw => ats === "greenhouse" ? ({
        title:String(raw.title || "").trim(), company, url:String(raw.absolute_url || ""),
        location:raw.location?.name || "", department:raw.departments?.[0]?.name || "",
        source:"greenhouse", posted_at:raw.updated_at || ""
      }) : ({
        title:String(raw.text || "").trim(), company, url:String(raw.hostedUrl || ""),
        location:raw.categories?.location || "", department:raw.categories?.team || raw.categories?.department || "",
        source:"lever", posted_at:raw.createdAt ? String(raw.createdAt) : ""
      })).filter(j => j.title && j.url);
      return {ok:true,status:200,jobs,board:b};
    } catch(e) {
      return {ok:false,status:0,jobs:[],error:String(e?.message || e),board:b};
    }
  }

  try {
    const results = await Promise.all(boards.map(scrape));
    let jobs = results.flatMap(r => r.jobs);
    jobs = jobs.filter(j => {
      const hay = [j.title,j.company,j.department,j.location].join(" ").toLowerCase();
      return (!q || hay.includes(q)) && (!loc || j.location.toLowerCase().includes(loc));
    });
    const seen = new Set();
    jobs = jobs.filter(j => {
      const key = `${j.company}|${j.title}|${j.url}`.toLowerCase();
      if (seen.has(key)) return false; seen.add(key); return true;
    });
    jobs.sort((a,b) => String(b.posted_at).localeCompare(String(a.posted_at)));
    res.setHeader("Cache-Control","s-maxage=60, stale-while-revalidate=300");
    return res.status(200).json({
      ok:true, jobs, jobsFound:jobs.length, boardsChecked:boards.length,
      liveBoards:results.filter(r=>r.ok).length,
      boardReports:results.map(r=>({
        source:r.board[0], token:r.board[1], label:r.board[2],
        status:r.status, jobs:r.jobs.length, error:r.error || null
      }))
    });
  } catch(e) {
    return res.status(500).json({ok:false,error:String(e?.message || e),jobs:[]});
  }
}
