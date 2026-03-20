import { useState, useEffect } from "react";

export default function Tooltip({ id, text, position = "bottom" }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const key = "mm_tooltip_" + id;
    if (!localStorage.getItem(key)) {
      setVisible(true);
    }
  }, [id]);

  const dismiss = () => {
    localStorage.setItem("mm_tooltip_" + id, "1");
    setVisible(false);
  };

  if (!visible) return null;

  const posStyles = {
    bottom: { top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: 8 },
    top: { bottom: "100%", left: "50%", transform: "translateX(-50%)", marginBottom: 8 },
    right: { left: "100%", top: "50%", transform: "translateY(-50%)", marginLeft: 8 },
  };

  return (
    <div onClick={dismiss} style={{
      position: "absolute",
      ...posStyles[position],
      background: "rgba(201,168,76,0.95)",
      color: "#06080D",
      padding: "8px 14px",
      borderRadius: 10,
      fontSize: 11,
      fontWeight: 600,
      maxWidth: 220,
      zIndex: 200,
      cursor: "pointer",
      boxShadow: "0 4px 20px rgba(201,168,76,0.3)",
      lineHeight: 1.5,
      whiteSpace: "normal",
    }}>
      {text}
      <div style={{ fontSize: 9, opacity: 0.7, marginTop: 4 }}>Touchez pour fermer</div>
    </div>
  );
}
