import { useMutation } from '@tanstack/react-query'

export function useApiMutation<TPayload>(url: string) {
  return useMutation({
    mutationFn: async (payload: TPayload) => {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      return true as const
    },

    retry: (failureCount, error: any) => {
      const msg = String(error?.message ?? '')
      const is4xx = /^4\d{2}/.test(msg) || msg.includes('Bad Request') || msg.includes('Validation')
      return !is4xx && failureCount < 2
    },
  })
}