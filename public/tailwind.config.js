/** @type {import('tailwindcss').Config} */
export default {
    darkMode: "class",

    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}"
    ],

    theme: {
        extend: {

            fontFamily: {
                sans: ["Inter", "Roboto", "system-ui", "sans-serif"]
            },

            colors: {
                /* Grafana style dark theme */
                bg: "#0b0f14",
                card: "#11161c",
                border: "#1f2933",

                text: "#e6edf3",
                muted: "#9aa4af",

                accent: "#3b82f6",
                accentSoft: "#1d4ed8",

                success: "#22c55e",
                warning: "#f59e0b",
                danger: "#ef4444"
            },

            boxShadow: {
                card: "0 2px 6px rgba(0,0,0,0.25)",
                hover: "0 6px 16px rgba(0,0,0,0.35)"
            },

            borderRadius: {
                xl: "12px",
                "2xl": "16px"
            }
        }
    },

    plugins: []
}