package com.douglasrohden.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class TestProtectedController {

    @GetMapping("/v1/protected-test")
    public String ok() {
        return "ok";
    }
}
