// Latest 2026 Market Rates (Input + Output rates per 1M tokens)
const modelData = [
    { name: "GPT-5.4",        provider: "OpenAI",    in: 2.50,  out: 15.00, batchDiscount: 0.50 },
    { name: "Claude 4.6 Sonnet", provider: "Anthropic", in: 3.00, out: 15.00, batchDiscount: 0.50 },
    { name: "Gemini 3.1 Pro",  provider: "Google",    in: 2.00,  out: 12.00, batchDiscount: 0.50 },
    { name: "DeepSeek V4",     provider: "DeepSeek",  in: 0.28,  out: 0.28,  batchDiscount: 0.00 },
    { name: "GPT-5 Nano",      provider: "OpenAI",    in: 0.05,  out: 0.40,  batchDiscount: 0.50 }
];

function updateCosts() {
    const requests   = parseInt(document.getElementById('requests').value) || 0;
    const words      = parseInt(document.getElementById('words').value) || 0;
    const isBatch    = document.getElementById('batchToggle').checked;
    const container  = document.getElementById('results-container');
    const modeBadge  = document.getElementById('mode-badge');

    // Mode badge
    if (modeBadge) {
        modeBadge.textContent = isBatch ? '24hr Batch' : 'Real-time';
        modeBadge.className   = isBatch ? 'batch' : '';
        modeBadge.id          = 'mode-badge'; // preserve id
    }

    // Core metrics
    const totalWords        = requests * words;
    const totalInputTokens  = (totalWords * 1.333) / 1_000_000;
    const totalOutputTokens = totalInputTokens * 1.5;

    // Human labour comparison
    const humanCost = (totalWords / 800) * 35;
    const humanCard = document.getElementById('human-comparison');
    const humanCostEl = document.getElementById('human-cost');

    if (totalWords > 0) {
        humanCard.classList.remove('hidden');
        humanCostEl.textContent = '$' + humanCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
        humanCard.classList.add('hidden');
    }

    container.innerHTML = '';

    // Compute all costs first so we can mark the cheapest
    const costs = modelData.map(model => {
        let inRate  = model.in;
        let outRate = model.out;
        if (isBatch && model.batchDiscount > 0) {
            inRate  *= model.batchDiscount;
            outRate *= model.batchDiscount;
        }
        return (totalInputTokens * inRate) + (totalOutputTokens * outRate);
    });

    const cheapestCost = Math.min(...costs);

    costs.forEach((cost, index) => {
        const model      = modelData[index];
        const isCheapest = cost === cheapestCost && cost > 0;

        const card = document.createElement('div');
        card.className = 'model-card' + (isCheapest ? ' cheapest' : '');

        const batchApplied = isBatch && model.batchDiscount > 0;

        card.innerHTML = `
            <div class="model-left">
                <span class="model-name">${model.name}</span>
                <div class="model-meta">
                    <span>${model.provider}</span>
                    ${batchApplied ? '<span class="meta-tag batch">Batch</span>' : '<span class="meta-tag">Real-time</span>'}
                    ${isCheapest ? '<span class="meta-tag best">✦ Lowest</span>' : ''}
                </div>
            </div>
            <span class="model-cost ${batchApplied ? 'batch-cost' : ''}">
                $${cost.toFixed(2)}
            </span>
        `;
        container.appendChild(card);
    });

    // Savings bar: based on cheapest AI vs human
    if (humanCost > 0) {
        const cheapest      = Math.min(...costs.filter(c => c > 0));
        const savingsPct    = Math.min(99.9, ((humanCost - cheapest) / humanCost) * 100);
        const savingsBar    = document.getElementById('savings-bar');
        if (savingsBar) savingsBar.style.width = Math.max(savingsPct, 5) + '%';
    }
}

window.onload = updateCosts;
