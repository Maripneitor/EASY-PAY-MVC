/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#2078f3",
                "primary-dark": "#1a6fc4",
                "primary-glow": "#2078f380",
                "background-light": "#f5f7f8",
                "background-dark": "#0f172a",
                "surface-dark": "#1e293b",
                "glass-border": "rgba(255, 255, 255, 0.08)",
                "glass-bg": "rgba(30, 41, 59, 0.7)",
                "card-glass": "rgba(30, 41, 59, 0.7)",
                "card-border": "rgba(255, 255, 255, 0.1)",
                "cyan-glow": "#06b6d4",
                "emerald-btn": "#10b981",
                // Register Expense palette
                "alice-blue": "#E3F2FD",
                "icy-blue": "#BBDEFB",
                "sky-blue": "#90CAF9",
                "cool-sky": "#64B5F6",
                "cool-sky-var": "#42A5F5",
                "dodger-blue": "#2196F3",
                "brilliant-azure": "#1E88E5",
                "twitter-blue": "#1976D2",
                "ocean-deep": "#1565C0",
                "cobalt-blue": "#0D47A1",
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"],
                "body": ["Inter", "sans-serif"],
                "mono": ["Roboto Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "2xl": "1rem",
                "3xl": "1.5rem",
                "full": "9999px"
            },
            boxShadow: {
                'glow': '0 0 20px -5px var(--tw-shadow-color)',
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                'cyan-glow': '0 0 20px rgba(6, 182, 212, 0.5)',
                'card': '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            },
            backgroundImage: {
                'gradient-card': 'linear-gradient(135deg, rgba(59, 130, 246, 0.6) 0%, rgba(139, 92, 246, 0.6) 100%)',
                'frosted': 'linear-gradient(120deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
            },
            animation: {
                "scan": "scan 3s ease-in-out infinite",
                "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            },
            keyframes: {
                scan: {
                    "0%, 100%": { top: "5%" },
                    "50%": { top: "95%" }
                },
            },
        },
    },
    plugins: [],
}
