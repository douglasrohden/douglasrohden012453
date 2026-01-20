package com.douglasrohden.backend.controller;

import com.douglasrohden.backend.model.Album;
import com.douglasrohden.backend.repository.AlbumRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/v1/albuns")
public class AlbumController {
    @Autowired
    private AlbumRepository albumRepository;

    @GetMapping
    public List<Album> getAllAlbuns() {
        return albumRepository.findAll();
    }
}
