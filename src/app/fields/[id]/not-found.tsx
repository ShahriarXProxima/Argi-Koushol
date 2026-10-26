import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPinOff, ArrowLeft, Home } from "lucide-react";

export default function FieldNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="max-w-md w-full rounded-2xl border border-border/80 shadow-md text-center bg-card">
        <CardContent className="pt-8 pb-8 px-6 space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <MapPinOff className="size-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              প্লটটি খুঁজে পাওয়া যায়নি (Field Not Found)
            </h2>
            <p className="text-sm text-muted-foreground">
              আপনি যে জমির আইডিটি অনুসন্ধান করেছেন তা সিস্টেমের ডাটাবেজে রেকর্ড করা নেই অথবা আইডিটি ভুল।
            </p>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <Link href="/fields" className="w-full sm:w-auto">
              <Button variant="default" className="w-full sm:w-auto rounded-xl gap-2 cursor-pointer">
                <ArrowLeft className="size-4" />
                <span>সকল জমির তালিকায় ফিরে যান</span>
              </Button>
            </Link>
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto rounded-xl gap-2 cursor-pointer">
                <Home className="size-4" />
                <span>ড্যাশবোর্ডে যান</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
