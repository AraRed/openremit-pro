"""
🎯 OpenRemit API Server - Phase 1: Real Bridge Aggregation
=========================================================

REPLACED: Gemini AI simulation
WITH: Real Li.Fi API + Circle CCTP estimation

Value Proposition: We compare ALL bridges and show the cheapest route.
"""

import os
import json
import requests
from decimal import Decimal
from flask import Flask, request, jsonify
from flask_cors import CORS

# --- Configuration ---
LIFI_BASE_URL = "https://li.quest/v1"

# Chain IDs (Li.Fi uses numeric chain IDs)
CHAINS = {
    "Ethereum": 1,
    "Polygon": 137,
    "Arbitrum": 42161,
    "Optimism": 10,
    "Base": 8453,
    "Avalanche": 43114,
}

# USDC addresses on different chains
USDC_ADDRESSES = {
    "Ethereum": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    "Polygon": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    "Arbitrum": "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    "Optimism": "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    "Base": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "Avalanche": "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
}

# Supported routes (our sweet spot: Ethereum → L2)
SUPPORTED_ROUTES = {
    "Ethereum": ["Base", "Arbitrum", "Optimism", "Polygon"],
    "Base": ["Arbitrum", "Optimism"],
    "Arbitrum": ["Optimism", "Base"],
    "Optimism": ["Arbitrum", "Base"],
}

# Flask App Setup
app = Flask(__name__)

# CORS Configuration - Support both development and production
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:5173').split(',')
CORS(app, origins=ALLOWED_ORIGINS + [
    'https://openremit-pro-lscw.vercel.app',  # Vercel deployment
    'https://web.telegram.org',
    'https://telegram.org'
])


# ===== HELPER FUNCTIONS =====

def get_lifi_quote(from_chain: str, to_chain: str, amount_usd: float) -> dict:
    """
    Get a quote from Li.Fi bridge aggregator

    Returns dict with:
    - provider: "Li.Fi"
    - amount_received: Decimal
    - fee_usd: Decimal
    - fee_percent: float
    - time_seconds: int
    - route_details: str (which bridges used)
    - security_score: int (1-10)
    """

    # Convert amount to wei (USDC has 6 decimals)
    amount_wei = str(int(amount_usd * 10**6))

    try:
        params = {
            "fromChain": CHAINS[from_chain],
            "toChain": CHAINS[to_chain],
            "fromToken": USDC_ADDRESSES[from_chain],
            "toToken": USDC_ADDRESSES[to_chain],
            "fromAmount": amount_wei,
            "fromAddress": "0x552008c0f6870c2f77e5cC1d2eb9bdff03e30Ea0",  # Valid EOA for quotes
            "slippage": 0.03,  # 3% slippage tolerance
        }

        print(f"  → Fetching Li.Fi quote: {from_chain} → {to_chain} (${amount_usd})")

        response = requests.get(f"{LIFI_BASE_URL}/quote", params=params, timeout=15)

        if response.status_code != 200:
            print(f"  ❌ Li.Fi API error: {response.status_code}")
            return None

        data = response.json()

        # Extract quote details
        amount_received = Decimal(data["estimate"]["toAmount"]) / Decimal(10**6)
        fee_usd = Decimal(str(amount_usd)) - amount_received
        fee_percent = float((fee_usd / Decimal(str(amount_usd))) * 100)
        time_seconds = data["estimate"]["executionDuration"]

        # Get route details (which bridges are used)
        steps = data.get("includedSteps", [])
        bridges_used = [step["tool"] for step in steps]
        route_details = " → ".join(bridges_used) if bridges_used else "Direct"

        # Security score: Li.Fi uses audited bridges (Across, Stargate = 8/10)
        security_score = 8

        print(f"  ✅ Li.Fi: ${float(amount_received):.2f} received (${float(fee_usd):.2f} fee, {fee_percent:.2f}%)")

        return {
            "provider": "Li.Fi",
            "amount_received": float(amount_received),
            "fee_usd": float(fee_usd),
            "fee_percent": fee_percent,
            "time_seconds": time_seconds,
            "route_details": route_details,
            "security_score": security_score,
            "bridge_tool": bridges_used[0] if bridges_used else "Li.Fi"
        }

    except Exception as e:
        print(f"  ❌ Li.Fi error: {str(e)}")
        return None


