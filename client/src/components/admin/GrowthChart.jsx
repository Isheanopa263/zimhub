import useTheme from "../../hooks/useTheme";

const GrowthChart = ({ data = [] }) => {
  const { c } = useTheme();

  if (!data.length) return null;

  const maxUsers = Math.max(...data.map((d) => d.users), 1);
  const maxPosts = Math.max(...data.map((d) => d.posts), 1);
  const maxValue = Math.max(maxUsers, maxPosts, 5);

  return (
    <div
      style={{
        padding: "16px",
        background: c.bgCard,
        borderRadius: "14px",
        border: `1px solid ${c.border}`,
        boxShadow: c.shadowSm,
      }}
    >
      <h3
        style={{
          fontSize: "13px",
          fontWeight: 700,
          color: c.text,
          margin: "0 0 4px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        📈 7-Day Growth
      </h3>
      <p
        style={{
          fontSize: "11px",
          color: c.textMuted,
          margin: "0 0 16px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        New users and posts per day
      </p>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "14px",
          marginBottom: "12px",
          fontSize: "11px",
          fontFamily: "Inter, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              background: c.accent,
              borderRadius: "3px",
            }}
          />
          <span style={{ color: c.textTer, fontWeight: 600 }}>Users</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              background: "#8b5cf6",
              borderRadius: "3px",
            }}
          />
          <span style={{ color: c.textTer, fontWeight: 600 }}>Posts</span>
        </div>
      </div>

      {/* Chart bars */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "8px",
          height: "140px",
          paddingBottom: "24px",
          position: "relative",
        }}
      >
        {data.map((day, idx) => {
          const dayDate = new Date(day.date);
          const label = dayDate.toLocaleDateString("en-GB", {
            weekday: "short",
          });

          const usersHeight = (day.users / maxValue) * 100;
          const postsHeight = (day.posts / maxValue) * 100;

          return (
            <div
              key={idx}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                position: "relative",
                height: "100%",
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "3px",
                  width: "100%",
                  justifyContent: "center",
                }}
              >
                {/* Users bar */}
                <div
                  title={`${day.users} users`}
                  style={{
                    width: "40%",
                    height: `${Math.max(usersHeight, 2)}%`,
                    background: `linear-gradient(to top, ${c.accentHover}, ${c.accent})`,
                    borderRadius: "4px 4px 0 0",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                />
                {/* Posts bar */}
                <div
                  title={`${day.posts} posts`}
                  style={{
                    width: "40%",
                    height: `${Math.max(postsHeight, 2)}%`,
                    background: "linear-gradient(to top, #6d28d9, #8b5cf6)",
                    borderRadius: "4px 4px 0 0",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                />
              </div>

              <span
                style={{
                  position: "absolute",
                  bottom: "-22px",
                  fontSize: "10px",
                  color: c.textMuted,
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 600,
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GrowthChart;
