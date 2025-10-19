import React, { useState, useEffect, useMemo } from 'react';

// Normalized comparison chart (0-100% of term on X, 100%→0% remaining on Y)
const AmortizationChart = ({ mode, series, selectedId, light, taxRate }) => {
  if (!series || series.length === 0) return null;
  const width = 640; const height = 320; const padding = 36;
  const xFor = (t) => padding + t * (width - padding * 2); // t in [0,1]
  const yFor = (r) => padding + (1 - r) * (height - padding * 2); // r in [0,1]

  const curves = useMemo(() => {
    const calcFinance = (p) => {
      const salesTax = p.price * (taxRate / 100);
      const principal = Math.max(0, p.price + salesTax - p.downPayment);
      const r = p.apr / 100 / 12;
      const n = p.term;
      const mPay = r === 0 ? principal / n : principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
      let bal = principal;
      const pts = [];
      for (let i = 0; i <= n; i++) {
        pts.push({ t: i / n, remainRatio: principal > 0 ? Math.max(0, bal) / principal : 0, label: { month: i, raw: Math.max(0, bal) } });
        const interestForMonth = bal * r;
        const principalForMonth = mPay - interestForMonth;
        bal -= principalForMonth;
      }
      return pts;
    };
    const calcLease = (p) => {
      const capCost = Math.max(0, p.price - p.downPayment);
      const residualRate = p.term <= 24 ? 0.7 : p.term <= 36 ? 0.6 : p.term <= 48 ? 0.55 : p.term <= 60 ? 0.5 : 0.45;
      const residualValue = capCost * residualRate;
      const moneyFactor = (p.apr / 100) / 2400;
      const baseMonthly = (capCost - residualValue) / p.term + (capCost + residualValue) * moneyFactor;
      const monthlyWithTax = baseMonthly * (1 + taxRate / 100);
      const total = monthlyWithTax * p.term;
      const pts = [];
      for (let i = 0; i <= p.term; i++) {
        const remain = monthlyWithTax * (p.term - i);
        pts.push({ t: i / p.term, remainRatio: total > 0 ? remain / total : 0, label: { month: i, raw: remain } });
      }
      return pts;
    };
    return series.map((p) => ({ id: p.id, name: p.name, pts: (mode === 'Finance' ? calcFinance(p) : calcLease(p)) }));
  }, [series, mode, taxRate]);

  const [hoverT, setHoverT] = useState(null);
  const onMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const relX = e.clientX - rect.left - padding;
    const frac = Math.min(1, Math.max(0, relX / (width - padding * 2)));
    setHoverT(frac);
  };

  const styles = {
    chartContainer: { marginTop: '8px', fontFamily: 'sans-serif', color: light ? '#475569' : '#666', fontSize: '12px' },
    svg: { border: '1px solid #eee', borderRadius: '12px', background: '#fff' },
    path: { stroke: light ? '#ef4444' : '#007bff', strokeWidth: '2.5', fill: 'none' },
    grid: { stroke: '#e5e7eb', strokeWidth: 1 },
    axisLabel: { fill: '#9ca3af', fontSize: '11px' }
  };

  const gridLines = [];
  for (let i = 0; i <= 4; i++) {
    const y = padding + (i / 4) * (height - padding * 2);
    gridLines.push(
      <g key={`gy-${i}`}>
        <line x1={padding} y1={y} x2={width - padding} y2={y} style={styles.grid} />
        <text x={padding - 8} y={y + 4} textAnchor="end" style={styles.axisLabel}>{(100 - i * 25)}%</text>
      </g>
    );
  }
  const xTicks = [];
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    const x = xFor(t);
    xTicks.push(<text key={`gx-${i}`} x={x} y={height - 10} textAnchor="middle" style={styles.axisLabel}>{Math.round(t * 100)}%</text>);
  }

  return (
    <div style={styles.chartContainer}>
      <div style={{ marginBottom: 8, fontWeight: 600 }}>Loan Balance Over Time</div>
      <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} style={styles.svg} onMouseMove={onMouseMove} onMouseLeave={()=>setHoverT(null)}>
        <rect x={0} y={0} width={width} height={height} rx={12} fill="#ffffff" />
        {gridLines}
        {curves.map((c) => {
          const d = c.pts.map((p,i)=>`${i===0?'M':'L'} ${xFor(p.t).toFixed(2)} ${yFor(p.remainRatio).toFixed(2)}`).join(' ');
          const isActive = c.id === selectedId;
          return (
            <g key={c.id}>
              <path d={d} style={{ stroke: '#ef4444', strokeOpacity: isActive ? 1 : 0.35, strokeWidth: isActive ? 3 : 1.5, fill: 'none', strokeDasharray: isActive ? '0' : '4,6' }} />
              {isActive && c.pts.map((p,i)=>(<circle key={i} cx={xFor(p.t)} cy={yFor(p.remainRatio)} r={1.6} fill="#ef4444" opacity={0.25} />))}
            </g>
          );
        })}
        {hoverT !== null && (
          <g>
            <line x1={xFor(hoverT)} y1={padding} x2={xFor(hoverT)} y2={height - padding} stroke="#ef4444" strokeDasharray="4,4" opacity="0.6" />
            {curves.map((c, idx) => {
              const i = Math.round(hoverT * (c.pts.length - 1));
              const p = c.pts[i];
              const cx = xFor(p.t); const cy = yFor(p.remainRatio);
              const boxX = Math.min(cx + 8, width - 170);
              const boxY = Math.max(cy - 20 - idx * 40, padding);
              const label = mode==='Finance' ? 'Balance' : 'Remaining';
              const val = Math.round(p.label.raw).toLocaleString();
              const isActive = c.id === selectedId;
              return (
                <g key={`tt-${c.id}`}>
                  <circle cx={cx} cy={cy} r={4} fill="#ef4444" opacity={isActive?1:0.5} />
                  {isActive && (
                    <>
                      <rect x={boxX} y={boxY} width={160} height={34} rx={6} fill="white" stroke="#fecaca" />
                      <text x={boxX + 8} y={boxY + 14} fill="#ef4444" fontSize="11" fontWeight="700">{c.name} • {Math.round(p.t*100)}%</text>
                      <text x={boxX + 8} y={boxY + 26} fill="#0f172a" fontSize="11">{label} ${val}</text>
                    </>
                  )}
                </g>
              );
            })}
          </g>
        )}
        {xTicks}
      </svg>
    </div>
  );
};

