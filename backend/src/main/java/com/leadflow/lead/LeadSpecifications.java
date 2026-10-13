package com.leadflow.lead;

import org.springframework.data.jpa.domain.Specification;

/** Optional filters for the lead list. A null predicate means "no filter". */
final class LeadSpecifications {

    private LeadSpecifications() {
    }

    static Specification<Lead> hasStatus(LeadStatus status) {
        return (root, query, cb) -> status == null ? null : cb.equal(root.get("status"), status);
    }

    static Specification<Lead> nameContains(String term) {
        return (root, query, cb) -> {
            if (term == null || term.isBlank()) {
                return null;
            }
            String pattern = "%" + escapeLike(term.trim().toLowerCase()) + "%";
            return cb.like(cb.lower(root.<String>get("name")), pattern, '\\');
        };
    }

    /** Treat %, _ and \ typed by the user as literal characters. */
    private static String escapeLike(String value) {
        return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
