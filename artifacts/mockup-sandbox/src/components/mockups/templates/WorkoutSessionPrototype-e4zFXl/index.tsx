import React, { useState, useEffect, useMemo } from 'react';
import { 
  Play, Pause, Square, Plus, Check, MoreHorizontal, ChevronLeft, ChevronRight, 
  Settings, History, Dumbbell, Home, Activity, Search, X, Clock
} from 'lucide-react';

// Pre-packaged Icons since react-icons might not have all, we use lucide-react. Wait, standard is `import { Icon } from 'lucide-react'`
// Actually, `lucide-react` is pre-installed.
import * as Lucide from 'lucide-react';

const navItems = [
  { id: 'home', icon: Lucide.Home, label: 'Home' },
  { id: 'workout', icon: Lucide.Dumbbell, label: 'Workout' },
  { id: 'history', icon: Lucide.History, label: 'History' },
  { id: 'metrics', icon: Lucide.Activity, label: 'Metrics' },
  { id: 'settings', icon: Lucide.Settings, label: 'Settings' },
];

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type SetData = {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
};

type ExerciseData = {
  id: string;
  name: string;
  muscle: string;
  sets: SetData[];
};

const initialExercises: Record<string, ExerciseData[]> = {
  'Mon': [
    {
      id: 'ex1',
      name: 'Barbell Bench Press',
      muscle: 'Chest',
      sets: [
        { id: 's1', reps: 10, weight: 135, completed: true },
        { id: 's2', reps: 8, weight: 185, completed: true },
        { id: 's3', reps: 5, weight: 225, completed: false },
        { id: 's4', reps: 5, weight: 225, completed: false },
      ]
    },
    {
      id: 'ex2',
      name: 'Incline Dumbbell Press',
      muscle: 'Chest',
      sets: [
        { id: 's1', reps: 10, weight: 65, completed: false },
        { id: 's2', reps: 10, weight: 75, completed: false },
        { id: 's3', reps: 8, weight: 80, completed: false },
      ]
    },
    {
      id: 'ex3',
      name: 'Cable Crossovers',
      muscle: 'Chest',
      sets: [
        { id: 's1', reps: 15, weight: 40, completed: false },
        { id: 's2', reps: 15, weight: 45, completed: false },
        { id: 's3', reps: 12, weight: 50, completed: false },
      ]
    }
  ],
  'Tue': [
    {
      id: 'ex4',
      name: 'Barbell Squats',
      muscle: 'Legs',
      sets: [
        { id: 's1', reps: 10, weight: 135, completed: false },
        { id: 's2', reps: 8, weight: 225, completed: false },
        { id: 's3', reps: 5, weight: 315, completed: false },
      ]
    }
  ],
  'Wed': [],
  'Thu': [
    {
      id: 'ex5',
      name: 'Overhead Press',
      muscle: 'Shoulders',
      sets: [
        { id: 's1', reps: 10, weight: 95, completed: false },
        { id: 's2', reps: 8, weight: 115, completed: false },
        { id: 's3', reps: 5, weight: 135, completed: false },
      ]
    }
  ],
  'Fri': [],
  'Sat': [],
  'Sun': [],
};

const exercisesDatabase = [
  { name: 'Pull-ups', muscle: 'Back' },
  { name: 'Barbell Row', muscle: 'Back' },
  { name: 'Lat Pulldown', muscle: 'Back' },
  { name: 'Bicep Curls', muscle: 'Biceps' },
  { name: 'Tricep Extensions', muscle: 'Triceps' },
  { name: 'Leg Press', muscle: 'Legs' },
  { name: 'Calf Raises', muscle: 'Calves' },
  { name: 'Crunch', muscle: 'Abs' },
  { name: 'Plank', muscle: 'Abs' },
];

