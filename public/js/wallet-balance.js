// Wallet Balance Display functionality

// Load user wallet balance for navigation
function loadUserWalletBalance(userId) {
  if (!firebase || !firebase.firestore) return;
  
  const db = firebase.firestore();
  db.collection('users').doc(userId).get()
    .then(doc => {
      if (doc.exists) {
        const userData = doc.data();
        const walletBalance = userData.walletBalance || 0;
        
        // Update all wallet balance displays in the navigation
        const navWalletBalances = document.querySelectorAll('#navWalletBalance');
        navWalletBalances.forEach(element => {
          element.textContent = '$' + walletBalance.toFixed(2);
        });
      } else {
        // Create user document if it doesn't exist
        db.collection('users').doc(userId).set({
          walletBalance: 0,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Set default balance
        const navWalletBalances = document.querySelectorAll('#navWalletBalance');
        navWalletBalances.forEach(element => {
          element.textContent = '$0.00';
        });
      }
    })
    .catch(error => {
      console.error('Error fetching user wallet balance:', error);
    });
}

// Update the wallet balance when Firebase is ready
document.addEventListener('DOMContentLoaded', function() {
  // Wait for Firebase and auth to be initialized
  const checkFirebase = setInterval(() => {
    if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
      clearInterval(checkFirebase);
      
      firebase.auth().onAuthStateChanged(user => {
        if (user) {
          loadUserWalletBalance(user.uid);
        }
      });
    }
  }, 100);
});

// Function to fetch and display user wallet balance on the wallet page
function fetchUserWalletBalance(userId) {
  if (!firebase || !firebase.firestore) return;
  
  const db = firebase.firestore();
  db.collection('users').doc(userId).get()
    .then(doc => {
      if (doc.exists) {
        const userData = doc.data();
        const walletBalance = userData.walletBalance || 0;
        
        // Update the main wallet balance display on the wallet page
        const userWalletBalance = document.getElementById('userWalletBalance');
        if (userWalletBalance) {
          userWalletBalance.textContent = walletBalance.toFixed(2);
        }
        
        // Also update transaction history if it exists
        loadTransactionHistory(userId);
      } else {
        // Create user document if it doesn't exist
        db.collection('users').doc(userId).set({
          walletBalance: 0,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Set default balance
        const userWalletBalance = document.getElementById('userWalletBalance');
        if (userWalletBalance) {
          userWalletBalance.textContent = '0.00';
        }
      }
    })
    .catch(error => {
      console.error('Error fetching user wallet balance:', error);
    });
}

// Function to load transaction history
function loadTransactionHistory(userId) {
  const transactionsList = document.getElementById('transactionsList');
  if (!transactionsList) return;
  
  const db = firebase.firestore();
  db.collection('transactions')
    .where('userId', '==', userId)
    .orderBy('timestamp', 'desc')
    .limit(10)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        transactionsList.innerHTML = '<div class="no-transactions">No transactions yet</div>';
        return;
      }
      
      transactionsList.innerHTML = '';
      snapshot.forEach(doc => {
        const transaction = doc.data();
        const transactionItem = createTransactionItem(transaction);
        transactionsList.appendChild(transactionItem);
      });
    })
    .catch(error => {
      console.error('Error loading transaction history:', error);
      transactionsList.innerHTML = '<div class="error-message">Error loading transactions</div>';
    });
}

// Helper function to create transaction item
function createTransactionItem(transaction) {
  const item = document.createElement('div');
  item.className = 'transaction-item';
  
  const date = transaction.timestamp ? new Date(transaction.timestamp.toDate()) : new Date();
  const formattedDate = date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  
  const isDeposit = transaction.type === 'deposit';
  const amountClass = isDeposit ? 'amount-positive' : 'amount-negative';
  const amountPrefix = isDeposit ? '+' : '-';
  
  item.innerHTML = `
    <div class="transaction-details">
      <div class="transaction-title">${transaction.description || 'Transaction'}</div>
      <div class="transaction-date">${formattedDate}</div>
    </div>
    <div class="transaction-amount ${amountClass}">${amountPrefix}$${Math.abs(transaction.amount).toFixed(2)}</div>
  `;
  
  return item;
}
