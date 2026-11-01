package com.glanzwerk.api.appointments;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    /**
     * Whether this employee is already committed over this window.
     *
     * The overlap test is {@code existing.start < new.end and existing.end > new.start},
     * which is the only form that catches an appointment that merely straddles the new
     * one. Touching appointments (one ends exactly when the next begins) deliberately
     * do not collide. {@code excludedId} lets a reschedule ignore the row being moved.
     */
    @Query("""
            select count(a) > 0 from Appointment a
            where a.employee.id = :employeeId
              and a.status in :blockingStatuses
              and (:excludedId is null or a.id <> :excludedId)
              and a.startTime < :end
              and a.endTime > :start
            """)
    boolean hasConflict(@Param("employeeId") Long employeeId,
                        @Param("start") LocalDateTime start,
                        @Param("end") LocalDateTime end,
                        @Param("blockingStatuses") Collection<AppointmentStatus> blockingStatuses,
                        @Param("excludedId") Long excludedId);

    /**
     * Every commitment in the window, as a flat projection.
     *
     * One query for a whole month of availability. Computing the free slots from this
     * in memory is far cheaper than asking the database per employee per day per slot,
     * which for thirty days and thirteen slots would be hundreds of round trips.
     *
     * The join is a **left** join, so appointments nobody is assigned to yet come back
     * with a null {@code employeeId} instead of being dropped. That matters: an
     * unassigned appointment still needs somebody to go, so it has to count against
     * capacity. {@code a.employee.id} on its own would be an implicit inner join and
     * would quietly leave every one of them out.
     */
    @Query("""
            select new com.glanzwerk.api.appointments.BusySlot(e.id, a.startTime, a.endTime)
            from Appointment a
            left join a.employee e
            where a.status in :blockingStatuses
              and a.startTime < :to
              and a.endTime > :from
            """)
    List<BusySlot> findCommitmentsInWindow(@Param("from") LocalDateTime from,
                                           @Param("to") LocalDateTime to,
                                           @Param("blockingStatuses") Collection<AppointmentStatus> blockingStatuses);

    /**
     * The admin table, filtered. Every filter is optional and null means "no filter",
     * which keeps one query and one plan instead of a Specification tree.
     *
     * The joins are fetch joins on to-one associations only, so paging still happens
     * in the database — a fetch join on a collection would make Hibernate read every
     * matching row into memory to paginate it.
     */
    @Query(value = """
            select a from Appointment a
            join fetch a.client c
            join fetch a.service s
            left join fetch a.employee e
            where (:status is null or a.status = :status)
              and (:employeeId is null or a.employee.id = :employeeId)
              and (:clientId is null or a.client.id = :clientId)
              and (:from is null or a.startTime >= :from)
              and (:to is null or a.startTime < :to)
              and (:query is null
                   or (:referenceId is not null and a.id = :referenceId)
                   or lower(c.name) like :query escape '\\'
                   or lower(c.email) like :query escape '\\'
                   or lower(s.nameDe) like :query escape '\\'
                   or lower(s.nameEn) like :query escape '\\')
            """,
            countQuery = """
            select count(a) from Appointment a
            where (:status is null or a.status = :status)
              and (:employeeId is null or a.employee.id = :employeeId)
              and (:clientId is null or a.client.id = :clientId)
              and (:from is null or a.startTime >= :from)
              and (:to is null or a.startTime < :to)
              and (:query is null
                   or (:referenceId is not null and a.id = :referenceId)
                   or lower(a.client.name) like :query escape '\\'
                   or lower(a.client.email) like :query escape '\\'
                   or lower(a.service.nameDe) like :query escape '\\'
                   or lower(a.service.nameEn) like :query escape '\\')
            """)
    Page<Appointment> search(@Param("status") AppointmentStatus status,
                             @Param("employeeId") Long employeeId,
                             @Param("clientId") Long clientId,
                             @Param("from") LocalDateTime from,
                             @Param("to") LocalDateTime to,
                             @Param("query") String query,
                             @Param("referenceId") Long referenceId,
                             Pageable pageable);

    @Query("""
            select a from Appointment a
            join fetch a.client
            join fetch a.service
            left join fetch a.employee
            where a.id = :id
            """)
    Optional<Appointment> findDetailed(@Param("id") Long id);

    @Query("""
            select a from Appointment a
            join fetch a.client
            join fetch a.service
            left join fetch a.employee
            where a.client.id = :clientId
            order by a.startTime desc
            """)
    List<Appointment> findForClient(@Param("clientId") Long clientId);

    long countByStatus(AppointmentStatus status);

    @Query("select count(a) from Appointment a where a.startTime >= :from and a.startTime < :to")
    long countInWindow(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
