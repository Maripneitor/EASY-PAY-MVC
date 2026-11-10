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
                // Semantic Design Tokens (FinTech System)
                "background": "var(--bg-body)",
                "surface": "var(--bg-surface)",
                "surface-card": "var(--bg-card)",
                "surface-muted": "var(--bg-surface-muted)",
                "border": "var(--border-color)",
                "border-subtle": "var(--border-subtle)",
                "muted": "var(--text-secondary)",
                "muted-foreground": "var(--text-secondary)",
                "foreground": "var(--text-primary)",
                "primary": {
                    DEFAULT: "var(--primary)",
                    subtle: "var(--primary-subtle)",
                    border: "var(--primary-border)",
                    foreground: "var(--primary-foreground)",
                    50: '#eef2ff',
                    100: '#e0e7ff',
                    200: '#c7d2fe',
                    300: '#a5b4fc',
                    400: '#818cf8',
                    500: '#6366f1',
                    600: '#4f46e5',
                    700: '#4338ca',
                    800: '#3730a3',
                    900: '#312e81',
                },
                "primary-dark": "#4338ca",
                "primary-glow": "rgba(99, 102, 241, 0.3)",
                "background-light": "#f8fafc",
                "background-dark": "#0a0e17",
                "surface-dark": "#111827",
                "glass-border": "var(--border-subtle)",
                "glass-bg": "var(--glass-bg)",
                "card-glass": "var(--glass-bg)",
                "card-border": "var(--border-color)",
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
                'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.2), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
            },
            backgroundImage: {
                'gradient-card': 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)',
                'frosted': 'linear-gradient(120deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)',
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
