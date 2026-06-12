import { useEffect, useState } from "react";
import api from "../api/axios";

const DebugImage = () => {
  const [tests, setTests] = useState([]);

  // The actual files from your DB
  const testFiles = [
    "9753a0f0-2a10-4017-800e-1086cfa43efe.png",
    "2ddea586-2522-49ef-9a52-5cce3e2d0a91.jpeg",
  ];

  const testUrls = testFiles.flatMap((file) => [
    {
      label: "Direct backend (port 5000)",
      url: `http://localhost:5000/uploads/images/${file}`,
    },
    {
      label: "Via Vite proxy (port 5173)",
      url: `http://localhost:5173/uploads/images/${file}`,
    },
    {
      label: "Relative path",
      url: `/uploads/images/${file}`,
    },
  ]);

  useEffect(() => {
    const runTests = async () => {
      const results = [];

      for (const test of testUrls) {
        try {
          const res = await fetch(test.url);
          results.push({
            ...test,
            status: res.status,
            ok: res.ok,
            contentType: res.headers.get("content-type"),
            size: res.headers.get("content-length"),
          });
        } catch (err) {
          results.push({
            ...test,
            status: "ERROR",
            ok: false,
            error: err.message,
          });
        }
      }

      setTests(results);
    };

    runTests();
  }, []);

  return (
    <div style={{ padding: "20px", fontFamily: "monospace", fontSize: "13px" }}>
      <h1>🐛 Image Loading Debug</h1>

      <h2>Environment</h2>
      <pre
        style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px" }}
      >
        {JSON.stringify(
          {
            "import.meta.env.VITE_API_URL": import.meta.env.VITE_API_URL,
            "import.meta.env.MODE": import.meta.env.MODE,
            "window.location.origin": window.location.origin,
            "api.defaults.baseURL": api.defaults.baseURL,
          },
          null,
          2,
        )}
      </pre>

      <h2>Fetch Tests</h2>
      {tests.length === 0 ? (
        <p>Testing...</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "24px",
          }}
        >
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th style={cellStyle}>Label</th>
              <th style={cellStyle}>Status</th>
              <th style={cellStyle}>Content-Type</th>
              <th style={cellStyle}>URL</th>
            </tr>
          </thead>
          <tbody>
            {tests.map((t, i) => (
              <tr key={i} style={{ background: t.ok ? "#f0fdf4" : "#fef2f2" }}>
                <td style={cellStyle}>{t.label}</td>
                <td style={cellStyle}>
                  <strong>{t.status}</strong>
                </td>
                <td style={cellStyle}>{t.contentType || t.error || "—"}</td>
                <td
                  style={{
                    ...cellStyle,
                    fontSize: "11px",
                    wordBreak: "break-all",
                  }}
                >
                  {t.url}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Direct &lt;img&gt; rendering tests</h2>
      {testUrls.map((t, i) => (
        <div
          key={i}
          style={{
            marginBottom: "24px",
            border: "1px solid #e2e8f0",
            padding: "12px",
            borderRadius: "8px",
          }}
        >
          <div style={{ marginBottom: "8px", fontWeight: 700 }}>{t.label}</div>
          <div
            style={{
              marginBottom: "8px",
              color: "#64748b",
              fontSize: "11px",
              wordBreak: "break-all",
            }}
          >
            {t.url}
          </div>
          <img
            src={t.url}
            alt={t.label}
            onLoad={() => console.log("✅ LOADED:", t.url)}
            onError={() => console.log("❌ FAILED:", t.url)}
            style={{
              maxWidth: "200px",
              maxHeight: "150px",
              border: "2px solid #3B82F6",
              borderRadius: "8px",
              background: "#f1f5f9",
              display: "block",
            }}
          />
        </div>
      ))}
    </div>
  );
};

const cellStyle = {
  padding: "8px 12px",
  border: "1px solid #e2e8f0",
  textAlign: "left",
};

export default DebugImage;