// Main Simulation Component
const PaymentSimulation = ({ plans, taxRate = 8.25, readOnly = false, initialPlanId, light = false, hidePlanButtons = false, orientation = 'vertical' }) => {
  const defaultPlan = initialPlanId ? (plans.find(p => p.id === initialPlanId) ?? plans[0]) : plans[0];
  const [mode, setMode] = useState('Finance');
  const [activePlan, setActivePlan] = useState(defaultPlan.id);
  const [price, setPrice] = useState(defaultPlan.price);
  const [term, setTerm] = useState(defaultPlan.term);
  const [apr, setApr] = useState(defaultPlan.apr);
  const [downPayment, setDownPayment] = useState(defaultPlan.downPayment ?? 4000);
  const [tradeIn, setTradeIn] = useState(0);

  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [financedAmount, setFinancedAmount] = useState(0);

  const selectPlan = (plan) => {
    setActivePlan(plan.id);
    setPrice(plan.price);
    setTerm(plan.term);
    setApr(plan.apr);
    setDownPayment(plan.downPayment ?? downPayment);
  };

  // React to incoming plan id changes from parent
  useEffect(() => {
    const next = initialPlanId ? (plans.find(p => p.id === initialPlanId) ?? plans[0]) : plans[0];
    setActivePlan(next.id);
    setPrice(next.price);
    setTerm(next.term);
    setApr(next.apr);
    setDownPayment(next.downPayment ?? downPayment);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPlanId]);

  useEffect(() => {
    if (mode === 'Finance') {
      const salesTax = price * (taxRate / 100);
      const totalCost = price + salesTax;
      const principal = totalCost - downPayment - tradeIn;
      setFinancedAmount(principal > 0 ? principal : 0);
      if (principal <= 0) { setMonthlyPayment(0); return; }
      const monthlyInterestRate = apr / 100 / 12;
      const numberOfPayments = term;
      if (monthlyInterestRate === 0) { setMonthlyPayment(principal / numberOfPayments); return; }
      const payment = principal * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
      setMonthlyPayment(payment);
    } else {
      // Simple lease model
      const capCost = Math.max(0, price - downPayment - tradeIn);
      // Residual rate heuristic based on term
      const residualRate = term <= 24 ? 0.7 : term <= 36 ? 0.6 : term <= 48 ? 0.55 : term <= 60 ? 0.5 : 0.45;
      const residualValue = capCost * residualRate;
      const moneyFactor = (apr / 100) / 2400; // approximate conversion
      const depreciationFee = (capCost - residualValue) / term;
      const financeFee = (capCost + residualValue) * moneyFactor;
      const baseMonthly = depreciationFee + financeFee;
      const monthlyWithTax = baseMonthly * (1 + taxRate / 100);
      setMonthlyPayment(monthlyWithTax);
      setFinancedAmount(monthlyWithTax * term);
    }
  }, [mode, price, term, apr, downPayment, tradeIn, taxRate]);

  const styles = {
    container: light
      ? { fontFamily: 'Arial, sans-serif', backgroundColor: 'rgba(255,255,255,0.85)', padding: '20px', borderRadius: '16px', width: '100%', boxShadow: '0 18px 50px -12px rgba(239,68,68,0.25)', border: '1px solid rgba(239,68,68,0.2)', backdropFilter: 'blur(10px)', color: '#0f172a' }
      : { fontFamily: 'Arial, sans-serif', backgroundColor: 'rgba(255,255,255,0.06)', padding: '24px', borderRadius: '12px', maxWidth: '960px', margin: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: 'white' },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' },
    planButtons: { display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '16px' },
    button: light
      ? { flex: 1, padding: '12px 16px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s', margin: '0 4px', borderRadius: '10px', color: '#0f172a' }
      : { flex: 1, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s', margin: '0 4px', borderRadius: '8px', color: 'white' },
    activeButton: { backgroundColor: '#ef4444', color: 'white', border: '1px solid #ef4444' },
    sliderGroup: { marginBottom: '14px' },
    label: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 'bold', color: light ? '#374151' : '#e5e7eb' },
    slider: { width: '100%', opacity: readOnly ? 0.5 : 1 },
    results: { marginTop: '12px', textAlign: 'center' },
    paymentDisplay: { fontSize: '2em', fontWeight: 'bold', color: light ? '#0f172a' : 'white' },
    paymentLabel: { fontSize: '1em', color: light ? '#374151' : '#e5e7eb' },
    toggleContainer: light
      ? { display: 'flex', justifyContent: 'center', backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: '10px', padding: '4px', border: '1px solid rgba(239,68,68,0.2)' }
      : { display: 'flex', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '4px' },
    toggleButton: light
      ? { flex: 1, padding: '8px 12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', borderRadius: '8px', color: '#ef4444' }
      : { flex: 1, padding: '10px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', borderRadius: '6px', color: 'white' },
    activeToggle: light
      ? { backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444', boxShadow: '0 2px 4px rgba(0,0,0,0.06)', borderRadius: '8px' }
      : { backgroundColor: 'rgba(255,255,255,0.12)', color: '#ef4444', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
  };

  const seriesPlans = useMemo(() => plans.map(p => (
    p.id === activePlan ? { ...p, price, term, apr, downPayment } : p
  )), [plans, activePlan, price, term, apr, downPayment]);

  return (
    <div style={styles.container}>
      <div style={styles.headerRow}>
        <div style={styles.toggleContainer}>
          <button onClick={() => setMode('Finance')} style={{ ...styles.toggleButton, ...(mode === 'Finance' ? styles.activeToggle : {}) }}>Finance</button>
          <button onClick={() => setMode('Lease')} style={{ ...styles.toggleButton, ...(mode === 'Lease' ? styles.activeToggle : {}) }}>Lease</button>
        </div>
      </div>

      {!hidePlanButtons && (
        <div style={styles.planButtons}>
          {plans.map((plan) => (
            <button key={plan.id} onClick={() => selectPlan(plan)} style={{ ...styles.button, ...(activePlan === plan.id ? styles.activeButton : {}) }} className="sim-button">
              {plan.name}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: orientation === 'horizontal' ? 'grid' : 'block', gridTemplateColumns: orientation === 'horizontal' ? '1fr 1.4fr' : undefined, gap: orientation === 'horizontal' ? '20px' : undefined }}>
        <div>
          {mode === 'Finance' ? (
            <>
              <div style={styles.sliderGroup}><div style={styles.label}><span>Vehicle Price</span><span>${price.toLocaleString()}</span></div><input className="sim-range" disabled={readOnly} type="range" min="15000" max="50000" step="500" value={price} onChange={(e) => setPrice(Number(e.target.value))} style={styles.slider} /></div>
              <div style={styles.sliderGroup}><div style={styles.label}><span>Down Payment</span><span>${downPayment.toLocaleString()}</span></div><input className="sim-range" disabled={readOnly} type="range" min="0" max="15000" step="500" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} style={styles.slider} /></div>
              <div style={styles.sliderGroup}><div style={styles.label}><span>Trade-in Value</span><span>${tradeIn.toLocaleString()}</span></div><input className="sim-range" disabled={readOnly} type="range" min="0" max="15000" step="500" value={tradeIn} onChange={(e) => setTradeIn(Number(e.target.value))} style={styles.slider} /></div>
              <div style={styles.sliderGroup}><div style={styles.label}><span>Term</span><span>{term} Months</span></div><input className="sim-range" disabled={readOnly} type="range" min="24" max="84" step="12" value={term} onChange={(e) => setTerm(Number(e.target.value))} style={styles.slider} /></div>
              <div style={styles.sliderGroup}><div style={styles.label}><span>APR</span><span>{apr.toFixed(1)}%</span></div><input className="sim-range" disabled={readOnly} type="range" min="0.9" max="12.9" step="0.1" value={apr} onChange={(e) => setApr(Number(e.target.value))} style={styles.slider} /></div>
            </>
          ) : (
            <div style={{textAlign: 'center', padding: '40px', color: light ? '#475569' : '#666'}}>Lease simulation controls would be displayed here.</div>
          )}
          <div style={styles.results}>
            <div style={styles.paymentLabel}>Estimated Monthly Payment</div>
            <div style={styles.paymentDisplay}>${monthlyPayment > 0 ? monthlyPayment.toFixed(2) : '0.00'}</div>
          </div>
        </div>
        <div>
          <AmortizationChart mode={mode} series={seriesPlans} selectedId={activePlan} light={light} taxRate={taxRate} />
        </div>
      </div>
    </div>
  );
};

export default PaymentSimulation;
