package uth.edu.github.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uth.edu.github.model.GlobalSetting;
import uth.edu.github.repository.GlobalSettingRepo;

@RestController
@RequestMapping("/api/github/settings")
@RequiredArgsConstructor
public class GlobalSettingController {

    private final GlobalSettingRepo repo;

    @GetMapping
    public ResponseEntity<?> getSettings() {
        return ResponseEntity.ok(repo.findAll().stream().findFirst().orElse(new GlobalSetting()));
    }

    @PostMapping
    public ResponseEntity<?> saveSettings(@RequestBody GlobalSetting settings) {
        GlobalSetting existing = repo.findAll().stream().findFirst().orElse(null);
        if (existing != null) {
            settings.setId(existing.getId());
        }
        return ResponseEntity.ok(repo.save(settings));
    }
}
