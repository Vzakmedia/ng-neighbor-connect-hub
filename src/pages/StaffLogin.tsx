import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";

interface InvitationInfo {
  id: string;
  email: string;
  role: string;
  invitation_code: string;
  expires_at: string;
  status: string;
}

const StaffLogin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const [validatingInvitation, setValidatingInvitation] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Check if user is already logged in and redirect
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Get invitation code from URL parameters
  useEffect(() => {
    const invitationParam = searchParams.get('invitation');
    if (invitationParam) {
      setInvitationCode(invitationParam);
      setIsLogin(false); // Switch to signup mode for invitations
      validateInvitation(invitationParam);
    }
  }, [searchParams]);

  const validateInvitation = async (code: string) => {
    if (!code) return;

    setValidatingInvitation(true);
    try {
      const { data, error } = await supabase
        .from('staff_invitations')
        .select('*')
        .eq('invitation_code', code)
        .eq('status', 'pending')
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        toast({
          title: "Invalid Invitation",
          description: "This invitation code is invalid, expired, or has already been used.",
          variant: "destructive"
        });
        return;
      }

      setInvitationInfo(data);
      setFormData(prev => ({ ...prev, email: data.email }));
    } catch (error) {
      console.error('Error validating invitation:', error);
      toast({
        title: "Error",
        description: "Failed to validate invitation code",
        variant: "destructive"
      });
    } finally {
      setValidatingInvitation(false);
    }
  };

  const handleInvitationCodeChange = (code: string) => {
    setInvitationCode(code);
    if (code.length >= 12) { // Invitation codes are 12 characters
      validateInvitation(code);
    } else {
      setInvitationInfo(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Handle login
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (error) throw error;
        
        toast({
          title: "Welcome back!",
          description: "Successfully logged in"
        });
      } else {
        // Handle signup with invitation
        if (!invitationInfo) {
          throw new Error('Valid invitation required for staff registration');
        }

        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        // Sign up the user
        const redirectUrl = `${window.location.origin}/`;
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        
        if (error) throw error;

        if (data.user) {
          // Accept the invitation and assign role
          const { data: success, error: inviteError } = await supabase.rpc('accept_staff_invitation', {
            _invitation_code: invitationCode,
            _user_id: data.user.id
          });

          if (inviteError || !success) {
            throw new Error('Failed to accept staff invitation');
          }

          toast({
            title: "Account Created!",
            description: `Welcome to the staff team! You've been assigned the ${invitationInfo.role} role.`
          });
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        title: "Authentication Failed",
        description: error.message || "An error occurred during authentication",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleDetails = (role: string) => {
    const roles = {
      moderator: { label: 'Moderator', color: 'blue', description: 'Content moderation and community safety' },
      manager: { label: 'Manager', color: 'green', description: 'Business operations and platform management' },
      support: { label: 'Support', color: 'orange', description: 'User assistance and emergency response' },
      staff: { label: 'Staff', color: 'purple', description: 'Basic monitoring and platform oversight' }
    };
    return roles[role as keyof typeof roles] || { label: role, color: 'gray', description: 'Staff member' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Staff Portal</h1>
          <p className="text-muted-foreground">
            {isLogin ? 'Sign in to your staff account' : 'Create your staff account'}
          </p>
        </div>

        {/* Invitation Info Card */}
        {invitationInfo && (
          <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Valid Staff Invitation
                  </p>
                   <p className="text-sm text-green-700 dark:text-green-300">
                     You're invited to join as a <Badge variant="outline" className="ml-1">
                       {getRoleDetails(invitationInfo.role).label}
                     </Badge>
                   </p>
                   <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                     {getRoleDetails(invitationInfo.role).description}
                   </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Login/Signup Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              {isLogin ? 'Staff Login' : 'Staff Registration'}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? 'Enter your credentials to access the staff portal'
                : 'Complete your registration using the invitation'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Invitation Code Input (for signup without URL param) */}
              {!isLogin && !invitationInfo && (
                <div>
                  <Label htmlFor="invitationCode">Invitation Code</Label>
                  <Input
                    id="invitationCode"
                    type="text"
                    placeholder="Enter your invitation code"
                    value={invitationCode}
                    onChange={(e) => handleInvitationCodeChange(e.target.value)}
                    disabled={validatingInvitation}
                  />
                  {validatingInvitation && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Validating invitation code...
                    </p>
                  )}
                </div>
              )}

              {/* Email */}
              <div>
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!!invitationInfo} // Disable if invitation sets email
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Confirm Password (signup only) */}
              {!isLogin && (
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      className="pl-10"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || (!isLogin && !invitationInfo)}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  isLogin ? 'Sign In' : 'Create Staff Account'
                )}
              </Button>

              {/* Mode Toggle */}
              <div className="text-center pt-4">
                <Button
                  type="button"
                  variant="link"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    if (isLogin) {
                      // Switching to signup, clear form but keep invitation info
                      setFormData(prev => ({ 
                        ...prev, 
                        password: '', 
                        confirmPassword: '',
                        email: invitationInfo?.email || ''
                      }));
                    } else {
                      // Switching to login, clear everything
                      setFormData({ email: '', password: '', confirmPassword: '' });
                      setInvitationCode('');
                      setInvitationInfo(null);
                    }
                  }}
                >
                  {isLogin 
                    ? "Have an invitation? Register here" 
                    : "Already have an account? Sign in"
                  }
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Staff accounts have elevated privileges. Keep your credentials secure and report any suspicious activity.
          </AlertDescription>
        </Alert>

        {/* Back to Main Site */}
        <div className="text-center">
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Main Site
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
