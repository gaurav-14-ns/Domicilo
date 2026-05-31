import {
  Badge,
  transactionStatusClass,
} from "@/components/ui/badge";

interface Props {
  status?: string;
}

export function TransactionStatusBadge({
  status,
}: Props) {

  return (
    <Badge
      variant="outline"
      className={`
        capitalize
        ${transactionStatusClass(status)}
      `}
    >
      {status}
    </Badge>
  );
}
