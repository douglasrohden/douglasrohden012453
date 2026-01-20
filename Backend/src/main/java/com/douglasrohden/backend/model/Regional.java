package com.douglasrohden.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "regional", indexes = {
    @Index(name = "idx_regional_external_id_jpa", columnList = "external_id")
})
public class Regional {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "external_id", nullable = false, length = 255)
    private String externalId;

    @Column(name = "nome", nullable = false, length = 255)
    private String nome;

    @Column(name = "active", nullable = false)
    private Boolean active = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "inactivated_at")
    private LocalDateTime inactivatedAt;

    @Column(name = "notes", length = 1000)
    private String notes;

}
