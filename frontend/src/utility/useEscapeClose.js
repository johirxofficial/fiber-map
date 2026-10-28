import { useEffect } from "react";

/* Close an Add/Edit sidebar with Escape without stealing Escape from the map
 * search box.  Keeping this in one hook makes every form behave the same. */
export default function useEscapeClose(visible, onClose) {
  useEffect(() => {
    if (!visible) return undefined;
    const handleKeyDown = (event) => {
      if (event.key !== "Escape") return;
      const target = event.target;
      if (target && typeof target.closest === "function") {
        if (target.closest(".map-search-control")) return;
      }
      onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, visible]);
}
