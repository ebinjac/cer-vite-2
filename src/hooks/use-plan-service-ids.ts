import { useState, useEffect } from 'react'
import { useTeamStore } from '@/store/team-store'
import { PLANNING_SERVICEID_API } from '@/lib/api-endpoints'

export type ServiceIdChecklist = {
  validateExpiry: boolean;
  raiseIIQRequest: boolean;
  createChangeRequest: boolean;
  scheduleDowntime: boolean;
  notifyStakeholders: boolean;
  backupConfigurations: boolean;
  updateCredentials: boolean;
  updateApplicationConfig: boolean;
  updateDependentSystems: boolean;
  testConnectivity: boolean;
  verifyIntegration: boolean;
  performHealthCheck: boolean;
  documentChanges: boolean;
  closureValidation: boolean;
}

export type ServiceIdStatus = 'completed' | 'pending' | 'continue';

export type PlanServiceId = {
  id: number;
  scid: string;
  changeNumber: string;
  renewalDate: string;
  renewedBy: string;
  currentStatus: string;
  expDate: string;
  checklist: string;
  underRenewal: boolean;
  renewingTeamName: string;
  comment: string;
}

const parseChecklist = (checklistStr: string): ServiceIdChecklist => {
  if (!checklistStr) {
    return {
      validateExpiry: false,
      raiseIIQRequest: false,
      createChangeRequest: false,
      scheduleDowntime: false,
      notifyStakeholders: false,
      backupConfigurations: false,
      updateCredentials: false,
      updateApplicationConfig: false,
      updateDependentSystems: false,
      testConnectivity: false,
      verifyIntegration: false,
      performHealthCheck: false,
      documentChanges: false,
      closureValidation: false
    };
  }
  
  const values = checklistStr.split(',').map(val => val === '1');
  
  return {
    validateExpiry: values[0] || false,
    raiseIIQRequest: values[1] || false,
    createChangeRequest: values[2] || false,
    scheduleDowntime: values[3] || false,
    notifyStakeholders: values[4] || false,
    backupConfigurations: values[5] || false,
    updateCredentials: values[6] || false,
    updateApplicationConfig: values[7] || false,
    updateDependentSystems: values[8] || false,
    testConnectivity: values[9] || false,
    verifyIntegration: values[10] || false,
    performHealthCheck: values[11] || false,
    documentChanges: values[12] || false,
    closureValidation: values[13] || false
  };
};

const serializeChecklist = (checklist: ServiceIdChecklist): string => {
  return [
    checklist.validateExpiry ? '1' : '0',
    checklist.raiseIIQRequest ? '1' : '0',
    checklist.createChangeRequest ? '1' : '0',
    checklist.scheduleDowntime ? '1' : '0',
    checklist.notifyStakeholders ? '1' : '0',
    checklist.backupConfigurations ? '1' : '0',
    checklist.updateCredentials ? '1' : '0',
    checklist.updateApplicationConfig ? '1' : '0',
    checklist.updateDependentSystems ? '1' : '0',
    checklist.testConnectivity ? '1' : '0',
    checklist.verifyIntegration ? '1' : '0',
    checklist.performHealthCheck ? '1' : '0',
    checklist.documentChanges ? '1' : '0',
    checklist.closureValidation ? '1' : '0'
  ].join(',');
};

export const getServiceIdStatus = (checklist: ServiceIdChecklist): ServiceIdStatus => {
  const checklistValues = Object.values(checklist);
  const checkedCount = checklistValues.filter(Boolean).length;
  
  if (checkedCount === 0) return 'pending';
  if (checkedCount === checklistValues.length) return 'completed';
  return 'continue';
};

