/**
 * Wineries Database
 * Contains structured information about wineries extracted from wineries_12-11.md
 * Used to dynamically populate producer descriptions in wine detail pages
 */

const WineriesDB = {
    // Helper function to normalize winery names for matching
    normalizeName(name) {
        if (!name) return '';
        return name
            .toUpperCase()
            .trim()
            .replace(/[*]/g, '')
            .replace(/\s+/g, ' ')
            .replace(/[()]/g, '');
    },

    // Helper function to find winery by producer name (fuzzy matching)
    findWinery(producerName) {
        if (!producerName) return null;
        
        const normalized = this.normalizeName(producerName);
        
        // Direct match
        if (this.wineries[normalized]) {
            return this.wineries[normalized];
        }
        
        // Try partial matches - split by words for better matching
        const producerWords = normalized.split(/\s+/).filter(w => w.length > 2); // Ignore short words
        
        for (const [key, winery] of Object.entries(this.wineries)) {
            const keyNormalized = this.normalizeName(key);
            const producerNormalized = this.normalizeName(producerName);
            
            // Exact match after normalization
            if (keyNormalized === producerNormalized) {
                return winery;
            }
            
            // Check if producer name contains winery name or vice versa
            if (keyNormalized.includes(producerNormalized) || 
                producerNormalized.includes(keyNormalized)) {
                return winery;
            }
            
            // Word-based matching: check if significant words match
            if (producerWords.length > 0) {
                const keyWords = keyNormalized.split(/\s+/).filter(w => w.length > 2);
                const matchingWords = producerWords.filter(pw => 
                    keyWords.some(kw => kw.includes(pw) || pw.includes(kw))
                );
                // If at least one significant word matches, consider it a match
                if (matchingWords.length > 0 && matchingWords.length >= Math.min(producerWords.length, 2)) {
                    return winery;
                }
            }
            
            // Check aliases
            if (winery.aliases) {
                for (const alias of winery.aliases) {
                    const aliasNormalized = this.normalizeName(alias);
                    if (aliasNormalized === producerNormalized || 
                        aliasNormalized.includes(producerNormalized) ||
                        producerNormalized.includes(aliasNormalized)) {
                        return winery;
                    }
                }
            }
        }
        
        return null;
    },

    // Get formatted description for a winery
    getDescription(winery) {
        if (!winery) return null;
        
        const parts = [];
        
        if (winery.region) {
            parts.push(`Located in ${winery.location || winery.region}, ${winery.region}`);
        }
        
        if (winery.history) {
            parts.push(winery.history);
        }
        
        if (winery.philosophy) {
            parts.push(winery.philosophy);
        }
        
        if (winery.hectares) {
            parts.push(`The estate spans ${winery.hectares} hectares`);
        }
        
        if (winery.grapes) {
            parts.push(`Main grape varieties include ${winery.grapes}`);
        }
        
        if (winery.mainWines) {
            parts.push(`Notable wines include ${winery.mainWines}`);
        }
        
        if (winery.notes) {
            parts.push(winery.notes);
        }
        
        return parts.length > 0 ? parts.join('. ') + '.' : null;
    },

    // Wineries database
    wineries: {
        'FEUDI DEL PISCIOTTO': {
            name: 'Feudi del Pisciotto',
            region: 'Sicily',
            location: 'Cerasuolo di Vittoria DOCG',
            history: 'Ancient 1700s palmento preserved; modern winery built nearby',
            philosophy: 'Gravity-flow vinification without pumps; manual harvest; lower emissions; energy efficiency',
            hectares: '44',
            production: 'Capacity 1.5M bottles; actual 400k bottles (16 labels)',
            mainWines: '"Grandi Stilisti" line (includes L\'Eterno, Pinot Nero 100%), "Baglio del Sole" line',
            notes: 'High quality driven by altitude and sea breezes'
        },
        'THE WANTED WINES': {
            name: 'The Wanted Wines',
            aliases: ['ORION WINES'],
            region: 'Italy (production), Trentino (headquarters)',
            location: 'Lavis, Trento',
            philosophy: 'American strength meets Italian elegance; bold, soft, fruit‑forward style',
            mainWines: 'The Chard, The Zin Old Vines, The Zin Rosé, The Cab, The Ranger'
        },
        'VIGNETI VUMBACA': {
            name: 'Vigneti Vumbaca',
            region: 'Calabria',
            location: 'Cirò',
            year: '1984',
            philosophy: 'Organic farming',
            grapes: 'Gaglioppo, Greco Bianco',
            notes: 'Recognized by major Italian guides'
        },
        'TENUTE DI GIULIO': {
            name: 'Tenute di Giulio',
            region: 'Molise',
            location: 'Campomarino (CB)',
            history: 'Estate purchased 1960; first winery built 1977; modern expansion in the 1990s by Enrico and Pasquale',
            hectares: '100 (80 vineyards)',
            grapes: 'Montepulciano, Trebbiano, Aglianico, Falanghina',
            mainWines: 'Volto Marino Rosso, Tintilia del Molise',
            notes: 'Advanced technological approach'
        },
        'TENUTA VITANZA': {
            name: 'Tenuta Vitanza',
            region: 'Tuscany',
            location: 'Montalcino',
            history: 'Project began 1994; founders Rosalba Vitanza and Guido Andretta. First Brunello (1995) received 93 points from Wine Spectator. Gravity-flow winery built in 2002',
            grapes: 'Sangiovese',
            mainWines: 'Brunello di Montalcino (various labels), Rosso di Montalcino, Chianti Colli Senesi, "Quadrimendo" Super Tuscan'
        },
        'VINEKA': {
            name: 'Vineka',
            region: 'Puglia',
            location: 'Valle d\'Itria',
            philosophy: 'Preservation of regional heritage; focus on native grapes; sustainability',
            lines: 'ZITO (premium), VINEKA (environment-focused)',
            grapes: 'Primitivo, Susumaniello, Minutolo, Verdeca, Negroamaro'
        },
        'FATTORIA DE VAIRA': {
            name: 'Fattoria de Vaira',
            region: 'Molise',
            location: 'Near Campobasso',
            hectares: '500 total (40 vineyards)',
            philosophy: 'Biodynamic; native yeasts; minimal sulfur; manual harvest',
            grapes: 'Falanghina, Trebbiano, Montepulciano, Sangiovese, Merlot',
            mainWines: 'Vincenzo Bianco'
        },
        'VINI VENTURINI': {
            name: 'Vini Venturini',
            aliases: ['AZIENDA AGRICOLA VENTURINI MASSIMINO'],
            region: 'Veneto',
            location: 'Valpolicella (San Floriano)',
            year: '1963',
            history: 'Three generations working the vineyards',
            mainWines: 'Valpolicella'
        },
        'TONNINO WINERY': {
            name: 'Tonnino Winery',
            region: 'Sicily',
            history: 'Began with Paolo (grandfather) producing must in the 1950s; family later started bottling',
            philosophy: 'Manual harvest, natural approach',
            notes: 'Located between sea and mountains'
        },
        'THOMAIN': {
            name: 'Thomain',
            region: 'Valle d\'Aosta',
            location: 'Arvier',
            history: 'Winery active since 1920; three generations',
            grapes: 'Enfer d\'Arvier DOC area (2 hectares)',
            notes: 'Visits by appointment'
        },
        'TAMELLINI': {
            name: 'Tamellini',
            region: 'Veneto (Soave)',
            year: '1998',
            history: 'Family of four generations of viticulturists',
            grapes: 'Garganega',
            mainWines: 'Soave DOC, Le Bine de Costiola, Spumante Metodo Classico Extra Brut'
        },
        'TENUTA SAN FRANCESCO': {
            name: 'Tenuta San Francesco',
            region: 'Campania',
            location: 'Tramonti, Amalfi Coast',
            year: '2004',
            grapes: 'Tintore (300‑year‑old pre‑phylloxera vines), Aglianico, Piedirosso, Falanghina, Pepella, Ginestra',
            mainWines: 'È Iss (Tintore), 4 Spine, Per Eva, Tramonti Rosso/Bianco'
        },
        'TENUTA PRINCIPE ALBERICO': {
            name: 'Tenuta Principe Alberico',
            region: 'Lazio',
            location: 'Appia Antica (Rome)',
            history: 'Founded 1946 by Prince Alberico Boncompagni Ludovisi; today owned by the Antinori family (descendants)',
            grapes: 'Cabernet Sauvignon, Merlot, Sémillon',
            mainWines: 'Alberico Rosso, Alberico Bianco, Appia Antica 400'
        },
        'BINDI SERGARDI': {
            name: 'Bindi Sergardi',
            region: 'Tuscany (Chianti Classico)',
            year: '1349',
            history: '23 generations',
            locations: 'Mocenni, I Colli, Marcianella',
            grapes: 'Sangiovese'
        },
        'SPORTOLETTI': {
            name: 'Sportoletti',
            region: 'Umbria',
            location: 'Spello / Assisi',
            history: 'Estate switched to bottling in 1979',
            grapes: 'Sangiovese, Merlot, Cabernet Sauvignon, Grechetto, Chardonnay',
            mainWines: 'Assisi Rosso, Assisi Grechetto, Villa Fidelia'
        },
        'SCARBOLO': {
            name: 'Scarbolo',
            region: 'Friuli Venezia Giulia',
            location: 'Lauzacco',
            year: '1982',
            specialization: 'Pinot Grigio (four styles including Ramato)',
            grapes: 'Friulano, Refosco, Merlot, Sauvignon'
        },
        'VACCA': {
            name: 'Vacca',
            aliases: ['VACCA BARBARESCO'],
            region: 'Piedmont',
            location: 'Barbaresco',
            history: 'Active since 1958; three generations',
            grapes: 'Nebbiolo, Barbera, Arneis',
            notes: 'Member of the Produttori del Barbaresco cooperative'
        },
        'SANTA TRESA': {
            name: 'Santa Tresa',
            region: 'Sicily',
            location: 'Vittoria',
            year: '1697',
            hectares: '50',
            notes: 'Historic estate near River Dirillo; symbol is a medieval golden sun'
        },
        'AGRICOLA PUNICA': {
            name: 'Agricola Punica',
            region: 'Sardinia',
            location: 'Sulcis',
            year: '2002',
            founders: 'Tachis + Tenuta San Guido + Cantina Santadi',
            grapes: 'Carignano, Cabernet Sauvignon, Merlot, Syrah',
            mainWines: 'Barrua, Montessu, Samas'
        },
        'IPPOLITO 1845': {
            name: 'Ippolito 1845',
            aliases: ['IPPOLITO'],
            region: 'Calabria',
            location: 'Cirò Marina',
            year: '1845',
            hectares: '100',
            grapes: 'Gaglioppo, Greco Bianco, Pecorello',
            notes: 'Oldest winery in Calabria'
        },
        'QUERCIAVALLE': {
            name: 'Querciavalle',
            aliases: ['LOSI'],
            region: 'Tuscany (Chianti Classico)',
            history: 'Family cultivating grapes since 1870; estate acquired 1954',
            grapes: 'Sangiovese'
        },
        'PRODUTTORI DEL BARBARESCO': {
            name: 'Produttori del Barbaresco',
            region: 'Piedmont',
            location: 'Barbaresco',
            year: '1958',
            grapes: 'Nebbiolo',
            mainWines: 'Barbaresco DOCG + Riservas (great vintages)'
        },
        'PRIMA PAVÉ': {
            name: 'Prima Pavé',
            region: 'Northern Italy',
            products: 'Alcohol‑free sparkling and still drinks from dealcoholized wine',
            grapes: 'Pinot Grigio, Sauvignon Blanc, Gewürztraminer, Montepulciano, Chardonnay',
            abv: '0.0%'
        },
        'AZIENDA AGRICOLA POSSA': {
            name: 'Azienda Agricola Possa',
            region: 'Liguria',
            location: 'Riomaggiore (Cinque Terre)',
            products: 'Sciacchetrà, white & red local wines, distillates'
        },
        'ERMES PAVESE': {
            name: 'Ermes Pavese',
            region: 'Valle d\'Aosta',
            location: 'Morgex‑La Salle',
            grapes: 'Prié Blanc (pre‑phylloxera)',
            altitude: 'Up to 1200m',
            mainWines: 'Blanc de Morgex et de La Salle, metodo classico, passiti'
        },
        'FEUDI BIZANTINI': {
            name: 'Feudi Bizantini',
            aliases: ['TENUTA ULISSE', 'PASSOFINO'],
            region: 'Abruzzo',
            grapes: 'Pecorino (Passofino), Trebbiano, Montepulciano',
            notes: 'Pecorino grape recovered from near extinction'
        },
        'FATTORIA DI MAGLIANO': {
            name: 'Fattoria di Magliano',
            region: 'Tuscany (Maremma)',
            year: '1996',
            certification: 'Organic',
            mainWines: 'Heba, Brissaia, Poggio Bestiale, Pagliatura, Illario'
        },
        'VITE COLTE': {
            name: 'Vite Colte',
            region: 'Piedmont',
            location: 'Barolo',
            structure: 'Cooperative (180 growers, 300 hectares)',
            philosophy: 'Payment per hectare to reward quality',
            mainWines: 'Barolo Paesi Tuoi'
        }
    }
};

// Make it available globally
if (typeof window !== 'undefined') {
    window.WineriesDB = WineriesDB;
}
