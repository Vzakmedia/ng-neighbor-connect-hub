import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";
import SupportTicketForm from "@/components/settings/SupportTicketForm";

interface SupportTicketDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SupportTicketDialog({ open, onOpenChange }: SupportTicketDialogProps) {
    const isMobile = useIsMobile();

    if (!isMobile) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Contact Support</DialogTitle>
                        <DialogDescription>
                            Submit a ticket and our team will get back to you shortly.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {/* Pass generic Card style removal if needed, but the form uses Card internally. 
                For cleaner UI inside a Dialog, we might want to strip the Card wrapper, 
                but using it as-is is acceptable for speed. */}
                        <div className="[&>div]:border-0 [&>div]:shadow-none [&>div]:p-0 [&_div.p-6]:p-0">
                            <SupportTicketForm onSuccess={() => onOpenChange(false)} />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        );
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent>
                <DrawerHeader className="text-left">
                    <DrawerTitle>Contact Support</DrawerTitle>
                    <DrawerDescription>
                        Submit a ticket and our team will get back to you shortly.
                    </DrawerDescription>
                </DrawerHeader>
                <div className="px-4 pb-4 overflow-y-auto max-h-[80vh]">
                    <div className="[&>div]:border-0 [&>div]:shadow-none [&>div]:p-0 [&_div.p-6]:p-0">
                        <SupportTicketForm onSuccess={() => onOpenChange(false)} />
                    </div>
                </div>
                <DrawerFooter className="pt-2">
                    <DrawerClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
