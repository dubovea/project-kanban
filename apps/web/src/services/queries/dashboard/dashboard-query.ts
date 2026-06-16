import { dashboardApi } from "@/services/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
const 

  const queryClient = useQueryClient()

  // Queries
  const query = useQuery({ queryKey: ['todos'], queryFn: dashboardApi.getDashboard() })