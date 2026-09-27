import { CustomerForm } from "../CustomerForm";

export default function NewCustomerPage() {
  return (
    <div className="w-full max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Customer</h1>
        <p className="text-muted-foreground">Add a new client to your directory.</p>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-6">
        <CustomerForm />
      </div>
    </div>
  );
}