def get_cctp_estimate(from_chain: str, to_chain: str, amount_usd: float) -> dict:
    """
    Estimate Circle CCTP cost

    CCTP doesn't have a public quote API, so we estimate based on:
    - Gas costs for burn/mint (varies by chain)
    - CCTP V2 transfer time: ~30 seconds

    Returns same format as get_lifi_quote()
    """

    # CCTP only supports specific chains
    cctp_supported = ["Ethereum", "Arbitrum", "Optimism", "Base", "Avalanche", "Polygon"]

    if from_chain not in cctp_supported or to_chain not in cctp_supported:
        return None

    # Estimate gas costs (as of 2025)
    gas_costs = {
        "Ethereum": Decimal("3.00"),  # High L1 gas
        "Arbitrum": Decimal("0.50"),  # Low L2 gas
        "Optimism": Decimal("0.50"),
        "Base": Decimal("0.50"),
        "Avalanche": Decimal("1.00"),
        "Polygon": Decimal("0.80"),
    }

    total_gas = gas_costs[from_chain] + gas_costs[to_chain]
    amount_received = Decimal(str(amount_usd)) - total_gas
    fee_percent = float((total_gas / Decimal(str(amount_usd))) * 100)

    print(f"  ✅ CCTP: ${float(amount_received):.2f} received (${float(total_gas):.2f} fee, {fee_percent:.2f}%)")

    return {
        "provider": "Circle CCTP",
        "amount_received": float(amount_received),
        "fee_usd": float(total_gas),
        "fee_percent": fee_percent,
        "time_seconds": 30,  # CCTP V2 advertised time
        "route_details": "Canonical (Burn & Mint)",
        "security_score": 10,  # CCTP is canonical, highest security
        "bridge_tool": "CCTP"
    }


def format_route_response(quote: dict, route_id: str, is_best: bool) -> dict:
    """
    Convert quote dict to frontend-compatible Route object
    """

    # Determine provider badge type
    if quote["provider"] == "Circle CCTP":
        provider_badge = "Stablecoin"  # Using existing badge type
    else:
        provider_badge = "Bridge"

    # Determine confidence level based on security score
    if quote["security_score"] >= 9:
        confidence = "high"
    elif quote["security_score"] >= 7:
        confidence = "medium"
    else:
        confidence = "low"

    return {
        "id": route_id,
        "routeName": f"via {quote['provider']} ({quote['bridge_tool']})",
        "isBest": is_best,
        "totalCost": quote["fee_usd"],
        "recipientGets": quote["amount_received"],
        "recipientCurrency": "USDC",
        "feeBreakdown": f"({quote['fee_percent']:.2f}% bridge fee)",
        "time": f"~ {int(quote['time_seconds'] / 60)} Minutes" if quote['time_seconds'] >= 60 else "< 1 Minute",
        "provider": provider_badge,
        "confidence": confidence,
        "steps": [{
            "action": "bridge",
            "from": "USDC",
            "to": "USDC",
            "provider": quote["bridge_tool"],
            "cost": quote["fee_usd"],
            "time": f"{int(quote['time_seconds'] / 60)} min"
        }]
    }


# ===== API ENDPOINT =====

