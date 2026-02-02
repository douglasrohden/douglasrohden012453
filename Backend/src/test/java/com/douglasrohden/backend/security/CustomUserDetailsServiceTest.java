package com.douglasrohden.backend.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import com.douglasrohden.backend.model.Usuario;
import com.douglasrohden.backend.repository.UsuarioRepository;
import java.util.Optional;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

// AUTO-GENERATED TEST - you can customize and remove this marker if you keep the test
@DisplayName("CustomUserDetailsService service tests")
@ExtendWith(MockitoExtension.class)
class CustomUserDetailsServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Test
    @DisplayName("loads CustomUserDetailsService via reflection")
    void loadsClass() {
        assertDoesNotThrow(() -> Class.forName("com.douglasrohden.backend.security.CustomUserDetailsService"));
    }

    @Nested
    @DisplayName("scenarios to implement for service")
    class Scenarios {

        @Test
        void happyPath() {
            CustomUserDetailsService service = new CustomUserDetailsService(usuarioRepository);

            Usuario usuario = new Usuario();
            usuario.setUsername("tester");
            usuario.setPasswordHash("hashed");

            when(usuarioRepository.findByUsername("tester")).thenReturn(Optional.of(usuario));

            UserDetails details = service.loadUserByUsername("tester");
            assertEquals("tester", details.getUsername());
            assertEquals("hashed", details.getPassword());
        }

        @Test
        void handlesEdgeCases() {
            CustomUserDetailsService service = new CustomUserDetailsService(usuarioRepository);
            when(usuarioRepository.findByUsername("missing")).thenReturn(Optional.empty());

            assertThrows(UsernameNotFoundException.class, () -> service.loadUserByUsername("missing"));
        }
    }
}
