import { redirect } from "next/navigation";

// "My tickets" now lives on the Account page. This keeps old links working.
export default function MyTicketsPage() {
  redirect("/account#tickets");
}
