import React, { useState, useEffect } from 'react';

// Amortization line chart visualization
const AmortizationChart = ({ principal, term, apr, monthlyPayment, light }) => {
  if (principal <= 0 || term <= 0) return null;

  const points = [];
  let balance = principal;
  const monthlyInterestRate = apr / 100 / 12;
  for (let i = 0; i <= term; i++) {
    points.push({ month: i, balance });
    const interestForMonth = balance * monthlyInterestRate;
    const principalForMonth = monthlyPayment - interestForMonth;
    balance -= principalForMonth;
  }
  const width = 300;
  const height = 150;
  const pathData = points
    .map((p, i) => {
      const x = (i / term) * width;
      const y = height - (p.balance / principal) * height;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');

  const styles = {
    chartContainer: { marginTop: '20px', fontFamily: 'sans-serif', color: light ? '#475569' : '#666', fontSize: '12px' },
    svg: { border: '1px solid #eee', borderRadius: '8px', overflow: 'visible' },
    path: { stroke: light ? '#ef4444' : '#007bff', strokeWidth: '2', fill: 'none' },
    axisLabel: { fill: '#9ca3af', fontSize: '10px' }
  };

  return (
    <div style={styles.chartContainer}>
      <div>Loan Balance Over Time</div>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={styles.svg}>
        <path d={pathData} style={styles.path} />
        <text x="0" y={height + 15} style={styles.axisLabel}>0 Months</text>
        <text x={width} y={height + 15} textAnchor="end" style={styles.axisLabel}>{term} Months</text>
      </svg>
    </div>
  );
};

// Main Simulation Component
const PaymentSimulation = ({ plans, taxRate = 8.25, readOnly = false, initialPlanId, light = false }) => {
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
      setMonthlyPayment(350);
      setFinancedAmount(0);
    }
  }, [mode, price, term, apr, downPayment, tradeIn, taxRate]);

  const styles = {
    container: light
      ? { fontFamily: 'Arial, sans-serif', backgroundColor: 'rgba(255,255,255,0.78)', padding: '24px', borderRadius: '16px', maxWidth: '960px', margin: 'auto', boxShadow: '0 18px 50px -12px rgba(239,68,68,0.35)', border: '1px solid rgba(239,68,68,0.25)', backdropFilter: 'blur(10px)', color: '#0f172a' }
      : { fontFamily: 'Arial, sans-serif', backgroundColor: 'rgba(255,255,255,0.06)', padding: '24px', borderRadius: '12px', maxWidth: '960px', margin: 'auto', boxShadow: '0 10px 30px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: 'white' },
    planButtons: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px' },
    button: light
      ? { flex: 1, padding: '12px 16px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s', margin: '0 4px', borderRadius: '10px', color: '#0f172a' }
      : { flex: 1, padding: '12px 16px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s', margin: '0 4px', borderRadius: '8px', color: 'white' },
    activeButton: { backgroundColor: '#ef4444', color: 'white', border: '1px solid #ef4444' },
    sliderGroup: { marginBottom: '20px' },
    label: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 'bold', color: light ? '#374151' : '#e5e7eb' },
    slider: { width: '100%', opacity: readOnly ? 0.5 : 1 },
    results: { marginTop: '24px', textAlign: 'center' },
    paymentDisplay: { fontSize: '2em', fontWeight: 'bold', color: light ? '#0f172a' : 'white' },
    paymentLabel: { fontSize: '1em', color: light ? '#374151' : '#e5e7eb' },
    toggleContainer: light
      ? { display: 'flex', justifyContent: 'center', marginBottom: '20px', backgroundColor: 'rgba(239,68,68,0.08)', borderRadius: '10px', padding: '4px', border: '1px solid rgba(239,68,68,0.2)' }
      : { display: 'flex', justifyContent: 'center', marginBottom: '20px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: '8px', padding: '4px' },
    toggleButton: light
      ? { flex: 1, padding: '10px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', borderRadius: '8px', color: '#ef4444' }
      : { flex: 1, padding: '10px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', borderRadius: '6px', color: 'white' },
    activeToggle: light
      ? { backgroundColor: 'rgba(239,68,68,0.12)', color: '#ef4444', boxShadow: '0 2px 4px rgba(0,0,0,0.06)', borderRadius: '8px' }
      : { backgroundColor: 'rgba(255,255,255,0.12)', color: '#ef4444', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.toggleContainer}>
        <button onClick={() => setMode('Finance')} style={{ ...styles.toggleButton, ...(mode === 'Finance' ? styles.activeToggle : {}) }}>Finance</button>
        <button onClick={() => setMode('Lease')} style={{ ...styles.toggleButton, ...(mode === 'Lease' ? styles.activeToggle : {}) }}>Lease</button>
      </div>

      <div style={styles.planButtons}>
        {plans.map((plan) => (
          <button key={plan.id} onClick={() => selectPlan(plan)} style={{ ...styles.button, ...(activePlan === plan.id ? styles.activeButton : {}) }} className="sim-button">
            {plan.name}
          </button>
        ))}
      </div>

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
        <AmortizationChart principal={financedAmount} term={term} apr={apr} monthlyPayment={monthlyPayment} light={light} />
      </div>
    </div>
  );
};

export default PaymentSimulation;