@app.route('/get_any_to_any_quote', methods=['POST'])
def handle_quote_request():
    """
    Handle quote requests from frontend

    Expected JSON:
    {
      "sendAmount": 500,
      "sourceCurrency": "USDC",
      "destinationCurrency": "USDC",
      "country": "Base"  # Using country field as destination chain for now
    }

    Returns:
    {
      "status": "OK",
      "routes": [...]
    }
    """

    data = request.json
    if not data:
        return jsonify({"error": "No JSON data"}), 400

    print(f"\n{'='*80}")
    print(f"📥 API Request: {data}")
    print(f"{'='*80}")

    # Extract parameters
    amount = data.get("sendAmount", 500)
    source_currency = data.get("sourceCurrency", "USDC")
    dest_currency = data.get("destinationCurrency", "USDC")
    dest_country = data.get("country", "Base")

    # Validation
    if source_currency != "USDC" or dest_currency != "USDC":
        return jsonify({
            "status": "ERROR",
            "error": "Currently only USDC → USDC transfers are supported (MVP scope)"
        })

    # Map country to chain (temporary - will be updated in Phase 2)
    chain_mapping = {
        "Brazil": "Base",
        "Nigeria": "Optimism",
        "United States": "Arbitrum"
    }

    from_chain = "Ethereum"  # Default source for MVP
    to_chain = chain_mapping.get(dest_country, dest_country)

    # Check if route is supported
    if from_chain not in SUPPORTED_ROUTES or to_chain not in SUPPORTED_ROUTES[from_chain]:
        return jsonify({
            "status": "UNSUPPORTED",
            "error": f"Route {from_chain} → {to_chain} not yet supported",
            "message": "Try Ethereum → Base, Arbitrum, or Optimism"
        })

    # Get quotes from both providers
    print(f"\n🔍 Fetching quotes for {from_chain} → {to_chain}...")

    lifi_quote = get_lifi_quote(from_chain, to_chain, amount)
    cctp_quote = get_cctp_estimate(from_chain, to_chain, amount)

    quotes = []
    if lifi_quote:
        quotes.append(lifi_quote)
    if cctp_quote:
        quotes.append(cctp_quote)

    if not quotes:
        return jsonify({
            "status": "ERROR",
            "error": "Unable to fetch quotes from any provider"
        })

    # Sort by amount received (highest first)
    quotes.sort(key=lambda q: q["amount_received"], reverse=True)

    # Format routes for frontend
    routes = []
    for i, quote in enumerate(quotes):
        is_best = (i == 0)  # First route is best
        route = format_route_response(quote, f"route_{i+1}", is_best)
        routes.append(route)

    # Calculate savings
    if len(quotes) >= 2:
        savings = quotes[0]["amount_received"] - quotes[1]["amount_received"]
        print(f"\n💰 Best route: {quotes[0]['provider']} saves ${savings:.2f}")

    print(f"\n{'='*80}")
    print(f"📤 Returning {len(routes)} routes")
    print(f"{'='*80}\n")

    return jsonify({
        "status": "OK",
        "routes": routes
    })


# ===== HEALTH CHECK =====

@app.route('/health', methods=['GET'])
def health_check():
    """Simple health check endpoint"""
    return jsonify({
        "status": "OK",
        "message": "OpenRemit API Server running with Li.Fi + CCTP",
        "supported_routes": SUPPORTED_ROUTES
    })


# ===== RUN SERVER =====

if __name__ == '__main__':
    # Configuration from environment (supports production deployment)
    PORT = int(os.getenv('PORT', 5000))
    HOST = os.getenv('HOST', '0.0.0.0')
    DEBUG = os.getenv('DEBUG', 'True').lower() == 'true'

    print("\n" + "="*80)
    print("🚀 OpenRemit API Server - Phase 1: Real Bridge Aggregation")
    print("="*80)
    print("✅ Li.Fi API integration: ACTIVE")
    print("✅ Circle CCTP estimation: ACTIVE")
    print("✅ USDC-only transfers: ENFORCED")
    print(f"✅ Supported routes: {list(SUPPORTED_ROUTES.keys())}")
    print(f"✅ Allowed origins: {ALLOWED_ORIGINS}")
    print("="*80)
    print(f"\n🌐 Server running on http://{HOST}:{PORT}")
    print(f"📡 Health check: http://{HOST}:{PORT}/health\n")

    app.run(host=HOST, port=PORT, debug=DEBUG)
