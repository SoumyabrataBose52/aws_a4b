"use client";

import dynamic from "next/dynamic";

const UnicornScene = dynamic(() => import("unicornstudio-react/next"), {
    ssr: false,
    loading: () => (
        <div
            style={{
                width: "100%",
                height: "100%",
                background:
                    "radial-gradient(ellipse at 50% 50%, rgba(108,92,231,0.15) 0%, transparent 70%)",
            }}
        />
    ),
});

export default function UnicornHero() {
    return (
        <div className="unicorn-backdrop">
            <UnicornScene
                projectId="RzCfFlNtWfGtGkDWbY4m"
                sdkUrl="https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.0.5/dist/unicornStudio.umd.js"
                width="100%"
                height="100%"
            />
            <div className="unicorn-overlay" />
        </div>
    );
}
