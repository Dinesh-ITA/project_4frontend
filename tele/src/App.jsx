import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabaseClient';
import './index.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [user, setUser] = useState('Dinesh');
  
  // High-end flexible window scaling configuration
  const [durationValue, setDurationValue] = useState('60');
  const [durationUnit, setDurationUnit] = useState('minutes'); // options: minutes, hours, days
  
  // State to track who is currently viewing the console
  const [currentOperator, setCurrentOperator] = useState(null);
  
  // Track which task ID is currently awaiting confirmation
  const [confirmTaskId, setConfirmTaskId] = useState(null);
  const resetTimerRef = useRef(null);

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(() => fetchTasks(), 5000);
    return () => {
      clearInterval(interval);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, []);

  async function fetchTasks() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('is_completed', false)
      .order('id', { ascending: false });

    if (!error && data) {
      setTasks(data);
    }
  }

  async function handleAddTask(e) {
    e.preventDefault();
    if (!title.trim()) return;

    const creationTime = new Date();
    
    // Convert selected unit scale directly to milliseconds
    let multiplier = 60000; // default minutes
    if (durationUnit === 'hours') multiplier = 60000 * 60;
    if (durationUnit === 'days') multiplier = 60000 * 60 * 24;

    const targetDeadline = new Date(creationTime.getTime() + parseInt(durationValue) * multiplier);

    const { error } = await supabase
      .from('tasks')
      .insert([
        {
          title: title,
          users: user,
          reminder_time: targetDeadline.toISOString(),
          is_completed: false,
          current_milestone: null
        }
      ]);

    if (!error) {
      setTitle('');
      fetchTasks();
    }
  }

  function handleResolveClick(taskId) {
    if (confirmTaskId === taskId) {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      setConfirmTaskId(null);
      handleCompleteTask(taskId);
    } else {
      setConfirmTaskId(taskId);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => {
        setConfirmTaskId(null);
      }, 3000);
    }
  }

  async function handleCompleteTask(taskId) {
    const { error } = await supabase
      .from('tasks')
      .update({ is_completed: true })
      .eq('id', taskId);

    if (!error) {
      fetchTasks();
    }
  }

  const renderProgress = (createdAtStr, reminderTimeStr) => {
    const start = Date.parse(createdAtStr);
    const end = Date.parse(reminderTimeStr);
    const now = Date.now();

    const total = end - start;
    const passed = now - start;

    if (total <= 0) return 100;
    const rawPct = (passed / total) * 100;
    return Math.min(Math.max(parseFloat(rawPct.toFixed(1)), 0), 100);
  };

  const filteredTasks = tasks.filter(task => task.users === currentOperator);

  // --- SCREEN 1: OPERATOR GATE ---
  if (!currentOperator) {
    return (
      <div style={{ maxWidth: '500px', width: '100%', padding: '80px 16px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <header style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '2.4rem', 
            fontWeight: '800', 
            letterSpacing: '-0.04em', 
            background: 'linear-gradient(to right, #ffffff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0' 
          }}>
            EXECUTION HUB
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', marginTop: '6px', fontWeight: '500' }}>
            Identify Active Console Operator
          </p>
        </header>

        <div className="glass-card" style={{ padding: '32px', textAlign: 'center' }}>
          <h3 style={{ marginTop: '0', marginBottom: '24px', fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc' }}>
            Select Your Workspace
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button 
              className="metallic-btn" 
              onClick={() => { setCurrentOperator('Dinesh'); setUser('Dinesh'); }}
              style={{ padding: '16px', borderRadius: '12px', fontSize: '1.1rem', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' }}
            >
              Dinesh
            </button>
            <button 
              className="metallic-btn" 
              onClick={() => { setCurrentOperator('Thilip'); setUser('Thilip'); }}
              style={{ padding: '16px', borderRadius: '12px', fontSize: '1.1rem', background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)' }}
            >
              Thilip
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- SCREEN 2: MAIN FILTERED WORKSPACE ---
  return (
    <div style={{ maxWidth: '650px', width: '100%', padding: '24px 16px', boxSizing: 'border-box' }}>
      
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingTop: '10px' }}>
        <div>
          <h1 style={{ 
            fontSize: '1.8rem', 
            fontWeight: '800', 
            letterSpacing: '-0.04em', 
            background: 'linear-gradient(to right, #ffffff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: '0' 
          }}>
            EXECUTION HUB
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0 0 0', fontWeight: '500' }}>
            Active Session: <strong style={{ color: currentOperator === 'Dinesh' ? '#818cf8' : '#38bdf8' }}>{currentOperator}</strong>
          </p>
        </div>

        <button 
          onClick={() => setCurrentOperator(null)}
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#94a3b8',
            padding: '8px 14px',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)'}
        >
          🔄 Switch Identity
        </button>
      </header>

      {/* Task Creation Card with Days/Hours Config option */}
      <div className="glass-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <h3 style={{ marginTop: '0', marginBottom: '20px', fontSize: '1.1rem', fontWeight: '700', color: '#f8fafc', letterSpacing: '-0.02em' }}>
          ⚡ Launch Operation
        </h3>
        
        <form onSubmit={handleAddTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', fontWeight: '700', letterSpacing: '0.05em' }}>OBJECTIVE DESCRIPTION</label>
            <input 
              type="text" 
              className="cyber-input"
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter active objective details..." 
            />
          </div>

          {/* Three Column Grid layout for elegant proportions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', fontWeight: '700', letterSpacing: '0.05em' }}>ASSIGN OPERATOR</label>
              <select className="cyber-input" value={user} onChange={(e) => setUser(e.target.value)}>
                <option value="Dinesh">Dinesh</option>
                <option value="Thilip">Thilip</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', fontWeight: '700', letterSpacing: '0.05em' }}>WINDOW DURATION</label>
              <input 
                type="number" 
                className="cyber-input"
                value={durationValue} 
                onChange={(e) => setDurationValue(e.target.value)}
                min="1"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', fontWeight: '700', letterSpacing: '0.05em' }}>TIME SCALE</label>
              <select className="cyber-input" value={durationUnit} onChange={(e) => setDurationUnit(e.target.value)}>
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
              </select>
            </div>
          </div>

          <button type="submit" className="metallic-btn" style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '1rem', marginTop: '4px' }}>
            Deploy Task Stream
          </button>
        </form>
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ color: '#f8fafc', margin: '0', fontSize: '1.1rem', fontWeight: '700' }}>
            {currentOperator}'s Active Streams
          </h3>
          <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '20px', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.05)', fontWeight: '600' }}>
            {filteredTasks.length} Tracked
          </span>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center', color: '#475569' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '1.1rem', fontWeight: '600' }}>All Streams Clear</p>
            <p style={{ margin: '0', fontSize: '0.85rem' }}>No active penalties or time decay detected for {currentOperator}.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredTasks.map((task) => {
              const pct = renderProgress(task.created_at, task.reminder_time);
              const isOverdue = pct >= 100;
              const isWarning = pct >= 80;
              
              const statusColor = isOverdue ? '#f43f5e' : isWarning ? '#fbbf24' : '#10b981';
              const shadowColor = isOverdue ? 'rgba(244, 63, 94, 0.04)' : isWarning ? 'rgba(251, 191, 36, 0.03)' : 'rgba(16, 185, 129, 0.03)';
              const badgeBg = isOverdue ? 'rgba(244, 63, 94, 0.12)' : 'rgba(251, 191, 36, 0.12)';
              
              const isAwaitingConfirm = confirmTaskId === task.id;

              return (
                <div 
                  key={task.id} 
                  className={`glass-card ${isOverdue ? 'pulse-overdue' : ''}`} 
                  style={{ 
                    padding: '18px 20px', 
                    background: `linear-gradient(145deg, rgba(13, 18, 30, 0.65) 0%, ${shadowColor} 100%)`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    border: '1px solid rgba(255, 255, 255, 0.06)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ 
                          fontSize: '0.65rem', 
                          background: task.users === 'Dinesh' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'linear-gradient(135deg, #0ea5e9, #0284c7)', 
                          padding: '3px 8px', 
                          borderRadius: '6px', 
                          fontWeight: '800', 
                          letterSpacing: '0.05em',
                          textTransform: 'uppercase' 
                        }}>
                          {task.users}
                        </span>
                        {isOverdue && (
                          <span style={{ 
                            fontSize: '0.65rem', 
                            background: badgeBg, 
                            color: '#f43f5e', 
                            border: '1px solid rgba(244, 63, 94, 0.25)', 
                            padding: '2px 8px', 
                            borderRadius: '6px', 
                            fontWeight: '700',
                            letterSpacing: '0.02em'
                          }}>
                            CRITICAL TIMEOUT
                          </span>
                        )}
                      </div>
                      <span style={{ color: '#f8fafc', fontSize: '1.05rem', fontWeight: '600', lineHeight: '1.4', wordBreak: 'break-word' }}>
                        {task.title}
                      </span>
                    </div>

                    <button 
                      onClick={() => handleResolveClick(task.id)} 
                      style={{ 
                        background: isAwaitingConfirm 
                          ? 'rgba(251, 191, 36, 0.15)' 
                          : isOverdue ? 'rgba(244, 63, 94, 0.08)' : 'transparent', 
                        border: `1px solid ${
                          isAwaitingConfirm 
                            ? '#fbbf24' 
                            : isOverdue ? 'rgba(244, 63, 94, 0.45)' : 'rgba(34, 197, 94, 0.4)'
                        }`, 
                        color: isAwaitingConfirm ? '#fbbf24' : isOverdue ? '#f43f5e' : '#22c55e', 
                        padding: '8px 16px', 
                        borderRadius: '10px', 
                        cursor: 'pointer', 
                        fontWeight: '700',
                        fontSize: '0.8rem',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {isAwaitingConfirm ? 'Confirm?' : 'Resolve'}
                    </button>
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>
                      <span>TIME CONSUMPTION RESOURCE</span>
                      <span style={{ fontWeight: '700', color: statusColor, letterSpacing: '0.03em' }}>
                        {pct}% {isOverdue ? 'LOCKED' : 'DECAY'}
                      </span>
                    </div>
                    
                    <div style={{ width: '100%', height: '6px', background: 'rgba(15, 23, 42, 0.8)', borderRadius: '999px', padding: '2px', boxSizing: 'content-box', border: '1px solid rgba(255,255,255,0.02)' }}>
                      <div style={{ 
                        width: `${pct}%`, 
                        height: '100%', 
                        background: `linear-gradient(90deg, ${statusColor} 0%, #fff 250%)`, 
                        borderRadius: '999px',
                        boxShadow: `0 0 12px ${statusColor}`,
                        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)' 
                      }} />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

export default App;