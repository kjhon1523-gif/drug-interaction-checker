// Public search page functionality
class DrugSearch {
    constructor() {
        this.selectedDrugs = [];
        this.searchInput = document.getElementById('drug-search');
        this.searchResults = document.getElementById('search-results');
        this.drugList = document.getElementById('drug-list');
        this.addDrugBtn = document.getElementById('add-drug');
        this.checkInteractionsBtn = document.getElementById('check-interactions');
        this.clearAllBtn = document.getElementById('clear-all');
        this.resultsSection = document.getElementById('results-section');
        this.interactionResults = document.getElementById('interaction-results');

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateSelectedDrugsDisplay();
    }

    setupEventListeners() {
        // Search input with debounce
        this.searchInput.addEventListener('input', Utils.debounce(() => {
            this.handleSearch();
        }, 300));

        // Add drug button
        this.addDrugBtn.addEventListener('click', () => {
            this.addSelectedDrug();
        });

        // Check interactions button
        this.checkInteractionsBtn.addEventListener('click', () => {
            this.checkInteractions();
        });

        // Clear all button
        this.clearAllBtn.addEventListener('click', () => {
            this.clearAllDrugs();
        });

        // Allow pressing Enter to add drug
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addSelectedDrug();
            }
        });
    }

    handleSearch() {
        const query = this.searchInput.value.trim();
        if (query.length < 2) {
            this.searchResults.style.display = 'none';
            return;
        }

        const results = DrugInteractionDB.searchDrugs(query);
        this.displaySearchResults(results);
    }

    displaySearchResults(results) {
        this.searchResults.innerHTML = '';
        
        if (results.length === 0) {
            this.searchResults.style.display = 'block';
            this.searchResults.innerHTML = '<div class="search-result-item">No drugs found</div>';
            return;
        }

        results.forEach(drug => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            item.innerHTML = `
                <strong>${drug.name}</strong>
                ${drug.genericName ? `<br><small>${drug.genericName}</small>` : ''}
            `;
            item.addEventListener('click', () => {
                this.searchInput.value = drug.name;
                this.searchResults.style.display = 'none';
                this.addDrugFromSearch(drug);
            });
            this.searchResults.appendChild(item);
        });

        this.searchResults.style.display = 'block';
    }

    addSelectedDrug() {
        const query = this.searchInput.value.trim();
        if (!query) {
            Utils.showNotification('Please enter a drug name', 'error');
            return;
        }

        const drug = DrugInteractionDB.getDrugByName(query);
        if (drug) {
            this.addDrugFromSearch(drug);
        } else {
            Utils.showNotification(`Drug "${query}" not found in database`, 'error');
        }
    }

    addDrugFromSearch(drug) {
        // Check if already selected
        if (this.selectedDrugs.find(d => d.id === drug.id)) {
            Utils.showNotification(`${drug.name} is already in the list`, 'error');
            return;
        }

        this.selectedDrugs.push(drug);
        this.updateSelectedDrugsDisplay();
        this.searchInput.value = '';
        this.searchResults.style.display = 'none';
        
        Utils.showNotification(`${drug.name} added to list`, 'success');
    }

    updateSelectedDrugsDisplay() {
        this.drugList.innerHTML = '';
        
        this.selectedDrugs.forEach((drug, index) => {
            const tag = document.createElement('div');
            tag.className = 'drug-tag';
            tag.innerHTML = `
                ${drug.name}
                <button class="remove-drug" data-index="${index}">&times;</button>
            `;
            
            const removeBtn = tag.querySelector('.remove-drug');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeDrug(index);
            });
            
            this.drugList.appendChild(tag);
        });

        // Update count
        const countElement = document.querySelector('#selected-drugs h3');
        countElement.textContent = `Selected Drugs (${this.selectedDrugs.length})`;

        // Enable/disable check button
        this.checkInteractionsBtn.disabled = this.selectedDrugs.length < 2;
    }

    removeDrug(index) {
        const removedDrug = this.selectedDrugs[index];
        this.selectedDrugs.splice(index, 1);
        this.updateSelectedDrugsDisplay();
        Utils.showNotification(`${removedDrug.name} removed from list`, 'info');
    }

    clearAllDrugs() {
        if (this.selectedDrugs.length === 0) return;
        
        this.selectedDrugs = [];
        this.updateSelectedDrugsDisplay();
        this.resultsSection.classList.add('hidden');
        Utils.showNotification('All drugs cleared', 'info');
    }

    checkInteractions() {
        if (this.selectedDrugs.length < 2) {
            Utils.showNotification('Please select at least 2 drugs', 'error');
            return;
        }

        const drugIds = this.selectedDrugs.map(drug => drug.id);
        const interactions = DrugInteractionDB.getInteractionsForDrugs(drugIds);
        
        this.displayInteractionResults(interactions);
    }

    displayInteractionResults(interactions) {
        this.interactionResults.innerHTML = '';
        
        if (interactions.length === 0) {
            this.interactionResults.innerHTML = `
                <div class="no-interactions">
                    <h3>No Interactions Found</h3>
                    <p>No known interactions between the selected drugs were found in our database.</p>
                    <p class="note">Note: This doesn't guarantee safety. Always consult with healthcare professionals.</p>
                </div>
            `;
        } else {
            interactions.forEach(interaction => {
                const drugA = DrugInteractionDB.getDrugById(interaction.drugAId);
                const drugB = DrugInteractionDB.getDrugById(interaction.drugBId);
                
                const severityName = Utils.getSeverityName(interaction.severity);
                const severityClass = severityName.toLowerCase();
                
                const result = document.createElement('div');
                result.className = `interaction-result ${severityClass}`;
                result.innerHTML = `
                    <div class="severity-badge severity-${severityClass}">${severityName}</div>
                    <h4>${drugA.name} + ${drugB.name}</h4>
                    <p class="interaction-desc">${interaction.description}</p>
                    ${interaction.mechanism ? `<p><strong>Mechanism:</strong> ${interaction.mechanism}</p>` : ''}
                    ${interaction.recommendations ? `<p><strong>Recommendation:</strong> ${interaction.recommendations}</p>` : ''}
                `;
                
                this.interactionResults.appendChild(result);
            });
        }

        this.resultsSection.classList.remove('hidden');
        window.scrollTo({
            top: this.resultsSection.offsetTop - 20,
            behavior: 'smooth'
        });
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    new DrugSearch();
});