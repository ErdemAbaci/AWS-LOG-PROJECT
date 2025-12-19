import React from 'react';
import { motion } from 'framer-motion';

const StatsCard = ({ title, value, icon: Icon, color = "cyan", delay = 0 }) => {
    const colorClasses = {
        cyan: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
        red: "text-red-400 bg-red-400/10 border-red-400/20",
        yellow: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
        purple: "text-purple-400 bg-purple-400/10 border-purple-400/20",
        green: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className={`glass-card p-6 rounded-2xl flex items-center gap-4 relative overflow-hidden group`}
        >
            <div className={`p-3 rounded-xl border ${colorClasses[color]} group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={24} />
            </div>
            <div>
                <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
                <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
            </div>

            {/* Glow Effect */}
            <div className={`absolute -right-6 -bottom-6 w-24 h-24 ${colorClasses[color].split(" ")[0].replace("text", "bg")}/20 blur-3xl rounded-full group-hover:bg-opacity-40 transition-all`} />
        </motion.div>
    );
};

export default StatsCard;
