import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogIn, UserPlus } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { SignUpForm } from "./SignUpForm";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const AuthPage = () => {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Neighborlink
          </CardTitle>
          <CardDescription>
            Connect with your neighborhood community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* Desktop tabs */}
            <TabsList className="hidden md:grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            {/* Mobile tabs - responsive filter buttons */}
            <div className="md:hidden w-full mb-4">
              <div className="flex justify-center gap-1 w-full">
                <TabsTrigger 
                  value="login" 
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <LogIn className="h-3 w-3 mr-1" />
                  Login
                </TabsTrigger>
                <TabsTrigger 
                  value="signup"
                  className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  Sign Up
                </TabsTrigger>
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