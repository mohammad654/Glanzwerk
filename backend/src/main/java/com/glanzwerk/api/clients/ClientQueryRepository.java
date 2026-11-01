package com.glanzwerk.api.clients;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import com.glanzwerk.api.users.User;

/**
 * Read-only views of client accounts.
 *
 * Its own repository rather than more methods on {@code UserRepository}: these queries
 * exist for one screen, join across to appointments, and return projections instead of
 * entities. Keeping them here stops the account repository growing reporting concerns.
 */
public interface ClientQueryRepository extends Repository<User, Long> {

    /**
     * Every client with their appointment totals, in one grouped query.
     *
     * The entity join to appointments is a left join, so a client who has never made
     * one still appears — with a count of zero rather than missing from the page.
     */
    @Query("""
            select new com.glanzwerk.api.clients.ClientSummaryDto(
                u.id, u.name, u.email, u.phone, u.active, u.createdAt,
                count(a.id), max(a.startTime),
                sum(case when a.status = com.glanzwerk.api.appointments.AppointmentStatus.COMPLETED
                         then 1L else 0L end))
            from User u
            left join com.glanzwerk.api.appointments.Appointment a on a.client = u
            where u.role = com.glanzwerk.api.users.Role.CLIENT
              and (:query is null or lower(u.name) like :query escape '\\' or lower(u.email) like :query escape '\\')
            group by u.id, u.name, u.email, u.phone, u.active, u.createdAt
            order by u.name asc
            """)
    List<ClientSummaryDto> findClientSummaries(@Param("query") String query);

    @Query("""
            select new com.glanzwerk.api.clients.ClientSummaryDto(
                u.id, u.name, u.email, u.phone, u.active, u.createdAt,
                count(a.id), max(a.startTime),
                sum(case when a.status = com.glanzwerk.api.appointments.AppointmentStatus.COMPLETED
                         then 1L else 0L end))
            from User u
            left join com.glanzwerk.api.appointments.Appointment a on a.client = u
            where u.role = com.glanzwerk.api.users.Role.CLIENT
              and u.id = :id
            group by u.id, u.name, u.email, u.phone, u.active, u.createdAt
            """)
    Optional<ClientSummaryDto> findClientSummary(@Param("id") Long id);

    @Query("select count(u) from User u where u.role = com.glanzwerk.api.users.Role.CLIENT and u.active = true")
    long countActiveClients();
}
