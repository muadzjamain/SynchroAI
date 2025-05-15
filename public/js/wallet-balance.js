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
