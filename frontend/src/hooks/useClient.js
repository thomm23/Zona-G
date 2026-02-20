import { useEffect, useState, useCallback } from "react";
import axios from "axios";

export default function useClient(clientId, initialClient = null) {
  const [client, setClient] = useState(initialClient);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchClient = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`http://localhost:4000/clientes/${id}`);
      setClient(res.data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!clientId) return;
    // If we already have an initial client and its id matches, skip fetch
    if (initialClient && initialClient._id && (initialClient._id === clientId || initialClient.id === clientId)) {
      setClient(initialClient);
      return;
    }
    fetchClient(clientId);
  }, [clientId, initialClient, fetchClient]);

  return { client, loading, error, reload: () => fetchClient(clientId) };
}
