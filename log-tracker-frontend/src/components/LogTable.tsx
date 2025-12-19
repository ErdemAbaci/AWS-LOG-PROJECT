import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileStack, Terminal, MapPin, Calendar, AlertCircle, Info, AlertTriangle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { LogData } from '../services/api';

const LogIcon = ({ level }: { level: string }) => {
    switch (level?.toLowerCase()) {
        case 'error': return <AlertCircle className="text-red-400" size={18} />;
        case 'warn': return <AlertTriangle className="text-yellow-400" size={18} />;
        default: return <Info className="text-cyan-400" size={18} />;
    }
};

const LevelBadge = ({ level }: { level: string }) => {
    const levelKey = level?.toLowerCase();
    let styles = "bg-slate-500/10 text-slate-400 border-slate-500/20";

    if (levelKey === 'error') styles = "bg-red-500/10 text-red-400 border-red-500/20";
    else if (levelKey === 'warn') styles = "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    else if (levelKey === 'info') styles = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";

    return (
        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 w-fit ${styles}`}>
            <LogIcon level={level} />
            {level?.toUpperCase() || 'UNKNOWN'}
        </span>
    );
};

interface LogTableProps {
    logs: LogData[];
    loading: boolean;
}

const LogTable: React.FC<LogTableProps> = ({ logs, loading }) => {
    if (loading) {
        return (
            <div className="w-full h-64 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-slate-500 text-sm animate-pulse">Fetching logs...</p>
                </div>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="w-full h-64 flex flex-col items-center justify-center text-slate-500">
                <FileStack size={48} className="mb-4 opacity-50" />
                <p>No logs found matching your criteria</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-white/5 text-slate-400 text-xs uppercase tracking-wider">
                        <th className="p-4 font-medium">Timestamp</th>
                        <th className="p-4 font-medium">Level</th>
                        <th className="p-4 font-medium w-1/3">Message</th>
                        <th className="p-4 font-medium">Source IP</th>
                        <th className="p-4 font-medium">Location</th>
                        <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    <AnimatePresence mode="popLayout">
                        {logs.map((log, index) => (
                            <motion.tr
                                key={log.id || index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                                className="group hover:bg-white/5 transition-colors"
                            >
                                <td className="p-4 text-sm text-slate-300 font-mono whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-500" />
                                        {log.timestamp ? format(new Date(log.timestamp), 'MMM dd, HH:mm:ss') : '-'}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <LevelBadge level={log.level} />
                                </td>
                                <td className="p-4 text-sm text-white font-medium max-w-xs truncate" title={log.message}>
                                    {log.message}
                                </td>
                                <td className="p-4 text-sm text-slate-400 font-mono">
                                    <div className="flex items-center gap-2">
                                        <Terminal size={14} className="text-slate-600" />
                                        {log.ip || 'N/A'}
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-slate-400">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-slate-600" />
                                        {log.location && typeof log.location === 'object'
                                            ? `${log.location.city || ''}, ${log.location.country || ''}`
                                            : (log.location || 'Unknown')}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    {log.s3Url && (
                                        <a
                                            href={log.s3Url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors bg-cyan-400/10 hover:bg-cyan-400/20 px-3 py-1.5 rounded-lg border border-cyan-400/20"
                                        >
                                            View Raw <ExternalLink size={12} />
                                        </a>
                                    )}
                                </td>
                            </motion.tr>
                        ))}
                    </AnimatePresence>
                </tbody>
            </table>
        </div>
    );
};

export default LogTable;
