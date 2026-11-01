package com.glanzwerk.api.clients;

import java.util.List;
import java.util.Locale;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.glanzwerk.api.appointments.AppointmentService;
import com.glanzwerk.api.common.NotFoundException;
import com.glanzwerk.api.common.Text;
import com.glanzwerk.api.users.Role;
import com.glanzwerk.api.users.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * Client administration. Reads and the account flag only: there is no "create client"
 * here, because a client account is something a person makes for themselves, and no
 * delete, because their appointments are business records.
 */
@Service
@RequiredArgsConstructor
public class ClientService {
    private final ClientQueryRepository clientQueries;
    private final UserRepository userRepository;
    private final AppointmentService appointments;

    @Transactional(readOnly = true)
    public List<ClientSummaryDto> list(String query) {
        return clientQueries.findClientSummaries(Text.likePattern(query));
    }

    @Transactional(readOnly = true)
    public ClientDetailDto get(Long id, Locale locale) {
        var client = clientQueries.findClientSummary(id)
                .orElseThrow(() -> new NotFoundException("Client not found."));

        return new ClientDetailDto(client, appointments.listForClient(id, locale));
    }

    /**
     * Blocking or restoring a client's access. The row stays, so their appointments
     * keep pointing at a real account.
     */
    @Transactional
    public void setActive(Long id, boolean active) {
        var user = userRepository.findByIdAndRole(id, Role.CLIENT)
                .orElseThrow(() -> new NotFoundException("Client not found."));

        user.setActive(active);
        userRepository.save(user);
    }
}
