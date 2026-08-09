import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDownCircle, ArrowUpCircle, Bell, CircleDollarSign, Edit3, LayoutDashboard,
  Menu, Plus, RotateCcw, Settings, Target, Trash2, TrendingUp, Wallet, X
} from "lucide-react";
import "./styles.css";

const DEFAULT_ALLOC = { savings: 50, investment: 10, regular: 40 };
const DEFAULT_TARGETS = [
  {id:1,name:"Beli Laptop",target:8000000,saved:175000,desc:"Target untuk kebutuhan belajar dan kerja."},
];
const DEFAULT_TX = [
  {id:1,type:"income",amount:100000,category:"Uang Saku",note:"Uang saku mingguan",date:"2026-08-09"},
  {id:2,type:"expense",amount:15000,category:"Makanan",note:"Makan siang",date:"2026-08-09"},
];

const money = n => new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(n);
const read = (key, fallback) => { try { const v=JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; } };

function App(){
  const [page,setPage]=useState("Dashboard"),[mobile,setMobile]=useState(false);
  const [alloc,setAlloc]=useState(()=>read("ft_alloc",DEFAULT_ALLOC));
  const [tx,setTx]=useState(()=>read("ft_tx",DEFAULT_TX));
  const [targets,setTargets]=useState(()=>read("ft_targets",DEFAULT_TARGETS));
  const [modal,setModal]=useState(null);
  const [form,setForm]=useState({type:"expense",amount:"",category:"Makanan",note:""});
  const [targetForm,setTargetForm]=useState({name:"",target:"",saved:"",desc:""});
  const [confirm,setConfirm]=useState(null);

  useEffect(()=>localStorage.setItem("ft_alloc",JSON.stringify(alloc)),[alloc]);
  useEffect(()=>localStorage.setItem("ft_tx",JSON.stringify(tx)),[tx]);
  useEffect(()=>localStorage.setItem("ft_targets",JSON.stringify(targets)),[targets]);

  const income=useMemo(()=>tx.filter(t=>t.type==="income").reduce((a,t)=>a+t.amount,0),[tx]);
  const expenses=useMemo(()=>tx.filter(t=>t.type==="expense").reduce((a,t)=>a+t.amount,0),[tx]);
  const saved=Math.round(income*alloc.savings/100), investment=Math.round(income*alloc.investment/100);
  const regular=Math.max(0,Math.round(income*alloc.regular/100)-expenses);
  const nav=[["Dashboard",LayoutDashboard],["Transaksi",Wallet],["Tabungan",Target],["Pengaturan",Settings]];

  function addTx(e){
    e.preventDefault(); const amount=Number(form.amount); if(!amount)return;
    setTx(p=>[{id:Date.now(),type:form.type,amount,category:form.category,note:form.note||form.category,date:new Date().toISOString().slice(0,10)},...p]);
    setForm({type:"expense",amount:"",category:"Makanan",note:""}); setModal(null);
  }
  function editTx(t){ setForm({type:t.type,amount:t.amount,category:t.category,note:t.note}); setModal({type:"editTx",id:t.id}); }
  function saveTx(e){
    e.preventDefault(); const amount=Number(form.amount); if(!amount)return;
    setTx(p=>p.map(t=>t.id===modal.id?{...t,...form,amount}:t)); setModal(null);
  }
  function deleteTx(id){setTx(p=>p.filter(t=>t.id!==id));}
  function openTarget(t=null){
    setTargetForm(t?{name:t.name,target:t.target,saved:t.saved,desc:t.desc||""}:{name:"",target:"",saved:"",desc:""});
    setModal(t?{type:"editTarget",id:t.id}:{type:"addTarget"});
  }
  function saveTarget(e){
    e.preventDefault(); const target=Number(targetForm.target), s=Math.min(Number(targetForm.saved)||0,target); if(!targetForm.name||!target)return;
    if(modal.type==="addTarget") setTargets(p=>[...p,{id:Date.now(),name:targetForm.name,target,saved:s,desc:targetForm.desc}]);
    else setTargets(p=>p.map(t=>t.id===modal.id?{...t,name:targetForm.name,target,saved:s,desc:targetForm.desc}:t));
    setModal(null);
  }
  function resetTarget(id){setTargets(p=>p.map(t=>t.id===id?{...t,saved:0}:t));}
  function deleteTarget(id){setTargets(p=>p.filter(t=>t.id!==id));}
  function resetAll(){
    setTx([]);setTargets([]);setAlloc(DEFAULT_ALLOC);
    localStorage.removeItem("ft_tx");localStorage.removeItem("ft_targets");localStorage.removeItem("ft_alloc");setConfirm(null);
  }

  return <div className="app">
    <aside className={"sidebar "+(mobile?"open":"")}>
      <div className="brand"><div className="brand-icon"><CircleDollarSign size={22}/></div><span>Finance<span className="brand-muted">Track</span></span></div>
      <div className="nav-title">MENU UTAMA</div>
      {nav.map(([n,I])=><button key={n} className={"nav-item "+(page===n?"active":"")} onClick={()=>{setPage(n);setMobile(false)}}><I size={19}/><span>{n}</span></button>)}
      <div className="sidebar-bottom"><button className="reset-link" onClick={()=>setConfirm("reset")}><RotateCcw size={16}/> Reset semua data</button></div>
    </aside>
    {mobile&&<div className="overlay" onClick={()=>setMobile(false)}/>}
    <main className="main">
      <header className="topbar"><button className="mobile-menu" onClick={()=>setMobile(true)}><Menu/></button><div><h1>{page}</h1><p>Kelola keuanganmu dengan lebih teratur.</p></div><div className="top-actions"><button className="icon-btn"><Bell size={19}/></button><div className="avatar">R</div></div></header>

      {page==="Dashboard"&&<Dashboard income={income} expenses={expenses} saved={saved} investment={investment} regular={regular} alloc={alloc} tx={tx} setModal={setModal} editTx={editTx} deleteTx={deleteTx}/>}
      {page==="Transaksi"&&<Transactions tx={tx} setModal={setModal} editTx={editTx} deleteTx={deleteTx}/>}
      {page==="Tabungan"&&<Savings targets={targets} openTarget={openTarget} resetTarget={resetTarget} deleteTarget={deleteTarget}/>}
      {page==="Pengaturan"&&<SettingsPage alloc={alloc} setAlloc={setAlloc}/>}
    </main>

    {modal&&<Modal modal={modal} setModal={setModal} form={form} setForm={setForm} addTx={addTx} saveTx={saveTx} targetForm={targetForm} setTargetForm={setTargetForm} saveTarget={saveTarget}/>}
    {confirm==="reset"&&<div className="modal-wrap"><div className="confirm-box"><div className="danger-icon"><Trash2/></div><h2>Reset semua data?</h2><p>Semua transaksi, target tabungan, dan pengaturan alokasi akan dihapus permanen.</p><div className="confirm-actions"><button onClick={()=>setConfirm(null)}>Batal</button><button className="danger-btn" onClick={resetAll}>Reset Data</button></div></div></div>}
  </div>
}

