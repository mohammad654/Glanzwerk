package com.glanzwerk.api.contact;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * The default notifier: writes a line to the log.
 *
 * It logs the enquiry's id and nothing else. The name, address and message are in the
 * database where they belong; repeating them in the log would scatter personal data
 * into files with a different retention policy and far looser access control.
 */
@Component
public class LoggingEnquiryNotifier implements EnquiryNotifier {
    private static final Logger log = LoggerFactory.getLogger(LoggingEnquiryNotifier.class);

    @Override
    public void notifyNewEnquiry(ContactRequest request) {
        log.info("New contact request #{} awaiting reply", request.getId());
    }
}
