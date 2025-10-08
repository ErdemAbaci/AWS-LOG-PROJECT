import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Log mesajına göre satır stilini belirleyen yardımcı fonksiyon
const getLogRowStyle = (message) => {
  const lowerCaseMessage = message.toLowerCase();
  if (lowerCaseMessage.includes('error')) {
    return { backgroundColor: '#ffebee', color: '#c62828' };
  }
  if (lowerCaseMessage.includes('warn') || lowerCaseMessage.includes('warning')) {
    return { backgroundColor: '#fffde7', color: '#f57f17' };
  }
  return {}; // Varsayılan stil
};

const CloudWatchLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCloudWatchLogs = async () => {
    try {
      const res = await axios.get("http://localhost:3000/cloudwatch-logs");
      if (res.data.length === 0) {
        setError("Görüntülenecek CloudWatch logu bulunamadı.");
      } else {
        setLogs(res.data);
        setError(null);
      }
    } catch (err) {
      console.error("Error fetching CloudWatch logs:", err);
      setError("CloudWatch logları çekilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCloudWatchLogs();
    const interval = setInterval(fetchCloudWatchLogs, 60000);
    return () => clearInterval(interval);
  }, []);

  // Logları ve KPI'ları hesaplayan bölüm
  const { chartData, totalLogs, totalErrors } = useMemo(() => {
    const counts = {};
    let errorCount = 0;
    logs.forEach(log => {
      const time = new Date(log.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      if (!counts[time]) {
        counts[time] = { time, logs: 0, errors: 0 };
      }
      counts[time].logs += 1;
      if (log.message.toLowerCase().includes('error')) {
        counts[time].errors += 1;
        errorCount += 1;
      }
    });
    return {
      chartData: Object.values(counts).slice(-30), // Son 30 dakikayı göster
      totalLogs: logs.length,
      totalErrors: errorCount,
    };
  }, [logs]);

  // --- Stil Tanımları ---
  const cardStyle = {
    background: '#fff',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    marginBottom: '1.5rem',
  };

  const kpiCardStyle = {
    ...cardStyle,
    flex: 1,
    textAlign: 'center',
    padding: '1rem',
  };

  return (
    <div style={{ background: '#f4f7f9', padding: '2rem', borderRadius: '8px' }}>
      <h2>📊 CloudWatch Logs</h2>
      {loading ? (
        <p>CloudWatch logları yükleniyor...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'stretch', marginBottom: '1.5rem' }}>
            {/* --- KPI Kartları --- */}
            <div style={kpiCardStyle}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#555' }}>Toplam Log</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: '#333' }}>{totalLogs}</p>
            </div>
            <div style={{...kpiCardStyle, background: totalErrors > 0 ? '#ffebee' : '#fff'}}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#555' }}>Toplam Hata</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0, color: totalErrors > 0 ? '#c62828' : '#333' }}>{totalErrors}</p>
            </div>
          </div>

          {/* --- GRAFİK --- */}
          <div style={cardStyle}>
            <h4 style={{ marginTop: 0 }}>Dakikaya Göre Log Aktivitesi</h4>
            <div style={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="time" />
                  <YAxis allowDecimals={false} />
                  <Tooltip wrapperStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '4px' }} />
                  <Legend verticalAlign="top" align="right" />
                  <Bar dataKey="logs" fill="#8884d8" name="Toplam Log" />
                  <Bar dataKey="errors" fill="#c62828" name="Hatalar" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* --- LOG TABLOSU --- */}
          <div style={cardStyle}>
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table style={{ width: "100%", borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#f1f1f1' }}>
                  <tr>
                    <th style={{ width: '180px', textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd' }}>Timestamp</th>
                    <th style={{ textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd' }}>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log, index) => (
                    <tr key={log.id || index} style={getLogRowStyle(log.message)}>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', verticalAlign: 'top' }}>
                        {new Date(log.timestamp).toLocaleString('tr-TR')}
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid #eee', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {log.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CloudWatchLogs;