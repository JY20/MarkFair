const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Data files paths
const DEPOSITS_FILE = path.join(__dirname, 'deposits.json');
const SWAPS_FILE = path.join(__dirname, 'swaps.json');

// Initialize data files if they don't exist
if (!fs.existsSync(DEPOSITS_FILE)) {
  fs.writeFileSync(DEPOSITS_FILE, JSON.stringify({ deposits: [] }));
}

if (!fs.existsSync(SWAPS_FILE)) {
  fs.writeFileSync(SWAPS_FILE, JSON.stringify({ swaps: [] }));
}

// API endpoint to save deposit data
app.post('/api/deposit', (req, res) => {
  try {
    const { userAddress, amount, txHash, secretHash, secretKey, timestamp } = req.body;
    
    // Validate required fields
    if (!userAddress || !amount || !txHash) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Read existing deposits data
    const depositsData = JSON.parse(fs.readFileSync(DEPOSITS_FILE));
    
    // Add new deposit
    const newDeposit = {
      userAddress,
      amount,
      txHash,
      timestamp: timestamp || new Date().toISOString(),
    };
    
    depositsData.deposits.push(newDeposit);
    
    // Write updated deposits data back to file
    fs.writeFileSync(DEPOSITS_FILE, JSON.stringify(depositsData, null, 2));
    
    // If this is a swap (has secretHash and secretKey), save to swaps file
    if (secretHash && secretKey) {
      // Read existing swaps data
      const swapsData = JSON.parse(fs.readFileSync(SWAPS_FILE));
      
      // Add new swap
      const newSwap = {
        userAddress,
        fromToken: 'ETH',
        toToken: 'STRK',
        amount,
        txHash,
        secretHash,
        secretKey,
        status: 'locked',
        timestamp: timestamp || new Date().toISOString(),
      };
      
      swapsData.swaps.push(newSwap);
      
      // Write updated swaps data back to file
      fs.writeFileSync(SWAPS_FILE, JSON.stringify(swapsData, null, 2));
    }
    
    res.status(200).json({ success: true, message: 'Data recorded successfully' });
  } catch (error) {
    console.error('Error saving data:', error);
    res.status(500).json({ error: 'Failed to save data' });
  }
});

// API endpoint to get all deposits
app.get('/api/deposits', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(DEPOSITS_FILE));
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching deposits:', error);
    res.status(500).json({ error: 'Failed to fetch deposits' });
  }
});

// API endpoint to get all swaps
app.get('/api/swaps', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(SWAPS_FILE));
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching swaps:', error);
    res.status(500).json({ error: 'Failed to fetch swaps' });
  }
});

// API endpoint to update swap status
app.post('/api/swaps/update', (req, res) => {
  try {
    const { txHash, status } = req.body;
    
    // Validate required fields
    if (!txHash || !status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Read existing swaps data
    const swapsData = JSON.parse(fs.readFileSync(SWAPS_FILE));
    
    // Find and update the swap
    const swapIndex = swapsData.swaps.findIndex(swap => swap.txHash === txHash);
    
    if (swapIndex === -1) {
      return res.status(404).json({ error: 'Swap not found' });
    }
    
    swapsData.swaps[swapIndex].status = status;
    swapsData.swaps[swapIndex].claimedAt = new Date().toISOString();
    
    // Write updated swaps data back to file
    fs.writeFileSync(SWAPS_FILE, JSON.stringify(swapsData, null, 2));
    
    res.status(200).json({ success: true, message: 'Swap status updated successfully' });
  } catch (error) {
    console.error('Error updating swap status:', error);
    res.status(500).json({ error: 'Failed to update swap status' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 