package com.glanzwerk.api.clients;

import java.util.List;

import com.glanzwerk.api.appointments.AppointmentDto;

/** One client with the appointment history the dashboard shows under them. */
public record ClientDetailDto(ClientSummaryDto client, List<AppointmentDto> appointments) {
}
