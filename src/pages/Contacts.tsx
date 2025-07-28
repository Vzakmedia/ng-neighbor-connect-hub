import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import EmergencyContacts from '@/components/settings/EmergencyContacts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Shield, Bell } from 'lucide-react';

const Contacts = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="md:ml-64 pt-16 pb-20 md:pb-8">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Emergency Contacts</h1>
            </div>
            <p className="text-muted-foreground">
              Manage your emergency contacts who will be notified during urgent situations
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Contacts</p>
                    <p className="text-lg font-semibold">Active Management</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Safety Priority</p>
                    <p className="text-lg font-semibold">High Security</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Notifications</p>
                    <p className="text-lg font-semibold">Real-time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Emergency Contacts Component */}
          <EmergencyContacts />

          {/* Additional Information */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                How Emergency Contacts Work
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">When are contacts notified?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• When you activate the panic button</li>
                    <li>• During safety emergencies</li>
                    <li>• When you request emergency assistance</li>
                    <li>• Based on your emergency preferences</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Contact verification</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Contacts receive confirmation requests</li>
                    <li>• They must accept to be emergency contacts</li>
                    <li>• You can set different permission levels</li>
                    <li>• Contacts can opt out at any time</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Contacts;