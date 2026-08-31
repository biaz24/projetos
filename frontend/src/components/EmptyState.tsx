import React from "react";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "fa-regular fa-folder-open",
  title,
  description,
  actionText,
  onAction,
}) => {
  return (
    <div
      style={{
        background: "white",
        border: "1px dashed #cbd5e1",
        borderRadius: "12px",
        padding: "40px 20px",
        textAlign: "center",
        color: "#64748b",
        marginTop: "20px",
      }}
    >
      <i
        className={icon}
        style={{ fontSize: "2.5rem", color: "#94a3b8", marginBottom: "12px" }}
      ></i>
      <h3 style={{ fontSize: "15px", color: "#1e3a8a", marginBottom: "6px" }}>
        {title}
      </h3>
      <p style={{ fontSize: "11px", color: "#64748b", maxWidth: "400px", margin: "0 auto 16px" }}>
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          style={{
            background: "#07327c",
            color: "white",
            border: "none",
            borderRadius: "6px",
            padding: "8px 16px",
            fontSize: "11px",
            cursor: "pointer",
          }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
