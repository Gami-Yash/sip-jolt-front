const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const handleResponse = async (response) => {
  if (!response.ok) {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json();
        throw new Error(error.error || error.message || `HTTP ${response.status}`);
      } else {
        throw new Error(`HTTP ${response.status}: Server error`);
      }
    } catch (e) {
      if (e.message && e.message.includes('Unexpected')) {
        throw new Error(`HTTP ${response.status}: Server error`);
      }
      throw e;
    }
  }
  try {
    return await response.json();
  } catch (e) {
    throw new Error('Failed to parse response: ' + e.message);
  }
};

export const api = {
  technicians: {
    createOrGet: async (technicianId, name) => {
      try {
        const response = await fetch(`${API_BASE}/technicians`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ technicianId, name })
        });
        const result = await handleResponse(response);
        if (!result || !result.technician) {
          console.error('Invalid technician response:', result);
          throw new Error('Server returned invalid technician data');
        }
        return result;
      } catch (error) {
        console.error('createOrGet error:', error);
        throw error;
      }
    },
    
    getProfile: async (technicianId) => {
      const response = await fetch(`${API_BASE}/technicians/${technicianId}`);
      return handleResponse(response);
    },
    
    getVisits: async (technicianId, limit = 50) => {
      const response = await fetch(`${API_BASE}/technicians/${technicianId}/visits?limit=${limit}`);
      return handleResponse(response);
    },
    
    getPrizes: async (technicianId, limit = 50) => {
      const response = await fetch(`${API_BASE}/technicians/${technicianId}/prizes?limit=${limit}`);
      return handleResponse(response);
    }
  },
  
  visits: {
    submit: async (visitData) => {
      const response = await fetch(`${API_BASE}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(visitData)
      });
      return handleResponse(response);
    }
  },
  
  prizes: {
    submit: async (prizeData) => {
      const response = await fetch(`${API_BASE}/prizes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prizeData)
      });
      return handleResponse(response);
    }
  },
  
  photos: {
    submit: async (photoData) => {
      const response = await fetch(`${API_BASE}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(photoData)
      });
      return handleResponse(response);
    }
  },
  
  ai: {
    chat: async (message, image, systemPrompt) => {
      const response = await fetch(`${API_BASE}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, image, systemPrompt })
      });
      return handleResponse(response);
    }
  },
  
  aiChats: {
    log: async (logData) => {
      const response = await fetch(`${API_BASE}/ai-chats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logData)
      });
      return handleResponse(response);
    }
  },
  
  auth: {
    verifyOpsCode: async (code) => {
      const response = await fetch(`${API_BASE}/auth/ops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      return handleResponse(response);
    }
  },
  
  ops: {
    getFleet: async (opsToken) => {
      const response = await fetch(`${API_BASE}/ops/fleet?opsToken=${opsToken}`);
      return handleResponse(response);
    },
    
    getTechnicians: async (opsToken) => {
      const response = await fetch(`${API_BASE}/ops/technicians?opsToken=${opsToken}`);
      return handleResponse(response);
    },
    
    getVisits: async (opsToken, limit = 50) => {
      const response = await fetch(`${API_BASE}/ops/visits?limit=${limit}&opsToken=${opsToken}`);
      return handleResponse(response);
    },
    
    getPrizes: async (opsToken) => {
      const response = await fetch(`${API_BASE}/ops/prizes?opsToken=${opsToken}`);
      return handleResponse(response);
    },
    
    exportData: async (type, opsToken) => {
      const response = await fetch(`${API_BASE}/ops/export/${type}?opsToken=${opsToken}`);
      return handleResponse(response);
    },
    
    machines: {
      create: async (machineData, opsToken) => {
        const response = await fetch(`${API_BASE}/ops/machines?opsToken=${opsToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(machineData)
        });
        return handleResponse(response);
      },
      
      update: async (machineId, updates, opsToken) => {
        const response = await fetch(`${API_BASE}/ops/machines/${machineId}?opsToken=${opsToken}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        return handleResponse(response);
      },
      
      delete: async (machineId, opsToken) => {
        const response = await fetch(`${API_BASE}/ops/machines/${machineId}?opsToken=${opsToken}`, {
          method: 'DELETE'
        });
        return handleResponse(response);
      }
    }
  }
};
