import {
	queryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { CreateMeetingInput } from "@/lib/api/types";

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

export function useCreateMeetingMutation() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input?: CreateMeetingInput) => api.createMeeting(input),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: meetingKeys.list() });
		},
	});
}
