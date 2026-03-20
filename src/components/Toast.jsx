import { useState, useEffect } from "react";

let showToastFn = null;

export function triggerToast(message) {
  if (showToastFn) showToastFn(message);
}

export default function Toast() {
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    showToastFn = (m) => {
      setMsg(m);
      setTimeout(() => setMsg(null), 2500);
    };
    return () => { showToastFn = null; };
  }, []);

  if (!msg) return null;

  return (
    <div style={{
      position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)",
      background: "rgba(82,195,122,0.95)", color: "#06080D",
      padding: "10px 20px", borderRadius: 12, fontSize: 12, fontWeight: 700,
      zIndex: 300, boxShadow: "0 4px 20px rgba(82,195,122,0.3)",
    }}>
      {"\u2713"} {msg}
    </div>
  );
}