export default function Tempo() {
  const [activeTab, setActiveTab] = useState('workout');
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [exercises, setExercises] = useState(initialExercises);
  
  // Rest Timer State
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  
  // Add Exercise Modal
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const startRestTimer = (seconds: number = 90) => {
    setTimerSeconds(seconds);
    setTimerActive(true);
  };

  const stopRestTimer = () => {
    setTimerActive(false);
    setTimerSeconds(0);
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const toggleSet = (exId: string, setId: string) => {
    setExercises(prev => {
      const dayExercises = prev[selectedDay] || [];
      const updated = dayExercises.map(ex => {
        if (ex.id !== exId) return ex;
        return {
          ...ex,
          sets: ex.sets.map(s => {
            if (s.id !== setId) return s;
            const newlyCompleted = !s.completed;
            if (newlyCompleted) {
              // Start a default 90s rest timer if completed
              startRestTimer(90);
            }
            return { ...s, completed: newlyCompleted };
          })
        };
      });
      return { ...prev, [selectedDay]: updated };
    });
  };

  const updateSet = (exId: string, setId: string, field: 'reps' | 'weight', value: number) => {
    setExercises(prev => {
      const dayExercises = prev[selectedDay] || [];
      const updated = dayExercises.map(ex => {
        if (ex.id !== exId) return ex;
        return {
          ...ex,
          sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s)
        };
      });
      return { ...prev, [selectedDay]: updated };
    });
  };

  const addSet = (exId: string) => {
    setExercises(prev => {
      const dayExercises = prev[selectedDay] || [];
      const updated = dayExercises.map(ex => {
        if (ex.id !== exId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet = {
          id: Math.random().toString(36).substring(7),
          reps: lastSet ? lastSet.reps : 10,
          weight: lastSet ? lastSet.weight : 0,
          completed: false
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      });
      return { ...prev, [selectedDay]: updated };
    });
  };

  const deleteExercise = (exId: string) => {
    setExercises(prev => ({
      ...prev,
      [selectedDay]: prev[selectedDay].filter(ex => ex.id !== exId)
    }));
  };

  const addExercise = (exItem: {name: string, muscle: string}) => {
    const newEx: ExerciseData = {
      id: Math.random().toString(36).substring(7),
      name: exItem.name,
      muscle: exItem.muscle,
      sets: [
        { id: Math.random().toString(36).substring(7), reps: 10, weight: 0, completed: false }
      ]
    };
    setExercises(prev => ({
      ...prev,
      [selectedDay]: [...(prev[selectedDay] || []), newEx]
    }));
    setShowAddExercise(false);
    setSearchQuery('');
  };

  const currentExercises = exercises[selectedDay] || [];
  
  const stats = useMemo(() => {
    let totalSets = 0;
    let completedSets = 0;
    let totalVolume = 0;
    
    currentExercises.forEach(ex => {
      ex.sets.forEach(s => {
        totalSets++;
        if (s.completed) {
          completedSets++;
          totalVolume += (s.reps * s.weight);
        }
      });
    });

    const progress = totalSets === 0 ? 0 : Math.round((completedSets / totalSets) * 100);

    return { totalSets, completedSets, totalVolume, progress };
  }, [currentExercises]);

  const filteredDatabase = exercisesDatabase.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()) || e.muscle.toLowerCase().includes(searchQuery.toLowerCase()));

  // Render main content based on tab
  const renderContent = () => {
    if (activeTab !== 'workout') {
      return (
        <div className="flex-1 flex items-center justify-center text-zinc-500 flex-col">
          <Lucide.Activity className="w-16 h-16 mb-4 opacity-20" />
          <h2 className="text-xl font-medium text-zinc-300 mb-2">Coming Soon</h2>
          <p>The {activeTab} section is under construction.</p>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Day Selector */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-center border-b border-zinc-800 shrink-0">
          <div className="flex space-x-1 bg-zinc-900/50 p-1 rounded-xl">
            {days.map(d => (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedDay === d ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'}`}
              >
                {d}
              </button>
            ))}
          </div>
          
          <button 
            onClick={() => setShowAddExercise(true)}
            className="flex items-center space-x-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <Lucide.Plus className="w-4 h-4" />
            <span>Add Exercise</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            
            {/* Summary Header */}
            <div className="flex items-center space-x-8 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-xl">
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" className="stroke-zinc-800" strokeWidth="8" fill="none" />
                  <circle 
                    cx="48" cy="48" r="40" 
                    className="stroke-emerald-500 transition-all duration-1000 ease-out" 
                    strokeWidth="8" fill="none" 
                    strokeDasharray="251.2" 
                    strokeDashoffset={251.2 - (251.2 * stats.progress) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-white tracking-tight">{stats.progress}%</span>
                </div>
              </div>
              
              <div className="flex-1 grid grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-zinc-500 font-medium mb-1 uppercase tracking-wider">Volume</div>
                  <div className="text-3xl font-bold text-white flex items-baseline space-x-1">
                    {stats.totalVolume.toLocaleString()} <span className="text-base text-zinc-500 font-normal ml-1">lbs</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500 font-medium mb-1 uppercase tracking-wider">Sets</div>
                  <div className="text-3xl font-bold text-white">
                    {stats.completedSets} <span className="text-zinc-500 text-2xl">/ {stats.totalSets}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-zinc-500 font-medium mb-1 uppercase tracking-wider">Duration</div>
                  <div className="text-3xl font-bold text-white flex items-baseline space-x-2">
                    42 <span className="text-base text-zinc-500 font-normal ml-1">min</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Exercises List */}
            <div className="space-y-6 pb-24">
              {currentExercises.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/20 border border-zinc-800/30 rounded-2xl border-dashed">
                  <Lucide.Dumbbell className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-zinc-300 mb-2">Rest Day</h3>
                  <p className="text-zinc-500 max-w-sm mx-auto mb-6">You don't have any exercises scheduled for today. Enjoy your rest or add some exercises.</p>
                  <button onClick={() => setShowAddExercise(true)} className="bg-white text-black px-6 py-2.5 rounded-xl font-medium hover:bg-zinc-200 transition-colors">
                    Add Exercises
                  </button>
                </div>
              ) : (
                currentExercises.map((ex, index) => (
                  <div key={ex.id} className="bg-zinc-900 border border-zinc-800/80 rounded-2xl overflow-hidden group">
                    <div className="px-6 py-4 border-b border-zinc-800/50 flex justify-between items-center bg-zinc-900/80">
                      <div className="flex items-center space-x-3">
                        <span className="text-emerald-500 font-mono text-sm font-bold bg-emerald-500/10 px-2 py-1 rounded">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className="text-lg font-semibold text-zinc-100">{ex.name}</h3>
                        <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{ex.muscle}</span>
                      </div>
                      <button onClick={() => deleteExercise(ex.id)} className="text-zinc-600 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Lucide.Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="p-2">
                      <div className="grid grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        <div className="col-span-2 text-center">Set</div>
                        <div className="col-span-3 text-center">Previous</div>
                        <div className="col-span-3 text-center">lbs</div>
                        <div className="col-span-2 text-center">Reps</div>
                        <div className="col-span-2 text-center"><Lucide.Check className="w-4 h-4 mx-auto" /></div>
                      </div>
                      
                      <div className="space-y-1">
                        {ex.sets.map((set, sIdx) => (
                          <div 
                            key={set.id} 
                            className={`grid grid-cols-12 gap-4 px-4 py-3 items-center rounded-xl transition-colors ${set.completed ? 'bg-emerald-500/5' : 'hover:bg-zinc-800/30'}`}
                          >
                            <div className="col-span-2 text-center font-mono text-zinc-400 font-medium">{sIdx + 1}</div>
                            <div className="col-span-3 text-center text-zinc-600 font-medium text-sm">{set.weight} × {set.reps}</div>
                            <div className="col-span-3">
                              <div className="relative">
                                <input 
                                  type="number" 
                                  value={set.weight || ''}
                                  onChange={(e) => updateSet(ex.id, set.id, 'weight', parseInt(e.target.value) || 0)}
                                  className={`w-full bg-zinc-950 border ${set.completed ? 'border-emerald-500/30 text-emerald-100' : 'border-zinc-800 text-white'} rounded-lg py-2 text-center font-semibold focus:outline-none focus:border-zinc-600 transition-colors`}
                                />
                              </div>
                            </div>
                            <div className="col-span-2">
                              <div className="relative">
                                <input 
                                  type="number" 
                                  value={set.reps || ''}
                                  onChange={(e) => updateSet(ex.id, set.id, 'reps', parseInt(e.target.value) || 0)}
                                  className={`w-full bg-zinc-950 border ${set.completed ? 'border-emerald-500/30 text-emerald-100' : 'border-zinc-800 text-white'} rounded-lg py-2 text-center font-semibold focus:outline-none focus:border-zinc-600 transition-colors`}
                                />
                              </div>
                            </div>
                            <div className="col-span-2 flex justify-center">
                              <button
                                onClick={() => toggleSet(ex.id, set.id)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${set.completed ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}
                              >
                                <Lucide.Check className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <button 
                        onClick={() => addSet(ex.id)}
                        className="w-full mt-2 py-3 border border-dashed border-zinc-800 rounded-xl text-sm font-medium text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800/20 transition-all flex items-center justify-center space-x-2"
                      >
                        <Lucide.Plus className="w-4 h-4" />
                        <span>Add Set</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-[#09090b] text-zinc-100 overflow-hidden flex font-['Inter',sans-serif] antialiased">
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #27272a;
          border-radius: 20px;
          border: 3px solid #09090b;
        }
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .timer-active {
          animation: pulse-ring 2s infinite;
        }
      `}} />

      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800/60 bg-zinc-950/50 flex flex-col backdrop-blur-3xl relative z-10 shrink-0">
        <div className="p-6 flex items-center space-x-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Lucide.Activity className="w-5 h-5 text-zinc-950" />
          </div>
          <span className="font-bold text-xl tracking-tight">Tempo</span>
        </div>
        
        <div className="px-4 py-2">
          <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 px-2">Menu</div>
          <nav className="space-y-1">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all ${
                  activeTab === item.id 
                    ? 'bg-zinc-800/80 text-white font-medium shadow-sm' 
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6">
          <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                <span className="font-semibold text-sm">JW</span>
              </div>
              <div>
                <div className="font-medium text-sm">Jonah Woods</div>
                <div className="text-xs text-zinc-500">Pro Member</div>
              </div>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2">
              <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '65%' }}></div>
            </div>
            <div className="text-xs text-zinc-500 mt-2 text-center">4 workouts this week</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative z-0">
        {renderContent()}
      </main>

      {/* Floating Rest Timer */}
      {timerSeconds > 0 && (
        <div className={`absolute bottom-8 right-8 bg-zinc-900 border ${timerActive ? 'border-emerald-500/50' : 'border-zinc-800'} shadow-2xl rounded-2xl p-4 flex items-center space-x-4 z-50 ${timerActive ? 'timer-active' : ''} transition-all`}>
          <div className="w-12 h-12 rounded-full border-[3px] border-emerald-500/20 flex items-center justify-center relative">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
              <circle 
                cx="24" cy="24" r="20" 
                className="stroke-emerald-500 transition-all duration-1000 ease-linear" 
                strokeWidth="3" fill="none" 
                strokeDasharray="125.6" 
                strokeDashoffset={125.6 - (125.6 * (timerSeconds / 90))} 
              />
            </svg>
            <Lucide.Clock className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="flex-1 min-w-[80px]">
            <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-0.5">Rest</div>
            <div className="text-2xl font-bold font-mono text-white leading-none">{formatTime(timerSeconds)}</div>
          </div>
          <div className="flex space-x-2">
            {timerActive ? (
              <button onClick={() => setTimerActive(false)} className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center hover:bg-zinc-700 text-zinc-300">
                <Lucide.Pause className="w-5 h-5" />
              </button>
            ) : (
              <button onClick={() => setTimerActive(true)} className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-500/30">
                <Lucide.Play className="w-5 h-5" />
              </button>
            )}
            <button onClick={stopRestTimer} className="w-10 h-10 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20">
              <Lucide.Square className="w-4 h-4 fill-current" />
            </button>
            <button onClick={() => startRestTimer(timerSeconds + 30)} className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center hover:bg-zinc-700 font-medium text-sm">
              +30
            </button>
          </div>
        </div>
      )}

      {/* Add Exercise Modal Overlay */}
      {showAddExercise && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[80vh]">
            <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="text-xl font-bold">Add Exercise</h2>
              <button onClick={() => setShowAddExercise(false)} className="text-zinc-500 hover:text-white p-1">
                <Lucide.X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/50">
              <div className="relative">
                <Lucide.Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {filteredDatabase.map((ex, idx) => (
                <button
                  key={idx}
                  onClick={() => addExercise(ex)}
                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-800/50 rounded-xl transition-colors group"
                >
                  <div className="flex flex-col items-start">
                    <span className="font-semibold text-zinc-200 group-hover:text-emerald-400 transition-colors">{ex.name}</span>
                    <span className="text-xs text-zinc-500 uppercase tracking-wider mt-1">{ex.muscle}</span>
                  </div>
                  <Lucide.Plus className="w-5 h-5 text-zinc-600 group-hover:text-emerald-500" />
                </button>
              ))}
              {filteredDatabase.length === 0 && (
                <div className="p-8 text-center text-zinc-500">
                  No exercises found matching "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
