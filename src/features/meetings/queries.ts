import { queryOptions, useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export const meetingKeys = {
	all: ["meetings"] as const,
	list: () => [...meetingKeys.all, "list"] as const,
	detail: (meetingId: string) =>
		[...meetingKeys.all, "detail", meetingId] as const,
};

export function meetingsQueryOptions() {
	return queryOptions({
		queryKey: meetingKeys.list(),
		queryFn: () => api.listMeetings(),
	});
}

export function meetingQueryOptions(meetingId: string) {
	return queryOptions({
		queryKey: meetingKeys.detail(meetingId),
		queryFn: () => api.getMeeting(meetingId),
	});
}

export function useMeetingsQuery() {
	return useQuery(meetingsQueryOptions());
}

export function useMeetingQuery(meetingId: string | undefined) {
	return useQuery({
		...meetingQueryOptions(meetingId ?? ""),
		enabled: Boolean(meetingId),
	});
}
