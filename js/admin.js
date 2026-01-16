// Admin panel functionality
class AdminPanel {
    constructor() {
        this.currentSection = 'drugs';
        this.editingItem = null;
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupEventListeners();
        this.loadDashboard();
        this.showSection('drugs');
    }

    setupNavigation() {
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                this.showSection(section);
            });
        });
    }

    setupEventListeners() {
        // Action buttons
        document.getElementById('add-drug-btn').addEventListener('click', () => this.showDrugModal());
        document.getElementById('add-interaction-btn').addEventListener('click', () => this.showInteractionModal());
        document.getElementById('add-category-btn').addEventListener('click', () => this.showCategoryModal());
        
        // Admin actions
        document.getElementById('export-data').addEventListener('click', () => DrugInteractionDB.exportData());
        document.getElementById('import-data').addEventListener('click', () => this.handleImport());
        document.getElementById('reset-data').addEventListener('click', () => this.confirmReset());
        
        // Search/filter
        document.getElementById('drug-search-admin').addEventListener('input', 
            Utils.debounce(() => this.filterDrugs(), 300));
        
        // Modal
        document.querySelector('.close-modal').addEventListener('click', () => this.hideModal());
        document.querySelector('.cancel-btn').addEventListener('click', () => this.hideModal());
        document.querySelector('.save-btn').addEventListener('click', () => this.saveItem());
    }

    showSection(section) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.section === section);
        });
        
        // Show selected section
        document.querySelectorAll('.management-section').forEach(sec => {
            sec.classList.toggle('active', sec.id === `${section}-section`);
        });
        
        this.currentSection = section;
        
        // Load section data
        switch(section) {
            case 'drugs':
                this.loadDrugs();
                break;
            case 'interactions':
                this.loadInteractions();
                break;
            case 'categories':
                this.loadCategories();
                break;
            case 'severity':
                this.loadSeverityLevels();
                break;
        }
    }

    loadDashboard() {
        const drugs = DrugInteractionDB.getDrugs();
        const interactions = DrugInteractionDB.getInteractions();
        const categories = DrugInteractionDB.getCategories();
        
        document.getElementById('stat-drugs').textContent = drugs.length;
        document.getElementById('stat-interactions').textContent = interactions.length;
        document.getElementById('stat-categories').textContent = categories.length;
    }

    loadDrugs() {
        const drugs = DrugInteractionDB.getDrugs();
        const tbody = document.getElementById('drugs-list');
        tbody.innerHTML = '';
        
        drugs.forEach(drug => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${drug.id}</td>
                <td><strong>${drug.name}</strong></td>
                <td>${drug.genericName || '-'}</td>
                <td>${Utils.getCategoryName(drug.category)}</td>
                <td><span class="status-badge ${drug.status}">${drug.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-edit" onclick="adminPanel.editDrug('${drug.id}')">Edit</button>
                        <button class="btn-small btn-delete" onclick="adminPanel.deleteDrug('${drug.id}')">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Populate category filter
        this.populateCategoryFilter();
    }

    populateCategoryFilter() {
        const select = document.getElementById('category-filter');
        const categories = DrugInteractionDB.getCategories();
        
        // Clear existing options (keep first)
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    }

    filterDrugs() {
        const searchTerm = document.getElementById('drug-search-admin').value.toLowerCase();
        const categoryFilter = document.getElementById('category-filter').value;
        
        const drugs = DrugInteractionDB.getDrugs();
        const filtered = drugs.filter(drug => {
            const matchesSearch = drug.name.toLowerCase().includes(searchTerm) ||
                                  drug.genericName.toLowerCase().includes(searchTerm);
            const matchesCategory = !categoryFilter || drug.category === categoryFilter;
            return matchesSearch && matchesCategory;
        });
        
        const tbody = document.getElementById('drugs-list');
        tbody.innerHTML = '';
        
        filtered.forEach(drug => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${drug.id}</td>
                <td><strong>${drug.name}</strong></td>
                <td>${drug.genericName || '-'}</td>
                <td>${Utils.getCategoryName(drug.category)}</td>
                <td><span class="status-badge ${drug.status}">${drug.status}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-small btn-edit" onclick="adminPanel.editDrug('${drug.id}')">Edit</button>
                        <button class="btn-small btn-delete" onclick="adminPanel.deleteDrug('${drug.id}')">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    loadInteractions() {
        const interactions = DrugInteractionDB.getInteractions();
        const tbody = document.getElementById('interactions-list');
        tbody.innerHTML = '';
        
        // Populate drug selects
        this.populateDrugSelects();
        
        interactions.forEach(interaction => {
            const drugA = DrugInteractionDB.getDrugById(interaction.drugAId);
            const drugB = DrugInteractionDB.getDrugById(interaction.drugBId);
            const severityName = Utils.getSeverityName(interaction.severity);
            
            if (drugA && drugB) {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${drugA.name}</strong></td>
                    <td><strong>${drugB.name}</strong></td>
                    <td><span class="severity-badge">${severityName}</span></td>
                    <td>${interaction.description.substring(0, 100)}...</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-small btn-edit" onclick="adminPanel.editInteraction('${interaction.id}')">Edit</button>
                            <button class="btn-small btn-delete" onclick="adminPanel.deleteInteraction('${interaction.id}')">Delete</button>
                        </div>
                    </td>
                `;
                tbody.appendChild(row);
            }
        });
    }

    populateDrugSelects() {
        const select1 = document.getElementById('interaction-drug1');
        const select2 = document.getElementById('interaction-drug2');
        const severityFilter = document.getElementById('severity-filter');
        
        const drugs = DrugInteractionDB.getDrugs();
        const severityLevels = DrugInteractionDB.getSeverityLevels();
        
        // Clear and populate drug selects
        [select1, select2].forEach(select => {
            while (select.options.length > 1) {
                select.remove(1);
            }
            
            drugs.forEach(drug => {
                const option = document.createElement('option');
                option.value = drug.id;
                option.textContent = `${drug.name} (${drug.genericName || 'Generic'})`;
                select.appendChild(option);
            });
        });
        
        // Populate severity filter
        while (severityFilter.options.length > 1) {
            severityFilter.remove(1);
        }
        
        severityLevels.forEach(level => {
            const option = document.createElement('option');
            option.value = level.id;
            option.textContent = level.name;
            severityFilter.appendChild(option);
        });
    }

    loadCategories() {
        const categories = DrugInteractionDB.getCategories();
        const container = document.getElementById('categories-list');
        container.innerHTML = '';
        
        categories.forEach(category => {
            const card = document.createElement('div');
            card.className = 'category-card';
            card.innerHTML = `
                <div class="category-header">
                    <h4>${category.name}</h4>
                    <span class="category-count">${DrugInteractionDB.getDrugs().filter(d => d.category === category.id).length}</span>
                </div>
                <p class="category-desc">${category.description}</p>
                <div class="category-actions">
                    <button class="btn-small btn-edit" onclick="adminPanel.editCategory('${category.id}')">Edit</button>
                    <button class="btn-small btn-delete" onclick="adminPanel.deleteCategory('${category.id}')">Delete</button>
                </div>
            `;
            container.appendChild(card);
        });
    }

    loadSeverityLevels() {
        const severityLevels = DrugInteractionDB.getSeverityLevels();
        const container = document.getElementById('severity-levels');
        container.innerHTML = '';
        
        severityLevels.forEach(level => {
            const card = document.createElement('div');
            card.className = 'severity-level';
            card.innerHTML = `
                <div class="severity-label" style="background: ${level.color}20; color: ${level.color};">
                    ${level.name}
                </div>
                <p class="severity-description">${level.description}</p>
                <div class="severity-stats">
                    <small>Interactions: ${DrugInteractionDB.getInteractions().filter(i => i.severity === level.id).length}</small>
                </div>
            `;
            container.appendChild(card);
        });
    }

    showDrugModal(drugId = null) {
        this.editingItem = drugId ? DrugInteractionDB.getDrugById(drugId) : null;
        
        const modalTitle = document.getElementById('modal-title');
        modalTitle.textContent = this.editingItem ? 'Edit Drug' : 'Add New Drug';
        
        const categories = DrugInteractionDB.getCategories();
        
        const formHTML = `
            <div class="form-group">
                <label for="drug-name">Drug Name *</label>
                <input type="text" id="drug-name" class="form-control" value="${this.editingItem ? this.editingItem.name : ''}" required>
            </div>
            <div class="form-group">
                <label for="drug-generic">Generic Name</label>
                <input type="text" id="drug-generic" class="form-control" value="${this.editingItem ? this.editingItem.genericName : ''}">
            </div>
            <div class="form-group">
                <label for="drug-category">Category</label>
                <select id="drug-category" class="form-control">
                    <option value="">Select Category</option>
                    ${categories.map(cat => `
                        <option value="${cat.id}" ${this.editingItem && this.editingItem.category === cat.id ? 'selected' : ''}>
                            ${cat.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="drug-description">Description</label>
                <textarea id="drug-description" class="form-control" rows="3">${this.editingItem ? this.editingItem.description : ''}</textarea>
            </div>
            <div class="form-group">
                <label for="drug-warnings">Warnings</label>
                <textarea id="drug-warnings" class="form-control" rows="3">${this.editingItem ? this.editingItem.warnings : ''}</textarea>
            </div>
            <div class="form-group">
                <label for="drug-status">Status</label>
                <select id="drug-status" class="form-control">
                    <option value="active" ${this.editingItem && this.editingItem.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="inactive" ${this.editingItem && this.editingItem.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                </select>
            </div>
        `;
        
        document.getElementById('modal-body').innerHTML = formHTML;
        document.getElementById('modal').classList.remove('hidden');
    }

    showInteractionModal(interactionId = null) {
        this.editingItem = interactionId ? DrugInteractionDB.getInteractions().find(i => i.id === interactionId) : null;
        
        const modalTitle = document.getElementById('modal-title');
        modalTitle.textContent = this.editingItem ? 'Edit Interaction' : 'Add New Interaction';
        
        const drugs = DrugInteractionDB.getDrugs();
        const severityLevels = DrugInteractionDB.getSeverityLevels();
        
        const formHTML = `
            <div class="form-group">
                <label for="interaction-drug1">First Drug *</label>
                <select id="interaction-drug1" class="form-control" required>
                    <option value="">Select First Drug</option>
                    ${drugs.map(drug => `
                        <option value="${drug.id}" ${this.editingItem && this.editingItem.drugAId === drug.id ? 'selected' : ''}>
                            ${drug.name} (${drug.genericName || 'Generic'})
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="interaction-drug2">Second Drug *</label>
                <select id="interaction-drug2" class="form-control" required>
                    <option value="">Select Second Drug</option>
                    ${drugs.map(drug => `
                        <option value="${drug.id}" ${this.editingItem && this.editingItem.drugBId === drug.id ? 'selected' : ''}>
                            ${drug.name} (${drug.genericName || 'Generic'})
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="interaction-severity">Severity Level *</label>
                <select id="interaction-severity" class="form-control" required>
                    <option value="">Select Severity</option>
                    ${severityLevels.map(level => `
                        <option value="${level.id}" ${this.editingItem && this.editingItem.severity === level.id ? 'selected' : ''}>
                            ${level.name}
                        </option>
                    `).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="interaction-description">Description *</label>
                <textarea id="interaction-description" class="form-control" rows="3" required>${this.editingItem ? this.editingItem.description : ''}</textarea>
            </div>
            <div class="form-group">
                <label for="interaction-mechanism">Mechanism of Interaction</label>
                <textarea id="interaction-mechanism" class="form-control" rows="2">${this.editingItem ? this.editingItem.mechanism : ''}</textarea>
            </div>
            <div class="form-group">
                <label for="interaction-recommendations">Recommendations</label>
                <textarea id="interaction-recommendations" class="form-control" rows="2">${this.editingItem ? this.editingItem.recommendations : ''}</textarea>
            </div>
        `;
        
        document.getElementById('modal-body').innerHTML = formHTML;
        document.getElementById('modal').classList.remove('hidden');
    }

    showCategoryModal(categoryId = null) {
        this.editingItem = categoryId ? DrugInteractionDB.getCategories().find(c => c.id === categoryId) : null;
        
        const modalTitle = document.getElementById('modal-title');
        modalTitle.textContent = this.editingItem ? 'Edit Category' : 'Add New Category';
        
        const formHTML = `
            <div class="form-group">
                <label for="category-name">Category Name *</label>
                <input type="text" id="category-name" class="form-control" value="${this.editingItem ? this.editingItem.name : ''}" required>
            </div>
            <div class="form-group">
                <label for="category-description">Description</label>
                <textarea id="category-description" class="form-control" rows="3">${this.editingItem ? this.editingItem.description : ''}</textarea>
            </div>
        `;
        
        document.getElementById('modal-body').innerHTML = formHTML;
        document.getElementById('modal').classList.remove('hidden');
    }

    saveItem() {
        switch(this.currentSection) {
            case 'drugs':
                this.saveDrug();
                break;
            case 'interactions':
                this.saveInteraction();
                break;
            case 'categories':
                this.saveCategory();
                break;
        }
    }

    saveDrug() {
        const drugData = {
            name: document.getElementById('drug-name').value.trim(),
            genericName: document.getElementById('drug-generic').value.trim(),
            category: document.getElementById('drug-category').value,
            description: document.getElementById('drug-description').value.trim(),
            warnings: document.getElementById('drug-warnings').value.trim(),
            status: document.getElementById('drug-status').value
        };

        const validation = Utils.validateDrug(drugData);
        if (!validation.valid) {
            Utils.showNotification(validation.message, 'error');
            return;
        }

        let success = false;
        if (this.editingItem) {
            success = DrugInteractionDB.updateDrug(this.editingItem.id, drugData);
        } else {
            success = DrugInteractionDB.addDrug(drugData);
        }

        if (success) {
            Utils.showNotification(`Drug ${this.editingItem ? 'updated' : 'added'} successfully`, 'success');
            this.hideModal();
            this.loadDrugs();
            this.loadDashboard();
        } else {
            Utils.showNotification('Failed to save drug', 'error');
        }
    }

    saveInteraction() {
        const interactionData = {
            drugAId: document.getElementById('interaction-drug1').value,
            drugBId: document.getElementById('interaction-drug2').value,
            severity: document.getElementById('interaction-severity').value,
            description: document.getElementById('interaction-description').value.trim(),
            mechanism: document.getElementById('interaction-mechanism').value.trim(),
            recommendations: document.getElementById('interaction-recommendations').value.trim()
        };

        const validation = Utils.validateInteraction(interactionData);
        if (!validation.valid) {
            Utils.showNotification(validation.message, 'error');
            return;
        }

        let success = false;
        if (this.editingItem) {
            success = DrugInteractionDB.updateInteraction(this.editingItem.id, interactionData);
        } else {
            success = DrugInteractionDB.addInteraction(interactionData);
        }

        if (success) {
            Utils.showNotification(`Interaction ${this.editingItem ? 'updated' : 'added'} successfully`, 'success');
            this.hideModal();
            this.loadInteractions();
            this.loadDashboard();
        } else {
            Utils.showNotification('Failed to save interaction', 'error');
        }
    }

    saveCategory() {
        const categoryName = document.getElementById('category-name').value.trim();
        const description = document.getElementById('category-description').value.trim();

        if (!categoryName) {
            Utils.showNotification('Category name is required', 'error');
            return;
        }

        const categories = DrugInteractionDB.getCategories();
        
        if (this.editingItem) {
            // Update existing category
            const index = categories.findIndex(c => c.id === this.editingItem.id);
            if (index !== -1) {
                categories[index] = {
                    ...categories[index],
                    name: categoryName,
                    description: description
                };
                DrugInteractionDB.updateCollection('categories', categories);
                Utils.showNotification('Category updated successfully', 'success');
            }
        } else {
            // Add new category
            const newCategory = {
                id: DrugInteractionDB.generateId('CAT'),
                name: categoryName,
                description: description
            };
            categories.push(newCategory);
            DrugInteractionDB.updateCollection('categories', categories);
            Utils.showNotification('Category added successfully', 'success');
        }

        this.hideModal();
        this.loadCategories();
        this.loadDashboard();
        this.populateCategoryFilter();
    }

    hideModal() {
        document.getElementById('modal').classList.add('hidden');
        this.editingItem = null;
    }

    editDrug(drugId) {
        this.showDrugModal(drugId);
    }

    deleteDrug(drugId) {
        if (confirm('Are you sure you want to delete this drug? This will also delete all associated interactions.')) {
            if (DrugInteractionDB.deleteDrug(drugId)) {
                Utils.showNotification('Drug deleted successfully', 'success');
                this.loadDrugs();
                this.loadDashboard();
            }
        }
    }

    editInteraction(interactionId) {
        this.showInteractionModal(interactionId);
    }

    deleteInteraction(interactionId) {
        if (confirm('Are you sure you want to delete this interaction?')) {
            if (DrugInteractionDB.deleteInteraction(interactionId)) {
                Utils.showNotification('Interaction deleted successfully', 'success');
                this.loadInteractions();
                this.loadDashboard();
            }
        }
    }

    editCategory(categoryId) {
        this.showCategoryModal(categoryId);
    }

    deleteCategory(categoryId) {
        if (confirm('Are you sure you want to delete this category? Drugs in this category will become uncategorized.')) {
            const categories = DrugInteractionDB.getCategories();
            const filtered = categories.filter(c => c.id !== categoryId);
            DrugInteractionDB.updateCollection('categories', filtered);
            
            // Update drugs that had this category
            const drugs = DrugInteractionDB.getDrugs();
            const updatedDrugs = drugs.map(drug => {
                if (drug.category === categoryId) {
                    return { ...drug, category: '' };
                }
                return drug;
            });
            DrugInteractionDB.updateCollection('drugs', updatedDrugs);
            
            Utils.showNotification('Category deleted successfully', 'success');
            this.loadCategories();
            this.loadDashboard();
            this.populateCategoryFilter();
        }
    }

    handleImport() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();
            
            reader.onload = (event) => {
                if (confirm('Importing data will replace all existing data. Continue?')) {
                    if (DrugInteractionDB.importData(event.target.result)) {
                        Utils.showNotification('Data imported successfully', 'success');
                        this.loadDashboard();
                        this.showSection(this.currentSection);
                    } else {
                        Utils.showNotification('Failed to import data. Invalid format.', 'error');
                    }
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    confirmReset() {
        if (confirm('WARNING: This will reset ALL data to default values. This action cannot be undone. Continue?')) {
            if (DrugInteractionDB.resetData()) {
                Utils.showNotification('Data reset to default values', 'success');
                this.loadDashboard();
                this.showSection(this.currentSection);
            }
        }
    }
}

// Initialize admin panel
const adminPanel = new AdminPanel();