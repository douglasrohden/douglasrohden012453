package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.model.Usuario;
import com.douglasrohden.backend.repository.UsuarioRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;

@RestController
@RequestMapping("/v1/dev")
public class DevController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public DevController(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PostMapping("/create-default-admin")
    public ResponseEntity<String> createDefaultAdmin() {
        Optional<Usuario> existing = usuarioRepository.findByUsername("admin");
        Usuario u = existing.orElseGet(Usuario::new);
        u.setUsername("admin");
        u.setPasswordHash(passwordEncoder.encode("admin"));
        usuarioRepository.save(u);
        return ResponseEntity.ok("admin user created/updated");
    }
}