export const usePlanServiceIds = () => {
  const { selectedTeam } = useTeamStore();
  const [data, setData] = useState<PlanServiceId[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchServiceIds = async () => {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      
      try {
        // For mocking purposes, we'll use a hardcoded response
        // In a real implementation, we would make an API call to PLANNING_SERVICEID_API
        // const response = await fetch(PLANNING_SERVICEID_API);
        
        // For now, let's use the sample data provided
        const mockData = [
          {
            "id": 1290,
            "scid": "svc-e3.desre.netauto",
            "changeNumber": "CHG1234567",
            "renewalDate": "2024-10-29",
            "renewedBy": "hranja",
            "currentStatus": "completed",
            "expDate": "2024-10-31",
            "checklist": "1,1,1,1,1,1,1,1,1,1,1,1,1,1",
            "renewingTeamName": "enterprise-security",
            "comment": "",
            "underRenewal": false
          },
          {
            "id": 1291,
            "scid": "svc-e2.cloud.gateway",
            "changeNumber": "CHG2345678",
            "renewalDate": "2024-11-15",
            "renewedBy": "amkada",
            "currentStatus": "pending",
            "expDate": "2024-11-20",
            "checklist": "0,0,0,0,0,0,0,0,0,0,0,0,0,0",
            "renewingTeamName": "CloudSecurity",
            "comment": "Awaiting approvals",
            "underRenewal": false
          },
          {
            "id": 1292,
            "scid": "svc-e1.mobile.token",
            "changeNumber": "CHG3456789",
            "renewalDate": "2024-12-10",
            "renewedBy": "jsmith",
            "currentStatus": "continue",
            "expDate": "2024-12-25",
            "checklist": "1,1,1,1,0,0,0,0,0,0,0,0,0,0",
            "renewingTeamName": "Mobile-Team",
            "comment": "Renewal work in progress",
            "underRenewal": true
          },
          {
            "id": 1293,
            "scid": "svc-e2.data.processor",
            "changeNumber": "CHG4567890",
            "renewalDate": "2025-01-05",
            "renewedBy": "mwilson",
            "currentStatus": "completed",
            "expDate": "2025-01-10",
            "checklist": "1,1,1,1,1,1,1,1,1,1,1,1,1,1",
            "renewingTeamName": "Data-Cert",
            "comment": "Renewal completed and validated",
            "underRenewal": false
          }
        ];
        
        // Store the teams in the team store if available
        if (mockData.length > 0) {
          const teams = [...new Set(mockData
            .map(svc => svc.renewingTeamName)
            .filter((team): team is string => Boolean(team))
            .sort()
          )];
          
          if (teams.length > 0) {
            useTeamStore.getState().setAvailableTeams(teams);
          }
        }
        
        setData(mockData);
      } catch (err) {
        console.error('Error fetching service IDs:', err);
        setIsError(true);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchServiceIds();
  }, []);
  
  const updateServiceIdChecklist = async (
    id: number, 
    checklistUpdates: Partial<ServiceIdChecklist>,
    comment: string
  ) => {
    try {
      // Find the service ID in current data
      const serviceIdIndex = data.findIndex(svc => svc.id === id);
      if (serviceIdIndex === -1) {
        throw new Error(`Service ID with ID ${id} not found`);
      }
      
      // Get the current service ID and parse its checklist
      const currentServiceId = data[serviceIdIndex];
      const currentChecklist = parseChecklist(currentServiceId.checklist);
      
      // Update the checklist
      const updatedChecklist = {
        ...currentChecklist,
        ...checklistUpdates
      };
      
      // Serialize back to string format
      const serializedChecklist = serializeChecklist(updatedChecklist);
      
      // Get the new status based on the checklist
      const newStatus = getServiceIdStatus(updatedChecklist);
      
      // In a real implementation, we would make an API call to update the checklist
      // For now, we'll just update the local state
      
      // Update the local state
      const updatedData = [...data];
      updatedData[serviceIdIndex] = {
        ...currentServiceId,
        checklist: serializedChecklist,
        currentStatus: newStatus,
        comment: comment
      };
      
      setData(updatedData);
      return true;
    } catch (err) {
      console.error('Error updating service ID checklist:', err);
      return false;
    }
  };
  
  return {
    data,
    isLoading,
    isError,
    error,
    parseChecklist,
    updateServiceIdChecklist,
    getServiceIdStatus
  };
}; 