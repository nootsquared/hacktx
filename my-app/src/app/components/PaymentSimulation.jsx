import React, { useState, useEffect } from 'react';

// A new component for the amortization line chart visualization
const AmortizationChart = ({ principal, term, apr, monthlyPayment }) => {
  if (principal <= 0 || term <= 0) return null; // Don't render if there's no loan

  const points = [];
  let balance = principal;
  const monthlyInterestRate = apr / 100 / 12;

  for (let i = 0; i <= term; i++) {
    points.push({ month: i, balance: balance });
    const interestForMonth = balance * monthlyInterestRate;
    const principalForMonth = monthlyPayment - interestForMonth;
    balance -= principalForMonth;
  }
  
  // SVG drawing logic
  const width = 300;
  const height = 150;
  const pathData = points.map((p, i) => {
      const x = (i / term) * width;
      const y = height - (p.balance / principal) * height;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    }).join(' ');

  const styles = {
    chartContainer: {
      marginTop: '20px',
      fontFamily: 'sans-serif',
      color: '#666',
      fontSize: '12px'
    },
    svg: {
      border: '1px solid #eee',
      borderRadius: '4px',
      overflow: 'visible'
    },
    path: {
      stroke: '#007bff',
      strokeWidth: '2',
      fill: 'none',
    },
    axisLabel: {
      fill: '#999',
      fontSize: '10px'
    }
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
const PaymentSimulation = ({ plans, taxRate = 8.25 }) => {
  const [mode, setMode] = useState('Finance'); // 'Finance' or 'Lease'
  
  // State for sliders, initialized with the first plan
  const [activePlan, setActivePlan] = useState(plans[0].id);
  const [price, setPrice] = useState(plans[0].price);
  const [term, setTerm] = useState(plans[0].term);
  const [apr, setApr] = useState(plans[0].apr);
  const [downPayment, setDownPayment] = useState(4000);
  const [tradeIn, setTradeIn] = useState(0);

  // State for calculated values
  const [monthlyPayment, setMonthlyPayment] = useState(0);
  const [financedAmount, setFinancedAmount] = useState(0);

  // Function to handle clicks on the plan buttons
  const selectPlan = (plan) => {
    setActivePlan(plan.id);
    setPrice(plan.price);
    setTerm(plan.term);
    setApr(plan.apr);
  };

  // Recalculate payment whenever a value changes
  useEffect(() => {
    if (mode === 'Finance') {
      const salesTax = price * (taxRate / 100);
      const totalCost = price + salesTax;
      const principal = totalCost - downPayment - tradeIn;
      setFinancedAmount(principal > 0 ? principal : 0);

      if (principal <= 0) {
        setMonthlyPayment(0);
        return;
      }

      const monthlyInterestRate = apr / 100 / 12;
      const numberOfPayments = term;
      
      if (monthlyInterestRate === 0) {
        setMonthlyPayment(principal / numberOfPayments);
        return;
      }
      
      const payment =
        principal *
        (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);

      setMonthlyPayment(payment);
    } else {
      // Placeholder for Lease calculation logic
      setMonthlyPayment(350); // Example static value
      setFinancedAmount(0);
    }
  }, [mode, price, term, apr, downPayment, tradeIn, taxRate]);

  // Inline styles for the component (condensed for brevity)
  const styles = {
    container: { fontFamily: 'Arial, sans-serif', backgroundColor: '#f9f9f9', padding: '24px', borderRadius: '8px', maxWidth: '500px', margin: 'auto', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
    planButtons: { display: 'flex', justifyContent: 'space-between', marginBottom: '24px' },
    button: { flex: 1, padding: '12px 16px', border: '1px solid #ccc', backgroundColor: '#fff', cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s', margin: '0 4px', borderRadius: '4px' },
    activeButton: { backgroundColor: '#007bff', color: 'white', border: '1px solid #007bff' },
    sliderGroup: { marginBottom: '20px' },
    label: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 'bold' },
    slider: { width: '100%' },
    results: { marginTop: '24px', textAlign: 'center' },
    paymentDisplay: { fontSize: '2em', fontWeight: 'bold', color: '#333' },
    paymentLabel: { fontSize: '1em', color: '#666' },
    toggleContainer: { display: 'flex', justifyContent: 'center', marginBottom: '20px', backgroundColor: '#e9ecef', borderRadius: '8px', padding: '4px' },
    toggleButton: { flex: 1, padding: '10px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', borderRadius: '6px' },
    activeToggle: { backgroundColor: '#fff', color: '#007bff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
  };

  return (
    <div style={styles.container}>
      <div style={styles.toggleContainer}>
        <button onClick={() => setMode('Finance')} style={{ ...styles.toggleButton, ...(mode === 'Finance' ? styles.activeToggle : {}) }}>Finance</button>
        <button onClick={() => setMode('Lease')} style={{ ...styles.toggleButton, ...(mode === 'Lease' ? styles.activeToggle : {}) }}>Lease</button>
      </div>

      <div style={styles.planButtons}>
        {plans.map((plan) => ( <button key={plan.id} onClick={() => selectPlan(plan)} style={{ ...styles.button, ...(activePlan === plan.id ? styles.activeButton : {}) }}>{plan.name}</button> ))}
      </div>
      
      {/* Sliders will be rendered based on the mode */}
      {mode === 'Finance' ? (
        <>
          <div style={styles.sliderGroup}><div style={styles.label}><span>Vehicle Price</span><span>${price.toLocaleString()}</span></div><input type="range" min="15000" max="50000" step="500" value={price} onChange={(e) => setPrice(Number(e.target.value))} style={styles.slider} /></div>
          <div style={styles.sliderGroup}><div style={styles.label}><span>Down Payment</span><span>${downPayment.toLocaleString()}</span></div><input type="range" min="0" max="15000" step="500" value={downPayment} onChange={(e) => setDownPayment(Number(e.target.value))} style={styles.slider} /></div>
          <div style={styles.sliderGroup}><div style={styles.label}><span>Trade-in Value</span><span>${tradeIn.toLocaleString()}</span></div><input type="range" min="0" max="15000" step="500" value={tradeIn} onChange={(e) => setTradeIn(Number(e.target.value))} style={styles.slider} /></div>
          <div style={styles.sliderGroup}><div style={styles.label}><span>Term</span><span>{term} Months</span></div><input type="range" min="24" max="84" step="12" value={term} onChange={(e) => setTerm(Number(e.target.value))} style={styles.slider} /></div>
          <div style={styles.sliderGroup}><div style={styles.label}><span>APR</span><span>{apr.toFixed(1)}%</span></div><input type="range" min="0.9" max="12.9" step="0.1" value={apr} onChange={(e) => setApr(Number(e.target.value))} style={styles.slider} /></div>
        </>
      ) : (
        <div style={{textAlign: 'center', padding: '40px', color: '#666'}}>Lease simulation controls would be displayed here.</div>
      )}

      <div style={styles.results}>
        <div style={styles.paymentLabel}>Estimated Monthly Payment</div>
        <div style={styles.paymentDisplay}>${monthlyPayment > 0 ? monthlyPayment.toFixed(2) : '0.00'}</div>
        <AmortizationChart principal={financedAmount} term={term} apr={apr} monthlyPayment={monthlyPayment}/>
      </div>
    </div>
  );
};

export default PaymentSimulation;