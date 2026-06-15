import * as Sentry from "@sentry/react";

// DSN 留空 => 不啟用，安全 no-op。DSN 是公開值，可放 VITE_*。
export function initSentry(): void {
	const dsn = import.meta.env.VITE_SENTRY_DSN;
	if (!dsn) return;

	Sentry.init({
		dsn,
		environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? "development",
		// 自架後端先低採樣；GlitchTip 對 tracing 支援有限。
		tracesSampleRate: Number(
			import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0,
		),
	});
}
