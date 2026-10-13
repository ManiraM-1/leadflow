package com.leadflow.lead.dto;

import com.leadflow.lead.Lead;
import com.leadflow.lead.LeadStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Body of {@code POST /api/leads}. Only the name is required; status defaults to NEW. */
public record CreateLeadRequest(
        @NotBlank(message = "Name is required")
        @Size(max = Lead.NAME_MAX, message = "Name must be at most {max} characters")
        String name,

        @Size(max = Lead.COMPANY_MAX, message = "Company must be at most {max} characters")
        String company,

        @Size(max = Lead.PHONE_MAX, message = "Phone must be at most {max} characters")
        @Pattern(regexp = "^[0-9+()\\-\\s]*$", message = "Phone may only contain digits, spaces and + ( ) -")
        String phone,

        LeadStatus status
) {
}
