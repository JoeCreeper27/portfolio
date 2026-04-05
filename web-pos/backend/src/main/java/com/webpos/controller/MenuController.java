package com.webpos.controller;

import com.webpos.dto.CategoryRequest;
import com.webpos.dto.MenuItemRequest;
import com.webpos.dto.ModifierRequest;
import com.webpos.entity.Category;
import com.webpos.entity.MenuItem;
import com.webpos.entity.Modifier;
import com.webpos.service.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    // ── Categories ───────────────────────────────────────────────────────────

    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getCategories(@RequestAttribute("storeId") UUID storeId) {
        return ResponseEntity.ok(menuService.getCategories(storeId));
    }

    @PostMapping("/categories")
    public ResponseEntity<Category> createCategory(
            @RequestAttribute("storeId") UUID storeId,
            @Valid @RequestBody CategoryRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuService.createCategory(storeId, req));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<Category> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody CategoryRequest req) {
        return ResponseEntity.ok(menuService.updateCategory(id, req));
    }

    @DeleteMapping("/categories/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable UUID id) {
        menuService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }

    // ── Menu Items ────────────────────────────────────────────────────────────

    @GetMapping("/items")
    public ResponseEntity<List<MenuItem>> getMenuItems(
            @RequestAttribute("storeId") UUID storeId,
            @RequestParam(required = false) UUID categoryId) {
        return ResponseEntity.ok(menuService.getItems(storeId, categoryId));
    }

    @PostMapping("/items")
    public ResponseEntity<MenuItem> createMenuItem(
            @RequestAttribute("storeId") UUID storeId,
            @Valid @RequestBody MenuItemRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuService.createItem(storeId, req));
    }

    @PutMapping("/items/{id}")
    public ResponseEntity<MenuItem> updateMenuItem(
            @PathVariable UUID id,
            @Valid @RequestBody MenuItemRequest req) {
        return ResponseEntity.ok(menuService.updateItem(id, req));
    }

    @DeleteMapping("/items/{id}")
    public ResponseEntity<Void> deleteMenuItem(@PathVariable UUID id) {
        menuService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }

    // ── Modifiers ─────────────────────────────────────────────────────────────

    @GetMapping("/items/{id}/modifiers")
    public ResponseEntity<List<Modifier>> getModifiers(@PathVariable UUID id) {
        return ResponseEntity.ok(menuService.getModifiers(id));
    }

    @PostMapping("/items/{id}/modifiers")
    public ResponseEntity<Modifier> createModifier(
            @PathVariable UUID id,
            @Valid @RequestBody ModifierRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(menuService.createModifier(id, req));
    }

    @DeleteMapping("/modifiers/{id}")
    public ResponseEntity<Void> deleteModifier(@PathVariable UUID id) {
        menuService.deleteModifier(id);
        return ResponseEntity.noContent().build();
    }
}
