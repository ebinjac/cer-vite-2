export function getIsAdminFromDOM(): boolean {
  if (typeof window === 'undefined') return false
  const el = document.getElementById('isAdmin')
  return el?.textContent === 'true'
}

export function getUsernameFromDOM(): string {
  if (typeof window === 'undefined') return ''
  const el = document.getElementById('username')
  return el?.textContent || ''
} 