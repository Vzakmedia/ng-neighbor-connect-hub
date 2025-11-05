import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus, ArrowLeft } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { SignUpForm } from "./SignUpForm";
import { ResetPasswordForm } from "./ResetPasswordForm";
import AuthBackground from "./AuthBackground";
import { GoogleAuthButton } from "./GoogleAuthButton";

export const AuthPage = () => {
  const [activeTab, setActiveTab] = useState("login");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4">
      <AuthBackground />
      <Button 
        variant="outline" 
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 z-20"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      <Card className="w-full max-w-md relative z-10 backdrop-blur-sm bg-background/95 border border-border/50 shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <img 
              src="/lovable-uploads/9bca933b-29c0-4a99-894e-bc536d1a6a50.png" 
              alt="NeighborLink Logo" 
              className="h-10 w-10 object-contain"
            />
            <CardTitle className="text-2xl font-bold text-community-primary">
              NeighborLink
            </CardTitle>
          </div>
          <CardDescription>
            Connect with your neighborhood community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Desktop tabs */}
            <TabsList className="hidden md:flex mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            {/* Mobile tabs - using buttons instead of TabsTrigger */}
            <div className="md:hidden w-full mb-4">
              <div className="flex justify-center gap-1 w-full">
                <Button
                  variant={activeTab === "login" ? "default" : "outline"}
                  onClick={() => setActiveTab("login")}
                  className="flex-1"
                >
                  <LogIn className="h-3 w-3 mr-1" />
                  Login
                </Button>
                <Button
                  variant={activeTab === "signup" ? "default" : "outline"}
                  onClick={() => setActiveTab("signup")}
                  className="flex-1"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Sign Up
                </Button>
              </div>
            </div>
            
            <TabsContent value="login" className="space-y-4 mt-6">
              <LoginForm onSwitchToReset={() => setActiveTab("reset")} />
            </TabsContent>
            
            <TabsContent value="signup" className="space-y-4 mt-6">
              <SignUpForm />
            </TabsContent>
            
            <TabsContent value="reset" className="space-y-4 mt-6">
              <ResetPasswordForm onBack={() => setActiveTab("login")} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};