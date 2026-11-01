package com.glanzwerk.api.contact;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContactRequestRepository extends JpaRepository<ContactRequest, Long> {

    @Query(value = """
            select r from ContactRequest r
            left join fetch r.service
            where (:status is null or r.status = :status)
              and (:query is null
                   or lower(r.name) like :query escape '\\'
                   or lower(r.email) like :query escape '\\'
                   or lower(r.message) like :query escape '\\')
            """,
            countQuery = """
            select count(r) from ContactRequest r
            where (:status is null or r.status = :status)
              and (:query is null
                   or lower(r.name) like :query escape '\\'
                   or lower(r.email) like :query escape '\\'
                   or lower(r.message) like :query escape '\\')
            """)
    Page<ContactRequest> search(@Param("status") ContactRequestStatus status,
                                @Param("query") String query,
                                Pageable pageable);

    @Query("select r from ContactRequest r left join fetch r.service where r.id = :id")
    Optional<ContactRequest> findDetailed(@Param("id") Long id);

    long countByStatus(ContactRequestStatus status);
}
