package com.webpos.service;

import com.webpos.dto.CategoryRequest;
import com.webpos.dto.MenuItemRequest;
import com.webpos.dto.ModifierRequest;
import com.webpos.entity.Category;
import com.webpos.entity.MenuItem;
import com.webpos.entity.Modifier;
import com.webpos.entity.ModifierOption;
import com.webpos.enums.MenuItemStatus;
import com.webpos.exception.ResourceNotFoundException;
import com.webpos.repository.CategoryRepository;
import com.webpos.repository.MenuItemRepository;
import com.webpos.repository.ModifierOptionRepository;
import com.webpos.repository.ModifierRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MenuService {

    private final CategoryRepository categoryRepository;
    private final MenuItemRepository menuItemRepository;
    private final ModifierRepository modifierRepository;
    private final ModifierOptionRepository modifierOptionRepository;

    // -------------------------------------------------------------------------
    // Category operations
    // -------------------------------------------------------------------------

    public List<Category> getCategories(UUID storeId) {
        return categoryRepository.findByStoreIdOrderBySortOrder(storeId);
    }

    @Transactional
    public Category createCategory(UUID storeId, CategoryRequest request) {
        Category category = Category.builder()
                .storeId(storeId)
                .name(request.getName())
                .sortOrder(request.getSortOrder())
                .isVisible(request.isVisible())
                .build();
        return categoryRepository.save(category);
    }

    @Transactional
    public Category updateCategory(UUID categoryId, CategoryRequest request) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category", categoryId));
        category.setName(request.getName());
        category.setSortOrder(request.getSortOrder());
        category.setVisible(request.isVisible());
        return categoryRepository.save(category);
    }

    @Transactional
    public void deleteCategory(UUID categoryId) {
        if (!categoryRepository.existsById(categoryId)) {
            throw new ResourceNotFoundException("Category", categoryId);
        }
        categoryRepository.deleteById(categoryId);
    }

    // -------------------------------------------------------------------------
    // Menu item operations
    // -------------------------------------------------------------------------

    public List<MenuItem> getItems(UUID storeId, UUID categoryId) {
        if (categoryId != null) {
            return menuItemRepository.findByStoreIdAndCategoryId(storeId, categoryId);
        }
        return menuItemRepository.findByStoreId(storeId);
    }

    @Transactional
    public MenuItem createItem(UUID storeId, MenuItemRequest request) {
        MenuItem item = MenuItem.builder()
                .storeId(storeId)
                .categoryId(request.getCategoryId())
                .name(request.getName())
                .price(request.getPrice())
                .cost(request.getCost())
                .imageUrl(request.getImageUrl())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : MenuItemStatus.ACTIVE)
                .sortOrder(request.getSortOrder())
                .build();
        return menuItemRepository.save(item);
    }

    @Transactional
    public MenuItem updateItem(UUID itemId, MenuItemRequest request) {
        MenuItem item = menuItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", itemId));
        item.setCategoryId(request.getCategoryId());
        item.setName(request.getName());
        item.setPrice(request.getPrice());
        item.setCost(request.getCost());
        item.setImageUrl(request.getImageUrl());
        item.setDescription(request.getDescription());
        if (request.getStatus() != null) {
            item.setStatus(request.getStatus());
        }
        item.setSortOrder(request.getSortOrder());
        return menuItemRepository.save(item);
    }

    @Transactional
    public void deleteItem(UUID itemId) {
        if (!menuItemRepository.existsById(itemId)) {
            throw new ResourceNotFoundException("MenuItem", itemId);
        }
        menuItemRepository.deleteById(itemId);
    }

    public MenuItem getItem(UUID itemId) {
        return menuItemRepository.findById(itemId)
                .orElseThrow(() -> new ResourceNotFoundException("MenuItem", itemId));
    }

    // -------------------------------------------------------------------------
    // Modifier operations
    // -------------------------------------------------------------------------

    public List<Modifier> getModifiers(UUID menuItemId) {
        return modifierRepository.findByMenuItemIdOrderBySortOrderAsc(menuItemId);
    }

    @Transactional
    public Modifier createModifier(UUID menuItemId, ModifierRequest req) {
        if (!menuItemRepository.existsById(menuItemId)) {
            throw new ResourceNotFoundException("MenuItem", menuItemId);
        }
        Modifier modifier = new Modifier();
        modifier.setMenuItemId(menuItemId);
        modifier.setName(req.getName());
        modifier.setRequired(req.isRequired());
        modifier.setMultiple(req.isMultiple());
        modifier.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        modifier = modifierRepository.save(modifier);

        if (req.getOptions() != null) {
            int order = 0;
            for (ModifierRequest.OptionItem opt : req.getOptions()) {
                ModifierOption option = new ModifierOption();
                option.setModifierId(modifier.getId());
                option.setName(opt.getName());
                option.setAdditionalPrice(opt.getAdditionalPrice());
                option.setSortOrder(opt.getSortOrder() != null ? opt.getSortOrder() : order++);
                modifierOptionRepository.save(option);
            }
        }
        return modifier;
    }

    @Transactional
    public void deleteModifier(UUID modifierId) {
        if (!modifierRepository.existsById(modifierId)) {
            throw new ResourceNotFoundException("Modifier", modifierId);
        }
        modifierOptionRepository.deleteByModifierId(modifierId);
        modifierRepository.deleteById(modifierId);
    }
}
