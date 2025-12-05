/**
 * Helper function per determinare se una sottocategoria deve essere mostrata
 * e per ottenere la descrizione della sottocategoria
 */

// Sottocategorie valide da mostrare
const VALID_SUBCATEGORIES = {
    // Sparkling
    'METODO MARTINOTTI': {
        show: true,
        description: 'Metodo Martinotti (Charmat) - Seconda fermentazione in autoclave'
    },
    'METODO ANCESTRALE': {
        show: true,
        description: 'Metodo Ancestrale - Fermentazione naturale in bottiglia'
    },
    'METODO CLASSICO': {
        show: true,
        description: 'Metodo Classico - Seconda fermentazione in bottiglia (Champagne method)'
    },
    // Toscana
    'TOSCANA ROSSO': {
        show: true,
        description: 'Vini rossi della Toscana'
    },
    'CHIANTI': {
        show: true,
        description: 'Chianti DOCG - Il vino toscano più famoso'
    },
    'MONTALCINO': {
        show: true,
        description: 'Brunello di Montalcino DOCG - Il re dei vini toscani'
    },
    'SUPERTUSCAN': {
        show: true,
        description: 'Super Tuscan - Vini innovativi della Toscana'
    },
    // Veneto
    'VENETO ROSSO': {
        show: true,
        description: 'Vini rossi del Veneto'
    },
    'AMARONE': {
        show: true,
        description: 'Amarone della Valpolicella DOCG - Vino passito secco'
    },
    // Piemonte
    'PIEMONTE ROSSO': {
        show: true,
        description: 'Vini rossi del Piemonte'
    },
    'BAROLO DOCG': {
        show: true,
        description: 'Barolo DOCG - Il re dei vini'
    },
    'BARBARESCO DOCG': {
        show: true,
        description: 'Barbaresco DOCG - La regina dei vini'
    }
};

/**
 * Verifica se una sottocategoria deve essere mostrata
 */
function shouldShowSubcategory(subcategory, wine) {
    if (!subcategory) return false;
    
    // Controlla se è una sottocategoria valida
    if (VALID_SUBCATEGORIES[subcategory]) {
        return true;
    }
    
    // Per sparkling, mostra solo i metodi
    if (wine.wine_type && wine.wine_type.includes('BOLLICINE')) {
        return subcategory.startsWith('METODO') || subcategory === 'BOLLICINE';
    }
    
    return false;
}

/**
 * Ottiene la descrizione della sottocategoria
 */
function getSubcategoryDescription(subcategory) {
    if (VALID_SUBCATEGORIES[subcategory]) {
        return VALID_SUBCATEGORIES[subcategory].description;
    }
    return '';
}

/**
 * Formatta la sottocategoria per la visualizzazione
 */
function formatSubcategoryForDisplay(subcategory, wine) {
    if (!shouldShowSubcategory(subcategory, wine)) {
        return null;
    }
    
    const description = getSubcategoryDescription(subcategory);
    
    return {
        name: subcategory,
        description: description
    };
}

/**
 * Raggruppa i vini per sub-categoria
 * Restituisce un array di oggetti con { subcategoryInfo, wines }
 */
function groupWinesBySubcategory(wines) {
    const groups = new Map();
    const winesWithoutSubcategory = [];
    
    wines.forEach(wine => {
        const subcategory = wine.subcategory || '';
        const subcategoryInfo = formatSubcategoryForDisplay(subcategory, wine);
        
        if (subcategoryInfo) {
            const key = subcategoryInfo.name;
            if (!groups.has(key)) {
                groups.set(key, {
                    subcategoryInfo: subcategoryInfo,
                    wines: []
                });
            }
            groups.get(key).wines.push(wine);
        } else {
            winesWithoutSubcategory.push(wine);
        }
    });
    
    // Converti la Map in array e ordina per nome sub-categoria
    const groupedArray = Array.from(groups.values()).sort((a, b) => 
        a.subcategoryInfo.name.localeCompare(b.subcategoryInfo.name)
    );
    
    // Aggiungi i vini senza sub-categoria alla fine
    if (winesWithoutSubcategory.length > 0) {
        groupedArray.push({
            subcategoryInfo: null,
            wines: winesWithoutSubcategory
        });
    }
    
    return groupedArray;
}

