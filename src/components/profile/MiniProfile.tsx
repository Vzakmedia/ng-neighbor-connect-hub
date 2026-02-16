import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { MessageCircle, User, MapPin, Calendar, Shield } from "@/lib/icons";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom"; // Assuming we have this
import { DirectMessageDialog } from "@/components/DirectMessageDialog";

interface MiniProfileProps {
    userId: string | null; // If null, the component is closed (or handles internal state if controlled differently)
    isOpen: boolean;
    onClose: () => void;
}

export const MiniProfile = ({ userId, isOpen, onClose }: MiniProfileProps) => {
    const isMobile = useIsMobile();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [showDirectMessage, setShowDirectMessage] = useState(false);

    useEffect(() => {
        if (isOpen && userId) {
            fetchProfile(userId);
        } else {
            setProfile(null);
        }
    }, [isOpen, userId]);

    const fetchProfile = async (id: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('public_profiles')
                .select('*')
                .eq('user_id', id)
                .single();

            if (data) {
                setProfile(data);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMessage = () => {
        if (!currentUser) return; // Prompt login?
        setShowDirectMessage(true);
        // onClose(); // Keep mini profile open? Or close it? Usually better to keep open or close once chat starts.
        // Let's keep it open but the chat dialog will be on top.
    };

    const handleViewFullProfile = () => {
        navigate(`/profile/${profile?.user_id}`); // Assuming this route exists
        onClose();
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short'
        });
    };

    const content = (
        <div className="flex flex-col items-center space-y-4 p-4">
            {loading ? (
                <div className="h-40 flex items-center justify-center w-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : profile ? (
                <>
                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                        <AvatarImage src={profile.avatar_url} />
                        <AvatarFallback className="text-2xl">{profile.display_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="text-center space-y-1 w-full">
                        <div className="flex items-center justify-center gap-2">
                            <h3 className="text-xl font-bold">{profile.display_name || 'Anonymous'}</h3>
                            {profile.is_verified && <Shield className="w-4 h-4 text-blue-500" />}
                        </div>

                        {(profile.neighborhood || profile.city) && (
                            <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                <span>{profile.neighborhood ? `${profile.neighborhood}, ` : ''}{profile.city || ''}</span>
                            </div>
                        )}

                        {profile.created_at && (
                            <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground/80">
                                <Calendar className="w-3 h-3" />
                                <span>Joined {formatDate(profile.created_at)}</span>
                            </div>
                        )}
                    </div>

                    {profile.bio && (
                        <p className="text-sm text-center text-muted-foreground max-w-xs line-clamp-3">
                            {profile.bio}
                        </p>
                    )}

                    <div className="flex gap-3 w-full max-w-xs pt-2">
                        {currentUser?.id !== profile.user_id && (
                            <Button className="flex-1" onClick={handleMessage}>
                                <MessageCircle className="w-4 h-4 mr-2" />
                                Message
                            </Button>
                        )}
                        <Button variant="outline" className="flex-1" onClick={handleViewFullProfile}>
                            <User className="w-4 h-4 mr-2" />
                            Profile
                        </Button>
                    </div>
                </>
            ) : (
                <div className="text-center py-8 text-muted-foreground">User not found</div>
            )}
        </div>
    );

    if (isMobile) {
        return (
            <>
                <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
                    <DrawerContent>
                        <DrawerHeader className="text-left hidden">
                            <DrawerTitle>User Profile</DrawerTitle>
                            <DrawerDescription>User details</DrawerDescription>
                        </DrawerHeader>
                        {content}
                        <DrawerFooter className="pt-2">
                            <Button variant="ghost" onClick={onClose}>Close</Button>
                        </DrawerFooter>
                    </DrawerContent>
                </Drawer>

                {/* Direct Message Dialog (nested or separate) */}
                {profile && (
                    <DirectMessageDialog
                        isOpen={showDirectMessage}
                        onClose={() => setShowDirectMessage(false)}
                        recipientId={profile.user_id}
                        recipientName={profile.display_name || 'User'}
                        recipientAvatar={profile.avatar_url}
                    />
                )}
            </>
        );
    }

    return (
        <>
            <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader className="hidden">
                        <DialogTitle>User Profile</DialogTitle>
                    </DialogHeader>
                    {content}
                </DialogContent>
            </Dialog>

            {/* Direct Message Dialog */}
            {profile && (
                <DirectMessageDialog
                    isOpen={showDirectMessage}
                    onClose={() => setShowDirectMessage(false)}
                    recipientId={profile.user_id}
                    recipientName={profile.display_name || 'User'}
                    recipientAvatar={profile.avatar_url}
                />
            )}
        </>
    );
};
