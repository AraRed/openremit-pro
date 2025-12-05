/**
 * 🎯 WHY: API Client for Flask Backend
 *
 * Centralized API calls with error handling and type safety
 *
 * 💼 INTERVIEW: "I create API client layers to:
 *    - Centralize API logic (single source of truth)
 *    - Handle errors consistently
 *    - Add authentication/headers in one place
 *    - Make testing easier (mock the API client)
 *    - Type-safe responses with TypeScript"
 */

import type { APIQuoteRequest, APIQuoteResponse } from './types'

/**
 * Base API URL
 * In development: proxied by Vite to Flask (localhost:5000)
 * In production: Railway backend URL
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

/**
 * 🔧 HOW: Fetch wrapper with error handling
 *
 * Wraps fetch() to handle common errors and parse JSON
 */
async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    })

    // Check if response is OK (status 200-299)
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    // Parse JSON
    const data = await response.json()
    return data as T

  } catch (error) {
    // Log error for debugging
    console.error('API request failed:', error)

    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw new Error(`Failed to connect to backend: ${error.message}`)
    }
    throw new Error('Unknown error occurred')
  }
}

/**
 * 📡 API: Get route quote
 *
 * Calls your Flask backend which uses Li.Fi + CCTP to compare bridges
 *
 * @param request - Amount and country from user
 * @returns Route options with costs
 */
export async function getRouteQuote(
  request: APIQuoteRequest
): Promise<APIQuoteResponse> {
  return apiRequest<APIQuoteResponse>('/get_any_to_any_quote', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

/**
 * 🎓 LEARNING NOTES:
 *
 * 1. Generic Functions:
 *    async function apiRequest<T>
 *    - T is a type parameter (like a variable for types)
 *    - Makes function reusable for different response types
 *    - TypeScript knows return type based on usage
 *
 * 2. Fetch API:
 *    - Modern way to make HTTP requests (no axios needed!)
 *    - Promises-based (use async/await)
 *    - Built into browsers
 *
 * 3. Error Handling:
 *    - try/catch for async errors
 *    - Check response.ok (status 200-299)
 *    - Throw custom errors with context
 *
 * 4. Type Assertions:
 *    return data as T
 *    - Tell TypeScript: "trust me, this is type T"
 *    - Use when you know more than TypeScript
 *
 * 5. RequestInit Type:
 *    options?: RequestInit
 *    - TypeScript type for fetch options
 *    - Includes method, headers, body, etc.
 *    - Built-in type from lib.dom.d.ts
 *
 * 6. Spread Operator for Headers:
 *    { ...options?.headers }
 *    - Merges default headers with custom ones
 *    - Optional chaining (?.) prevents errors
 *
 * 💼 INTERVIEW QUESTION: "How do you structure API calls?"
 * ANSWER: "I create an API client layer with:
 *          - Base URL configuration
 *          - Error handling wrapper
 *          - Type-safe request/response
 *          - Consistent headers/auth
 *          - Easy to mock for testing
 *
 *          This separates API logic from components,
 *          making the codebase more maintainable."
 *
 * 💼 INTERVIEW QUESTION: "Why use generics?"
 * ANSWER: "Generics make functions reusable while maintaining
 *          type safety. Instead of writing separate functions
 *          for each response type, I use <T> to create one
 *          function that works for all types. TypeScript
 *          infers the correct type based on usage."
 */
