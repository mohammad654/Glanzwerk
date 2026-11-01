package com.glanzwerk.api.common;

import java.util.List;

import org.springframework.data.domain.Page;

/**
 * A page of DTOs, returned bare like every other success payload.
 *
 * Spring's own {@code Page} serialises its internal structure and warns about it;
 * this keeps the wire format ours and stable.
 */
public record PagedResponse<T>(
        List<T> items,
        int page,
        int size,
        long totalItems,
        int totalPages
) {
    public static <E, T> PagedResponse<T> from(Page<E> page, java.util.function.Function<E, T> mapper) {
        return new PagedResponse<>(
                page.getContent().stream().map(mapper).toList(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
}
