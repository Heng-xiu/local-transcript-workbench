/** Trigger a browser download for an in-memory blob. */
export function downloadBlob(filename: string, blob: Blob): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.rel = "noopener";
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	// Revoke on the next tick so the download has a chance to start.
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
