
"use client";

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from 'lucide-react';

export function ClientTracking() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!trackingNumber.trim()) {
      setError('Please enter a tracking number, name, or email.');
      return;
    }
    setError('');
    startTransition(() => {
      router.push(`/track/${trackingNumber}`);
    });
  };

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Track Your Shipment</CardTitle>
        <CardDescription className="text-center">Enter your BBL, Consignment, or Shakers number, or your name/email below to see the status of your shipment.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              id="trackingNumber"
              placeholder="e.g., BBL-123456, John Doe, or john@email.com"
              value={trackingNumber}
              onChange={(e) => {
                setTrackingNumber(e.target.value);
                if (error) setError('');
              }}
              className="py-6 text-base"
            />
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </div>
          <Button type="submit" className="w-full py-6" disabled={isPending}>
            {isPending ? (
              'Tracking...'
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Track
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
