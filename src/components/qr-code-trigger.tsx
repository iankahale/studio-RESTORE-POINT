
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';
import { QrCodeScannerDialog } from '@/components/qr-code-scanner-dialog';

export function QrCodeTrigger() {
    const [isScannerOpen, setScannerOpen] = useState(false);

    return (
        <>
            <Button variant="outline" onClick={() => setScannerOpen(true)}>
                <QrCode className="mr-2 h-4 w-4" />
                Scan QR Code
            </Button>
            <QrCodeScannerDialog open={isScannerOpen} onOpenChange={setScannerOpen} />
        </>
    );
}
