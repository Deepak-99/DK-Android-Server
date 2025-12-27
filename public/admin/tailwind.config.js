/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
        "./index.html",
        "./src/**/*.{ts,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                bg: "#0d0d0f",
                card: "#16161a",
                border: "#26262b",
                text: "#ffffff",
                accent: "#4f46e5"
            }
        }
    },
    plugins: []
}
