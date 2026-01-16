// Database structure and initialization
const DrugInteractionDB = {
    // Initialize database
    init: function() {
        if (!localStorage.getItem('drugInteractionDB')) {
            const defaultData = {
                drugs: [],
                interactions: [],
                categories: [
                    { id: 'CAT001', name: 'Antibiotics', description: 'Anti-bacterial medications' },
                    { id: 'CAT002', name: 'Analgesics', description: 'Pain relief medications' },
                    { id: 'CAT003', name: 'Antidepressants', description: 'Mood disorder medications' },
                    { id: 'CAT004', name: 'Antihypertensives', description: 'Blood pressure medications' },
                    { id: 'CAT005', name: 'Anticoagulants', description: 'Blood thinners' }
                ],
                severityLevels: [
                    { id: 'SEV001', name: 'Serious', color: '#e53e3e', description: 'Potentially life-threatening' },
                    { id: 'SEV002', name: 'Moderate', color: '#d69e2e', description: 'Requires monitoring' },
                    { id: 'SEV003', name: 'Minor', color: '#38a169', description: 'Minimal clinical significance' }
                ]
            };
            this.save(defaultData);
        }
    },

    // Save data to localStorage
    save: function(data) {
        localStorage.setItem('drugInteractionDB', JSON.stringify(data));
    },

    // Get all data
    getAll: function() {
        const data = localStorage.getItem('drugInteractionDB');
        return data ? JSON.parse(data) : null;
    },

    // Get specific collection
    getCollection: function(collectionName) {
        const data = this.getAll();
        return data ? data[collectionName] : [];
    },

    // Update collection
    updateCollection: function(collectionName, items) {
        const data = this.getAll();
        if (data) {
            data[collectionName] = items;
            this.save(data);
        }
    },

    // Generate ID
    generateId: function(prefix = 'DRG') {
        return prefix + Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Drug methods
    getDrugs: function() {
        return this.getCollection('drugs');
    },

    getDrugById: function(id) {
        const drugs = this.getDrugs();
        return drugs.find(drug => drug.id === id);
    },

    getDrugByName: function(name) {
        const drugs = this.getDrugs();
        return drugs.find(drug => 
            drug.name.toLowerCase() === name.toLowerCase() ||
            drug.genericName.toLowerCase() === name.toLowerCase()
        );
    },

    searchDrugs: function(query) {
        const drugs = this.getDrugs();
        const searchTerm = query.toLowerCase();
        return drugs.filter(drug =>
            drug.name.toLowerCase().includes(searchTerm) ||
            drug.genericName.toLowerCase().includes(searchTerm)
        );
    },

    addDrug: function(drug) {
        const drugs = this.getDrugs();
        drugs.push({
            id: this.generateId('DRG'),
            name: drug.name,
            genericName: drug.genericName || '',
            category: drug.category || '',
            description: drug.description || '',
            warnings: drug.warnings || '',
            status: 'active',
            createdAt: new Date().toISOString()
        });
        this.updateCollection('drugs', drugs);
        return true;
    },

    updateDrug: function(id, updates) {
        const drugs = this.getDrugs();
        const index = drugs.findIndex(drug => drug.id === id);
        if (index !== -1) {
            drugs[index] = { ...drugs[index], ...updates, updatedAt: new Date().toISOString() };
            this.updateCollection('drugs', drugs);
            return true;
        }
        return false;
    },

    deleteDrug: function(id) {
        const drugs = this.getDrugs();
        const filtered = drugs.filter(drug => drug.id !== id);
        this.updateCollection('drugs', filtered);
        
        // Also remove any interactions involving this drug
        const interactions = this.getInteractions();
        const filteredInteractions = interactions.filter(interaction =>
            interaction.drugAId !== id && interaction.drugBId !== id
        );
        this.updateCollection('interactions', filteredInteractions);
        
        return true;
    },

    // Interaction methods
    getInteractions: function() {
        return this.getCollection('interactions');
    },

    getInteractionBetween: function(drugAId, drugBId) {
        const interactions = this.getInteractions();
        return interactions.find(interaction =>
            (interaction.drugAId === drugAId && interaction.drugBId === drugBId) ||
            (interaction.drugAId === drugBId && interaction.drugBId === drugAId)
        );
    },

    getInteractionsForDrugs: function(drugIds) {
        const interactions = this.getInteractions();
        return interactions.filter(interaction =>
            drugIds.includes(interaction.drugAId) && drugIds.includes(interaction.drugBId)
        );
    },

    addInteraction: function(interaction) {
        const interactions = this.getInteractions();
        interactions.push({
            id: this.generateId('INT'),
            drugAId: interaction.drugAId,
            drugBId: interaction.drugBId,
            severity: interaction.severity,
            description: interaction.description,
            mechanism: interaction.mechanism || '',
            recommendations: interaction.recommendations || '',
            createdAt: new Date().toISOString()
        });
        this.updateCollection('interactions', interactions);
        return true;
    },

    updateInteraction: function(id, updates) {
        const interactions = this.getInteractions();
        const index = interactions.findIndex(interaction => interaction.id === id);
        if (index !== -1) {
            interactions[index] = { ...interactions[index], ...updates, updatedAt: new Date().toISOString() };
            this.updateCollection('interactions', interactions);
            return true;
        }
        return false;
    },

    deleteInteraction: function(id) {
        const interactions = this.getInteractions();
        const filtered = interactions.filter(interaction => interaction.id !== id);
        this.updateCollection('interactions', filtered);
        return true;
    },

    // Category methods
    getCategories: function() {
        return this.getCollection('categories');
    },

    // Severity methods
    getSeverityLevels: function() {
        return this.getCollection('severityLevels');
    },

    // Export/Import
    exportData: function() {
        const data = this.getAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'drug-interaction-database.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    importData: function(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            // Validate structure
            if (data.drugs && data.interactions && data.categories && data.severityLevels) {
                this.save(data);
                return true;
            }
        } catch (error) {
            console.error('Invalid data format:', error);
        }
        return false;
    },

    // Reset to default
    resetData: function() {
        localStorage.removeItem('drugInteractionDB');
        this.init();
        return true;
    }
};

