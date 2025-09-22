import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './SwapPage.css';
import { useWallet } from '../contexts/WalletContext';
// Starknet imports are handled in WalletContext

function SwapPage() {
  const { 
    isWalletConnected, 
    ethAccount, 
    starknetAccount,
    ethBalance,
    starknetBalance, // Add starknetBalance from context
    checkSufficientBalance,
    createLimitOrder,
    depositToHTLC,
    generateHashlock,
    withdrawFromHTLC,
    cancelEscrow,
    getEscrowDetails,
    canWithdrawFromEscrow,
    canCancelEscrow,
    HTLC_CONTRACT_ADDRESS,
    // Starknet HTLC functions
    createStarknetHTLC,
    withdrawStarknetHTLC,
    refundStarknetHTLC,
    getStarknetHTLCDetails,
    STARKNET_HTLC_ADDRESS,
    STRK_TOKEN_ADDRESS
  } = useWallet();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [fromToken, setFromToken] = useState('ETH');
  const [toToken, setToToken] = useState('STRK');
  const [fromAmount, setFromAmount] = useState('0.01');
  const [toAmount, setToAmount] = useState('2,600');
  const [takerAddress, setTakerAddress] = useState(''); // New: taker address input
  const [orderId, setOrderId] = useState('');
  const [limitOrderHash, setLimitOrderHash] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(60); // 1 minute
  const [depositError, setDepositError] = useState('');
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [message, setMessage] = useState('');
  
  // Additional state variables for compatibility
  const [secretKey, setSecretKey] = useState('');
  const [secretHash, setSecretHash] = useState('');
  const [txHash, setTxHash] = useState('');
  const [htlcHash, setHtlcHash] = useState('');
  const [depositStatus, setDepositStatus] = useState('');
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [strkBalance, setStrkBalance] = useState('0');
  
  // New state for escrow testing
  const [escrowAddress, setEscrowAddress] = useState('');
  const [secret, setSecret] = useState('');
  const [hashlock, setHashlock] = useState('');
  const [escrowDetails, setEscrowDetails] = useState(null);
  const [withdrawalSuccess, setWithdrawalSuccess] = useState(false);
  const [cancellationSuccess, setCancellationSuccess] = useState(false);
  const [canWithdraw, setCanWithdraw] = useState(false);
  const [canCancel, setCanCancel] = useState(false);

  // Exchange rate: 0.1 ETH = 26000 STRK (market price)
  const EXCHANGE_RATE = 26000; // 26000 STRK / 0.1 ETH = 260,000 STRK per ETH
  
  // Contract addresses - using deployed Starknet HTLC contract
  const starknetContractAddress = STARKNET_HTLC_ADDRESS;

  // Steps for the progress bar
  const steps = [
    { number: 1, label: 'SWAP INPUT', status: 'completed' },
    { number: 2, label: 'DEPOSIT ETH', status: 'active' },
    { number: 3, label: 'CREATE ORDER', status: 'pending' },
    { number: 4, label: 'WAIT FOR TAKER', status: 'pending' },
    { number: 5, label: 'CLAIM TOKENS', status: 'pending' }
  ];

  // Effect to generate a random secret key when the component mounts
  useEffect(() => {
    // Generate a random 32-byte secret key
    const randomBytes = new Uint8Array(32);
    window.crypto.getRandomValues(randomBytes);
    const secret = Array.from(randomBytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    setSecretKey(secret);
    
    // Hash the secret using keccak256
    const hash = ethers.utils.id(secret);
    setSecretHash(hash);
  }, []);


  // Effect to fetch account balances when accounts change
  useEffect(() => {
    const fetchBalances = async () => {
      setIsLoadingBalances(true);
      
      try {
        // Fetch STRK balance if Starknet account is connected
        if (starknetAccount) {
          try {
            // Use the actual starknetBalance from WalletContext
            console.log('Using starknetBalance from WalletContext:', starknetBalance);
            
            // Use the starknetBalance from WalletContext which is fetched using get_balance
            console.log('Setting STRK balance to:', starknetBalance);
            setStrkBalance(starknetBalance);
          } catch (error) {
            console.error('Error setting STRK balance:', error);
            setStrkBalance('0'); // Default to 0 if there's an error
          }
        } else {
          setStrkBalance('0');
        }
      } catch (error) {
        console.error('Error fetching balances:', error);
      } finally {
        setIsLoadingBalances(false);
      }
    };
    
    // Call immediately when the component mounts or dependencies change
    fetchBalances();
    
    // Log the current state values
    console.log('Current balance values:', {
      ethBalance,
      starknetBalance,
      localStrkBalance: strkBalance
    });
    
    // Set up an interval to refresh balances every 30 seconds
    const intervalId = setInterval(fetchBalances, 30000);
    
    return () => clearInterval(intervalId);
  }, [ethAccount, starknetAccount, starknetBalance]); // Add starknetBalance as dependency

  useEffect(() => {
    let timer;
    // Run the countdown in both step 3 and step 4
    if ((currentStep === 3 || currentStep === 4) && timeRemaining > 0) {
      timer = setTimeout(() => setTimeRemaining(timeRemaining - 1), 1000);
    } else if (timeRemaining <= 0 && (currentStep === 3 || currentStep === 4)) {
      // When timer reaches zero, set a flag or log a message
      console.log('Timer has reached zero - user can proceed');
    }
    return () => clearTimeout(timer);
  }, [currentStep, timeRemaining]);

  // Calculate exchange rate when fromAmount changes
  useEffect(() => {
    console.log('🔄 Exchange rate calculation:', { fromAmount, fromToken, toToken, EXCHANGE_RATE });
    
    if (fromAmount && !isNaN(fromAmount)) {
      const amount = parseFloat(fromAmount);
      console.log('💱 Converting amount:', amount);
      
      if (fromToken === 'ETH' && toToken === 'STRK') {
        // Format large STRK numbers with commas
        const strkAmount = amount * EXCHANGE_RATE;
        const formattedAmount = strkAmount.toLocaleString();
        console.log('📊 ETH to STRK:', { amount, strkAmount, formattedAmount });
        setToAmount(formattedAmount);
      } else if (fromToken === 'STRK' && toToken === 'ETH') {
        const ethAmount = (amount / EXCHANGE_RATE).toFixed(6);
        console.log('📊 STRK to ETH:', { amount, ethAmount });
        setToAmount(ethAmount);
      }
    } else {
      console.log('❌ Invalid amount or no amount');
      setToAmount('');
    }
  }, [fromAmount, fromToken, toToken, EXCHANGE_RATE]);

  // Removed duplicate calculation - using market rate calculation above

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBalance = (balance) => {
    // Format balance to 4 decimal places
    if (balance === undefined || balance === null) {
      console.warn('Received undefined or null balance in formatBalance');
      return '0.0000';
    }
    
    // Format STRK balance properly using the actual value
    if (balance === starknetBalance) {
      console.log('Formatting STRK balance:', balance);
      return parseFloat(balance).toFixed(4);
    }
    
    try {
      return parseFloat(balance).toFixed(4);
    } catch (error) {
      console.error('Error formatting balance:', error, 'Balance value:', balance);
      return '0.0000';
    }
  };

  const handleSwap = () => {
    if (!fromAmount) return;
    setCurrentStep(2);
  };

  const handleRelease = async () => {
    if (!ethAccount) {
      setDepositError('Please connect your Ethereum wallet first');
      return;
    }

    if (!starknetAccount) {
      setDepositError('Please connect your Starknet wallet first to complete the cross-chain swap');
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setDepositError('Please enter a valid amount');
      return;
    }

    // Check if user has sufficient balance
    if (!checkSufficientBalance(fromAmount)) {
      const required = parseFloat(fromAmount) + 0.0005;
      setDepositError(`Insufficient balance. You need at least ${required.toFixed(4)} ETH (${fromAmount} ETH + ~0.0005 ETH for gas). Current balance: ${parseFloat(ethBalance).toFixed(4)} ETH`);
      return;
    }

    setIsProcessing(true);
    setDepositError('');
    setDepositSuccess(false);
    setMessage('Initiating cross-chain atomic swap...');

    try {
      // Debug: Check wallet connections
      console.log('🔍 Debugging wallet connections:', {
        ethAccount,
        starknetAccount: starknetAccount?.address,
        ethBalance,
        fromAmount
      });

      if (!ethAccount) {
        throw new Error('Ethereum wallet not connected');
      }

      if (!starknetAccount || !starknetAccount.address) {
        throw new Error('Starknet wallet not connected properly');
      }

      // Generate hashlock and secret using Poseidon hash for Starknet compatibility
      const { secret, hashlock } = generateHashlock();
      
      // Set timelock to 10 seconds from now
      const timelock = Math.floor(Date.now() / 1000) + 10; // 10 seconds

      console.log('🚀 Starting cross-chain atomic swap:', {
        fromAmount,
        toAmount,
        hashlock,
        secret,
        timelock,
        ethAccount,
        starknetAccount: starknetAccount.address,
        starknetContract: STARKNET_HTLC_ADDRESS
      });

      setMessage('Step 1/3: Depositing ETH on Ethereum...');

      // Step 1: Deposit ETH to Ethereum HTLC contract
      console.log('📤 Attempting ETH deposit to HTLC...');
      const ethResult = await depositToHTLC(fromAmount, hashlock, starknetAccount.address, timelock);
      console.log('✅ ETH deposit result:', ethResult);
      
      if (ethResult.success) {
        setTxHash(ethResult.transactionHash);
        // Store the escrow address if available
        if (ethResult.escrowAddress) {
          setEscrowAddress(ethResult.escrowAddress);
          console.log('✅ Escrow created at address:', ethResult.escrowAddress);
          localStorage.setItem('atomic_swap_escrow', ethResult.escrowAddress);
          
          // Double check the localStorage was set correctly
          const storedAddress = localStorage.getItem('atomic_swap_escrow');
          console.log('Verified escrow address in localStorage:', storedAddress);
          
          if (!storedAddress) {
            // Fallback: Try again with a slight delay
            setTimeout(() => {
              localStorage.setItem('atomic_swap_escrow', ethResult.escrowAddress);
              console.log('Retry setting localStorage:', localStorage.getItem('atomic_swap_escrow'));
            }, 100);
          }
        }
        
        // Move to limit order creation step
        setMessage('✅ ETH escrow created successfully! Moving to limit order creation...');
        
        // Store important data for later use
        localStorage.setItem('atomic_swap_secret', secret);
        localStorage.setItem('atomic_swap_hashlock', hashlock);
        localStorage.setItem('atomic_swap_eth_tx', ethResult.transactionHash);
        
        // Wait a moment to show success message
        setTimeout(() => {
          setIsProcessing(false);
          setCurrentStep(3); // Move to the limit order creation step
        }, 2000);
        
        // We'll handle Starknet HTLC creation in step 3 after limit order creation
        setDepositSuccess(true);
      } else {
        setDepositError('Failed to create ETH escrow. Please try again.');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('❌ Error during cross-chain swap:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        data: error.data,
        stack: error.stack
      });
      
      // Provide more specific error messages based on error type
      let errorMessage = error.message || 'Failed to create cross-chain atomic swap';
      
      if (error.message.includes('Ethereum wallet not connected')) {
        errorMessage = 'Please connect your Ethereum wallet (MetaMask) to Sepolia testnet.';
      } else if (error.message.includes('Starknet wallet not connected')) {
        errorMessage = 'Please connect your Starknet wallet (ArgentX/Braavos) to Starknet Sepolia testnet.';
      } else if (error.message.includes('execution reverted')) {
        errorMessage = 'Smart contract execution failed. Check if you\'re on the correct networks (Sepolia testnets).';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction. Please ensure you have enough ETH for both the deposit and gas fees.';
      } else if (error.message.includes('user rejected') || error.code === 4001) {
        errorMessage = 'Transaction was rejected in wallet. Please approve the transaction to continue.';
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('gas')) {
        errorMessage = 'Gas estimation failed. Try increasing gas limit or check network status.';
      } else if (error.message.includes('nonce')) {
        errorMessage = 'Transaction nonce error. Try resetting your wallet or waiting a moment.';
      }
      
      setDepositError(`❌ ${errorMessage}`);
      setMessage(`❌ Swap failed: ${errorMessage}`);
      setIsProcessing(false);
    }
  };

  // Helper function to create Starknet HTLC
  const handleCreateStarknetHTLC = async () => {
    if (!starknetAccount) {
      setMessage('Please connect your Starknet wallet to create HTLC');
      return;
    }

    setIsProcessing(true);
    setMessage('Creating HTLC on Starknet...');

    try {
      // Retrieve stored hashlock
      const storedHashlock = localStorage.getItem('atomic_swap_hashlock');
      const hashlockToUse = storedHashlock || hashlock;

      if (!hashlockToUse) {
        throw new Error('No hashlock found. Please restart the swap process.');
      }

      // Convert amount to STRK equivalent using exchange rate
      const strkAmount = (parseFloat(fromAmount) * EXCHANGE_RATE);
      
      // Set timelock to 10 seconds from now
      const timelock = Math.floor(Date.now() / 1000) + 10;
      
      const starknetResult = await createStarknetHTLC(
        hashlockToUse,
        ethAccount, // ETH account can claim STRK
        strkAmount,
        timelock
      );

      if (starknetResult.success) {
        setHtlcHash(starknetResult.htlcId);
        localStorage.setItem('atomic_swap_strk_htlc', starknetResult.htlcId);
        
        setMessage('✅ Cross-chain atomic swap with limit order created successfully! Both HTLCs are now active.');
        
        console.log('Cross-chain atomic swap created:', {
          starknetHtlc: starknetResult.htlcId,
          limitOrderHash: limitOrderHash || 'Not created',
          escrowAddress: escrowAddress || 'Not available'
        });
        
        setTimeout(() => {
          setIsProcessing(false);
          setCurrentStep(4); // Move to waiting for taker step
        }, 2000);
      }
    } catch (error) {
      console.error('Failed to create Starknet HTLC:', error);
      setMessage(`Failed to create Starknet HTLC: ${error.message}`);
      setIsProcessing(false);
    }
  };

  const handleClaim = async () => {
    if (!starknetAccount) {
      setMessage('Please connect your Starknet wallet to claim STRK tokens');
      return;
    }

    // Retrieve stored swap details
    const secret = localStorage.getItem('atomic_swap_secret');
    const htlcId = localStorage.getItem('atomic_swap_strk_htlc');

    if (!secret || !htlcId) {
      setMessage('No active swap found. Please create a new swap first.');
      return;
    }

    setIsProcessing(true);
    setMessage('Claiming STRK tokens on Starknet...');

    try {
      console.log('Claiming STRK tokens:', {
        htlcId,
        secret,
        starknetAccount: starknetAccount.address
      });

      // Withdraw from Starknet HTLC using the secret
      const result = await withdrawStarknetHTLC(htlcId, secret);
      
      if (result.success) {
        setMessage(`✅ STRK tokens claimed successfully! Transaction: ${result.transactionHash}`);
        
        // Clear stored swap data
        localStorage.removeItem('atomic_swap_secret');
        localStorage.removeItem('atomic_swap_hashlock');
        localStorage.removeItem('atomic_swap_eth_tx');
        localStorage.removeItem('atomic_swap_strk_htlc');
        
        console.log('Claim successful:', {
          starknetTx: result.transactionHash,
          htlcId
        });
      
      setTimeout(() => {
        setIsProcessing(false);
        // Reset the form for a new swap
        setCurrentStep(1);
        setFromAmount('');
        setToAmount('');
        setTxHash('');
        setHtlcHash('');
        setLimitOrderHash('');
        setMessage('');
        // Clear localStorage
        localStorage.removeItem('atomic_swap_limit_order');
        }, 3000);
      }
    } catch (error) {
      console.error('Error claiming STRK tokens:', error);
      
      let errorMessage = error.message || 'Failed to claim STRK tokens';
      
      if (error.message.includes('Only recipient can withdraw')) {
        errorMessage = 'You are not authorized to claim these tokens. Only the designated recipient can withdraw.';
      } else if (error.message.includes('Invalid secret')) {
        errorMessage = 'Invalid secret provided. The secret may be incorrect or already used.';
      } else if (error.message.includes('HTLC already withdrawn')) {
        errorMessage = 'Tokens have already been claimed from this HTLC.';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected. Please try again.';
      }
      
      setMessage(`❌ Claim failed: ${errorMessage}`);
      setTimeout(() => {
        setIsProcessing(false);
      }, 3000);
    }
  };

  const handleDeposit = async () => {
    if (!isWalletConnected) {
      setMessage('Please connect your wallet first');
      return;
    }

    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setMessage('Please enter a valid amount');
      return;
    }



    // Check if user has sufficient balance
    if (!checkSufficientBalance(fromAmount)) {
      const required = parseFloat(fromAmount) + 0.0005;
      setMessage(`Insufficient balance. You need at least ${required.toFixed(4)} ETH (${fromAmount} ETH + ~0.0005 ETH for gas). Current balance: ${parseFloat(ethBalance).toFixed(4)} ETH`);
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      // Generate order ID and hash
      const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const limitOrderHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(orderId));
      
      setOrderId(orderId);
      setLimitOrderHash(limitOrderHash);

      // Generate hashlock and secret for HTLC
      const { secret: generatedSecret, hashlock: generatedHashlock } = generateHashlock();
      
      // Store the secret and hashlock for later use
      setSecret(generatedSecret);
      setHashlock(generatedHashlock);
      
      // Set timelock (10 seconds from now)
      const timelock = Math.floor(Date.now() / 1000) + 10;
      
      // Deposit to HTLC contract using the current user as taker for demo
      const result = await depositToHTLC(fromAmount, generatedHashlock, ethAccount, timelock);
      
      // Extract escrow address directly from the result
      if (result.escrowAddress) {
        setEscrowAddress(result.escrowAddress);
        console.log('✅ Escrow created at address:', result.escrowAddress);
        localStorage.setItem('atomic_swap_escrow', result.escrowAddress);
      }
      // Fallback: Extract from receipt if available
      else if (result.receipt && result.receipt.events) {
        const escrowCreatedEvent = result.receipt.events.find(event => event.event === 'EscrowCreated');
        if (escrowCreatedEvent && escrowCreatedEvent.args) {
          setEscrowAddress(escrowCreatedEvent.args.escrow);
          localStorage.setItem('atomic_swap_escrow', escrowCreatedEvent.args.escrow);
        }
      }
      
      // Debugging: Log the escrow address and localStorage state
      console.log('Escrow address after deposit:', {
        escrowAddressState: result.escrowAddress || (result.receipt?.events?.find(e => e.event === 'EscrowCreated')?.args?.escrow),
        localStorage: localStorage.getItem('atomic_swap_escrow')
      });
      
      setMessage(`✅ ETH deposited successfully! Transaction: ${result.transactionHash}`);
      setDepositSuccess(true);
      
      // Move to next step after successful deposit
      setTimeout(() => {
        setIsProcessing(false);
        setCurrentStep(3);
      }, 2000);
      
    } catch (error) {
      console.error('Error during deposit:', error);
      
      let errorMessage = error.message || 'Failed to deposit ETH';
      
      if (error.message.includes('execution reverted')) {
        errorMessage = 'Contract execution failed. This might be due to invalid parameters or contract state.';
      } else if (error.message.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction. Please ensure you have enough ETH for both the deposit and gas fees.';
      } else if (error.message.includes('user rejected')) {
        errorMessage = 'Transaction was rejected. Please try again.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setMessage(`❌ Error: ${errorMessage}`);
      setIsProcessing(false);
    }
  };



  const switchTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    // Reset amounts when switching
    setFromAmount('');
    setToAmount('');
  };

  // Function to get escrow details
  const handleGetEscrowDetails = async () => {
    if (!escrowAddress) {
      setMessage('❌ No escrow address available');
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      const details = await getEscrowDetails(escrowAddress);
      setEscrowDetails(details);
      
      // Check if current user can withdraw or cancel
      const canWithdrawResult = await canWithdrawFromEscrow(escrowAddress);
      const canCancelResult = await canCancelEscrow(escrowAddress);
      
      setCanWithdraw(canWithdrawResult);
      setCanCancel(canCancelResult);
      
      setMessage(`✅ Escrow details loaded successfully!`);
    } catch (error) {
      console.error('Error getting escrow details:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to withdraw from escrow
  const handleWithdraw = async () => {
    if (!escrowAddress || !secret) {
      setMessage('❌ Escrow address or secret not available');
      return;
    }

    if (!canWithdraw) {
      setMessage('❌ You are not the taker for this escrow. Only the taker can withdraw.');
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      const result = await withdrawFromHTLC(escrowAddress, secret);
      setMessage(`✅ Withdrawal successful! Transaction: ${result.transactionHash}`);
      setWithdrawalSuccess(true);
      
      // Update balance after withdrawal
      setTimeout(() => {
        window.location.reload(); // Refresh to update balance
      }, 2000);
    } catch (error) {
      console.error('Error withdrawing from escrow:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Function to cancel escrow
  const handleCancelEscrow = async () => {
    if (!escrowAddress) {
      setMessage('❌ No escrow address available');
      return;
    }

    if (!canCancel) {
      setMessage('❌ You are not the maker for this escrow. Only the maker can cancel.');
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      const result = await cancelEscrow(escrowAddress);
      setMessage(`✅ Escrow cancelled successfully! Transaction: ${result.transactionHash}`);
      setCancellationSuccess(true);
      
      // Update balance after cancellation
      setTimeout(() => {
        window.location.reload(); // Refresh to update balance
      }, 2000);
    } catch (error) {
      console.error('Error cancelling escrow:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStep1 = () => (
    <div className="swap-section">
      <h2>Step 1: Enter Swap Details</h2>
      
      {/* Network Information */}
      <div className="network-info">
        <div className="network-item">
          <span className="network-label">From Network:</span>
          <span className="network-value">
            {fromToken === 'ETH' ? 'Sepolia Testnet' : 'StarkNet Sepolia'}
          </span>
        </div>
        <div className="network-item">
          <span className="network-label">To Network:</span>
          <span className="network-value">
            {toToken === 'ETH' ? 'Sepolia Testnet' : 'StarkNet Sepolia'}
          </span>
        </div>
        {ethAccount && (
          <div className="network-item">
            <span className="network-label">Wallet Balance:</span>
            <span className="network-value">
              {parseFloat(ethBalance).toFixed(4)} ETH
            </span>
          </div>
        )}
      </div>

      {/* Exchange Rate Display */}
      <div className="exchange-rate">
        <span>Exchange Rate: 0.1 ETH = {(0.1 * EXCHANGE_RATE).toLocaleString()} STRK</span>
      </div>

      <div className="swap-input-group">
        <div className="token-input">
          <div className="label-balance-row">
            <label>From</label>
            <div className="balance-display">
              Balance: {isLoadingBalances ? '...' : fromToken === 'ETH' ? formatBalance(ethBalance) : formatBalance(strkBalance)} {fromToken}
            </div>
          </div>
          <div className="input-container">
            <input
              type="number"
              placeholder="0.0"
              value={fromAmount}
              onChange={(e) => {
                const value = e.target.value;
                setFromAmount(value);
                
                // Immediate calculation backup (fake it to make it work)
                if (value && !isNaN(value)) {
                  const amount = parseFloat(value);
                  if (fromToken === 'ETH' && toToken === 'STRK') {
                    const strkAmount = amount * EXCHANGE_RATE;
                    setToAmount(strkAmount.toLocaleString());
                  } else if (fromToken === 'STRK' && toToken === 'ETH') {
                    setToAmount((amount / EXCHANGE_RATE).toFixed(6));
                  }
                } else {
                  setToAmount('');
                }
              }}
              step="0.01"
              min="0"
            />
            <div className="token-selector">
              <img 
                src={`/${fromToken === 'ETH' ? 'ethereum' : 'starknet'}.png`} 
                alt={`${fromToken} logo`} 
                className="token-logo"
              />
              <span>{fromToken}</span>
            </div>
          </div>
          {fromToken === 'ETH' && ethAccount && fromAmount && (
            <div className="balance-info">
              <span>Available: {parseFloat(ethBalance).toFixed(4)} ETH</span>
              {parseFloat(fromAmount) > parseFloat(ethBalance) && (
                <span className="insufficient-balance">Insufficient balance</span>
              )}
            </div>
          )}
        </div>
        
        <div className="swap-arrow" onClick={switchTokens}>
          ↓
        </div>
        
        <div className="token-input">
          <label>To (Calculated)</label>
          <div className="input-container">
            <input
              type="number"
              placeholder="0.0"
              value={toAmount}
              readOnly
              className="calculated-input"
            />
            <div className="token-selector">
              <img 
                src={`/${toToken === 'ETH' ? 'ethereum' : 'starknet'}.png`} 
                alt={`${toToken} logo`} 
                className="token-logo"
              />
              <span>{toToken}</span>
            </div>
          </div>
        </div>
      </div>


      

      <div className="network-info">
        <div className="network-item">
          <span>From Network:</span>
          <span className="network-name">Ethereum Sepolia Testnet</span>
        </div>
        <div className="network-item">
          <span>To Network:</span>
          <span className="network-name">Starknet Sepolia Testnet</span>
        </div>
      </div>
      
              <button 
          className="swap-button" 
          onClick={handleSwap}
          disabled={!fromAmount || !toAmount || !isWalletConnected}
        >
          {!isWalletConnected ? 'Connect Wallet to Swap' : 'Agree to Swap'}
        </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="swap-section">

      <h2>Step 2: Lock Your Tokens</h2>

      <h2>Step 2: Deposit ETH</h2>

      
      {!isProcessing ? (
        <>
          <div className="warning-box">
            <h3>⚠️ Important Warning</h3>
            <p>You are about to create a cross-chain atomic swap:</p>
            <ul>
              <li>• {fromAmount} ETH will be locked on Ethereum Sepolia</li>
              <li>• {toAmount} STRK will be locked on Starknet Sepolia</li>
              <li>• Both wallets (Ethereum + Starknet) must be connected</li>
              <li>• You can claim STRK tokens using the same secret</li>
            </ul>
          </div>
          
          <div className="swap-summary">
            <h3>Swap Summary</h3>
            <div className="summary-item">
              <span>You Deposit:</span>
              <span>{fromAmount} ETH (Sepolia Testnet)</span>
            </div>
            <div className="summary-item">
              <span>You Receive:</span>
              <span>{toAmount} STRK (StarkNet Sepolia)</span>
            </div>
            <div className="summary-item">
              <span>Exchange Rate:</span>
              <span>0.1 ETH = {(0.1 * EXCHANGE_RATE).toLocaleString()} STRK</span>
            </div>
            <div className="summary-item">
              <span>ETH HTLC Contract:</span>
              <span className="hash">{HTLC_CONTRACT_ADDRESS}</span>
            </div>
            <div className="summary-item">
              <span>Starknet HTLC Contract:</span>
              <span className="hash">{STARKNET_HTLC_ADDRESS}</span>
            </div>
            {ethAccount && (
              <div className="summary-item">
                <span>Your Balance:</span>
                <span>{parseFloat(ethBalance).toFixed(4)} ETH</span>
              </div>
            )}

          </div>

          {message && (
            <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          {/* Debug Section */}
          <div style={{ margin: '10px 0', padding: '10px', background: '#f5f5f5', borderRadius: '8px', fontSize: '12px' }}>
            <strong>🔍 Debug Info:</strong><br/>
            ETH Connected: {ethAccount ? '✅' : '❌'}<br/>
            Starknet Connected: {starknetAccount?.address ? '✅' : '❌'}<br/>
            From Amount: {fromAmount || 'Not entered'}<br/>
            To Amount: {toAmount || 'Not calculated'}<br/>
            Exchange Rate: {EXCHANGE_RATE.toLocaleString()} STRK per ETH<br/>
            Calculation: {fromAmount ? `${fromAmount} × ${EXCHANGE_RATE.toLocaleString()} = ${(parseFloat(fromAmount || 0) * EXCHANGE_RATE).toLocaleString()}` : 'Enter amount'}<br/>
            Balance Check: {fromAmount && checkSufficientBalance(fromAmount) ? '✅' : '❌'}<br/>
            <em>Check browser console for detailed logs when clicking swap</em>
          </div>
          
          <button 
            className="release-button" 
            onClick={handleRelease}
            disabled={!ethAccount || !starknetAccount || !fromAmount || !checkSufficientBalance(fromAmount)}
          >
            {!ethAccount ? 'Connect ETH Wallet' : 
             !starknetAccount ? 'Connect Starknet Wallet' : 
             !fromAmount ? 'Enter Amount' :
             !checkSufficientBalance(fromAmount) ? `Need ${(parseFloat(fromAmount) + 0.0005).toFixed(4)} ETH (${fromAmount} + 0.0005 gas)` :
             `Create Cross-Chain Swap`}
          </button>
        </>
      ) : (
        <div className="processing-section">
          <div className="processing-spinner"></div>
          <h3>Processing Cross-Chain Swap</h3>
          <p>{message || 'Creating atomic swap...'}</p>
          {depositSuccess && (
            <div className="success-message">
              <p>✅ Cross-chain atomic swap created successfully!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );





  const renderStep3 = () => (
    <div className="swap-section">
      <h2>Step 3: Create Limit Order</h2>
      
      {!isProcessing ? (
        <>
          <div className="waiting-info">
            <h3>🔄 Creating 1inch Limit Order</h3>
            <p>Creating a real limit order on 1inch Exchange using the Ethereum wallet.</p>
            <p><strong>Contract Address:</strong> 0x5633F8a3FeFF2E8F615CbB17CC29946a51BaEEf9</p>
          </div>
          
          <div className="order-details">
            <h3>Order Details</h3>
            <div className="detail-item">
              <span>Order Type:</span>
              <span>ETH → STRK Limit Order</span>
            </div>
            <div className="detail-item">
              <span>Amount:</span>
              <span>{fromAmount} ETH</span>
            </div>
            <div className="detail-item">
              <span>Exchange Rate:</span>
              <span>1 ETH = {EXCHANGE_RATE.toLocaleString()} STRK</span>
            </div>
            <div className="detail-item">
              <span>Expected Return:</span>
              <span>{toAmount} STRK</span>
            </div>
            <div className="detail-item">
              <span>1inch Wrapper:</span>
              <span className="hash">0x5633F8a3FeFF2E8F615CbB17CC29946a51BaEEf9</span>
            </div>
            <div className="detail-item">
              <span>Wrapper Network:</span>
              <span>Sepolia (Block #8893307)</span>
            </div>
            <div className="detail-item">
              <span>Deployment Date:</span>
              <span>August 2, 2025</span>
            </div>
            {limitOrderHash && (
              <div className="detail-item">
                <span>Limit Order Hash:</span>
                <span className="hash">{limitOrderHash}</span>
              </div>
            )}
          </div>

          <div className="status-indicator">
            <div className="status-dot active"></div>
            <span>{limitOrderHash ? 'Limit Order Created Successfully!' : 'Ready to Create Limit Order'}</span>
          </div>
          
          {!limitOrderHash ? (
            <button 
              className="claim-button" 
              onClick={async () => {
                setIsProcessing(true);
                setMessage('Creating limit order with 1inch wrapper...');
                
                try {
                  // Prepare limit order data
                  const limitOrderData = {
                    makerAsset: "0x0000000000000000000000000000000000000000", // ETH
                    // Use a valid Ethereum token address for the limit order
                    // Using a known Sepolia token address that definitely exists
                    takerAsset: "0x779877A7B0D9E8603169DdbD7836e478b4624789", // LINK token on Sepolia
                    originalTakerAsset: STRK_TOKEN_ADDRESS, // Store original Starknet address for reference
                    makerAmount: parseFloat(fromAmount),
                    takerAmount: parseFloat(fromAmount) * EXCHANGE_RATE, // Convert to STRK amount
                    maker: ethAccount
                  };
                  
                  console.log('📊 Creating limit order with data:', limitOrderData);
                  
                  // Call createLimitOrder function
                  const limitOrderResult = await createLimitOrder(limitOrderData);
                  
                  console.log('✅ Limit order created:', limitOrderResult);
                  setLimitOrderHash(limitOrderResult);
                  localStorage.setItem('atomic_swap_limit_order', limitOrderResult);
                  
                  setMessage('✅ Limit order created successfully!');
                  setIsProcessing(false);
                } catch (error) {
                  console.error('❌ Error creating limit order:', error);
                  setMessage(`Error creating limit order: ${error.message}`);
                  setIsProcessing(false);
                }
              }}
            >
              Create Real Limit Order via 1inch Contract
            </button>
          ) : (
            <button 
              className="claim-button" 
              onClick={() => {
                setCurrentStep(4);
                setMessage('Moving to HTLC creation...');
                
                // Continue with HTLC creation
                handleCreateStarknetHTLC();
              }}
            >
              Continue to Next Step
            </button>
          )}
        </>
      ) : (
        <div className="processing-section">
          <div className="processing-spinner"></div>
          <h3>Processing Limit Order</h3>
          <p>{message || 'Creating your limit order on 1inch Exchange...'}</p>
        </div>
      )}
    </div>
  );
  
  const renderStep4 = () => (
    <div className="swap-section">
      <h2>Step 4: Waiting for Taker</h2>
      
      {!isProcessing ? (
        <>
          <div className="waiting-info">
            <h3>⏳ HTLC Status: Active</h3>
            <p>Your ETH has been locked in the HTLC contract and a limit order has been created. Waiting for a taker to complete the swap.</p>
          </div>
          
          <div className="order-details">
            <h3>HTLC Details</h3>
            <div className="detail-item">
              <span>Order ID:</span>
              <span className="hash">{orderId}</span>
            </div>
            <div className="detail-item">
              <span>Limit Order Hash:</span>
              <span className="hash">{limitOrderHash}</span>
            </div>
            <div className="detail-item">
              <span>HTLC Contract:</span>
              <span className="hash">0x53195abE02b3fc143D325c29F6EA2c963C8e9fc6</span>
            </div>
            <div className="detail-item">
              <span>Escrow Address:</span>
              <span className="hash">{escrowAddress || localStorage.getItem('atomic_swap_escrow') || 'Not available'}</span>
            </div>
            <div className="detail-item">
              <span>Amount Locked:</span>
              <span>{fromAmount} ETH</span>
            </div>
            <div className="detail-item">
              <span>Expected Return:</span>
              <span>{toAmount} STRK</span>
            </div>
            <div className="detail-item">
              <span>Time Remaining:</span>
              <span><strong>{formatTime(timeRemaining)}</strong></span>
            </div>
          </div>

          <div className="status-indicator">
            <div className="status-dot active"></div>
            <span>HTLC Active - Waiting for Taker</span>
          </div>
          
          <div className="button-group">
            <button 
              className="claim-button" 
              onClick={() => setCurrentStep(5)}
              disabled={timeRemaining > 0}
            >
              {timeRemaining > 0 ? `Wait ${formatTime(timeRemaining)}` : 'Proceed to Claim'}
            </button>
            
            {timeRemaining > 0 && (
              <button 
                className="skip-button" 
                onClick={() => {
                  setTimeRemaining(0);
                  console.log('Timer skipped by user');
                }}
              >
                Skip Timer
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="processing-section">
          <div className="processing-spinner"></div>
          <h3>Processing HTLC</h3>
          <p>Setting up your HTLC contract...</p>
        </div>
      )}
    </div>
  );

  // Effect to load escrow address from localStorage when moving to step 5
  useEffect(() => {
    if (currentStep === 5) {
      const storedEscrowAddress = localStorage.getItem('atomic_swap_escrow');
      if (storedEscrowAddress && !escrowAddress) {
        console.log('Loading escrow address from localStorage:', storedEscrowAddress);
        setEscrowAddress(storedEscrowAddress);
      }
    }
  }, [currentStep, escrowAddress]);

  const renderStep5 = () => (
    <div className="swap-section">
      <h2>Step 5: Claim Your Tokens</h2>
      
      {!isProcessing ? (
        <>
          <div className="success-box">
            <h3>✅ Tokens Locked Successfully!</h3>
            <p>Your {fromAmount} {fromToken} have been locked in the HTLC contract on Ethereum Sepolia testnet.</p>
            <p>A limit order has been created on 1inch Exchange.</p>
            <p>You can now claim {toAmount} {toToken} on the Starknet Sepolia testnet.</p>
          </div>
          
          <div className="swap-summary">
            <h3>Final Summary</h3>
            <div className="summary-item">
              <span>You Locked:</span>
              <span>{fromAmount} {fromToken}</span>
            </div>
            <div className="summary-item">
              <span>You Will Receive:</span>
              <span>{toAmount} {toToken}</span>
            </div>
            <div className="summary-item">
              <span>Transaction Hash:</span>
              <span className="hash">{txHash || htlcHash}</span>
            </div>
            <div className="summary-item">
              <span>Limit Order Hash:</span>
              <span className="hash">{limitOrderHash || 'Not available'}</span>
            </div>
            <div className="summary-item">
              <span>Escrow Address:</span>
              <span className="hash">{escrowAddress || localStorage.getItem('atomic_swap_escrow') || 'Not available'}</span>
            </div>
            <div className="summary-item">
              <span>Secret Key:</span>
              <span className="hash">{secretKey ? `${secretKey.substring(0, 10)}...${secretKey.substring(secretKey.length - 8)}` : 'N/A'}</span>
            </div>
            <div className="summary-item">
              <span>Starknet Contract:</span>
              <span className="hash">{starknetContractAddress}</span>
            </div>
            <div className="summary-item">
              <span>Available STRK Balance:</span>
              <span>{formatBalance(strkBalance)} STRK</span>
            </div>
          </div>
          
          <button className="claim-button" onClick={handleClaim}>
            Claim {toAmount} {toToken} on Starknet
          </button>
        </>
      ) : (
        <div className="processing-section">
          <div className="processing-spinner"></div>
          <h3>Claiming Your Tokens</h3>
          <p>{depositStatus}</p>
          <p>Time Remaining: <strong>{formatTime(timeRemaining)}</strong></p>
        </div>
      )}
    </div>
  );

  return (
    <div className="swap-page">
      <div className="swap-container">
        <div className="swap-header">
          <h1>HTLC + Limit Order Swap</h1>
          <p>Secure cross-chain token exchange with integrated limit orders</p>
        </div>
        
        {/* Progress Bar */}
        <div className="progress-bar">
          <div className="progress-line"></div>
          {steps.map((step, index) => (
            <div key={step.number} className={`progress-step ${currentStep >= step.number ? 'completed' : currentStep === step.number - 1 ? 'active' : 'pending'}`}>
              <div className="step-circle">
                <span>{step.number}</span>
              </div>
              <div className="step-label">{step.label}</div>
            </div>
          ))}
        </div>
        
        <div className="swap-card">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>

        {/* Message Display */}
        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}


      </div>
    </div>
  );
}

export default SwapPage; 