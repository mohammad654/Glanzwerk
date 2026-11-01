package com.glanzwerk.api.users;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmailIgnoreCase(String email);

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByIdAndRole(Long id, Role role);

    List<User> findByRoleOrderByNameAsc(Role role);
}
