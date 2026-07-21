"use client";
import { Component, type ErrorInfo, type ReactNode } from "react";
type State = { failed: boolean };
export class ErrorBoundary extends Component<{ children: ReactNode }, State> { state: State = { failed: false }; static getDerivedStateFromError() { return { failed: true }; } componentDidCatch(error: Error, info: ErrorInfo) { console.error("Echoes dashboard error", error, info); } render() { if (this.state.failed) return <main className="error-realm parchment-texture"><p className="eyebrow">A SMALL MISCHIEF</p><h1>Something went wrong in the magic realm</h1><p>Your memories remain safe. Please try opening this page again.</p><button className="magic-button" onClick={() => this.setState({ failed: false })}>Try Again</button></main>; return this.props.children; } }
