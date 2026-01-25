package com.douglasrohden.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "regional")
public class Regional {

    @Id
    private Integer id;

    @Column(name = "nome", nullable = false, length = 200)
    private String nome;

    @Builder.Default
    @Column(name = "ativo", nullable = false)
    private boolean ativo = true;

}
