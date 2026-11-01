package com.glanzwerk.api.common;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

/**
 * Paging decisions the list endpoints share.
 *
 * Two services had their own copy of "use the caller's sort if they gave one, else
 * ours". Each had to remember to carry the page number and size across, and a copy
 * that forgets silently resets the caller to page zero.
 */
public final class Pages {
    private Pages() {
    }

    /** The caller's own sort when they asked for one, otherwise this screen's default. */
    public static Pageable sortedBy(Pageable pageable, Sort fallback) {
        return pageable.getSort().isSorted()
                ? pageable
                : PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), fallback);
    }
}
