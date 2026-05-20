"use client";

import { useEffect, useState } from "react";

export default function ScrollButton() {
  const [visible, setVisible] = useState(false);
  const [direction, setDirection] = useState<"up" | "down">("down");

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;

      const viewportHeight = window.innerHeight;

      const fullHeight = document.documentElement.scrollHeight;

      // Hide button if page is not long enough
      const isScrollable = fullHeight > viewportHeight + 300;

      if (!isScrollable) {
        setVisible(false);
        return;
      }

      const nearTop = scrollTop < 250;

      const nearBottom = scrollTop + viewportHeight >= fullHeight - 250;

      if (nearTop) {
        setVisible(true);
        setDirection("down");
      } else if (nearBottom) {
        setVisible(true);
        setDirection("up");
      } else {
        setVisible(false);
      }
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll);

    window.addEventListener("resize", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);

      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const handleClick = () => {
    if (direction === "down") {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={direction === "down" ? "Scroll to bottom" : "Scroll to top"}
      className={`
        fixed bottom-6 right-6 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full
        bg-neutral-900/90 dark:bg-neutral-100/90 text-neutral-50 dark:text-neutral-900
        backdrop-blur-md
        border border-neutral-800/10 dark:border-neutral-200/20
        shadow-md shadow-neutral-950/10
        transition-all duration-300 ease-out
        hover:bg-black dark:hover:bg-white
        hover:shadow-xl hover:shadow-neutral-950/20
        ${
          visible
            ? "opacity-100 translate-y-0 scale-100 visibility-visible"
            : "opacity-0 translate-y-4 scale-75 pointer-events-none visibility-hidden"
        }
      `}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="2.5"
        stroke="currentColor"
        className={`h-5 w-5 transition-transform duration-300 ${
          direction === "down" ? "rotate-180" : "rotate-0"
        }`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18"
        />
      </svg>
    </button>
  );
}
