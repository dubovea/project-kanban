import { Wifi, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useNetworkStatus } from "@/lib/network-status";
import { cn } from "@/lib/utils";

export function NetworkStatusBadge() {
  const isOnline = useNetworkStatus();
  const Icon = isOnline ? Wifi : WifiOff;

  return (
    <Badge
      variant={isOnline ? "outline" : "destructive"}
      className={cn("gap-1.5", isOnline && "text-muted-foreground")}
      title={isOnline ? "Online" : "Offline"}
    >
      <Icon className="size-3.5" />
      {isOnline ? "Online" : "Offline"}
    </Badge>
  );
}
