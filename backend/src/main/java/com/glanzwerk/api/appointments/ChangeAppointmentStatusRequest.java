package com.glanzwerk.api.appointments;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ChangeAppointmentStatusRequest {
    @NotNull(message = "Status is required")
    private AppointmentStatus status;
}
