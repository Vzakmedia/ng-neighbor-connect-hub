import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
            NextDoor NG
          </CardTitle>
          <CardDescription>
            Connect with your neighborhood community
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
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