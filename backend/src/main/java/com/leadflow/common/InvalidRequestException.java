package com.leadflow.common;

/** A request that is well-formed JSON but asks for something invalid. Mapped to HTTP 400. */
public class InvalidRequestException extends RuntimeException {

    public InvalidRequestException(String message) {
        super(message);
    }
}
