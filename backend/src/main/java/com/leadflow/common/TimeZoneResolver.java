package com.leadflow.common;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.DateTimeException;
import java.time.ZoneId;

/** Turns the optional {@code tz} query parameter into a {@link ZoneId}. */
@Component
public class TimeZoneResolver {

    private final ZoneId defaultZone;

    public TimeZoneResolver(@Value("${app.timezone}") String defaultZone) {
        this.defaultZone = ZoneId.of(defaultZone);
    }

    public ZoneId resolve(String tz) {
        if (tz == null || tz.isBlank()) {
            return defaultZone;
        }
        try {
            return ZoneId.of(tz.trim());
        } catch (DateTimeException e) {
            throw new InvalidRequestException("Unknown time zone: " + tz);
        }
    }
}