// Initialize database on load
DrugInteractionDB.init();

// Add some sample data if database is empty
function initializeSampleData() {
    const drugs = DrugInteractionDB.getDrugs();
    if (drugs.length === 0) {
        // Sample drugs
        const sampleDrugs = [
            { name: 'Warfarin', genericName: 'Warfarin Sodium', category: 'CAT005', description: 'Anticoagulant' },
            { name: 'Aspirin', genericName: 'Acetylsalicylic Acid', category: 'CAT002', description: 'NSAID, antiplatelet' },
            { name: 'Ibuprofen', genericName: 'Ibuprofen', category: 'CAT002', description: 'NSAID' },
            { name: 'Amoxicillin', genericName: 'Amoxicillin', category: 'CAT001', description: 'Penicillin antibiotic' },
            { name: 'Ciprofloxacin', genericName: 'Ciprofloxacin', category: 'CAT001', description: 'Fluoroquinolone antibiotic' },
            { name: 'Fluoxetine', genericName: 'Fluoxetine', category: 'CAT003', description: 'SSRI antidepressant' },
            { name: 'Lisinopril', genericName: 'Lisinopril', category: 'CAT004', description: 'ACE inhibitor' }
        ];

        sampleDrugs.forEach(drug => DrugInteractionDB.addDrug(drug));

        // Sample interactions
        const allDrugs = DrugInteractionDB.getDrugs();
        const warfarin = allDrugs.find(d => d.name === 'Warfarin');
        const aspirin = allDrugs.find(d => d.name === 'Aspirin');
        const ibuprofen = allDrugs.find(d => d.name === 'Ibuprofen');
        const ciprofloxacin = allDrugs.find(d => d.name === 'Ciprofloxacin');

        if (warfarin && aspirin) {
            DrugInteractionDB.addInteraction({
                drugAId: warfarin.id,
                drugBId: aspirin.id,
                severity: 'SEV001',
                description: 'Increased risk of bleeding',
                mechanism: 'Both drugs affect platelet function and coagulation',
                recommendations: 'Avoid concurrent use. Monitor for signs of bleeding.'
            });
        }

        if (warfarin && ciprofloxacin) {
            DrugInteractionDB.addInteraction({
                drugAId: warfarin.id,
                drugBId: ciprofloxacin.id,
                severity: 'SEV002',
                description: 'Increased anticoagulant effect',
                mechanism: 'Ciprofloxacin may enhance the anticoagulant effect of warfarin',
                recommendations: 'Monitor INR closely during and after ciprofloxacin therapy'
            });
        }

        if (aspirin && ibuprofen) {
            DrugInteractionDB.addInteraction({
                drugAId: aspirin.id,
                drugBId: ibuprofen.id,
                severity: 'SEV002',
                description: 'Reduced cardioprotective effect of aspirin',
                mechanism: 'Competitive inhibition of platelet COX-1',
                recommendations: 'Take ibuprofen at least 30 minutes after or 8 hours before aspirin'
            });
        }
    }
}

// Initialize sample data
initializeSampleData();