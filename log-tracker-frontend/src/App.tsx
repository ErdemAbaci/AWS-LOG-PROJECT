import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldAlert, Globe, Search, RefreshCw, Zap, AlertCircle } from 'lucide-react';
import StatsCard from './components/StatsCard';
import LogTable from './components/LogTable';
import { getLogs, createLog, getCloudWatchLogs, LogData } from './services/api';

function App() {
    const [logs, setLogs] = useState<LogData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [filter, setFilter] = useState<{ search: string; level: string }>({ search: '', level: 'all' });
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const [logSource, setLogSource] = useState<'db' | 'cloudwatch'>('db');

    // Stats
    const stats = {
        total: logs.length,
        errors: logs.filter(l => l.level?.toLowerCase() === 'error').length,
        warnings: logs.filter(l => l.level?.toLowerCase() === 'warn').length,
        uniqueIPs: new Set(logs.map(l => l.ip)).size
    };

    const fetchLogs = async () => {
        try {
            setLoading(true);

            let data: LogData[] = [];

            if (logSource === 'db') {
                data = await getLogs(filter.level !== 'all' ? { level: filter.level } : {});
            } else {
                const cloudLogs = await getCloudWatchLogs();
                // Map CloudWatch logs to LogData format
                data = cloudLogs.map((cl: any) => {
                    // Start simple level classification based on message content
                    let level = 'info';
                    const msg = cl.message?.toLowerCase() || '';
                    if (msg.includes('error') || msg.includes('fail')) level = 'error';
                    else if (msg.includes('warn')) level = 'warn';

                    return {
                        id: cl.id,
                        message: cl.message,
                        level: level,
                        ip: 'AWS CloudWatch',
                        timestamp: new Date(cl.timestamp).toISOString(),
                        location: {
                            country: 'AWS',
                            region: 'us-east-1', // Default or parse if available
                            city: 'Data Center',
                            timezone: 'UTC'
                        },
                        s3Url: null
                    } as LogData;
                });
            }

            // Client-side filtering
            let filteredData = data;

            // Apply level filter for CloudWatch logs (DB logs already filtered by API if source is DB, but safe to re-apply / ensure consistency)
            if (filter.level !== 'all') {
                filteredData = filteredData.filter(l => l.level?.toLowerCase() === filter.level.toLowerCase());
            }

            if (filter.search) {
                filteredData = filteredData.filter(log =>
                    (log.message?.toLowerCase().includes(filter.search.toLowerCase())) ||
                    (log.ip?.includes(filter.search))
                );
            }

            setLogs(filteredData);
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Failed to fetch logs", error);
        } finally {
            setLoading(false);
        }
    };

    // Initial load & Polling
    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, [filter.level, logSource]); // Refetch when level filter or source changes

    // Debounced search effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchLogs();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [filter.search]);

    // Handler for manual log creation (Simulator)
    const handleSimulateLog = async () => {
        const levels = ['info', 'warn', 'error'];
        const randomLevel = levels[Math.floor(Math.random() * levels.length)];
        const messages = [
            "User login attempt failed",
            "Database connection successful",
            "API rate limit exceeded",
            "New order received #12345",
            "S3 Bucket backup completed"
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];

        await createLog({
            message: randomMessage,
            level: randomLevel
        });
        fetchLogs();
    };

    return (
        <div className="min-h-screen bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-slate-200 font-sans p-6 md:p-12">

            {/* Background Ambience */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10 space-y-8">

                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
                            <Zap className="text-cyan-400 fill-cyan-400/20" size={32} />
                            CloudWatch Lens
                        </h1>
                        <p className="text-slate-400">Real-time AWS Log Monitoring & Analysis Dashboard</p>
                    </div>

                    <div className="flex items-center gap-4">
                        <span className="text-xs font-mono text-slate-500 flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Live Updates ({lastUpdated.toLocaleTimeString()})
                        </span>
                        <button
                            onClick={handleSimulateLog}
                            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-semibold rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
                        >
                            Simulate Log
                        </button>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <StatsCard title="Total Logs" value={stats.total} icon={Activity} color="cyan" delay={0.1} />
                    <StatsCard title="Error Rate" value={stats.errors} icon={ShieldAlert} color="red" delay={0.2} />
                    <StatsCard title="Warnings" value={stats.warnings} icon={AlertCircle} color="yellow" delay={0.3} />
                    <StatsCard title="Unique Sources" value={stats.uniqueIPs} icon={Globe} color="purple" delay={0.4} />
                </div>

                {/* Main Content Panel */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                    className="glass-panel rounded-3xl overflow-hidden min-h-[500px]"
                >
                    {/* Toolbar */}
                    <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center bg-white/5">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            {/* Source Toggle */}
                            <div className="flex p-1 bg-black/40 rounded-xl border border-white/10">
                                <button
                                    onClick={() => setLogSource('db')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${logSource === 'db'
                                            ? 'bg-cyan-500/20 text-cyan-400 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                >
                                    App Logs
                                </button>
                                <button
                                    onClick={() => setLogSource('cloudwatch')}
                                    className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${logSource === 'cloudwatch'
                                            ? 'bg-cyan-500/20 text-cyan-400 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                >
                                    CloudWatch
                                </button>
                            </div>

                            <div className="w-px h-8 bg-white/10 hidden md:block" />

                            <div className="relative group w-full md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search logs..."
                                    value={filter.search}
                                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                                    className="w-full bg-black/20 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                />
                            </div>

                            <select
                                value={filter.level}
                                onChange={(e) => setFilter({ ...filter, level: e.target.value })}
                                className="bg-black/20 border border-white/10 rounded-xl py-2 px-4 text-sm text-slate-300 focus:outline-none focus:border-cyan-500/50 appearance-none cursor-pointer hover:bg-black/30 transition-colors"
                                style={{ backgroundImage: 'none' }} // Remove default arrow if needed, but keeping simple for now
                            >
                                <option value="all">All Levels</option>
                                <option value="info">Info</option>
                                <option value="warn">Warnings</option>
                                <option value="error">Errors</option>
                            </select>
                        </div>

                        <button
                            onClick={fetchLogs}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>

                    {/* Table */}
                    <LogTable logs={logs} loading={loading} />

                </motion.div>
            </div>
        </div>
    );
}

export default App;
