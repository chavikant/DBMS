document.addEventListener('DOMContentLoaded', () => {
    // Navigation elements
    const navDashboard = document.getElementById('nav-dashboard');
    const navAddStock = document.getElementById('nav-add-stock');
    const navWatchlist = document.getElementById('nav-watchlist');
    const navLogout = document.getElementById('nav-logout');
    const mainNav = document.getElementById('main-nav');

    // Page sections
    const pageLogin = document.getElementById('page-login');
    const pageDashboard = document.getElementById('page-dashboard');
    const pageAddStock = document.getElementById('page-add-stock');
    const pageWatchlist = document.getElementById('page-watchlist');

    // Login/Register elements
    const showLoginBtn = document.getElementById('show-login-btn');
    const showRegisterBtn = document.getElementById('show-register-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Elements for Add Stock page
    const form = document.getElementById('transaction-form');
    const transactionsTableBody = document.querySelector('#transactions-table tbody');
    const totalInvestmentEl = document.getElementById('total-investment');
    const totalSharesEl = document.getElementById('total-shares');
    const currentValueEl = document.getElementById('current-value');
    const gainLossEl = document.getElementById('gain-loss');

    // Elements for Watchlist page
    const watchlistStocksEl = document.getElementById('watchlist-stocks');
    const watchlistInput = document.getElementById('watchlist-input');
    const addWatchlistBtn = document.getElementById('add-watchlist-btn');

    // Elements for Dashboard page
    const stocksOverviewTableBody = document.querySelector('#stocks-overview-table tbody');
    const stockChartCanvas = document.getElementById('stock-chart');
    const stockChartCtx = stockChartCanvas.getContext('2d');

    // Data storage
    let transactions = [];
    let watchlist = [];
    const currentPrices = {};
    const stockPriceHistory = {};

    // Current logged in user email
    let currentUserEmail = null;

    // Currently selected stock symbol for chart
    let selectedStock = null;

    // Interval ID for dynamic updates
    let dynamicUpdateInterval = null;

    // Show page helper
    function showPage(page) {
        pageLogin.classList.remove('active');
        pageDashboard.classList.remove('active');
        pageAddStock.classList.remove('active');
        pageWatchlist.classList.remove('active');

        navDashboard.classList.remove('active');
        navAddStock.classList.remove('active');
        navWatchlist.classList.remove('active');

        if (page === 'login') {
            pageLogin.classList.add('active');
            mainNav.style.display = 'none';
            stopDynamicUpdates();
        } else {
            mainNav.style.display = 'flex';
            if (page === 'dashboard') {
                pageDashboard.classList.add('active');
                navDashboard.classList.add('active');
                startDynamicUpdates();
            } else if (page === 'add-stock') {
                pageAddStock.classList.add('active');
                navAddStock.classList.add('active');
                stopDynamicUpdates();
            } else if (page === 'watchlist') {
                pageWatchlist.classList.add('active');
                navWatchlist.classList.add('active');
                stopDynamicUpdates();
            }
        }
    }

    // Toggle login/register forms
    showLoginBtn.addEventListener('click', () => {
        showLoginBtn.classList.add('active');
        showRegisterBtn.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });

    showRegisterBtn.addEventListener('click', () => {
        showRegisterBtn.classList.add('active');
        showLoginBtn.classList.remove('active');
        registerForm.style.display = 'block';
        loginForm.style.display = 'none';
    });

    // Simple hash function for password (for demo only, not secure)
    function simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return hash.toString();
    }

    // Load user data from localStorage
    function loadUserData(email) {
        const userDataStr = localStorage.getItem('user_' + email);
        if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            transactions = userData.transactions || [];
            watchlist = userData.watchlist || [];
        } else {
            transactions = [];
            watchlist = [];
        }
    }

    // Save user data to localStorage
    function saveUserData(email) {
        const userData = {
            transactions,
            watchlist
        };
        localStorage.setItem('user_' + email, JSON.stringify(userData));
    }

    // Render all transactions in the table
    function renderTransactions() {
        transactionsTableBody.innerHTML = '';
        transactions.forEach(tx => {
            addTransactionRow(tx);
        });
    }

    // Register form submit
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim().toLowerCase();
        const password = document.getElementById('register-password').value;

        if (!name || !email || !password) {
            alert('Please fill all fields.');
            return;
        }

        // Check if user exists
        if (localStorage.getItem('user_' + email)) {
            alert('User already exists. Please login.');
            return;
        }

        // Save user credentials (password hashed)
        const users = JSON.parse(localStorage.getItem('users') || '{}');
        users[email] = {
            name,
            passwordHash: simpleHash(password)
        };
        localStorage.setItem('users', JSON.stringify(users));

        // Initialize user data
        transactions = [];
        watchlist = [];
        saveUserData(email);

        alert('Registration successful. Please login.');
        showLoginBtn.click();
    });

    // Login form submit
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim().toLowerCase();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            alert('Please fill all fields.');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '{}');
        if (!users[email]) {
            alert('User not found. Please register.');
            return;
        }

        if (users[email].passwordHash !== simpleHash(password)) {
            alert('Incorrect password.');
            return;
        }

        currentUserEmail = email;
        loadUserData(email);
        renderTransactions();
        updateSummary();
        renderWatchlist();
        renderStocksOverview();
        clearChart();

        // Draw chart for last selected stock or first stock in portfolio
        if (selectedStock && currentPrices[selectedStock]) {
            drawStockChart(selectedStock);
        } else if (transactions.length > 0) {
            selectedStock = transactions[transactions.length - 1].symbol;
            drawStockChart(selectedStock);
        }

        showPage('dashboard');
    });

    // Logout handler
    navLogout.addEventListener('click', (e) => {
        e.preventDefault();
        currentUserEmail = null;
        transactions = [];
        watchlist = [];
        selectedStock = null;
        showPage('login');
    });

    // Navigation click handlers
    navDashboard.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('dashboard');
    });

    navAddStock.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('add-stock');
    });

    navWatchlist.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('watchlist');
    });

    // Helper functions for portfolio and watchlist
    function updateSummary() {
        let totalInvestment = 0;
        let totalShares = 0;
        let currentValue = 0;

        transactions.forEach(tx => {
            if (tx.type === 'buy') {
                totalInvestment += tx.shares * tx.price;
                totalShares += tx.shares;
            } else if (tx.type === 'sell') {
                totalInvestment -= tx.shares * tx.price;
                totalShares -= tx.shares;
            }
        });

        const portfolio = {};
        transactions.forEach(tx => {
            if (!portfolio[tx.symbol]) {
                portfolio[tx.symbol] = 0;
            }
            if (tx.type === 'buy') {
                portfolio[tx.symbol] += tx.shares;
                currentPrices[tx.symbol] = tx.price;
                if (!stockPriceHistory[tx.symbol]) {
                    stockPriceHistory[tx.symbol] = generateRandomPriceHistory(tx.price);
                }
            } else if (tx.type === 'sell') {
                portfolio[tx.symbol] -= tx.shares;
            }
        });

        for (const symbol in portfolio) {
            const shares = portfolio[symbol];
            if (shares > 0) {
                const price = currentPrices[symbol] || 0;
                currentValue += shares * price;
            }
        }

        const gainLoss = currentValue - totalInvestment;

        totalInvestmentEl.textContent = totalInvestment.toFixed(2);
        totalSharesEl.textContent = totalShares;
        currentValueEl.textContent = currentValue.toFixed(2);
        gainLossEl.textContent = gainLoss.toFixed(2);
        gainLossEl.style.color = gainLoss >= 0 ? 'lightgreen' : 'red';
    }

    function addTransactionRow(tx) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${tx.symbol.toUpperCase()}</td>
            <td>${tx.shares}</td>
            <td>$${tx.price.toFixed(2)}</td>
            <td>${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</td>
            <td>$${(tx.shares * tx.price).toFixed(2)}</td>
        `;
        transactionsTableBody.appendChild(tr);
    }

    function addWatchlistStock(symbol) {
        const li = document.createElement('li');
        li.textContent = symbol.toUpperCase();
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
            watchlist = watchlist.filter(s => s !== symbol);
            renderWatchlist();
            renderStocksOverview();
            clearChart();
            saveUserData(currentUserEmail);
        });
        li.appendChild(removeBtn);
        watchlistStocksEl.appendChild(li);
    }

    function renderWatchlist() {
        watchlistStocksEl.innerHTML = '';
        watchlist.forEach(symbol => {
            addWatchlistStock(symbol);
        });
    }

    function renderStocksOverview() {
        stocksOverviewTableBody.innerHTML = '';
        const allStocks = Array.from(new Set([...watchlist, ...Object.keys(currentPrices)]));
        allStocks.forEach(symbol => {
            const price = currentPrices[symbol] || getRandomPrice();
            const change = getRandomChange();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${symbol.toUpperCase()}</td>
                <td>$${price.toFixed(2)}</td>
                <td style="color: ${change >= 0 ? 'lightgreen' : 'red'}">${change.toFixed(2)}%</td>
            `;
            tr.addEventListener('click', () => {
                selectedStock = symbol;
                drawStockChart(symbol);
                showPage('dashboard');
            });
            stocksOverviewTableBody.appendChild(tr);
        });
    }

    function generateRandomPriceHistory(basePrice) {
        const history = [];
        let price = basePrice;
        for (let i = 0; i < 30; i++) {
            price += (Math.random() - 0.5) * 2;
            price = Math.max(price, 1);
            history.push(price);
        }
        return history;
    }

    function resizeCanvas() {
        const containerWidth = stockChartCanvas.parentElement.clientWidth;
        stockChartCanvas.width = containerWidth;
        stockChartCanvas.height = 300; // fixed height for better visibility
    }

    function drawGridLines(ctx, padding, width, height, maxPrice, minPrice) {
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 0.5;
        ctx.font = '10px Arial';
        ctx.fillStyle = '#666';

        // Horizontal grid lines and labels
        const numLines = 5;
        for (let i = 0; i <= numLines; i++) {
            const y = padding + (height / numLines) * i;
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(padding + width, y);
            ctx.stroke();

            const priceLabel = (maxPrice - ((maxPrice - minPrice) / numLines) * i).toFixed(2);
            ctx.fillText(`$${priceLabel}`, 5, y + 3);
        }

        // Vertical grid lines and labels (days)
        const numVerticalLines = 6;
        for (let i = 0; i <= numVerticalLines; i++) {
            const x = padding + (width / numVerticalLines) * i;
            ctx.beginPath();
            ctx.moveTo(x, padding + height);
            ctx.lineTo(x, padding + height + 5);
            ctx.stroke();

            const dayLabel = `Day ${Math.round((i * 30) / numVerticalLines)}`;
            ctx.fillText(dayLabel, x - 10, padding + height + 20);
        }
    }

    function drawStockChart(symbol) {
        resizeCanvas();

        const prices = stockPriceHistory[symbol] || generateRandomPriceHistory(100);
        stockPriceHistory[symbol] = prices;

        stockChartCtx.clearRect(0, 0, stockChartCanvas.width, stockChartCanvas.height);

        const padding = 40;
        const width = stockChartCanvas.width - padding * 2;
        const height = stockChartCanvas.height - padding * 2;

        // Draw axes
        stockChartCtx.strokeStyle = '#333';
        stockChartCtx.lineWidth = 1;
        stockChartCtx.beginPath();
        stockChartCtx.moveTo(padding, padding);
        stockChartCtx.lineTo(padding, padding + height);
        stockChartCtx.lineTo(padding + width, padding + height);
        stockChartCtx.stroke();

        const maxPrice = Math.max(...prices);
        const minPrice = Math.min(...prices);
        const range = maxPrice - minPrice || 1;

        // Draw grid lines and labels
        drawGridLines(stockChartCtx, padding, width, height, maxPrice, minPrice);

        // Draw price line
        stockChartCtx.strokeStyle = '#8b5cf6';
        stockChartCtx.lineWidth = 2;
        stockChartCtx.beginPath();

        prices.forEach((price, index) => {
            const x = padding + (index / (prices.length - 1)) * width;
            const y = padding + height - ((price - minPrice) / range) * height;
            if (index === 0) {
                stockChartCtx.moveTo(x, y);
            } else {
                stockChartCtx.lineTo(x, y);
            }
        });
        stockChartCtx.stroke();

        // Draw labels
        stockChartCtx.fillStyle = '#333';
        stockChartCtx.font = '14px Arial';
        stockChartCtx.fillText(symbol.toUpperCase(), padding, padding - 15);
        stockChartCtx.fillText(`Max: $${maxPrice.toFixed(2)}`, padding + width - 100, padding - 15);
        stockChartCtx.fillText(`Min: $${minPrice.toFixed(2)}`, padding + width - 100, padding + height + 35);
    }

    function clearChart() {
        stockChartCtx.clearRect(0, 0, stockChartCanvas.width, stockChartCanvas.height);
    }

    function getRandomPrice() {
        return 50 + Math.random() * 100;
    }

    function getRandomChange() {
        return (Math.random() - 0.5) * 5;
    }

    // Add stock transaction form submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const symbol = form.symbol.value.trim().toUpperCase();
        const shares = parseInt(form.shares.value);
        const price = parseFloat(form.price.value);
        const type = form.type.value;

        if (!symbol || shares <= 0 || price <= 0) {
            alert('Please enter valid transaction details.');
            return;
        }

        const transaction = { symbol, shares, price, type };
        transactions.push(transaction);

        addTransactionRow(transaction);
        updateSummary();
        renderStocksOverview();
        selectedStock = symbol;
        drawStockChart(symbol); // Draw chart for added stock

        saveUserData(currentUserEmail);

        form.reset();
        form.symbol.focus();
    });

    // Add to watchlist button handler
    addWatchlistBtn.addEventListener('click', () => {
        const symbol = watchlistInput.value.trim().toUpperCase();
        if (symbol && !watchlist.includes(symbol)) {
            watchlist.push(symbol);
            renderWatchlist();
            renderStocksOverview();
            selectedStock = symbol;
            drawStockChart(symbol);
            saveUserData(currentUserEmail);
            watchlistInput.value = '';
        }
    });

    // Dynamic stock price updates
    function startDynamicUpdates() {
        if (dynamicUpdateInterval) return; // Already running

        dynamicUpdateInterval = setInterval(() => {
            if (!selectedStock) return;

            // Simulate new price
            const prices = stockPriceHistory[selectedStock] || generateRandomPriceHistory(100);
            let lastPrice = prices[prices.length - 1];
            let newPrice = lastPrice + (Math.random() - 0.5) * 2;
            newPrice = Math.max(newPrice, 1);

            prices.push(newPrice);
            if (prices.length > 30) {
                prices.shift(); // Keep last 30 prices
            }
            stockPriceHistory[selectedStock] = prices;

            // Update current price
            currentPrices[selectedStock] = newPrice;

            // Update summary and stocks overview
            updateSummary();
            renderStocksOverview();

            // Redraw chart
            drawStockChart(selectedStock);
        }, 3000); // Update every 3 seconds
    }

    function stopDynamicUpdates() {
        if (dynamicUpdateInterval) {
            clearInterval(dynamicUpdateInterval);
            dynamicUpdateInterval = null;
        }
    }

    // Add window resize event listener to resize canvas and redraw chart
    window.addEventListener('resize', () => {
        if (selectedStock) {
            drawStockChart(selectedStock);
        }
    });

    // Initial state
    showPage('login');
});
