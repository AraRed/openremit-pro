/**
 * 🎯 WHY: Barrel Export Pattern
 *
 * Instead of:
 * import { Button } from '@/components/ui/Button'
 * import { Input } from '@/components/ui/Input'
 * import { Card } from '@/components/ui/Card'
 *
 * We can do:
 * import { Button, Input, Card } from '@/components/ui'
 *
 * 💼 INTERVIEW: "I use barrel exports to simplify imports and
 *    create a clean public API for component libraries."
 */

export { Button } from './Button'
export { Input } from './Input'
export { Card } from './Card'
