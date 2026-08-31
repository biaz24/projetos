import React from "react";

interface StatCardProps {
  icon: string;
  iconBg: string;
  iconColor: string;
  title: string;
  value: number | string;
}

export const StatCard: React.FC<StatCardProps> = ({
  icon,
  iconBg,
  iconColor,
  title,
  value,
}) => {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e6eaf0",
        borderRadius: "10px",
        padding: "16px",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        flex: "1 1 200px",
      }}
    >
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "8px",
          background: iconBg,
          color: iconColor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "18px",
          flexShrink: 0,
        }}
      >
        <i className={icon}></i>
      </div>
      <div>
        <p style={{ fontSize: "10px", color: "#64748b", marginBottom: "4px" }}>
          {title}
        </p>
        <h4 style={{ fontSize: "20px", fontWeight: "bold", color: "#1e3a8a", margin: 0 }}>
          {value}
        </h4>
      </div>
    </div>
  );
};
