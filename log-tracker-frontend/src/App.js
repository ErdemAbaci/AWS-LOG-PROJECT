import { useEffect, useState } from "react";
import axios from "axios";
import LogsTable from "./components/LogsTable";
import LogsChart from "./components/LogsChart";
import './App.css';

function App() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
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
          <LogsChart logs={logs} />
          <LogsTable logs={logs} />
        </>
      )}
    </div>
  );
}

export default App;
