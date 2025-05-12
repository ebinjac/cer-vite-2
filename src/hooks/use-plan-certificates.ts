import { useState, useEffect } from 'react'
import { useTeamStore } from '@/store/team-store'
import { PLANNING_CERTIFICATE_API, PLANNING_CERTIFICATE_UPDATE_API } from '@/lib/api-endpoints'

export type CertificateChecklist = {
  validateExpiry: boolean;
  raiseTapRequest: boolean;
  downloadCertificates: boolean;
  updateKeystore: boolean;
  updateTruststore: boolean;
  installCertificates: boolean;
  restartServer: boolean;
  validateChain: boolean;
  checkExpiryDate: boolean;
  checkNewCert: boolean;
  functionalValidations: boolean;
  updateCerser: boolean;
}

export type CertificateStatus = 'completed' | 'pending' | 'continue';

export type PlanCertificate = {
  id: number;
  commonName: string;
  seriatNumber: string;
  changeNumber: string;
  renewalDate: string;
  renewedBy: string;
  currentStatus: string;
  validTo: string;
  validFrom: string | null;
  checklist: string;
  underRenewal: boolean;
  renewingTeamName: string;
  comment: string;
  zeroTouch: boolean | null;
}

const parseChecklist = (checklistStr: string): CertificateChecklist => {
  if (!checklistStr) {
    return {
      validateExpiry: false,
      raiseTapRequest: false,
      downloadCertificates: false,
      updateKeystore: false,
      updateTruststore: false,
      installCertificates: false,
      restartServer: false,
      validateChain: false,
      checkExpiryDate: false,
      checkNewCert: false,
      functionalValidations: false,
      updateCerser: false
    };
  }
  
  const values = checklistStr.split(',').map(val => val === '1');
  
  return {
    validateExpiry: values[0] || false,
    raiseTapRequest: values[1] || false,
    downloadCertificates: values[2] || false,
    updateKeystore: values[3] || false,
    updateTruststore: values[4] || false,
    installCertificates: values[5] || false,
    restartServer: values[6] || false,
    validateChain: values[7] || false,
    checkExpiryDate: values[8] || false,
    checkNewCert: values[9] || false,
    functionalValidations: values[10] || false,
    updateCerser: values[11] || false
  };
};

const serializeChecklist = (checklist: CertificateChecklist): string => {
  return [
    checklist.validateExpiry ? '1' : '0',
    checklist.raiseTapRequest ? '1' : '0',
    checklist.downloadCertificates ? '1' : '0',
    checklist.updateKeystore ? '1' : '0',
    checklist.updateTruststore ? '1' : '0',
    checklist.installCertificates ? '1' : '0',
    checklist.restartServer ? '1' : '0',
    checklist.validateChain ? '1' : '0',
    checklist.checkExpiryDate ? '1' : '0',
    checklist.checkNewCert ? '1' : '0',
    checklist.functionalValidations ? '1' : '0',
    checklist.updateCerser ? '1' : '0'
  ].join(',');
};

export const getCertificateStatus = (checklist: CertificateChecklist): CertificateStatus => {
  const checklistValues = Object.values(checklist);
  const checkedCount = checklistValues.filter(Boolean).length;
  
  if (checkedCount === 0) return 'pending';
  if (checkedCount === checklistValues.length) return 'completed';
  return 'continue';
};

export const usePlanCertificates = () => {
  const { selectedTeam } = useTeamStore();
  const [data, setData] = useState<PlanCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      
      try {
        // For now, we're using a mock API that doesn't support query parameters
        // In a real implementation, we would append the team as a query parameter
        // const url = selectedTeam 
        //   ? `${PLANNING_CERTIFICATE_API}?team=${encodeURIComponent(selectedTeam)}`
        //   : PLANNING_CERTIFICATE_API;
        
        // For this mock implementation, we'll fetch all certificates and filter in the component
        const response = await fetch(PLANNING_CERTIFICATE_API);
        
        if (!response.ok) {
          throw new Error(`Error fetching certificates: ${response.statusText}`);
        }
        
        const certificateData = await response.json() as PlanCertificate[];
        
        // We're not setting the availableTeams anymore to avoid modifying the team-switcher behavior
        
        setData(certificateData);
      } catch (err) {
        console.error('Error fetching certificates:', err);
        setIsError(true);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCertificates();
  }, []);
  
  const updateCertificateChecklist = async (
    id: number, 
    checklistUpdates: Partial<CertificateChecklist>,
    comment: string
  ) => {
    try {
      // Find the certificate in current data
      const certificateIndex = data.findIndex(cert => cert.id === id);
      if (certificateIndex === -1) {
        throw new Error(`Certificate with ID ${id} not found`);
      }
      
      // Get the current certificate and parse its checklist
      const currentCertificate = data[certificateIndex];
      const currentChecklist = parseChecklist(currentCertificate.checklist);
      
      // Update the checklist
      const updatedChecklist = {
        ...currentChecklist,
        ...checklistUpdates
      };
      
      // Serialize back to string format
      const serializedChecklist = serializeChecklist(updatedChecklist);
      
      // Get the new status based on the checklist
      const newStatus = getCertificateStatus(updatedChecklist);
      
      // API call to update the checklist
      const response = await fetch(PLANNING_CERTIFICATE_UPDATE_API(id), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checklist: serializedChecklist,
          currentStatus: newStatus,
          comment: comment
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error updating certificate: ${response.statusText}`);
      }
      
      // Update the local state
      const updatedData = [...data];
      updatedData[certificateIndex] = {
        ...currentCertificate,
        checklist: serializedChecklist,
        currentStatus: newStatus,
        comment: comment
      };
      
      setData(updatedData);
      return true;
    } catch (err) {
      console.error('Error updating certificate checklist:', err);
      return false;
    }
  };
  
  return {
    data,
    isLoading,
    isError,
    error,
    parseChecklist,
    updateCertificateChecklist,
    getCertificateStatus
  };
}; 