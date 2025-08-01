import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, VideoIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface IncomingCallDialogProps {
  open: boolean;
  callerName: string;
  callerAvatar?: string;
  isVideoCall: boolean;
  onAccept: (acceptVideo: boolean) => void;
  onDecline: () => void;
}

export const IncomingCallDialog: React.FC<IncomingCallDialogProps> = ({
  open,
  callerName,
  callerAvatar,
  isVideoCall,
  onAccept,
  onDecline
}) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isVideoCall ? 'Incoming Video Call' : 'Incoming Voice Call'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-6">
          <Avatar className="w-24 h-24">
            <AvatarImage src={callerAvatar} />
            <AvatarFallback className="text-2xl">
              {callerName?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold">{callerName}</h3>
            <p className="text-sm text-muted-foreground">
              {isVideoCall ? 'wants to video call you' : 'is calling you'}
            </p>
          </div>
          
          <div className="flex gap-4">
            <Button
              variant="destructive"
              size="lg"
              onClick={onDecline}
              className="rounded-full w-16 h-16"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
            
            <Button
              variant="default"
              size="lg"
              onClick={() => onAccept(false)}
              className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700"
            >
              <Phone className="h-6 w-6" />
            </Button>
            
            {isVideoCall && (
              <Button
                variant="default"
                size="lg"
                onClick={() => onAccept(true)}
                className="rounded-full w-16 h-16 bg-blue-600 hover:bg-blue-700"
              >
                <VideoIcon className="h-6 w-6" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};