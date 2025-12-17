# OpenRemit Pro

**Cross-chain USDC bridge aggregator with real-time quote comparison**

OpenRemit compares bridge costs across multiple protocols (Circle CCTP, Across, Stargate, etc.) via Li.Fi API to find you the cheapest route for USDC transfers between Ethereum and Layer 2 networks.

![Phase](https://img.shields.io/badge/Phase-5%20Complete-success)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

✅ **Real-time Bridge Comparison** - Compare costs across 10+ bridge protocols
✅ **Multi-Chain Support** - Ethereum → Base, Arbitrum, Optimism
✅ **Transaction Execution** - Execute bridges directly from the app with wallet integration
✅ **Smart Approvals** - Automatic token approval handling via Li.Fi SDK
✅ **Network Switching** - Auto-prompts to switch to the correct network
✅ **Transaction Tracking** - Track status with links to Li.Fi Explorer
✅ **Beautiful UI** - Clean, responsive interface with success animations
✅ **Type-Safe** - Full TypeScript support throughout

## Tech Stack

### Frontend
- **React 18** + **TypeScript** - Modern UI with type safety
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **Zustand** - Lightweight state management (1KB)
- **Framer Motion** - Smooth animations

### Web3
- **Wagmi v2** - React hooks for Ethereum
- **Viem** - TypeScript Ethereum library
- **Li.Fi SDK** - Cross-chain bridge aggregation
- **Canvas Confetti** - Success celebrations

### Backend
- **Flask** (Python) - API server for quote aggregation
- **Li.Fi HTTP API** - Bridge quote fetching
- **CCTP Integration** - Circle's native USDC bridge

## Quick Start

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.8+ and pip
- **MetaMask** or compatible Web3 wallet

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/openremit-pro.git
cd openremit-pro
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Install Backend Dependencies
```bash
cd api_server
pip install -r requirements.txt
cd ..
```

### 4. Configure Environment Variables
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
# Optional: WalletConnect Project ID (get free at cloud.walletconnect.com)
VITE_WALLETCONNECT_PROJECT_ID=your_project_id_here

# Optional: Alchemy RPC (recommended for better reliability)
VITE_ALCHEMY_API_KEY=your_alchemy_key_here
```

### 5. Start the Backend Server
```bash
cd api_server
python api_server.py
```

The API server will start on `http://localhost:5001`

### 6. Start the Frontend (in a new terminal)
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Usage

### Getting a Quote
1. **Enter Amount** - Input USDC amount to transfer
2. **Select Destination** - Choose Brazil, Nigeria, or another supported country
3. **View Routes** - Compare bridge costs sorted by cheapest, fastest, or popular

### Executing a Transfer
1. **Connect Wallet** - Click "Connect Wallet" and select your wallet
2. **Select Route** - Choose the best route from the comparison
3. **Review Pre-flight Checks** - Verify network, balance, and route
4. **Approve USDC** (if needed) - One-time approval for the bridge contract
5. **Execute Transfer** - Confirm the bridge transaction in your wallet
6. **Track Progress** - Monitor status with link to Li.Fi Explorer

## Project Structure

```
openremit-pro/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (Button, Card, etc.)
│   │   ├── wallet/         # Wallet connection components
│   │   └── TransactionStatus.tsx
│   ├── screens/            # Main app screens
│   │   ├── QuoteScreen.tsx
│   │   ├── RouteComparisonScreen.tsx
│   │   └── TransactionScreen.tsx
│   ├── hooks/              # Custom React hooks
│   │   ├── useTokenBalance.ts
│   │   ├── useTokenApproval.ts
│   │   └── useBridgeTransaction.ts
│   ├── lib/                # Utilities and helpers
│   │   ├── api.ts          # API client
│   │   ├── contracts.ts    # Smart contract addresses
│   │   ├── lifi.ts         # Li.Fi SDK integration
│   │   └── types.ts        # TypeScript types
│   ├── store/              # State management
│   │   └── useStore.ts     # Zustand store
│   ├── config/             # Configuration
│   │   └── wagmi.ts        # Wagmi/wallet config
│   └── providers/          # Context providers
│       ├── WalletProvider.tsx
│       └── TelegramProvider.tsx
├── api_server/             # Flask backend
│   ├── api_server.py       # Main API server
│   └── requirements.txt    # Python dependencies
└── public/                 # Static assets
```

## Supported Chains

| Chain | Chain ID | USDC Address |
|-------|----------|--------------|
| Ethereum Mainnet | 1 | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| Base | 8453 | `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` |
| Arbitrum | 42161 | `0xaf88d065e77c8cC2239327C5EDb3A432268e5831` |
| Optimism | 10 | `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85` |

## Development

### Build for Production
```bash
npm run build
```

### Type Checking
```bash
npm run type-check
```

### Linting
```bash
npm run lint
```

## Architecture Decisions

### Why Li.Fi SDK over HTTP API?
The SDK automatically handles:
- Token approval detection and execution
- Multi-step route execution
- Network switching logic
- Transaction building

### Why Wagmi v2?
- Industry standard for React + Ethereum
- Type-safe hooks for wallet operations
- Built-in support for multiple wallets
- Excellent documentation and community

### Why Zustand over Redux?
- **Simpler**: No actions/reducers boilerplate
- **Smaller**: 1KB vs Redux's 12KB+
- **Type-safe**: First-class TypeScript support
- **Performant**: Selective subscriptions prevent unnecessary renders

### Why Flask backend?
- Quick prototyping for API aggregation
- Easy integration with Li.Fi HTTP API
- Simple deployment to Vercel/Railway

## Deployment

### Frontend (Vercel)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Backend (Railway/Render)
1. Push `api_server/` to a separate repo or monorepo
2. Create new Python service
3. Set start command: `python api_server.py`
4. Deploy

## Roadmap

- [x] Phase 1: Real bridge aggregation (Li.Fi + CCTP)
- [x] Phase 2: Wallet connection
- [x] Phase 3: Transaction execution
- [x] Phase 4: Polish & UX improvements
- [x] Phase 5: Success animations & copy-to-clipboard
- [ ] Phase 6: Multi-token support (USDT, DAI, etc.)
- [ ] Phase 7: Transaction history
- [ ] Phase 8: Gas estimation
- [ ] Phase 9: Mobile app (React Native)
- [ ] Phase 10: Telegram Mini App deployment

## Security

- ⚠️ **Never commit `.env` file** - It may contain sensitive API keys
- ⚠️ **Use testnet first** - Test with Sepolia before mainnet
- ⚠️ **Verify contract addresses** - Always double-check addresses before approving
- ⚠️ **Private keys stay in browser** - Transaction signing happens locally via wallet

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details

## Acknowledgments

- **Li.Fi** - Cross-chain bridge aggregation API
- **Circle** - USDC and CCTP protocol
- **Wagmi** - React hooks for Ethereum
- **Telegram** - Mini Apps platform

---

**Built with ❤️ for the cross-chain future**

For questions or support, open an issue on GitHub.
