import useTheme from "../../hooks/useTheme";

const SearchEmpty = ({ query, type = "all" }) => {
  const { c } = useTheme();

  const messages = {
    all: { icon: "🔍", text: "Start typing to search..." },
    typing: { icon: "⌨️", text: "Type at least 2 characters" },
    nothing: { icon: "🤷", text: "No results found" },
    users: { icon: "👤", text: "No users found" },
    posts: { icon: "📝", text: "No posts found" },
    notices: { icon: "📋", text: "No notices found" },
  };

  const config = messages[type] || messages.all;

  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 20px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div style={{ fontSize: "48px", marginBottom: "14px" }}>
        {config.icon}
      </div>
      <h3
        style={{
          fontSize: "16px",
          fontWeight: 700,
          color: c.textTer,
          margin: "0 0 6px",
        }}
      >
        {config.text}
      </h3>
      {query && (
        <p
          style={{
            fontSize: "13px",
            color: c.textMuted,
            margin: 0,
          }}
        >
          for "{query}"
        </p>
      )}
    </div>
  );
};

export default SearchEmpty;
