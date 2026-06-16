/**
 * Build the deep-link to a meeting room in the meet/ frontend. The path segment
 * is the meetingCode (workbench `Meeting.id`); meet/ resolves it against
 * meeting-api by code. workbench never connects to LiveKit itself.
 */
export function buildMeetingRoomUrl(
	meetBaseUrl: string,
	meetingCode: string,
): string {
	return `${meetBaseUrl}/rooms/${encodeURIComponent(meetingCode)}`;
}
