import api from "./api";

export type ActivityEventType =
    | "TAB_SWITCH"
    | "WINDOW_BLUR"
    | "FULLSCREEN_EXIT"
    | "COPY"
    | "PASTE"
    | "REFRESH"
    | "MULTIPLE_SESSION"
    | "CONNECTION_LOST";

export interface ActivityLog {
    id: string;
    attemptId: string;
    eventType: ActivityEventType;
    eventData: unknown;
    occurredAt: string;
}

export interface ActivityLogResult {
    activity: ActivityLog;
    violationCount: number;
    maxViolations: number;
    warningLevel:
    | "WARNING"
    | "FINAL_WARNING"
    | "REVIEW_REQUIRED"
    | null;
    blocked: boolean;
    message: string;
}

interface ActivityLogResponse {
    success: boolean;
    message: string;
    data: ActivityLogResult;
}

interface ActivityLogsResponse {
    success: boolean;
    message: string;
    data: ActivityLog[];
}

export const createActivityLog = async (
    attemptId: string,
    eventType: ActivityEventType,
    eventData?: unknown
): Promise<ActivityLogResult> => {
    const response =
        await api.post<ActivityLogResponse>(
            "/activity-logs",
            {
                attemptId,
                eventType,
                eventData,
            }
        );

    return response.data.data;
};

export const getActivityLogsByAttemptId = async (
    attemptId: string
): Promise<ActivityLog[]> => {
    const response =
        await api.get<ActivityLogsResponse>(
            `/activity-logs/attempt/${attemptId}`
        );

    return response.data.data;
};