import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CertificateAddFormValues } from '@/components/certificates/CertificateAddDrawerForm'

interface CertificateAddFormStore {
  formValues: Partial<CertificateAddFormValues>
  setFormValues: (values: Partial<CertificateAddFormValues>) => void
  resetForm: () => void
}

export const useCertificateAddFormStore = create<CertificateAddFormStore>()(
  persist(
    (set) => ({
      formValues: {},
      setFormValues: (values) => set({ formValues: values }),
      resetForm: () => set({ formValues: {} }),
    }),
    {
      name: 'certificate-add-form-storage',
    }
  )
) 