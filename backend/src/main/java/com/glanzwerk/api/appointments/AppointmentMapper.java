package com.glanzwerk.api.appointments;

import java.time.Duration;
import java.util.Locale;

import org.springframework.stereotype.Component;

@Component
public class AppointmentMapper {

    public AppointmentDto toDto(Appointment appointment, Locale locale) {
        var client = appointment.getClient();
        var service = appointment.getService();
        var employee = appointment.getEmployee();

        return new AppointmentDto(
                appointment.getId(),
                appointment.getReference(),
                new AppointmentDto.ClientSummary(
                        client.getId(), client.getName(), client.getEmail(), client.getPhone()),
                new AppointmentDto.ServiceSummary(
                        service.getId(), service.getServiceKey(), service.nameIn(locale)),
                employee == null ? null : new AppointmentDto.EmployeeSummary(
                        employee.getId(), employee.getName(), employee.getJobRole().name()),
                appointment.getStartTime(),
                appointment.getEndTime(),
                (int) Duration.between(appointment.getStartTime(), appointment.getEndTime()).toMinutes(),
                appointment.getStatus(),
                appointment.getStreet(),
                appointment.getPostalCode(),
                appointment.getCity(),
                appointment.getNotes(),
                appointment.getCreatedAt());
    }
}