function Dashboard({income,expenses,saved,investment,regular,alloc,tx,setModal,editTx,deleteTx}){
 return <div className="content">
  <div className="hero"><div><span className="eyebrow">RINGKASAN KEUANGAN</span><h2>Uangmu, lebih tertata.</h2><p>Catat pemasukan dan pengeluaran tanpa ribet.</p></div><button className="primary" onClick={()=>setModal({type:"addTx"})}><Plus size={18}/> Tambah transaksi</button></div>
  <div className="stats"><Stat title="Dana biasa" value={regular} sub={`${alloc.regular}% dari pemasukan`} kind="blue" icon={<Wallet/>}/><Stat title="Tabungan" value={saved} sub={`${alloc.savings}% dari pemasukan`} kind="green" icon={<Target/>}/><Stat title="Investasi" value={investment} sub={`${alloc.investment}% dari pemasukan`} kind="purple" icon={<TrendingUp/>}/><Stat title="Pengeluaran" value={expenses} sub="total tercatat" kind="orange" icon={<ArrowDownCircle/>}/></div>
  <div className="grid-two"><section className="card"><div className="card-head"><div><h3>Pembagian uang</h3><p>Aturan alokasi pemasukanmu</p></div></div><div className="allocation"><Alloc label="Tabungan" pct={alloc.savings} cls="green"/><Alloc label="Investasi" pct={alloc.investment} cls="purple"/><Alloc label="Dana biasa" pct={alloc.regular} cls="blue"/></div><div className="total-line"><span>Total alokasi</span><b>{alloc.savings+alloc.investment+alloc.regular}%</b></div></section>
  <section className="card"><div className="card-head"><div><h3>Ringkasan</h3><p>Semua pemasukan yang tercatat</p></div></div><div className="summary-row"><span><ArrowUpCircle/> Pemasukan</span><b className="positive">+{money(income)}</b></div><div className="summary-row"><span><ArrowDownCircle/> Pengeluaran</span><b className="negative">-{money(expenses)}</b></div><div className="summary-row highlight"><span><CircleDollarSign/> Sisa dana biasa</span><b>{money(regular)}</b></div></section></div>
  <section className="card"><div className="card-head"><div><h3>Transaksi terbaru</h3><p>Aktivitas keuangan terakhir</p></div></div><TransactionTable tx={tx.slice(0,6)} editTx={editTx} deleteTx={deleteTx}/></section>
 </div>
}
function Stat({title,value,sub,icon,kind}){return <div className="stat-card"><div className={"stat-icon "+kind}>{icon}</div><div><span>{title}</span><strong>{money(value)}</strong><small>{sub}</small></div></div>}
function Alloc({label,pct,cls}){return <div className="alloc-row"><div className="alloc-label"><span className={"dot "+cls}></span><span>{label}</span><b>{pct}%</b></div><div className="bar"><i className={cls} style={{width:`${pct}%`}}/></div></div>}
function TransactionTable({tx,editTx,deleteTx}){return <div className="table-wrap"><table><thead><tr><th>TRANSAKSI</th><th>KATEGORI</th><th>TANGGAL</th><th>NOMINAL</th><th>AKSI</th></tr></thead><tbody>{tx.length?tx.map(t=><tr key={t.id}><td><div className="tx-name"><span className={t.type==="income"?"tx-icon income":"tx-icon expense"}>{t.type==="income"?<ArrowUpCircle/>:<ArrowDownCircle/>}</span><div><b>{t.note}</b><small>{t.type==="income"?"Pemasukan":"Pengeluaran"}</small></div></div></td><td>{t.category}</td><td>{new Date(t.date).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"})}</td><td className={t.type==="income"?"positive":"negative"}>{t.type==="income"?"+":"-"}{money(t.amount)}</td><td><div className="actions"><button className="edit-btn" onClick={()=>editTx(t)} title="Edit"><Edit3 size={14}/></button><button className="delete-btn" onClick={()=>deleteTx(t.id)} title="Hapus"><Trash2 size={14}/></button></div></td></tr>):<tr><td colSpan="5" className="empty">Belum ada transaksi.</td></tr>}</tbody></table></div>}
function Transactions({tx,setModal,editTx,deleteTx}){return <div className="content"><div className="page-head"><div><h2>Riwayat transaksi</h2><p>Edit atau hapus transaksi kapan saja.</p></div><button className="primary" onClick={()=>setModal({type:"addTx"})}><Plus size={18}/> Tambah</button></div><section className="card"><TransactionTable tx={tx} editTx={editTx} deleteTx={deleteTx}/></section></div>}

function Savings({targets,openTarget,resetTarget,deleteTarget}){
 const totalTarget=targets.reduce((a,t)=>a+t.target,0), totalSaved=targets.reduce((a,t)=>a+t.saved,0), avg=totalTarget?Math.round(totalSaved/totalTarget*100):0;
 return <div className="content"><div className="page-head"><div><h2>Tabungan</h2><p>Kelola dan pantau target tabunganmu.</p></div><button className="primary" onClick={()=>openTarget()}><Plus size={18}/> Tambah Target</button></div>
 <div className="stats"><Stat title="Total Target" value={targets.length} sub="target aktif" kind="blue" icon={<Target/>}/><Stat title="Total Terkumpul" value={totalSaved} sub="dari semua target" kind="green" icon={<Wallet/>}/><Stat title="Total Target" value={totalTarget} sub="nilai seluruh target" kind="orange" icon={<CircleDollarSign/>}/><Stat title="Rata-rata Progress" value={avg} sub="persentase tercapai" kind="purple" icon={<TrendingUp/>}/></div>
 <section className="card"><div className="card-head"><div><h3>Target Tabungan</h3><p>Setiap target bisa diedit, direset, atau dihapus.</p></div></div>
 <div className="target-grid">{targets.map(t=>{const p=t.target?Math.min(100,Math.round(t.saved/t.target*100)):0;return <div className="target-card" key={t.id}><div className="target-top"><div className="target-icon"><Target size={22}/></div><div className="target-menu"><button onClick={()=>openTarget(t)} title="Edit"><Edit3 size={15}/></button><button onClick={()=>resetTarget(t.id)} title="Reset"><RotateCcw size={15}/></button><button className="danger-mini" onClick={()=>deleteTarget(t.id)} title="Hapus"><Trash2 size={15}/></button></div></div><h3>{t.name}</h3><p className="target-amount">Target {money(t.target)}</p><div className="progress-info"><b>{p}%</b><span>{money(t.saved)} terkumpul</span></div><div className="big-bar"><i style={{width:`${p}%`}}/></div><p className="target-desc">{t.desc||"Target tabunganmu."}</p><div className="target-actions"><button onClick={()=>openTarget(t)}><Edit3 size={14}/> Edit</button><button onClick={()=>resetTarget(t.id)}><RotateCcw size={14}/> Reset</button><button className="delete-target" onClick={()=>deleteTarget(t.id)}><Trash2 size={14}/> Hapus</button></div></div>})}{!targets.length&&<div className="empty-target"><Target size={30}/><b>Belum ada target</b><span>Tambahkan target tabungan pertamamu.</span><button className="primary" onClick={()=>openTarget()}><Plus size={16}/> Tambah Target</button></div>}</div></section>
 </div>
}
function SettingsPage({alloc,setAlloc}){const update=(k,v)=>setAlloc(p=>({...p,[k]:Math.max(0,Math.min(100,Number(v)||0))}));const total=alloc.savings+alloc.investment+alloc.regular;return <div className="content"><div className="page-head"><div><h2>Pengaturan alokasi</h2><p>Tentukan pembagian setiap pemasukan.</p></div></div><section className="card settings-card"><Setting label="Tabungan" value={alloc.savings} onChange={v=>update("savings",v)} desc="Uang yang disimpan untuk target masa depan."/><Setting label="Investasi" value={alloc.investment} onChange={v=>update("investment",v)} desc="Alokasi untuk investasi."/><Setting label="Dana biasa" value={alloc.regular} onChange={v=>update("regular",v)} desc="Uang yang bisa digunakan untuk kebutuhan."/><div className={"total-setting "+(total===100?"ok":"bad")}>Total alokasi <b>{total}%</b>{total!==100&&<span>Harus tepat 100%</span>}</div></section></div>}
function Setting({label,value,onChange,desc}){return <div className="setting-row"><div><b>{label}</b><p>{desc}</p></div><div className="percent-input"><input type="number" min="0" max="100" value={value} onChange={e=>onChange(e.target.value)}/><span>%</span></div></div>}

function Modal({modal,setModal,form,setForm,addTx,saveTx,targetForm,setTargetForm,saveTarget}){
 const tx=modal.type==="addTx"||modal.type==="editTx"; const target=modal.type==="addTarget"||modal.type==="editTarget";
 return <div className="modal-wrap"><div className="modal"><div className="modal-head"><div><h2>{tx?(modal.type==="editTx"?"Edit transaksi":"Tambah transaksi"):(modal.type==="editTarget"?"Edit target":"Tambah target")}</h2><p>{target?"Atur nama, nominal target, dan jumlah terkumpul.":"Catat pemasukan atau pengeluaran."}</p></div><button onClick={()=>setModal(null)}><X/></button></div>
 {tx?<form onSubmit={modal.type==="editTx"?saveTx:addTx}><label>Jenis transaksi<select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}><option value="expense">Pengeluaran</option><option value="income">Pemasukan</option></select></label><label>Nominal<input type="number" min="1" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} required/></label><label>Kategori<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option>Uang Saku</option><option>Makanan</option><option>Transportasi</option><option>Pendidikan</option><option>Hiburan</option><option>Belanja</option><option>Pulsa/Internet</option><option>Kesehatan</option><option>Lainnya</option></select></label><label>Catatan <span className="optional">(opsional)</span><input value={form.note} onChange={e=>setForm({...form,note:e.target.value})}/></label><button className="primary full" type="submit">Simpan</button></form>
 :<form onSubmit={saveTarget}><label>Nama Target<input placeholder="Contoh: Beli Laptop" value={targetForm.name} onChange={e=>setTargetForm({...targetForm,name:e.target.value})} required/></label><label>Target (Rp)<input type="number" min="1" value={targetForm.target} onChange={e=>setTargetForm({...targetForm,target:e.target.value})} required/></label><label>Jumlah Terkumpul (Rp)<input type="number" min="0" value={targetForm.saved} onChange={e=>setTargetForm({...targetForm,saved:e.target.value})}/></label><label>Deskripsi <span className="optional">(opsional)</span><input placeholder="Untuk kebutuhan belajar" value={targetForm.desc} onChange={e=>setTargetForm({...targetForm,desc:e.target.value})}/></label><button className="primary full" type="submit">Simpan Target</button></form>}
 </div></div>
}
createRoot(document.getElementById("root")).render(<App/>);
