import { createContext, useContext, useState, useCallback } from "react";
import QuickProfileModal from "../components/modals/QuickProfileModal";
import HashtagModal from "../components/modals/HashtagModal";

const QuickViewContext = createContext({
  openProfile: () => {},
  openHashtag: () => {},
});

export const useQuickView = () => useContext(QuickViewContext);

export const QuickViewProvider = ({ children }) => {
  const [profileUsername, setProfileUsername] = useState(null);
  const [hashtag, setHashtag] = useState(null);

  const openProfile = useCallback((username) => {
    if (!username) return;
    // Close other modals first
    setHashtag(null);
    setProfileUsername(username);
  }, []);

  const openHashtag = useCallback((tag) => {
    if (!tag) return;
    setProfileUsername(null);
    setHashtag(tag);
  }, []);

  return (
    <QuickViewContext.Provider value={{ openProfile, openHashtag }}>
      {children}

      <QuickProfileModal
        username={profileUsername}
        isOpen={!!profileUsername}
        onClose={() => setProfileUsername(null)}
      />

      <HashtagModal
        tag={hashtag}
        isOpen={!!hashtag}
        onClose={() => setHashtag(null)}
      />
    </QuickViewContext.Provider>
  );
};

export default QuickViewContext;
