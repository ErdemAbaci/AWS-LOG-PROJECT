import React from "react";

const LogsTable = ({ logs }) => {
  if (!logs || logs.length === 0) return <p>No logs available.</p>;

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "2rem" }}>
      <thead>
        <tr>
          <th style={thStyle}>Timestamp</th>
          <th style={thStyle}>Level</th>
          <th style={thStyle}>Message</th>
          <th style={thStyle}>IP</th>
          <th style={thStyle}>S3 Link</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id}>
            <td style={tdStyle}>{log.timestamp}</td>
            <td style={{...tdStyle, color: getLevelColor(log.level)}}>{log.level}</td>
            <td style={tdStyle}>{log.message}</td>
            <td style={tdStyle}>{log.ip}</td>
            <td style={tdStyle}>
              {log.s3Url ? (
                <a href={log.s3Url} target="_blank" rel="noopener noreferrer">View</a>
              ) : (
                "N/A"
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Basit stil objeleri
const thStyle = { border: "1px solid #ddd", padding: "8px", textAlign: "left", backgroundColor: "#f2f2f2" };
const tdStyle = { border: "1px solid #ddd", padding: "8px" };

// Level renkleri
const getLevelColor = (level) => {
  switch (level?.toLowerCase()) {
    case "error": return "red";
    case "warning": return "orange";
    case "info": return "green";
    default: return "black";
  }
};

export default LogsTable;
