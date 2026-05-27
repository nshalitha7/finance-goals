import React, { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const emptyGoal = { name:'', category:'', target_amount:'', target_date:'', start_date:new Date().toISOString().slice(0,10) };

export default function App() {
  const [goals, setGoals] = useState([]); const [summary, setSummary] = useState({});
  const [form, setForm] = useState(emptyGoal); const [selected, setSelected] = useState(null); const [error, setError] = useState(''); const [whatIf, setWhatIf] = useState(0); const [whatIfDate, setWhatIfDate] = useState('');
  const load = async()=>{ const {data}=await api.get('/goals'); setGoals(data.goals); setSummary(data.summary); if(selected){setSelected(data.goals.find(g=>g.id===selected.id));}};
  useEffect(()=>{load();},[]);

  const submitGoal=async(e)=>{e.preventDefault(); setError(''); try{ const payload={...form,target_amount:Number(form.target_amount)}; if(form.id) await api.put(`/goals/${form.id}`,payload); else await api.post('/goals',payload); setForm(emptyGoal); await load(); }catch{setError('Invalid goal input');}};
  const addTxn=async(e)=>{e.preventDefault(); const f=e.target; await api.post(`/goals/${selected.id}/transactions`,{amount:Number(f.amount.value),type:f.type.value,note:f.note.value,transaction_date:f.transaction_date.value}); f.reset(); await load();};
  const runWhatIf = async()=>{ const {data}=await api.get(`/goals/${selected.id}/what-if?monthly=${whatIf}`); setWhatIfDate(data.projectedDate || 'N/A'); };

  const paceSeries=useMemo(()=>selected?selected.metrics.monthlySeries.map((m,i)=>({month:m.month,actual:selected.metrics.monthlySeries.slice(0,i+1).reduce((s,x)=>s+x.net,0),planned:((i+1)*selected.target_amount/Math.max(1,selected.metrics.monthlySeries.length))})):[],[selected]);

  return <div className='container'><h1>Financial Goal Tracker</h1>{error&&<p className='error'>{error}</p>}
    <section className='grid stats'><Card t='Total Saved' v={`$${(summary.totalSaved||0).toFixed?.(2) || '0.00'}`}/><Card t='Avg Monthly Contribution' v={`$${(summary.averageMonthlyContribution||0).toFixed?.(2) || '0.00'}`}/><Card t='Completion Rate' v={`${(summary.completionRate||0).toFixed?.(1) || 0}%`}/></section>
    <section className='grid'>
      <form onSubmit={submitGoal} className='panel'>
        <h3>{form.id?'Edit':'Create'} Goal</h3>
        {['name','category','target_amount','target_date','start_date'].map(k=><input key={k} required value={form[k]} type={k.includes('date')?'date':k==='target_amount'?'number':'text'} step={k==='target_amount'?'0.01':undefined} onChange={e=>setForm({...form,[k]:e.target.value})} placeholder={k.replace('_',' ')} />)}
        <button>Save Goal</button>
      </form>
      <div className='panel'><h3>Goals Dashboard</h3>{goals.map(g=><div key={g.id} className='goal' onClick={()=>setSelected(g)}><b>{g.name}</b> <span>{g.metrics.achieved?'🎉 Achieved':''}</span><div className='progress'><div style={{width:`${g.metrics.progressPct}%`}}/></div><small>${g.metrics.totalSaved} / ${g.target_amount} ({g.metrics.progressPct}%) {g.metrics.behindPace&&'⚠️ Behind pace'}</small><div><button onClick={(e)=>{e.stopPropagation();setForm(g);}}>Edit</button><button onClick={async(e)=>{e.stopPropagation();await api.delete(`/goals/${g.id}`); if(selected?.id===g.id) setSelected(null); load();}}>Delete</button></div></div>)}</div>
    </section>
    {selected && <section className='panel'><h3>{selected.name} Insights</h3>
      <p>Projected completion: {selected.metrics.projectedCompletionDate || 'Insufficient data'} | Confidence: {selected.metrics.confidence}%</p>
      <div className='charts'>
        <Chart title='Monthly Net Contributions'><ResponsiveContainer width='100%' height={220}><BarChart data={selected.metrics.monthlySeries}><XAxis dataKey='month'/><YAxis/><Tooltip/><Bar dataKey='net' fill='#4f46e5'/></BarChart></ResponsiveContainer></Chart>
        <Chart title='Contribution Trend'><ResponsiveContainer width='100%' height={220}><AreaChart data={selected.metrics.monthlySeries}><XAxis dataKey='month'/><YAxis/><Tooltip/><Area dataKey='net' stroke='#0891b2' fill='#67e8f9'/></AreaChart></ResponsiveContainer></Chart>
        <Chart title='Actual vs Planned'><ResponsiveContainer width='100%' height={220}><LineChart data={paceSeries}><XAxis dataKey='month'/><YAxis/><Tooltip/><Line dataKey='actual' stroke='#16a34a'/><Line dataKey='planned' stroke='#dc2626'/></LineChart></ResponsiveContainer></Chart>
      </div>
      <form onSubmit={addTxn} className='inline'><input name='amount' type='number' step='0.01' placeholder='Amount' required/><select name='type'><option value='deposit'>Deposit</option><option value='withdrawal'>Withdrawal</option></select><input name='transaction_date' type='date' required/><input name='note' placeholder='Note'/><button>Add Transaction</button></form>
      <div className='inline'><input type='number' value={whatIf} onChange={e=>setWhatIf(e.target.value)} placeholder='What-if monthly contribution'/><button onClick={runWhatIf}>Simulate</button><span>{whatIfDate && `Projected date: ${whatIfDate}`}</span></div>
    </section>}
  </div>;
}

const Card=({t,v})=><div className='panel'><h4>{t}</h4><p>{v}</p></div>;
const Chart=({title,children})=><div><h4>{title}</h4>{children}</div>;
