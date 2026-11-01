package com.glanzwerk.api.contact;

/**
 * Tells the office that an enquiry arrived.
 *
 * An interface with one logging implementation, so the record is saved today and an
 * SMTP or webhook notifier can be added later without touching the service. It is an
 * interface rather than a direct mail call precisely because delivery is the part
 * most likely to change and most likely to fail.
 */
public interface EnquiryNotifier {
    void notifyNewEnquiry(ContactRequest request);
}
