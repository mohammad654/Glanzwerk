package com.glanzwerk.api.employees;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    /**
     * Every employee with their skills in one query.
     *
     * The explicit fetch join is what keeps the list page at one statement: without
     * it, rendering fifty employees costs fifty extra selects for the skill set.
     */
    @Query("""
            select distinct e from Employee e
            left join fetch e.skills
            order by e.name asc
            """)
    List<Employee> findAllWithSkills();

    @Query("""
            select distinct e from Employee e
            left join fetch e.skills
            where e.id = :id
            """)
    Optional<Employee> findWithSkills(@Param("id") Long id);

    /**
     * Who may be assigned to an appointment for this service: on the books, not on
     * leave, and trained for it.
     */
    @Query("""
            select distinct e from Employee e
            left join fetch e.skills
            where e.active = true
              and e.status = com.glanzwerk.api.employees.EmployeeStatus.ACTIVE
              and exists (select 1 from Employee e2 join e2.skills s2
                          where e2.id = e.id and s2.id = :serviceId)
            order by e.name asc
            """)
    List<Employee> findAssignableForService(@Param("serviceId") Long serviceId);

    boolean existsByEmailIgnoreCase(String email);

    /**
     * Whether anything in the diary still points at this person.
     *
     * Named in JPQL rather than through the appointments package, so that deleting an
     * employee does not make this feature depend on a feature that already depends on
     * it. The foreign key would refuse the delete anyway; asking first is what turns
     * a 500 from the driver into a sentence the dashboard can show.
     */
    @Query("select count(a) > 0 from Appointment a where a.employee.id = :id")
    boolean hasAppointments(@Param("id") Long id);

    /** Staff currently on the books, for the overview's headcount. */
    @Query("select count(e) from Employee e where e.active = true")
    long countActive();
}
