import { toast } from "sonner";
import SignaturePad from "../SignaturePad";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Input } from "../ui/input";

interface SignatureSectionProps {
  signature: string;
  onUpdate: (dataURL: string) => void;
}

export default function SignatureSection({
  signature,
  onUpdate,
}: SignatureSectionProps) {
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.warning("Please upload an image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataURL = event.target?.result as string;
      onUpdate(dataURL);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Authorized Signatory</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-8">
          <div className="space-y-4">
            <label className="text-sm font-semibold text-foreground">Method 1: Draw Signature</label>
            <SignaturePad 
              initialValue={signature}
              onSave={(dataURL) => onUpdate(dataURL)}
              onClear={() => onUpdate("")}
            />
          </div>
          
          <Card className="border-dashed bg-muted/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Method 2: Upload Signature Image</CardTitle>
              <CardDescription>Upload a clear PNG/JPG with a white or transparent background.</CardDescription>
            </CardHeader>
            <CardContent>
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleSignatureUpload}
                className="max-w-md cursor-pointer"
              />
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
