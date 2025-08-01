import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
          <div className="flex flex-col items-center gap-2">
            <img src="/lovable-uploads/03e76cbb-7d3e-4f68-b6fa-2c271cc8bff0.png" alt="NeighborLink" className="h-12 w-48 object-contain" />
          </div>
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