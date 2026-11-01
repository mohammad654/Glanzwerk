package com.glanzwerk.api.dashboard;

import com.glanzwerk.api.appointments.AppointmentStatsDto;

/** Everything the overview page shows, in one response instead of five requests. */
public record DashboardDto(
        long activeClients,
        long activeEmployees,
        long activeServices,
        long newEnquiries,
        AppointmentStatsDto appointments
) {
}
