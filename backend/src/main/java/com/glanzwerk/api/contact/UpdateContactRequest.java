package com.glanzwerk.api.contact;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** What the office may change on an enquiry: where it stands, and its own note. */
@Data
public class UpdateContactRequest {
    @NotNull(message = "Status is required")
    private ContactRequestStatus status;

    @Size(max = 2000, message = "Note must be at most {max} characters")
    private String adminNotes;
}
