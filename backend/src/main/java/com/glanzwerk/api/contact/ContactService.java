package com.glanzwerk.api.contact;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.glanzwerk.api.common.NotFoundException;
import com.glanzwerk.api.common.Pages;
import com.glanzwerk.api.common.PagedResponse;
import com.glanzwerk.api.common.Text;
import com.glanzwerk.api.services.ServiceOfferingRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ContactService {
    private static final Logger log = LoggerFactory.getLogger(ContactService.class);

    private final ContactRequestRepository repository;
    private final ServiceOfferingRepository serviceRepository;
    private final EnquiryNotifier notifier;

    /**
     * Stores the enquiry, then tries to announce it.
     *
     * The order matters and the try/catch is the point: the database write is the
     * commitment to the person who wrote in, and a notifier that throws must not turn
     * their enquiry into a 500 and a lost lead. A failed notification is an operations
     * problem, visible in the log and recoverable from the dashboard, which still
     * shows the record.
     */
    @Transactional
    public ContactRequestDto submit(SubmitContactRequest request) {
        if (request.getWebsite() != null && !request.getWebsite().isBlank()) {
            // A bot filled the honeypot. Answer as if it worked: telling a crawler it
            // was detected only teaches whoever wrote it to leave the field alone.
            log.debug("Dropped a contact request that filled the honeypot field");
            return new ContactRequestDto(null, request.getName(), request.getEmail(), request.getPhone(),
                    null, null, request.getMessage(), ContactRequestStatus.NEW, null, null, null);
        }

        // An unknown or deleted service id is dropped rather than rejected: the message
        // matters more than the dropdown, and the text usually says what it is about.
        var service = request.getServiceId() == null
                ? null
                : serviceRepository.findById(request.getServiceId()).orElse(null);

        var saved = repository.save(ContactRequest.builder()
                .name(request.getName().trim())
                .email(Text.normalizeEmail(request.getEmail()))
                .phone(Text.blankToNull(request.getPhone()))
                .service(service)
                .message(request.getMessage().trim())
                .status(ContactRequestStatus.NEW)
                .build());

        try {
            notifier.notifyNewEnquiry(saved);
        } catch (RuntimeException exception) {
            log.error("Could not notify the office about contact request #{}", saved.getId(), exception);
        }

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public PagedResponse<ContactRequestDto> search(ContactRequestStatus status, String query, Pageable pageable) {
        var sorted = Pages.sortedBy(pageable, Sort.by("createdAt").descending());
        return PagedResponse.from(
                repository.search(status, Text.likePattern(query), sorted), this::toDto);
    }

    @Transactional(readOnly = true)
    public ContactRequestDto get(Long id) {
        return toDto(require(id));
    }

    @Transactional
    public ContactRequestDto update(Long id, UpdateContactRequest request) {
        var enquiry = require(id);
        enquiry.setStatus(request.getStatus());
        enquiry.setAdminNotes(Text.blankToNull(request.getAdminNotes()));

        return toDto(repository.save(enquiry));
    }

    @Transactional(readOnly = true)
    public long countNew() {
        return repository.countByStatus(ContactRequestStatus.NEW);
    }

    private ContactRequest require(Long id) {
        return repository.findDetailed(id)
                .orElseThrow(() -> new NotFoundException("Contact request not found."));
    }

    private ContactRequestDto toDto(ContactRequest enquiry) {
        var service = enquiry.getService();

        return new ContactRequestDto(
                enquiry.getId(),
                enquiry.getName(),
                enquiry.getEmail(),
                enquiry.getPhone(),
                service == null ? null : service.getId(),
                service == null ? null : service.getNameDe(),
                enquiry.getMessage(),
                enquiry.getStatus(),
                enquiry.getAdminNotes(),
                enquiry.getCreatedAt(),
                enquiry.getUpdatedAt());
    }
}
