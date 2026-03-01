"use client";

import "./landing.css";
import UnicornHero from "@/components/UnicornHero";
import BlurText from "@/components/BlurText";
import {
    Bot,
    BarChart3,
    ShieldCheck,
    PenSquare,
    Handshake,
    TrendingUp,
    ArrowRight
} from "lucide-react";

const features = [
    {
        icon: <Bot size={28} />,
        title: "Multi-Agent AI Engine",
        desc: "Autonomous AI agents handle content planning, crisis detection, and deal negotiation — all working in parallel.",
    },
    {
        icon: <BarChart3 size={28} />,
        title: "Real-Time Analytics",
        desc: "Track performance across YouTube, Instagram, and Twitter with unified dashboards and actionable insights.",
    },
    {
        icon: <ShieldCheck size={28} />,
        title: "Crisis Shield",
        desc: "Detect PR risks before they escalate. AI-powered sentiment analysis monitors every mention 24/7.",
    },
    {
        icon: <PenSquare size={28} />,
        title: "Content Intelligence",
        desc: "Generate scripts, thumbnails, and posting schedules optimized by machine learning for maximum engagement.",
    },
    {
        icon: <Handshake size={28} />,
        title: "Deal Flow Automation",
        desc: "AI evaluates brand partnership offers, negotiates rates, and manages contract workflows automatically.",
    },
    {
        icon: <TrendingUp size={28} />,
        title: "Trend Forecasting",
        desc: "Stay ahead of viral moments. Predictive AI surfaces emerging trends aligned with your creator's niche.",
    },
];

const steps = [
    {
        num: "1",
        title: "Connect Creators",
        desc: "Link creator accounts across all major platforms in minutes.",
    },
    {
        num: "2",
        title: "Deploy AI Agents",
        desc: "Activate specialized agents for analytics, content, crisis, and deals.",
    },
    {
        num: "3",
        title: "Scale & Optimize",
        desc: "Watch your operations scale while AI continuously optimizes performance.",
    },
];

const stats = [
    { number: "10x", desc: "Faster Workflow" },
    { number: "24/7", desc: "AI Monitoring" },
    { number: "500+", desc: "Creators Managed" },
    { number: "98%", desc: "Client Retention" },
];

export default function LandingPage() {
    return (
        <div>
            {/* Navbar */}
            <nav className="landing-nav">
                <div className="landing-nav-logo">NEXUS SOLO</div>
                <ul className="landing-nav-links">
                    <li>
                        <a href="#features">Features</a>
                    </li>
                    <li>
                        <a href="#how-it-works">How It Works</a>
                    </li>
                    <li>
                        <a href="#stats">Stats</a>
                    </li>
                    <li>
                        <a href="/dashboard" className="nav-cta" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            Launch App <ArrowRight size={16} />
                        </a>
                    </li>
                </ul>
            </nav>

            {/* Hero */}
            <section className="landing-hero">
                <UnicornHero />
                <div className="hero-content">
                    <div className="hero-badge">⚡ AI-Powered Creator Management</div>
                    <h1 className="hero-title">
                        <BlurText
                            text="Your AI Command"
                            delay={150}
                            animateBy="words"
                            direction="top"
                            className="hero-blur-line"
                        />
                        <BlurText
                            text="Center for Creators"
                            delay={150}
                            animateBy="words"
                            direction="bottom"
                            className="hero-blur-line hero-gradient-line"
                            spanClassName="gradient-text"
                        />
                    </h1>
                    <p className="hero-subtitle">
                        The multi-agent AI platform that lets solopreneur creator managers
                        run operations at the scale of a full agency — content, analytics,
                        deals, and crisis management, all automated.
                    </p>
                    <div className="hero-buttons">
                        <a href="/dashboard" className="btn-hero-primary">
                            Get Started Free
                            <ArrowRight size={18} />
                        </a>
                        <a href="#features" className="btn-hero-secondary">
                            See How It Works
                        </a>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="landing-section fade-in-section delay-1" id="features">
                <span className="section-label">Features</span>
                <h2 className="section-title">
                    Everything you need to manage
                    <br />
                    creators at scale
                </h2>
                <p className="section-subtitle">
                    Six AI-powered modules working together to automate the entire creator
                    management lifecycle.
                </p>
                <div className="features-grid">
                    {features.map((f, i) => (
                        <div
                            key={i}
                            className={`feature-card fade-in-section delay-${(i % 4) + 1}`}
                        >
                            <div className="feature-icon">{f.icon}</div>
                            <h3>{f.title}</h3>
                            <p>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section
                className="landing-section fade-in-section delay-2"
                id="how-it-works"
            >
                <div style={{ textAlign: "center" }}>
                    <span className="section-label">How It Works</span>
                    <h2 className="section-title">Up and running in minutes</h2>
                    <p
                        className="section-subtitle"
                        style={{ margin: "0 auto" }}
                    >
                        Three simple steps to transform your creator management operations.
                    </p>
                </div>
                <div className="steps-grid">
                    {steps.map((s, i) => (
                        <div key={i} className="step-item">
                            <div className="step-number">{s.num}</div>
                            <h3>{s.title}</h3>
                            <p>{s.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Stats */}
            <section className="landing-section fade-in-section delay-3" id="stats">
                <div className="stats-row">
                    {stats.map((s, i) => (
                        <div key={i} className="stat-item">
                            <div className="stat-number">{s.number}</div>
                            <div className="stat-desc">{s.desc}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="cta-section fade-in-section delay-4">
                <div className="cta-card">
                    <div className="glow-orb glow-orb-1" />
                    <div className="glow-orb glow-orb-2" />
                    <h2>Ready to 10x your creator operations?</h2>
                    <p>
                        Join hundreds of creator managers who are scaling their businesses
                        with AI-powered automation.
                    </p>
                    <a href="/dashboard" className="btn-hero-primary">
                        Start Free Trial
                        <ArrowRight size={18} />
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-footer-text">
                    © 2026 Nexus Solo. All rights reserved.
                </div>
                <ul className="landing-footer-links">
                    <li>
                        <a href="#">Privacy</a>
                    </li>
                    <li>
                        <a href="#">Terms</a>
                    </li>
                    <li>
                        <a href="#">Docs</a>
                    </li>
                    <li>
                        <a href="#">Contact</a>
                    </li>
                </ul>
            </footer>
        </div>
    );
}
