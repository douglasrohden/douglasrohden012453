package com.douglasrohden.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            logger.info("Incoming request: {} {}", request.getMethod(), request.getRequestURI());
            String origin = request.getHeader("Origin");
            String authHeader = request.getHeader("Authorization") != null ? "present" : "absent";
            String contentType = request.getHeader("Content-Type");
            logger.info("Origin={}, Authorization={}, Content-Type={}", origin, authHeader, contentType);
        } catch (Exception e) {
            logger.warn("Failed to log request headers", e);
        }

        filterChain.doFilter(request, response);
    }
}
