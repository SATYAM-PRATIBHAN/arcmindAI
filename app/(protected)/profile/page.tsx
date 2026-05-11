// At the top with other imports, add:
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

// Inside the ProfilePage component, BEFORE the return statement, add:
const { theme, setTheme } = useTheme();
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
  console.log("Theme toggle mounted, current theme:", theme);
}, [theme]);

const toggleTheme = () => {
  console.log("Toggle clicked, current theme:", theme);
  setTheme(theme === "dark" ? "light" : "dark");
};

// Then in your JSX, replace your h1 section with:
<div className="flex justify-between items-center mb-6">
  <h1 className="text-3xl font-bold">Profile</h1>
  
  {/* Debug button - very obvious */}
  <button
    onClick={toggleTheme}
    style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      zIndex: 9999,
      padding: '12px 24px',
      backgroundColor: 'red',
      color: 'white',
      borderRadius: '8px',
      fontWeight: 'bold',
      fontSize: '16px',
      cursor: 'pointer'
    }}
  >
    {mounted ? `Toggle: ${theme}` : "Loading..."}
  </button>
</div>