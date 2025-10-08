import { useEffect, useState } from "react";
import axios from "axios";
import LogsTable from "./components/LogsTable";
import LogsChart from "./components/LogsChart";
import CloudWatchLogs from "./components/CloudWatchLogs";
import './App.css';

function App() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  fetchLogs(); // Sayfa açılır açılmaz logs çek

  // Her 5 saniyede bir otomatik güncelle
  const interval = setInterval(fetchLogs, 5000);

  // Component kapandığında interval'i temizle
  return () => clearInterval(interval);
}, []);


  const fetchLogs = async () => {
    try {
      const res = await axios.get("http://localhost:3000/logs"); // Backend endpoint
      setLogs(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching logs:", err);
      setLoading(false);
    }
  };

  return (
    <div className="App" style={{ padding: "2rem" }}>
      <h1>📊 Log Tracker Dashboard</h1>
      {loading ? (
        <p>Loading logs...</p>
      ) : (
        <>
          <CloudWatchLogs />
          <LogsChart logs={logs} />
          <LogsTable logs={logs} />
        </>
      )}
    </div>
  );
}

export default App;
